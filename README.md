# GHOSTCHAIN

A night-field stealth game. Walk your person, stand on glowing computers, steal **fictional** bitcoin, avoid red-vest guards, and get in the van.

**This is only a game. In-game bitcoin is fictional and is not real currency. Nothing here can be withdrawn, exchanged, or cashed out.**

## Play

You get **3 free nights**. After that, lifetime access is **₹50** via Razorpay (UPI, cards, netbanking). The purchase unlocks unlimited nights on that device. It does not buy real bitcoin.

Controls: WASD / arrows / on-screen stick to walk. Hold Shift or push the stick fully to run. Walk onto a glowing computer to steal. Get in the van to keep it.

## Razorpay (lifetime ₹50)

Checkout uses the live Razorpay hosted payment link (same merchant as Aether Latch — APOORVA SHARMA). No API keys required.

| | |
| --- | --- |
| Pay | [https://rzp.io/rzp/9v5vQRc4](https://rzp.io/rzp/9v5vQRc4) |
| Amount shown in-game | ₹50 one-time lifetime |
| After paying | **I've paid — Unlock lifetime** marks this browser |

Hosted links cannot callback without a backend, so unlock is confirmed in this browser after you return from Razorpay (`src/lib/game/pay.ts`).

## Stack

TanStack Start, React 19, Tailwind v4, Canvas 2D. Wallet, free-night count, and lifetime unlock live in `localStorage` (`ghostchain.field.v2`). Auth is off.

```bash
npm install
npm run dev
npm run build
npm run typecheck
```
