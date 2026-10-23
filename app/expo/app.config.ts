import type { ConfigContext, ExpoConfig } from 'expo/config';

// Static settings live in app.json. This file adds the values that come from
// EAS environment variables, so no key or ID is committed to the repo.
//
// EAS environment variables (set with `eas env:create`, see docs/setup-commands.md):
//   APPLE_TEAM_ID                       plain text   your Apple Developer team ID
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY      plain text   RevenueCat public iOS SDK key (appl_...)
//   EXPO_PUBLIC_SENTRY_DSN              plain text   Sentry DSN (safe to ship in the app)
//   SENTRY_ORG / SENTRY_PROJECT         plain text   for source-map upload
//   SENTRY_AUTH_TOKEN                   secret       for source-map upload, never in the repo
//   APP_ENV                             plain text   development | preview | production

const APP_GROUP = 'group.com.andrej.tillmorning';

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV ?? 'development';

  return {
    ...config,
    name: config.name ?? 'Till Morning',
    slug: config.slug ?? 'till-morning',
    ios: {
      ...config.ios,
      appleTeamId: process.env.APPLE_TEAM_ID,
      entitlements: {
        ...config.ios?.entitlements,
        'com.apple.developer.family-controls': true,
        'com.apple.security.application-groups': [APP_GROUP],
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-device-activity',
        {
          appleTeamId: process.env.APPLE_TEAM_ID,
          appGroup: APP_GROUP,
          // targets/ holds Till Morning's customised shield extensions; don't let the
          // plugin overwrite them with the library's stock copies on prebuild.
          copyToTargetFolder: false,
        },
      ],
      [
        '@sentry/react-native/expo',
        {
          url: 'https://sentry.io/',
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
        },
      ],
    ],
    extra: {
      ...config.extra,
      appEnv,
      appGroup: APP_GROUP,
    },
  };
};
