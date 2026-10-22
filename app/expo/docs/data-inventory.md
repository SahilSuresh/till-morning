# Till Morning data inventory

Source for Apple's App Privacy label. Update it whenever an SDK is added or its settings change.
Last checked: 22 October 2026, against the code in this repo.

**Summary:** no account, no login, no tracking, no ads, no bank links. Everything the person sets up
(apps, budgets, goals, check-in answers, XP, ranks, seals) stays on the iPhone.

## SDKs and what they send

| SDK | What leaves the phone | Why | Linked to the person? | Used for tracking? |
|---|---|---|---|---|
| Apple Screen Time (FamilyControls, ManagedSettings, DeviceActivity) via `react-native-device-activity` | Nothing. App picks are opaque Apple tokens kept in the App Group on the phone. Till Morning can't see app names or what happens inside them. | Shields and timed Shopping Passes | n/a | No |
| RevenueCat (`react-native-purchases`) | An anonymous RevenueCat ID, App Store receipt and subscription status, device and app version, country | Run the free trial and subscription, restore purchases | Not linked: anonymous ID only, no name or email | No |
| Sentry (`@sentry/react-native`) | Crash reports: stack trace, device model, iOS and app version, a random install ID. `sendDefaultPii` is off, so no IP address; no session replay, no screenshots | Find and fix crashes | Not linked | No |
| Expo Observe (`expo-observe`) | App start and screen timing, the named events below, a random EAS install ID, device and app version | Know if the app is fast and whether setup and the trial work | Not linked | No |
| Expo Updates (`expo-updates`) | The random EAS install ID, app version, runtime version, channel | Download bug-fix updates | Not linked | No |
| Expo Notifications (`expo-notifications`) | Nothing. Local notifications only (trial reminder on day 5, "tap to start your pause" on older iPhones). No push token is sent anywhere | Reminders the person asked for | n/a | No |
| Expo Store Review (`expo-store-review`) | Nothing from the app; Apple's own rating sheet | Ask for a rating | n/a | No |
| AsyncStorage | Nothing, on-device storage | Settings, XP, ranks, history | n/a | No |

## Named analytics events (src/lib/analytics.ts)

`onboarding_completed`, `screen_time_authorized`, `apps_selected`, `paywall_shown`, `trial_started`,
`purchase_restored`, `pause_completed`, `shopping_pass_started`, `check_in_completed`,
`shields_removed_subscription_ended`.

Rule: attributes may only be small counts or choices (e.g. `minutes: 10`). Never app names, budgets,
goals, typed text, check-in answers or anything that identifies the person.

## Apple App Privacy answers (draft)

"Data Not Linked to You":
- **Purchases** (Purchase History): App Functionality. Source: RevenueCat.
- **Diagnostics** (Crash Data, Performance Data): App Functionality / Analytics. Source: Sentry, Expo Observe.
- **Usage Data** (Product Interaction): Analytics. Source: the named events above.
- **Identifiers** (Device ID): random install IDs from Sentry, Expo and RevenueCat. App Functionality / Analytics.

"Data Used to Track You": none. No App Tracking Transparency prompt is needed.

## Retention and deletion

- On the phone: "Delete all data" in Settings wipes AsyncStorage and removes all shields. Deleting the app also removes everything.
- Sentry: 90 days on the free plan, then deleted.
- Expo Observe: per Expo's retention for the plan in use.
- RevenueCat: kept while the subscription record exists; the anonymous ID can be deleted on request through RevenueCat.
- Apple handles payment details; Till Morning never sees them.

To check before launch: confirm RevenueCat's and Expo Observe's current privacy guidance for the label, since their defaults can change.
