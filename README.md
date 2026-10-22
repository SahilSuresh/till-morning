# Till Morning

An iPhone app that puts a short pause between you and your shopping and takeaway apps, so you shop on purpose instead of on impulse. Shields lock chosen apps, a 15-second pause offers leave / remind me in 1 hour / shop with a plan, and a timed Shopping Pass re-locks the app afterwards. Everything stays on the device, no account.

(The project was called **Pausa** until 21 Oct 2026, so some older files and code names still say Pausa.)

**Current version:** clickable prototype v26 (main build), packed 22 Oct 2026.
Live link: https://claude.ai/artifact/Nw1QS7nCYsmLE3F85UkDZN

## Open it in VS Code

1. File > Open Folder, pick this `till-morning` folder (or open `till-morning.code-workspace`).
2. Install the recommended extensions when VS Code asks (Live Server, Expo Tools, ESLint).
3. Open `app/prototype/till-morning.html` and click **Go Live** (bottom right), or just double-click the file to open it in a browser.

The prototype is one self-contained HTML file. It needs internet for the fonts and Tailwind (loaded from a CDN). Progress is saved in your browser; use the test panel inside the prototype to reset or jump to any day.

**Real iPhone app (early):** `app/expo/` is the Expo starter project (Screen Time, RevenueCat, Sentry plumbing, no designed screens yet). Run `npm install` there, then see `app/expo/docs/setup-commands.md`. Copy `.env.example` to `.env.local` for keys; never commit real keys.

## Folder map

| Folder | What's in it |
|---|---|
| `app/prototype/` | `till-morning.html`, the clickable prototype (main build) |
| `app/expo/` | Expo / React Native starter for the real iPhone app, with its git history, plus draft privacy policy, support page and data inventory in `app/expo/docs/` |
| `assets/icon/` | Final "Sleepy bag" app icon: 1024 px PNG (light, dark, tinted), SVGs, and the 5 layers |
| `assets/images/` | Sample checkout screenshot used to test the checkout reader |
| `docs/` | App brief (rules), visual system, motion spec, start here, rename notes, new-chat prompt |
| `research/` | Market check, name checks, App Name Lab, 1.0 ship plan, App Store precheck, feature research (open the HTML files in a browser) |
| `research/mockups/` | Before/after pictures of each design change |
| `archive/` | Patch scripts that built v18 to v26, the original v17 handoff prototype, early concept pages |

Where the docs and the prototype disagree, the prototype is newer.

## What changed recently

- v22: "Sleepy bag" app icon.
- v23: Night lock (23:00 to 07:00), backup dinner, shields check with "Turn off till tomorrow", Home and Lock Screen widgets.
- v24: +5 XP once a day for turning shields back on.
- v25 and v26: tapping a sticker goal or the Morning card opens a page explaining what counts and how to get there.

## Next steps

- Request Apple's Family Controls entitlement (critical path; all 4 app targets need it).
- Build a small real-iPhone test in `app/expo/`: pick apps, shield, pause, 5-minute pass, auto re-lock.
- Host the privacy policy and support pages for free; Terms use Apple's standard EULA.
- Still open for 1.0: notifications permission step, shields-stopped warning, guideline 4.3 difference from Onus, UK/EU trade mark check for the name.
