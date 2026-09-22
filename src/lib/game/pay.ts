export const LIFETIME_PRICE_INR = 50;
export const DEMO_NIGHTS = 3;

export const FICTION_DISCLAIMER =
  "This is only a game. In-game bitcoin is fictional and is not real currency. Nothing here can be withdrawn, exchanged, or cashed out.";

/**
 * Live Razorpay hosted checkout for merchant APOORVA SHARMA.
 * Same account as Aether Latch — no SDK keys required.
 * Hosted links have no webhook; unlock is confirmed in-browser after payment.
 */
export const RAZORPAY_LIFETIME_LINK = "https://rzp.io/rzp/9v5vQRc4";

export function openLifetimeCheckout(): boolean {
  const popup = window.open(RAZORPAY_LIFETIME_LINK, "_blank", "noopener,noreferrer");
  if (!popup) {
    window.location.assign(RAZORPAY_LIFETIME_LINK);
    return false;
  }
  return true;
}
