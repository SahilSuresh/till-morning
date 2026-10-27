# Till Morning: App Review notes and guideline 5.6 checklist

Two of our other apps were rejected under **guideline 5.6 (Developer Code of Conduct)** for "features that appear to have been intentionally hidden during the review process". This file keeps Till Morning clear of that. Part A goes into App Store Connect → App Review Information → Notes. Part B is the checklist to run before every submission.

---

## A. Notes for App Review (in App Store Connect; keep the two in step)

Contact: Andrej Gazi, support@tillmorning.co.uk (phone in App Store Connect).

```
Till Morning is a shopping-specific tool against impulse buying: wants are "parked" with a wait time and decided on later with a clear head. People pick their shopping and takeaway apps with Apple's Screen Time picker; those apps open behind a short pause. No account, no bank connection, no server of our own.

TO TEST
- A real iPhone (Family Controls does not work in the Simulator).
- During setup, allow Screen Time and pick one or two shopping apps.
- Shields need the subscription. The paywall offers a 7-day free trial to eligible Apple IDs; a sandbox account works.

CORE FLOW (2-3 minutes)
1. Open a chosen app. iOS shows the Till Morning shield.
2. Tap "I still want it". A notification "Tap to start your pause" opens the breathing pause. (If notifications are off, the shield says to open Till Morning, which then starts the pause.)
3. After the pause: "I'll leave it", "Park it till morning" (the want goes to the trolley on Today and to Waiting) or "I need it now" (Shopping Pass).
4. Shopping Pass: say what you need, set a limit and minutes. The app unlocks, a Live Activity counts down, and it locks again. Also from Today > "Get a pass".
5. Decide: a want parked as "£20 or less" before 21:00 is ready in 1 hour. Then Waiting > Ready > tap it > "Let it go" or "Still want it" (which offers a Shopping Pass). Wants never become ready between 22:00 and 08:00.

EVERYTHING IS VISIBLE FROM DAY 1 (nothing unlocks later)
- Night lock (23:00-07:00 by default): Settings > Night lock > "See how night lock looks". Its "It's urgent" door (10 minutes after a short wait and a reason) can be opened from that preview.
- After 22:00 the pause is longer and the shield text changes.
- Your rules (Settings): challenges, treat nights (for takeaway apps you picked), sale seasons (waits doubled while switched on), "When to shield" (all day / evenings / weekends).
- Cool-off: after "Close" on a shield, that app stays closed for the minutes set in Settings.
- Weekly recap: Me > "Your week" (it also appears on Today on Sundays).
- Stickers, ranks and the Morning card: Me. Requirements are shown on screen.
- Voice note from calm you: Today setup card or Me > note. Plays in the pause.
- Monthly budget, cool-off length and the optional self-reported bank limit: Settings > More options.
- Rating prompt: Apple's SKStoreReviewController only.

EXTENSIONS
- Share: in any app, Share > Till Morning parks a link or a basket screenshot (the total is read on the phone with Vision).
- Safari: Settings > "Safari and the Share button" explains it. Turn it on in iPhone Settings > Apps > Safari > Extensions > Till Morning, then open a basket/checkout page on a listed shop (e.g. asos.com, open the bag). It offers to park the basket. Tapping its toolbar icon shows what it does.
- Widget: "Waiting room" widget for the Home and Lock Screen (long-press the Home Screen > Edit > Add Widget > Till Morning).

PERMISSIONS
- Screen Time (Family Controls): only to shield the apps the person picks.
- Notifications: start the pause, pass ended, a parked want is ready, the trial reminder. No marketing.
- Microphone (optional): the voice note. Photos (optional): a basket screenshot. Both stay on the phone.
- Messages (optional): "Ask a friend" opens the composer; the person sends it.

The App Store build has no test tools, hidden screens, gestures, remote feature flags or over-the-air updates. The bank limit is self-reported; the app never connects to a bank.

Website, privacy and support: https://tillmorning.co.uk
```

---

## B. Guideline 5.6 checklist (run before every submission)

**Built into the code** (keep it that way):
- [x] There are no test tools in the app at all (no Test tools section, no paywall skip, no replay/reset screens, no `isTestBuild`). Test on TestFlight builds like a customer.
- [x] `app.config.ts` turns expo-updates **off** when `APP_ENV` is `production`. Fixes ship as new reviewed builds. If OTA is ever turned back on, only bug fixes may go out that way, never new features or changed behaviour.
- [x] No long-press, multi-tap or other secret gestures (`grep -rn "onLongPress" src` should stay empty).
- [x] No feature waits for a date or a server switch to unlock. There are no week-one "New · day N" cards. Sunday's recap is always on Me → Your week.
- [x] Time-based features each have a visible way to see them (table above).
- [x] In-app copy describes only what exists in this build. The widget, Share and Safari extensions ship and are in the notes and the description.

**Before you press Submit:**
- [ ] Build with Codemagic → "Till Morning for iPhone" (APP_ENV=production) from the latest main.
- [ ] Install that exact build from TestFlight and walk the notes above end to end (night-lock preview + It's urgent, Your week, Safari page, paywall close button).
- [ ] The App Store description, screenshots and preview video show only features in this build, and every main feature in the build is mentioned (night lock, Waiting room, Shopping Pass, budget, rules, voice note, basket screenshot).
- [x] Privacy policy and support URLs point to https://tillmorning.co.uk (site/ in this repo, deployed with wrangler).
- [ ] App Privacy answers match the app: purchases (RevenueCat), crash/performance/diagnostics (Sentry, Expo), product interaction (Expo Observe). Not linked, no tracking.
- [ ] Paste Part A into the App Review notes, with a real contact.
- [ ] Don't reuse code, screenshots, descriptions or metadata from the other apps on this account. Shared templates across apps are a common reason for 5.6 and 4.3 "pattern" flags.
- [ ] Reply to any App Review question in Resolution Center plainly and quickly, and list where each feature is.
