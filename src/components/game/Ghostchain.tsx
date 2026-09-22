import { useCallback, useEffect, useState } from "react";
import { FieldGame } from "./FieldGame";
import { unlockAudio } from "@/lib/game/audio";
import {
  DEMO_NIGHTS,
  FICTION_DISCLAIMER,
  LIFETIME_PRICE_INR,
  RAZORPAY_LIFETIME_LINK,
} from "@/lib/game/pay";
import { formatBtcShort } from "@/lib/utils";

type Phase = "boot" | "play" | "result" | "pay";

const SAVE = "ghostchain.field.v2";
const LEGACY = "ghostchain.field.v1";

type Save = {
  wallet: number;
  nights: number;
  plays: number;
  purchased: boolean;
  paymentId?: string;
};

function emptySave(): Save {
  return { wallet: 0, nights: 0, plays: 0, purchased: false };
}

function load(): Save {
  try {
    const raw = localStorage.getItem(SAVE) ?? localStorage.getItem(LEGACY);
    if (!raw) return emptySave();
    const p = JSON.parse(raw) as Partial<Save>;
    return {
      wallet: p.wallet ?? 0,
      nights: p.nights ?? 0,
      plays: typeof p.plays === "number" ? p.plays : 0,
      purchased: p.purchased === true,
      paymentId: p.paymentId,
    };
  } catch {
    return emptySave();
  }
}

function write(s: Save): void {
  try {
    localStorage.setItem(SAVE, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function locked(s: Save): boolean {
  return !s.purchased && s.plays >= DEMO_NIGHTS;
}

function remaining(s: Save): number {
  if (s.purchased) return Number.POSITIVE_INFINITY;
  return Math.max(0, DEMO_NIGHTS - s.plays);
}

export function Ghostchain() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [run, setRun] = useState(0);
  const [save, setSave] = useState<Save>(emptySave);
  const [last, setLast] = useState<{ stolen: number; escaped: boolean } | null>(null);

  useEffect(() => {
    setSave(load());
  }, []);

  const persist = useCallback((next: Save) => {
    write(next);
    setSave(next);
  }, []);

  const onDone = useCallback((stolen: number, escaped: boolean) => {
    setLast({ stolen, escaped });
    window.setTimeout(() => {
      setSave((prev) => {
        const next: Save = {
          ...prev,
          wallet: Math.round((prev.wallet + (escaped ? stolen : 0)) * 1e8) / 1e8,
          nights: prev.nights + (escaped ? 1 : 0),
          plays: prev.plays + 1,
        };
        write(next);
        return next;
      });
      setPhase("result");
    }, 700);
  }, []);

  const startPlay = () => {
    const current = load();
    if (locked(current)) {
      setPhase("pay");
      return;
    }
    unlockAudio();
    setPhase("play");
  };

  const restart = (nextPhase: Phase) => {
    if (nextPhase === "play" && locked(load())) {
      setPhase("pay");
      return;
    }
    setRun((n) => n + 1);
    setPhase(nextPhase);
  };

  const unlock = (paymentId?: string) => {
    const current = load();
    persist({ ...current, purchased: true, paymentId: paymentId ?? current.paymentId });
    setRun((n) => n + 1);
    unlockAudio();
    setPhase("play");
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <FieldGame key={run} night={save.nights + 1} frozen={phase !== "play"} onDone={onDone} />

      {phase === "boot" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-linear-to-t from-bg via-bg/70 to-bg/25 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-10">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface/92 p-5 shadow-lg sm:p-6">
            <p className="text-xs tracking-widest text-faint uppercase">Night field · Helix grounds</p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg sm:text-5xl">GHOSTCHAIN</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              You are the mint-hoodie person. Walk. Stand on a glowing computer to steal bitcoin. Don't get tagged by
              red-vest guards. Get in the van.
            </p>
            <ul className="mt-4 hidden space-y-2 text-sm text-fg sm:block">
              <li className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full bg-signal" />
                Mint hoodie is you
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full bg-danger" />
                Red vests are guards — they catch you
              </li>
              <li className="flex items-center gap-3">
                <span className="size-2.5 shrink-0 rounded-full bg-accent" />
                White van is home — keep whatever you stole
              </li>
            </ul>
            {save.wallet > 0 ? (
              <p className="mt-3 tabular text-sm text-signal">Wallet {formatBtcShort(save.wallet)}</p>
            ) : null}
            <FreeNights save={save} />
            <button
              type="button"
              onClick={startPlay}
              className="mt-5 h-12 w-full rounded-md bg-accent text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
            >
              {locked(save) ? `Unlock lifetime · ₹${LIFETIME_PRICE_INR}` : "Start walking"}
            </button>
            <Disclaimer />
          </div>
        </div>
      ) : null}

      {phase === "result" && last ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/60 px-6">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface/94 p-6 text-center">
            <p className="text-xs tracking-widest text-faint uppercase">{last.escaped ? "You got out" : "Caught"}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-fg">
              {last.escaped ? "Bitcoin secured" : "The field is locked"}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {last.escaped
                ? `You walked the field, hacked the computers, and made the van. ${formatBtcShort(last.stolen)} is in the wallet.`
                : "A guard reached you. Tonight's coin is gone. Stay further from the red vests next time."}
            </p>
            <p className="mt-5 tabular text-signal">Wallet {formatBtcShort(save.wallet)}</p>
            <FreeNights save={save} />
            <button
              type="button"
              onClick={() => restart(locked(save) ? "pay" : "play")}
              className="mt-6 h-12 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
            >
              {locked(save)
                ? `Unlock lifetime · ₹${LIFETIME_PRICE_INR}`
                : last.escaped
                  ? "Next night"
                  : "Try again"}
            </button>
            <button type="button" onClick={() => restart("boot")} className="mt-2 h-11 w-full text-sm text-muted">
              How to play
            </button>
            <Disclaimer />
          </div>
        </div>
      ) : null}

      {phase === "pay" ? <Paywall onUnlock={unlock} onBack={() => setPhase("boot")} /> : null}
    </div>
  );
}

function FreeNights({ save }: { save: Save }) {
  if (save.purchased) {
    return <p className="mt-3 text-xs text-muted">Lifetime unlocked on this device</p>;
  }
  const left = remaining(save);
  if (left <= 0) {
    return (
      <p className="mt-3 text-xs text-muted">
        Three free nights used. Lifetime access is ₹{LIFETIME_PRICE_INR} — not real bitcoin.
      </p>
    );
  }
  return (
    <p className="mt-3 text-xs text-muted">
      {left} free {left === 1 ? "night" : "nights"} left · then ₹{LIFETIME_PRICE_INR} lifetime
    </p>
  );
}

function Disclaimer() {
  return <p className="mt-4 text-xs leading-relaxed text-faint">{FICTION_DISCLAIMER}</p>;
}

function Paywall({ onUnlock, onBack }: { onUnlock: (paymentId?: string) => void; onBack: () => void }) {
  const [opened, setOpened] = useState(false);

  const markOpened = () => setOpened(true);

  const confirmPaid = () => {
    onUnlock(`rzp_${Date.now().toString(36)}`);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-end bg-linear-to-t from-bg via-bg/80 to-bg/40 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-10 sm:justify-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface/94 p-5 shadow-lg sm:p-6">
        <p className="text-xs tracking-widest text-faint uppercase">Three free nights used</p>
        <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight text-fg">Lifetime access</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Pay once with Razorpay. Unlimited nights on this device. This purchase does not buy real bitcoin.
        </p>
        <p className="mt-5 font-display text-4xl font-semibold tabular text-fg">₹{LIFETIME_PRICE_INR}</p>
        <p className="mt-1 text-xs text-muted">One-time · UPI, cards, netbanking</p>
        {opened ? (
          <p className="mt-4 text-sm text-muted">
            Razorpay opened in a new tab. After you finish paying, come back and tap I've paid — Unlock lifetime.
          </p>
        ) : null}
        {opened ? (
          <button
            type="button"
            onClick={confirmPaid}
            className="mt-5 h-12 w-full rounded-md bg-accent text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
          >
            I've paid — Unlock lifetime
          </button>
        ) : (
          <a
            href={RAZORPAY_LIFETIME_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={markOpened}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.98]"
          >
            Pay ₹{LIFETIME_PRICE_INR} with Razorpay
          </a>
        )}
        {opened ? (
          <a
            href={RAZORPAY_LIFETIME_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex h-11 w-full items-center justify-center text-sm text-muted"
          >
            Reopen Razorpay
          </a>
        ) : (
          <button type="button" onClick={confirmPaid} className="mt-2 h-11 w-full text-sm text-muted">
            I've paid — Unlock lifetime
          </button>
        )}
        <button type="button" onClick={onBack} className="mt-1 h-11 w-full text-sm text-faint">
          Back
        </button>
        <Disclaimer />
      </div>
    </div>
  );
}
