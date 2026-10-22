import { Stack } from 'expo-router';
import { ObserveRoot, useObserve } from 'expo-observe';
import { useEffect } from 'react';

import { initAnalytics } from '../lib/analytics';
import { initCrashReporting, Sentry } from '../lib/crashes';
import { initPurchases } from '../lib/purchases';

initCrashReporting();
initAnalytics();
initPurchases();

function RootLayout() {
  const { markInteractive } = useObserve();

  useEffect(() => {
    markInteractive();
  }, [markInteractive]);

  // Placeholder navigation. Real screens and styling come from the design spec.
  return <Stack />;
}

export default Sentry.wrap(ObserveRoot.wrap(RootLayout));
