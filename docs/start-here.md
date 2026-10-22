# Pausa: start here

Pausa is an iPhone app that puts a short pause between you and your shopping and takeaway apps. When you open Amazon or Uber Eats, Pausa's shield appears. After a 15-second pause you can walk away, or shop with a plan on a timed Shopping Pass.

**Where it stands (17 October 2026):** the product is designed and there's a full clickable prototype. Nothing has been built for iPhone yet.

![The core loop: shield, pause, choose, tear the ticket, shop with a timer, check in](../4%20Screens/00%20Core%20loop.png)

## What's in this folder

| | What it is |
|---|---|
| **1 START HERE** | This guide. |
| **2 Pausa prototype.html** | The clickable prototype (version 17). Open it in Chrome or Safari on a computer, with internet on, because it loads its fonts and styles online. |
| **3 Pausa app brief** | The full product: every screen, rule and decision, plus what we rejected and why. |
| **4 Screens** | A picture of every screen, numbered in flow order, and one sheet with all of them. |
| **5 Design** | The visual system (colours, fonts, components), the motion spec, and the mascot images at full size (1024 × 1024). |
| **Markdown** | The same documents as editable text files, handy for an AI tool or the code repo. |

Where the documents and the prototype disagree, the prototype is the newer one.

## Try the prototype in 5 minutes

1. Open **2 Pausa prototype.html**. The phone is on the left and a test panel is on the right (below the phone in a narrow window).
2. Hold the pause button on the first screen, then go through setup. The iPhone permission, Apple's app picker and the payment are all simulated.
3. On Home, tap the bar at the bottom of the phone to go to the iPhone home screen. Open Uber Eats or Amazon to see the shield.
4. Tap "I still want to shop", wait out the pause, pick "Shop with a plan", then drag the ticket's stub to the right to start a Shopping Pass. Timers run fast in the prototype, so the app locks again after a few seconds and asks you to check in. You can also start a pass from the "Need to shop?" ticket on Home.
5. The test panel can skip setup, open any app, add XP, skip to tomorrow (for Pausa card stamps) and end the subscription. Tap "Restart prototype" twice to start again from scratch.

## Already decided

- **iPhone first.** Blocking uses Apple's Screen Time frameworks (FamilyControls, ManagedSettings, DeviceActivity), so the app needs native Swift.
- **Pausa can't see prices, baskets, receipts or bank activity,** so it never shows "money saved".
- **XP only for things Pausa can check:** closing at the shield, finishing the pause, passes and honest check-ins. Ranks never go down. Daily cap of 60 XP.
- **The bank limit is optional and self-reported.** No bank links and no screenshots as proof.
- **Hard paywall at the end of an 8-screen setup:** 7-day free trial, then £29.88 a year (shown as £2.49 a month) or £4.99 a month.
- **Privacy promise:** no bank links, no account, everything stays on the phone.

## Still open

- **The name.** "Pausa" is a working name, and an app called "Pausa: Screen Time & Focus" is already on the App Store. Pick a new name before launch. It only appears as text, so renaming is a find-and-replace.
- **App Review guideline 4.3 (copycat apps).** Pausa has to look and work clearly differently from other blockers, including our Android app Onus.
- **Pricing and keeping people after the first weeks.** The rest of the open questions are in section 11 of the brief.

## What to do next

1. **Ask Apple for the Family Controls entitlement now.** You need it for TestFlight and the App Store, and developers report waiting several weeks for approval. Request it through Apple's Family Controls form, keep the confirmation, and check the status in Certificates, Identifiers & Profiles.
2. **Build a small test app on a real iPhone first,** because this is the riskiest part: pick apps → shield → "I still want to shop" opens Pausa's pause → 5-minute pass → the shield comes back on its own. Check the timing (Device Activity callbacks can arrive late). Check that the shield opens Pausa directly on iOS 26.5 and later; older iPhones need a "Tap to start your pause" notification instead.
3. **Then build the rest from the prototype,** screen by screen.

A Screen Time app like this is usually split into these parts:

- **The app** (SwiftUI): setup, the pause, Shopping Pass, check-in, Home and the other tabs, and the paywall.
- **Shield Configuration extension:** what the shield looks like. iOS draws it, so you can only set the colours, one icon, the title, the subtitle and the button labels.
- **Shield Action extension:** what happens when someone taps a shield button.
- **Device Activity Monitor extension:** locks an app again when a pass ends, even when Pausa is closed.
- **An App Group,** so all of these share the same data.

## Paywall and subscriptions

- Two auto-renewing subscriptions in one group: **yearly £29.88** and **monthly £4.99**, each with a **7-day free trial**. Yearly is selected by default.
- Apple expects the amount people will be billed to be the most prominent price. The receipt paywall does this: "Total £29.88 a year" is bigger than "Due today £0.00".
- Keep Restore purchases, Terms and Privacy on the paywall. Send a reminder on day 5 of the trial, because the paywall promises one.
- If the trial or subscription ends, remove every shield straight away and show the "Protection paused" screen. Never keep someone's apps locked behind a payment. Keep their XP, rank and settings.

## App Review

- In the review notes, explain why Pausa needs Screen Time access, and attach a short screen recording of shield → pause → Shopping Pass.
- Lead with what's specific to shopping (Shopping Pass, check-in, budgets, the bank-limit guide), so it doesn't read as another general blocker.
- The shopping-app logos in the prototype are placeholders. The real app shows each person's own apps with Apple's label view for the app tokens it gets from the picker.

<div class="newpage"></div>

## Every screen

![Every screen in the prototype, in flow order](../4%20Screens/00%20All%20screens.png)
