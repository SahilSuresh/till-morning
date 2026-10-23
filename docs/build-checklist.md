# Till Morning: prototype v26 → iPhone app checklist

Source of truth: `app/prototype/till-morning.html` (prototype **v26**; its title still says v18).
Line numbers (L…) point into that file. Status: ✅ built · 🟡 partly built · ⬜ not built · 🔧 needs a new native build · ⛔ prototype-only, don't build.

Last updated: 23 Oct 2026 (evening). App Review / guideline 5.6 rules: see docs/app-review-notes.md.

## 1. Setup
| | Item | Notes |
|---|---|---|
| ✅ | Hold-to-pause welcome (L1119) | 10 sale pills, 2.5 s ring, "Paused.", Skip |
| ✅ | Welcome "Shop on purpose." (L1128) | |
| ✅ | Story "The 11 PM scroll" (L1142) | |
| ✅ | Screen Time ask (L1245) | real FamilyControls request |
| ✅ | UK apps tip (L1253) | |
| ✅ | Apple app picker (L1262) | real FamilyActivityPicker sheet |
| ✅ | Meals / backup dinner (L1490) | in Settings → Pause; shown in the pause on takeaway apps (needs your takeaway apps picked in Your rules). Shield meal line ⬜🔧 |
| ✅ | Demo pause "This is your pause" (L1351) | |
| ✅ | Tour slide "Park it till morning" (L1184) | |
| ✅ | Paywall "Your free week" (L1383) | live App Store prices via RevenueCat, day-5 reminder notification, restore; "Skip" only in test builds |
| ✅ | Post-purchase coach tour (L2252) | 4 tips as a paper card (no spotlight cut-out) |
| ✅ | Protection paused (plan lapsed) (L1685) | when RevenueCat reports a plan we've seen active has ended: every shield lifts, the Paused page shows, Today and Settings say so; resubscribing keeps week one as it was. Test-build skips never lapse |
| ✅ | Notifications permission | real-app addition, needed for "Tap to start your pause" |

## 2. Tabs
| | Item | Notes |
|---|---|---|
| ✅ | Tab bar Today / Waiting / Me / Settings + ready badge (L2194) | swipe between tabs ⬜ |
| 🟡 | Today: greeting, shields chip, check-in nudge, live pass, status card, wait card, Need-to-shop pill | status card variants: access lost ⬜, off till tomorrow ⬜, app list text ⬜; "checked N min ago" ⬜ |
| ✅ | Today: sale banner, week-one "New · day N" cards, Sunday recap row | |
| ✅ | Today: "A parcel to open" row | |
| ✅ | Today: Finish setting up card (budget, Shopping Pass intro, bank limit; Hide) and bank seal card (L1715, L2074) | note item ⬜🔧, habits item needs per-app tokens |
| ✅ | Which-app sheet for "Need to shop?" (L2213) | Apple's own app labels via modules/tm-native; tap → that app's pause and pass |
| ✅ | Waiting room: segments, tags, let-go shelf, empty states, countdown ring + time left on each tag | Share button ⬜🔧 |
| ✅ | Me: rank card, Morning card, sticker goals, How XP works, recent decisions | note card ⬜🔧 |
| 🟡 | Ranks page (L2010) | built as a collapsible list on Me; medals ⬜ |
| ✅ | Your rules page (L2131) | challenge, treat nights (with a takeaway-apps picker), wait rule + try a price, when to shield, sale seasons, hours of work. Ask a friend ⬜🔧 |
| ✅ | Your apps page (L2082) | per-app switch (−5 XP once a day, breaks the day), habit tags, budget line, add/remove apps |

## 3. Core loop
| | Item | Notes |
|---|---|---|
| ✅ | Shield normal / cool-off | custom Swift in targets/ |
| ✅ | Shield late (22:00–05:00) and night-lock shield | drawn by the Swift extension from the app's night-lock times; "You left it N of the last M" |
| ✅ | Shield message priority: own message → challenge → goal → habit; second line meals → app budget → total → waiting room | per-app lines written to tm_sub::key / tm_nightsub::key |
| ✅ | Pause: ring, facts, three choices, walk-away XP, "What's this one about?" + coach, challenge button, night-lock version | note playback ⬜🔧, takeaway meals card ⬜ |
| ✅ | Park sheet short + full, parked screen, Snap your basket (on-device Vision OCR), hours of work, Ask a friend (Messages composer, self-reported answer) | |
| ✅ | Decide screen | |
| ✅ | Shopping Pass + tear ticket + 3rd-pass wait, fromRoom notice (no pause, no 3rd-pass wait, only that app) | |
| ✅ | Live pass + re-lock | Live Activity ⬜🔧 |
| ✅ | Check-in + Did this pause help? + checkout proof screenshot (+15 XP, receipt/wallet stickers) | |
| ✅ | Urgent door (night lock "It's urgent") (L1477) | 60 s wait, reason, 10-minute pass, no check-in |
| ✅ | Rank-up celebration (L1603) | confetti, medal, XP count-up, share |

## 4. Sheets and pages
| | Item | Notes |
|---|---|---|
| ✅ | Turn off till tomorrow (L2264) | DeviceActivity schedule turns them back on at 07:00 |
| ✅ | Delete all data dialog (L2265) | |
| ✅ | App Store rating prompt rules (L1830) | Apple's pop-up after a let-go: subscribed, day 4+, 2+ let-gos, calm day, no rank-up, max 3 a year 120 days apart |
| ✅ | First-visit tab tips (L2243) | |
| ✅ | Sticker goal pages (v25–26) incl. "What's a calm day?" | |
| ✅ | Parcel opening | tear animation simplified to a tap |
| ⬜ | Note from calm you (L1673) | 🔧 expo-audio for recording/playback |
| ✅ | Week-one feature cards (L1552) | days 2–7 |
| ✅ | Sunday recap (L1562) | share as text |
| ✅ | Bank limit guide + seal (L1314, L1334) | 5 steps, seal page with confetti, 4 tiers, seal card with days on Today, "I removed my card limit" |
| ✅ | Monthly budget page (L1289) | total, £50–£200 chips, one pot / even / I'll choose (+/− £5 per app; apps appear by name once they've hit a shield). Shield line uses the total; per-app line ⬜🔧 (written to tm_budget::Name for the Swift shield) |
| ⬜ | Safari checkout sheet (L2232) | 🔧 Safari Web Extension — later |

## 5. Settings
| | Item | Notes |
|---|---|---|
| ✅ | Shield my apps switch (−10 / +5 once a day, breaks the day) | |
| ✅ | Turn off till tomorrow | |
| 🟡 | Your apps | "Choose apps" opens the picker |
| ✅ | Your rules | |
| ✅ | Night lock switch, starts 22/23/00, ends 06/07/08 | |
| ✅ | Backup dinner link | |
| ✅ | Pause length 10/15/30/60 s | |
| ✅ | More options: monthly budget, bank limit, shield message (60), what you're saving for (40) | |
| ✅ | Cool-off Off/5/10/30 | |
| ✅ | Ask "What's this one about?" switch | |
| ✅ | Shopping Pass lengths (3 fields) | |
| ✅ | Bank limit | in More options |
| ✅ | Subscription and privacy | plan + free-week day, opens Apple subscriptions; restore |
| ✅ | Rate Till Morning | |
| ✅ | Delete all data | |

## 6. Gamification
| | Item | Notes |
|---|---|---|
| ✅ | XP rules, 60/day cap, 5 closes/day, 30-min per-app gap, losses, rank floor | |
| ✅ | 18 ranks + rank-up screen | |
| ✅ | Morning card / calm days / breakDay / +50 card fill | |
| ✅ | 9 sticker goals + parcels | receipt/wallet need checkout proof; legend needs challenges |
| ✅ | Let-go shelf | |
| ✅ | Bank seals | Committed / Week strong / Month proof / Vault |

## 7. Rules
| | Item | Notes |
|---|---|---|
| ✅ | Challenges: no-buy, low-buy, takeaway-free weekdays | shield line, pause button, pause fact, Morning card title, legend sticker |
| ✅ | Treat nights | you pick your takeaway apps once; weekly DeviceActivity schedules open them on treat nights |
| ✅ | Night lock 23:00–07:00 | passes sleep, urgent door, shield copy |
| ✅ | Risky hour | pause ≥45 s, chip, late shield, status line |
| ✅ | Sale week ×2 waits, +15 s pause, Today banner | |
| ✅ | Wait rule | bands, exact price (1 h per £10), hours of work |
| ✅ | When to shield: all / evenings / weekends | DeviceActivity schedules |

## 8. Native extras (need a new install)
| | Item |
|---|---|
| ⬜🔧 | Home Screen + Lock Screen widgets (v23) — WidgetKit extension |
| ⬜🔧 | Note recording/playback — expo-audio |
| ✅ | Checkout screenshot + on-device OCR — image picker + Vision (Install A) |
| ⬜🔧 | Share Extension ("Park something from a shop's Share button") |
| ⛔ | Live Activity — not in the prototype |

## ⛔ Prototype-only (not built)
Springboard, simulated shop apps, home bar, fake picker/permission/purchase sheets, test panel, fast timers, virtual clock, day shift, skip setup.
Dead code in the prototype (skip): rhetorical/chaos/missing/pain/quiz/rules/roomIntro/challenge/shieldIntro/xpIntro/tags/passIntro screens, old `homeTab()` and everything only it renders, `checkAway`, `giveParcel`, `welcomeParcel`.
