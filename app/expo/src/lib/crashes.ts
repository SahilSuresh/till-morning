import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

import { config } from './config';

export function initCrashReporting() {
  if (!config.sentryDsn) return;

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appEnv,
    release: `till-morning@${config.version}+${config.build}`,
    dist: config.build,
    // Crash and error reports only: no IP address, no session replay, no screenshots.
    sendDefaultPii: false,
    tracesSampleRate: 0,
    enabled: !__DEV__,
  });

  const scope = Sentry.getGlobalScope();
  scope.setTag('expo-update-id', Updates.updateId ?? 'embedded');
  scope.setTag('expo-is-embedded-update', String(Updates.isEmbeddedLaunch));
  scope.setTag('expo-channel', Updates.channel ?? 'none');
}

export { Sentry };
