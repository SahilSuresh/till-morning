import * as Application from 'expo-application';
import Constants from 'expo-constants';

// Public, non-secret values only. They arrive from EAS environment variables at build time.
export const config = {
  appEnv: (Constants.expoConfig?.extra?.appEnv as string | undefined) ?? 'development',
  appGroup: (Constants.expoConfig?.extra?.appGroup as string | undefined) ?? 'group.com.andrej.tillmorning',
  revenueCatIosKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
  version: Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0',
  build: Application.nativeBuildVersion ?? 'dev',
};

// The single RevenueCat entitlement that unlocks the shields.
export const ENTITLEMENT_ID = 'pro';

// Draft URLs. Replace once the privacy and support pages are hosted (see docs/setup-commands.md).
export const links = {
  privacy: 'https://example.com/till-morning/privacy',
  support: 'https://example.com/till-morning/support',
  // Apple's standard licence agreement, used as the Terms of Use for subscriptions.
  terms: 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
  supportEmail: 'mailto:support@example.com',
};
