# Till Morning

iPhone app that puts a short pause between people and their shopping and takeaway apps.
Product rules: `Pausa app brief.md` in the project's handoff folder.

This repo is the **foundation**: build setup, subscriptions, crash reporting, analytics,
updates and Screen Time plumbing. Screens and styling come from the design spec, not from here.

| Piece | Choice |
|---|---|
| Framework | Expo SDK 58 + EAS Build/Submit/Update, Expo Router, iOS 18+ only |
| Screen Time | `react-native-device-activity` (app + ShieldConfiguration, ShieldAction, ActivityMonitor extensions, App Group `group.com.andrej.tillmorning`) |
| Payments | RevenueCat, entitlement `pro`, restore in Settings |
| Crashes | Sentry, no PII, source maps on EAS builds |
| Analytics | Expo Observe, 10 named events (`src/lib/analytics.ts`) |
| Updates | `expo-updates`, fingerprint runtime version, channels per build profile |
| Login | None. Everything on device |

- Setup steps and commands: [docs/setup-commands.md](docs/setup-commands.md)
- Data inventory (privacy label source): [docs/data-inventory.md](docs/data-inventory.md)
- Privacy policy and support drafts: [docs/privacy-policy.md](docs/privacy-policy.md), [docs/support.md](docs/support.md)

Secrets live in EAS environment variables. `.env*` files are ignored, except `.env.example`.
