# GHOSTCHAIN

A night-field stealth game. Walk your person, stand on glowing computers, steal **fictional** bitcoin, avoid red-vest guards, and get in the van.

**This is only a game. In-game bitcoin is fictional and is not real currency. Nothing here can be withdrawn, exchanged, or cashed out.**

Live game: play in the Grok app preview. This repo is the source.

## Play

You get **3 free nights**. After that, lifetime access is **₹50** via Razorpay (UPI, cards, netbanking). The purchase unlocks unlimited nights on that device. It does not buy real bitcoin.

Controls: WASD / arrows / on-screen stick to walk. Hold Shift or push the stick fully to run. Walk onto a glowing computer to steal. Get in the van to keep it.

## Razorpay (lifetime ₹50)

Checkout uses Razorpay Orders + Standard Checkout.

Set these on the server (never commit them):

| Variable | Where | Purpose |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | server | Public key, also sent to Checkout |
| `RAZORPAY_KEY_SECRET` | server | Signs orders and verifies payments |

Optional alias: `VITE_RAZORPAY_KEY_ID` (public only). **Never** expose the secret to the browser.

Amount is `5000` paise (₹50 INR), one-time, product note `ghostchain-lifetime`.

Until those keys are set, the paywall still appears after 3 nights and Razorpay will explain that checkout is not connected.

## Stack

TanStack Start, React 19, Tailwind v4, Canvas 2D. Wallet, free-night count, and lifetime unlock live in `localStorage` (`ghostchain.field.v2`). Auth is off.

```bash
npm install
npm run dev
npm run build
npm run typecheck
```
