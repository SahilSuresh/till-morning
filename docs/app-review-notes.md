# Till Morning: App Review notes and guideline 5.6 checklist

Two of our other apps were rejected under **guideline 5.6 (Developer Code of Conduct)** for "features that appear to have been intentionally hidden during the review process". This file keeps Till Morning clear of that. Part A goes into App Store Connect → App Review Information → Notes. Part B is the checklist to run before every submission.

---

## A. Notes for App Review (paste into App Store Connect)

Till Morning helps people stop impulse buying. They choose their shopping and takeaway apps with Apple's Screen Time picker, and those apps then open behind a short pause. Everything runs on the phone. There is no account, no bank connection and no server of our own.

**What you need to test it**
- A real iPhone (Screen Time / Family Controls doesn't work in the Simulator).
- Allow Screen Time access when asked during setup, and pick one or two apps (for example a shopping app).
- The shields need an active subscription. The paywall offers a free week. A sandbox account works.

**Core flow (about 2 minutes)**
1. Open one of the chosen apps. iOS shows the Till Morning shield (drawn by iOS from our Shield Configuration extension).
2. Tap **"I still want to shop"**. A notification, "Tap to start your pause", opens the breathing pause in Till Morning.
3. After the pause, choose **"I'll leave it"**, **"Park it till morning"** (saves the want to the Waiting room with a wait time) or **"Shop with a plan"** (a Shopping Pass that unlocks the app for a few minutes and re-locks it).
4. **Today → "Need to shop? Get a pass"** starts the same flow from inside the app.

**Behaviour that depends on the time or date.** These are not hidden; they are part of the product and can each be seen as follows:
| Feature | When it appears | How to see it during review |
|---|---|---|
| Night lock | 23:00–07:00 by default (Settings → Night lock) | **Settings → Night lock → "See how night lock looks"** shows the exact screen |
| Late-night shield and longer pause | after 22:00 | Same pause as the day, with a longer timer and different shield text |
| Treat nights | days chosen in **Your rules** | Pick today in Your rules → Treat nights |
| Sale week (waits ×2) | switched on by the user | **Your rules → More rules → Sale week** |
| Day 2–7 tips on Today | first week | Tips only. Every feature they mention is already available from the first launch (Your rules, Shopping Pass, stickers on Me, voice note, basket screenshot) |
| Rating prompt | Apple's own `SKStoreReviewController`, after a calm win on day 4+ | System controlled |

**Shopping Pass countdown outside the app**
- While a Shopping Pass runs, the countdown shows as a Live Activity (Lock Screen and Dynamic Island), plus notifications at 2 minutes and 30 seconds left.

**Share and Safari**
- Share extension: in any app, Share → Till Morning parks a screenshot (the total is read on the phone with Vision) or a link.
- Till Morning for Safari: runs only on a fixed list of shop sites, notices checkout pages, and offers to park the basket. Turn it on in Settings → Apps → Safari → Extensions. The app explains this on its "Caught at checkout" page.

**Permissions and why**
- Screen Time (Family Controls): to put the shield on the apps the person picks.
- Notifications: "Tap to start your pause", pass ended, and "your parked want is ready".
- Microphone: optional. Records a short "note from calm you" that plays in the pause. Stays on the phone.
- Photos: optional. The person picks a checkout or basket screenshot; Apple's Vision framework reads the total on the phone. Nothing is uploaded.
- Messages: optional "Ask a friend" opens the Messages composer with a draft; the person presses send.

**Things the app does not do**
- No hidden screens, gestures or debug menus in the App Store build. Test tools exist only in internal development builds and are compiled out of production.
- No remote configuration or feature flags. Over-the-air updates are switched off in App Store builds, so the build you review is the build people get.
- The bank limit is self-reported: the app shows the steps and never connects to a bank.

Contact for review questions: [add a phone number and email that are answered during review]

---

## B. Guideline 5.6 checklist (run before every submission)

**Built into the code** (keep it that way):
- [x] Test-only controls ("Skip" on the paywall, Settings → Test tools) appear only when `config.isTestBuild` is true: `__DEV__`, or `APP_ENV` = `development`/`preview`. A missing `APP_ENV` counts as production (fails safe). See `src/lib/config.ts`.
- [x] `app.config.ts` turns expo-updates **off** when `APP_ENV` is `production`. Fixes ship as new reviewed builds. If OTA is ever turned back on, only bug fixes may go out that way, never new features or changed behaviour.
- [x] No long-press, multi-tap or other secret gestures (`grep -rn "onLongPress" src` should stay empty).
- [x] No feature waits for a date or a server switch to unlock. The week-one cards only point to features that already exist.
- [x] Time-based features each have a visible way to see them (table above).
- [x] In-app copy describes only what exists in this build. Widgets, the Share button and the Safari extension are **not** mentioned until they ship.

**Before you press Submit:**
- [ ] Build with the **production** profile (`eas build --profile production`), never a development or preview build.
- [ ] Install that exact build from TestFlight and check: no "Skip (test build only)" on the paywall, no "Test tools" section at the bottom of Settings.
- [ ] The App Store description, screenshots and preview video show only features in this build, and every main feature in the build is mentioned (night lock, Waiting room, Shopping Pass, budget, rules, voice note, basket screenshot).
- [ ] Privacy policy and support URLs in `src/lib/config.ts` point to real, live pages. They are still `example.com` placeholders.
- [ ] App Privacy answers match the app: crash reports (Sentry), purchases (RevenueCat), nothing else leaves the phone.
- [ ] Paste Part A into the App Review notes, with a real contact.
- [ ] Don't reuse code, screenshots, descriptions or metadata from the other apps on this account. Shared templates across apps are a common reason for 5.6 and 4.3 "pattern" flags.
- [ ] Reply to any App Review question in Resolution Center plainly and quickly, and list where each feature is.
