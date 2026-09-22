import { createServerFn } from "@tanstack/react-start";

export const LIFETIME_PRICE_INR = 50;
export const LIFETIME_AMOUNT_PAISE = 5000;
export const DEMO_NIGHTS = 3;

export const FICTION_DISCLAIMER =
  "This is only a game. In-game bitcoin is fictional and is not real currency. Nothing here can be withdrawn, exchanged, or cashed out.";

type OrderOk = {
  configured: true;
  keyId: string;
  orderId: string;
  amount: number;
  currency: "INR";
};

type OrderOff = { configured: false; reason: string };

export type OrderResult = OrderOk | OrderOff;

export const getPayConfig = createServerFn({ method: "POST" }).handler(async () => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.VITE_RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return {
    configured: Boolean(keyId && keySecret),
    amountInr: LIFETIME_PRICE_INR,
    demoNights: DEMO_NIGHTS,
  };
});

export const createLifetimeOrder = createServerFn({ method: "POST" }).handler(async (): Promise<OrderResult> => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.VITE_RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    return {
      configured: false,
      reason: "Razorpay keys are not set yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then republish.",
    };
  }

  const receipt = `gc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: LIFETIME_AMOUNT_PAISE,
      currency: "INR",
      receipt,
      notes: { product: "ghostchain-lifetime", title: "GHOSTCHAIN lifetime" },
    }),
  });
  const body = (await res.json()) as { id?: string; error?: { description?: string } };
  if (!res.ok || !body.id) {
    return { configured: false, reason: body.error?.description ?? "Could not start Razorpay checkout." };
  }
  return {
    configured: true,
    keyId,
    orderId: body.id,
    amount: LIFETIME_AMOUNT_PAISE,
    currency: "INR",
  };
});

export const verifyLifetimePayment = createServerFn({ method: "POST" })
  .validator((data: { orderId: string; paymentId: string; signature: string }) => {
    if (!data?.orderId || !data?.paymentId || !data?.signature) {
      throw new Error("Missing payment fields");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) return { ok: false as const, reason: "Razorpay is not configured." };
    const { createHmac, timingSafeEqual } = await import("node:crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(data.signature, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false as const, reason: "Payment could not be verified." };
    }
    return { ok: true as const, paymentId: data.paymentId };
  });

type RazorpayCtor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, cb: (payload: { error?: { description?: string } }) => void) => void;
};

function loadCheckout(): Promise<RazorpayCtor> {
  const existing = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      const ctor = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
      if (ctor) resolve(ctor);
      else reject(new Error("Razorpay failed to load"));
    };
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.head.appendChild(script);
  });
}

export async function openLifetimeCheckout(): Promise<{ paymentId: string }> {
  const order = await createLifetimeOrder();
  if (!order.configured) {
    throw new Error(order.reason);
  }
  const Razorpay = await loadCheckout();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "GHOSTCHAIN",
      description: "Lifetime access · ₹50 · not real bitcoin",
      order_id: order.orderId,
      theme: { color: "#08090b" },
      notes: { product: "ghostchain-lifetime" },
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        void verifyLifetimePayment({
          data: {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          },
        }).then((result) => {
          if (result.ok) resolve({ paymentId: result.paymentId });
          else reject(new Error(result.reason));
        });
      },
    });
    rzp.on("payment.failed", (payload) => {
      reject(new Error(payload.error?.description ?? "Payment failed"));
    });
    rzp.open();
  });
}
