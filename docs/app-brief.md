# Pausa: full app brief (October 2026)

## 1. What Pausa is

**One line:** Pausa is an iPhone app that puts a pause between you and the shopping and takeaway apps that make you spend on impulse.

- **Who it's for:** people who impulse-buy on their phone, especially late at night (Amazon, SHEIN, Temu, Uber Eats, Deliveroo, Just Eat, eBay, Vinted, ASOS…).
- **Market:** UK first (prices in £), App Store first.
- **Team:** two people. One builds the app; the other handles the paywall, subscriptions and publishing.
- **Business model:** hard paywall with a 7-day free trial, then **£29.88 a year** (shown as £2.49 a month) or **£4.99 a month**.
- **Promise:** no bank links, no account, everything stays on the phone.

**How it differs from a normal app blocker:** blockers stop you using an app. Pausa is about *spending*. It slows down the impulse, lets you shop on purpose with a timed Shopping Pass, sets a monthly budget, and can guide you to a card limit your bank enforces. (We also have a separate Android app called Onus, where apps unlock after a challenge like push-ups. Pausa needs to look and work clearly differently, partly because of App Store guideline 4.3 on copycat apps.)

---

## 2. What iPhone allows (and what it doesn't)

Pausa is built on Apple's **Screen Time API** (FamilyControls, ManagedSettings, DeviceActivity).

**Possible:**
- The user picks apps in **Apple's own app picker**, grouped by category. "Shopping & Food" lists only the shopping and takeaway apps on that phone, and ticking the whole category also covers apps installed later.
- Pausa can put a **shield** over those apps. Apple draws it; Pausa can only set its colours, icon, title, subtitle and two button labels. It can't animate or show a live countdown.
- Pausa can unblock an app for a set time and block it again automatically.
- Pausa knows which shield button was tapped and can track its own timers, passes and streaks.

**Not possible:**
- Seeing inside other apps: no reading the basket, prices or checkout, and no jumping in at the moment of purchase.
- Knowing which apps are installed. Apple only hands over the apps the user ticked.
- Reading text messages (some Amazon accounts only get order texts, not emails).
- Creating bank cards or setting card limits in someone's bank app.

**Needed before launch:** Apple's Family Controls entitlement for App Store distribution (you have to request it from Apple).

---

## 3. Setup (onboarding): 8 screens

1. **Hold to pause, then welcome:** the screen is full of jiggling sale pop-ups ("70% OFF!", "Only 2 left") around one big pause button. Holding it for 2.5 seconds fills a ring, slows the pop-ups, fades them out and says "Paused." Letting go early brings the noise back. Then the welcome appears: "Shop on purpose. That was Pausa: a pause between you and the apps that make you spend." There is a Skip link and keyboard support.
2. **The 11 PM scroll:** one relatable story.
3. **Pain points:** tick all that apply (habitual scrolling, limited-time FOMO, empty-wallet anxiety).
4. **Screen Time permission:** explains why, then the iOS permission pop-up.
5. **Apple's app picker:** open Shopping & Food and tick the apps.
6. **Try the pause (demo):** a 5-second breathing pause plays once, then shows the three choices, so people feel the product before paying.
7. **Goal (optional):** pick a suggestion or write your own.
8. **Hard paywall, shaped like a receipt:** "Here's your order. Nothing to pay today." The receipt shows the protected apps, itemised lines (15-second pauses: unlimited; Shopping Passes: unlimited; Pausa cards, XP and ranks: included; Bank-limit guide: included; Bank links or account: none), the two plans as rows, then **Total £29.88 a year** as the biggest price with "Due today £0.00" smaller underneath (Apple requires the billed amount to be the most prominent price), the date the plan starts, and a barcode. Below it: the free-week timeline, restore purchases, terms, privacy.

**After paying, a "Finish setting up" card on Home** covers the rest at the user's own pace (and can be hidden):
- Pick a habit for each app (Takeaways / Online shopping / Fashion / Social / Other). This sets the question asked during the pause.
- Set a monthly budget: one total (£50 / £100 / £150 / £200 or any amount), then one pot for all apps, split evenly, or "I'll choose" with −/+ buttons.
- Meet the Shopping Pass and choose your usual length (5 / 10 / 15 / Custom).
- Add a bank limit (optional; see section 6).

## 4. The core loop

```
Opens Amazon
  → Pausa shield: "Hold on. Think twice."
     (one line: your own message, or your goal, or a habit line; plus this app's budget)
  ├─ "Close Amazon"         → +2 XP, then a cool-off starts
  └─ "I still want to shop" → opens Pausa's pause directly (iOS 26.5+; older iPhones get a notification to tap)
        The pause: full-screen breathing ring (15 s by default)
        Habit question, e.g. "Hungry, short on time, or just craving?" (can be turned off)
        Choices unlock when the timer ends:
        ├─ "I'll leave it"         → +10 XP, cool-off starts
        ├─ "Remind me in 1 hour"   → +5 XP, cool-off starts
        └─ "Shop with a plan"      → +5 XP → Shopping Pass
              Why are you shopping? (something specific / just browsing / not sure)
              What do you need? Limit (£)
              How long? (5 / 10 / 15 / Custom 1–120 min)
              → tear the ticket: drag its stub to the right to start
                (a plain tap only wiggles it and shows how; VoiceOver and the keyboard start it directly)
              → the app unlocks with a timer
              → when time's up, it locks again automatically
              → check-in: the ticket comes back stamped "Used": "Did you stick to the plan?"
                 Every honest answer earns the same +10 XP; skipping costs nothing
              → sometimes: "Did this pause help?" (after the first pass, then every third)
```

**Two ways into a Shopping Pass:** "Shop with a plan" in the pause (a full button with a ticket icon, under "I'll leave it" and "Remind me in 1 hour"), or the purple "Need to shop?" ticket on Home. The Home ticket lists your shielded apps; picking one gives you the same pause first, so it's never a way around the pause.

**A 3rd Shopping Pass in one day** doesn't cost XP. Instead the ticket's stub can't be torn for 10 seconds ("Wait 10s", "Take 10 more seconds to be sure"), and that day gets no Pausa card stamp.

**Cool-off (anti-farming):** after you close an app or leave it at the pause, it stays locked for a while: 10 minutes by default (Off / 5 / 10 / 30). The shield then reads "Taking a break from Uber Eats. It unlocks at 05:53" and only shows Close.

---

## 5. Home screen and tabs

- **Home:** greeting and shield status; a check-in reminder (if any); the live Shopping Pass ticket with time left; the **Pausa card** (a paper stamp card, see section 7); a "Need to shop?" ticket that starts a Shopping Pass (hidden while one is running); the rank card (rank, XP bar, XP earned today out of 60); the bank-lock seal card; protected apps with their status (Shielded / Open for 6:59 / Locked until 05:53 / Off) and budgets.
- **Apps:** shield each app on or off, change its habit, see its budget, add or remove apps (opens Apple's picker).
- **Progress:** total XP, the rank ladder, **How XP works** (every way to earn and lose XP), recent decisions with +/− XP.
- **Settings:** everything is customisable (section 8).

---

## 6. "Add a bank limit" (optional, self-reported) and seals

Pausa can't see payments, so an optional extra barrier comes from the user's bank:
1. Open your bank app → Cards
2. Add a virtual card
3. Set a monthly limit equal to your Pausa budget
4. Save that card in your shopping apps
5. Remove your other cards from those apps

Each step is ticked off on screen. When all 5 are done, the user earns the **Bank limit set** seal, clearly labelled **self-reported**: a celebration screen with their limit on a ribbon, their protected apps and the date it was set.

- **The seal levels up with days kept:** Committed (day 1, mint) → Week strong (7 days, blue/purple) → Month proof (30 days, gold) → Vault (90 days, pink/purple).
- **Home shows the current seal**, the days count and the next level.
- **No XP for this.** "I removed my card limit" takes the seal away.
- **Wording is deliberately honest.** We dropped "make it unbreakable": Pausa can't verify the limit or stop other cards. Not every bank offers virtual cards or limits (Revolut documents monthly card limits).

## 7. XP and ranks

**Ranks:** Bronze "Window Shopper" (0) → Silver "Mindful Browser" (100) → Gold "Cart Controller" (300) → Platinum "Checkout Guardian" (650) → Diamond "Impulse Breaker" (1,100) → Legend "Spending Strategist" (1,800). A rank-up gets a celebration screen.

**Earning:**

| Action | XP |
|---|---|
| Close an app at the shield | +2 (max 5 a day) |
| Finish the pause and leave | +10 |
| Remind me in 1 hour | +5 |
| Shop with a plan | +5 |
| Check in after a pass, **any honest answer** | +10 |
| Fill a Pausa card (10 stamps) | +50 (on top of the daily cap) |

**The Pausa card (an anti-loyalty card):** like a coffee-shop stamp card, except you earn stamps for shopping on purpose.
- A day earns one stamp when the shields stayed on, no app was unshielded, and you used 2 Shopping Passes or fewer.
- A slip only means no stamp that day: the slot shows ✕ with the reason and "Tomorrow is a fresh start". No XP is lost and the card never resets.
- Days away with the shields on still earn their stamps.
- 10 stamps fill the card: +50 XP and a fresh card ("Card 2").

**Losing (only for weakening your own protection):**

| What happens | XP |
|---|---|
| Switch every shield off | −10, once a day |
| Unshield an app | −5, once a day per app |

No penalty for being away, for skipping a check-in, or for an honest "I bought something else". A 3rd pass in a day means a 10-second wait instead.

**Rules:**
- Daily cap of 60 XP (a full Pausa card's +50 comes on top).
- The same app earns XP at most once every 30 minutes (no open-close farming).
- XP never drops below the start of your current rank, so ranks never go down.
- No money-saved figures, because Pausa can't see real spending. Instead, Progress shows **"The pause helped 4/5 times"** from the user's own "Did this pause help?" answers.

## 8. Customisation (Settings)

- **Shield:** all shields on/off; cool-off length (Off / 5 / 10 / 30 min); when to shield (all day / evenings 6 pm–6 am / weekends); your own shield message; what you're saving for.
- **Pause:** length (10 / 15 / 30 / 60 sec or Custom 5–300 sec); ask a question during the pause on/off.
- **Shopping Pass:** the three preset lengths (any minutes); Custom on the pass screen.
- **Budget:** monthly total and split (pot / even / custom).
- **Lock it at the bank:** set up, view steps, or remove the seal.
- **Plan and privacy:** plan details, delete all data.

---

## 9. Design and feel

- **"Pausa Night"** dark theme: deep navy base (#0D0F2E); **electric blue** (#4361FF) for every button and selection; **purple** for the Shopping Pass and big moments (the pause screen's glowing purple background); mint = protected, amber = XP, coral = impulse or losing XP.
- **Mascot:** a friendly green blob, drawn as stickers with white die-cut edges and a soft glow.
- **Fonts:** Fredoka (rounded) for headings, numbers and buttons; Figtree for body text. Sentence case everywhere.
- **Chunky "pressable" cards and buttons**, a Shopping Pass ticket you tear to start, a paper stamp card on Home, a receipt-shaped paywall and a paper-receipt check-in.
- **Motion:** screen slides, a breathing glow during the pause, pop-ins, rank-up confetti, the seal stamping in. All of it switches off when the phone's Reduce Motion setting is on.
- **Tone:** no shaming; honest; "shop on purpose", not "never shop".

---

## 10. Ideas we considered and rejected (and why)

| Idea | Why not |
|---|---|
| Detect the price at checkout and block over-budget purchases | iPhone apps can't see inside other apps |
| Safari extension that reads the checkout | Most people use the Amazon app, not Safari, and Chrome on iPhone has no extensions |
| Read order emails to track spending | Accounts made with only a phone number get no emails; Google requires a paid security audit for reading Gmail; breaks the privacy promise; email layouts change |
| Screenshot of the bank app as proof | Sensitive data, easy to fake, invites App Review questions |
| Pausa issuing its own capped card | Banking regulation, ID checks, fraud, high cost; maybe much later |
| XP for "money saved" | Can't be verified; replaced by XP for actions Pausa can see |
| Typing a budget for every app | Too much typing; replaced by one total plus a split |
| Guessing the user's apps in onboarding | Replaced by Apple's own picker (Shopping & Food) |

---

## 11. Known risks and open questions

0. **Review changes already made (Oct 2026):** setup cut from 15 to 8 screens with a demo pause; flat check-in XP; no away or skip penalties; bank feature renamed and self-reported; simpler shield; "Did this pause help?"; shield opens the pause directly on iOS 26.5+.
1. **App Review (guideline 4.3):** is Pausa different enough from other blockers, including our own Android app?
2. **Screen Time permission friction:** how many people drop off at the permission and picker steps?
3. **Hard paywall after an 8-screen setup with a demo pause:** does trying the pause first help people commit to the free week?
4. **Self-reported parts:** the bank limit relies on honesty. Check-ins now give the same XP for any answer, so there's no reason to lie.
5. **Easy escape:** users can remove Screen Time access or delete the app. How do we keep them?
6. **Budgets are only a reminder** unless the bank card limit is set up.
7. **Retention after the first weeks:** XP, ranks, seals, and the Pausa card (a gentle streak that never resets). Is that enough? What else?
8. **Pricing:** is £29.88 a year / £4.99 a month right for this audience?
9. **Ideas not built yet:** signing the receipt as a commitment, budget jars, a weekly summary, light mode, home-screen widgets, a share card for ranks, Android version, UK Open Banking later to show real spending.
10. **Tear to start:** does dragging the stub feel like good friction or an annoyance? Test with real users.

---

## 12. Current status

A full clickable prototype (single HTML page) covers every screen above. The iPhone home screen, Apple's picker, permission pop-up, notifications and the shopping apps are simulated. A test panel lets you skip setup, open apps directly, add XP, skip days on the bank seal, skip to tomorrow (to collect Pausa card stamps), and run timers fast. The real iPhone app hasn't been built yet.

**Next step:** a small real-iPhone test app with only app selection → shield → pause → 5-minute pass → automatic re-lock, to check timing and reliability (Device Activity callbacks can arrive late) before building the rest.
