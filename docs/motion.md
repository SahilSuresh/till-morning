# Pausa · motion spec (v1)

Built into the clickable prototype (first in version 2 "Motion pass"; current version 17, October 2026). Patterns researched on ScreensDesign, October 2026.

**Rule of thumb:** calm while the user decides (the pause), celebratory when they've earned something (XP, ranks), never pushy where money is involved (paywall). Every animation falls back to its end state when Reduce Motion is on.

## Pausa builds these

| Moment | What moves | Timing | SwiftUI starting point |
|---|---|---|---|
| Hold to pause (first screen) | Sale pop-ups jiggle around one big pause button. Holding it fills a ring; the pop-ups slow down and fade, then "Paused." appears. Letting go early brings the noise back | 2.5 s hold | `onLongPressGesture(minimumDuration:perform:onPressingChanged:)`, `.sensoryFeedback` |
| 15-second pause | A soft circle inside the countdown ring grows on "breathe in" and shrinks on "breathe out". At zero it settles full, a tick pops, and the three choices unlock 90 ms apart | One breath per 7.5 s (two per 15-s pause), ease-in-out | `PhaseAnimator` for the breath, `TimelineView` for the countdown |
| Tear the ticket (start a pass) | The stub follows the finger and tilts. Past about 70 pt it tears off and flies away, then the pass starts. A plain tap wiggles the stub and shows a hint. VoiceOver and keyboard start the pass directly | About 0.5 s tear | `DragGesture` with offset and rotation, `.accessibilityAction` to start |
| XP earned | Home's rank bar fills from the last-seen XP while the number counts up. Toasts show "+N XP" as a mint chip | 1 s fill, ease-out | `.contentTransition(.numericText())` plus an animated bar |
| Pausa card stamp | A new stamp stamps into its slot (scale down from big on a spring). Several new stamps land one after another | 0.55 s each, 170 ms apart | Spring scale 2.2 to 1 |
| "Used" stamp at check-in | The red "Used" stamp lands on the ticket | 0.55 s, after 380 ms | Spring scale 2.2 to 1 |
| Rank-up | Badge springs in, light rays turn slowly behind it, about 34 sticker-style confetti pieces burst from the badge and fall, the new rank pulses on the ladder | Burst 1.5 to 2.4 s, rays 26 s per turn | `keyframeAnimator`, a small particle view, `.sensoryFeedback(.success, trigger:)` |
| Shields up (trial starts) | "Protection on" stamps in, each app's Shielded chip stamps in 180 ms apart, a ring pulses twice | About 1.5 s total | Spring scale 2.2 to 1 |
| Paywall (receipt) | The user's apps pop in on the receipt and a shield badge stamps onto each. The free-week timeline line draws down and its steps pop when scrolled into view | About 1.1 s | `.scrollTransition` or on-appear |
| Onboarding | Content slides 34 px and fades (shared axis), the progress bar fills, mascots pop in then float gently, highlighted words pop with a tilt | 0.34 s per screen | `.transition(.asymmetric(...))`, `.spring` |
| Taps | Chips and cards bump (0.94, 1.04, 1), checks pop, toggles slide on a spring | About 0.3 s | `.sensoryFeedback(.selection, trigger:)` |
| Pass running | The pass bar drops in, the ticket wiggles, a thin bar runs down as time passes | Live | `ProgressView(timerInterval:)` |

## iOS does these (simulated in the prototype only, nothing to build)

- An app zooming open from its icon and shrinking back when closed.
- The shield appearing over a blocked app. iOS draws it: no animation, no custom font.
- The notification banner dropping in.
- Apple's app picker sheet and the Screen Time permission alert.
- One app handing over to another (slide in from the right).

## Kept still on purpose

- The shield (iOS won't allow it).
- The paywall button: no pulsing, no shine, no countdown.

## References (ScreensDesign)

- Breathing before unlocking apps, Blank Spaces Launcher: https://screensdesign.com/apps/blank-spaces-launcher/?vs=277421&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Pulsing breath circle with count, TeddyCare: https://screensdesign.com/apps/teddycare-daily-routine-plan/?vs=174237&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Concentric breathing rings, Breathwrk: https://screensdesign.com/apps/breathwrk-breathing-exercises/?vs=176682&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- "+10 XP" with a Level 1 to Level 2 bar, CharmXP: https://screensdesign.com/apps/charmxp-ai-charisma-coach/?vs=283422&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- "You gained 10 XP!" with a progress bar, Zest: https://screensdesign.com/apps/zest-cooking/?vs=37370&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Level-up badge with light rays, Liven: https://screensdesign.com/apps/liven-discover-yourself/?vs=216299&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Level-up confetti, WayBetter: https://screensdesign.com/apps/waybetter-secret-to-motivation/?vs=79942&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Mascot behind a badge with confetti, OtterLife: https://screensdesign.com/apps/otterlife-ai-health-tracker/?vs=248108&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Success animation, then the trial timeline, Moovit: https://screensdesign.com/apps/moovit-bus-transit-tracker/?vs=185832&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Free-trial timeline, GenK: https://screensdesign.com/apps/genk-world-general-knowledge/?vs=269344&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- "Creating your plan" checklist, Yazio: https://screensdesign.com/apps/yazio-calorie-counter-diet/?vs=223867&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
- Blocked-app interruption demo, AppBlock: https://screensdesign.com/apps/appblock-apps-web-blocker/?vs=293755&utm_source=screensdesign&utm_medium=mcp&utm_content=search_screens
