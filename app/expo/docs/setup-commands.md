# Till Morning: what you run, in order

Everything here runs on your PC (PowerShell) or in a web dashboard. Builds happen in EAS's cloud,
so no Mac or Xcode is needed. Never paste keys into chat or into the repo.

## 1. Apple (start today, it's the slow part)

1. In [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list),
   register these 4 App IDs. Give each the **Family Controls (Development)** and **App Groups**
   capabilities, and add the group `group.com.andrej.tillmorning`:
   - `com.andrej.tillmorning`
   - `com.andrej.tillmorning.ActivityMonitorExtension`
   - `com.andrej.tillmorning.ShieldAction`
   - `com.andrej.tillmorning.ShieldConfiguration`
2. Ask for distribution approval for all 4 at
   https://developer.apple.com/contact/request/family-controls-distribution . Keep the confirmation.
3. When Apple approves, add **Family Controls (Distribution)** to the same 4 IDs. EAS handles the rest.
4. Note your **Team ID** (top right of the developer site).
5. In App Store Connect, create the app (name "Till Morning: No Impulse Buys", bundle ID
   `com.andrej.tillmorning`), then one subscription group with two auto-renewing subscriptions,
   each with a 7-day free trial: yearly £29.88 and monthly £4.99.

## 2. Accounts (free tiers)

- **RevenueCat:** new project → add the iOS app (bundle ID above) → connect App Store Connect →
  import the two products → create entitlement `pro` with both → put both in the default offering.
  Copy the **public iOS SDK key** (starts `appl_`).
- **Sentry:** new React Native project `till-morning`. Copy the **DSN**, your **org slug**, and create an
  **Organization auth token** (Settings → Auth Tokens).

## 3. Link the project to EAS

```powershell
cd <where you keep the repo>\till-morning
npm install
npx eas-cli@latest login
npx eas-cli@latest init            # links the project and writes extra.eas.projectId to app.json
npx eas-cli@latest update:configure  # writes updates.url to app.json
```

## 4. Environment variables (once)

```powershell
$envs = "--environment","development","--environment","preview","--environment","production"
npx eas-cli@latest env:create --name APPLE_TEAM_ID --value <TEAM_ID> --visibility plaintext @envs
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value <appl_...> --visibility plaintext @envs
npx eas-cli@latest env:create --name EXPO_PUBLIC_SENTRY_DSN --value <DSN> --visibility plaintext @envs
npx eas-cli@latest env:create --name SENTRY_ORG --value <org-slug> --visibility plaintext @envs
npx eas-cli@latest env:create --name SENTRY_PROJECT --value till-morning --visibility plaintext @envs
npx eas-cli@latest env:create --name SENTRY_AUTH_TOKEN --value <token> --visibility secret @envs
```

## 5. First build on your iPhone (the gate)

```powershell
npx eas-cli@latest device:create          # register your iPhone, open the link on the phone
npm run build:dev                          # development build, install from the link EAS gives you
npx expo start --dev-client                # then open the app on the phone
```

If the build fails with a Family Controls provisioning error, it is waiting on Apple's approval in step 1.

On the phone, open Settings in the app and check, under "Foundation checks":
1. **Send test crash report** → the event shows in Sentry within a minute.
2. **Check RevenueCat offerings** → lists the yearly and monthly product IDs (sandbox).
3. **Ask for Screen Time access** → Apple's prompt appears and the status says approved.

Then tell me what you saw and I'll mark the gate.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run preflight` | Typecheck, lint, expo-doctor |
| `npm run build:dev` | Development build for your iPhone |
| `npm run build:preview` | Internal test build (release mode, test environment) |
| `npm run build:ios` | Production build, build number auto-increments |
| `npm run submit:ios` | Send the latest production build to App Store Connect / TestFlight |
| `npm run update` | Over-the-air JS fix to production, then upload source maps to Sentry. JS and image fixes only, never new features (Apple 2.5.2) |
