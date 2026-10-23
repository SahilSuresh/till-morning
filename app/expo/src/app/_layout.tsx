import { Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { ObserveRoot, useObserve } from 'expo-observe';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';

import { initAnalytics } from '../lib/analytics';
import { processShieldLog, tick } from '../lib/core';
import { initCrashReporting, Sentry } from '../lib/crashes';
import { Notifications } from '../lib/notify';
import { initPurchases } from '../lib/purchases';
import { loadState, useLoaded } from '../lib/store';
import { toast, ToastHost } from '../ui/components';
import { color } from '../ui/theme';

initCrashReporting();
initAnalytics();
initPurchases();

function onForeground() {
  tick();
  const toasts = processShieldLog();
  if (toasts.length) toast(toasts[toasts.length - 1]);
}

function openFromUrl(url?: unknown) {
  if (typeof url !== 'string') return;
  const path = url.replace(/^tillmorning:\/\//, '/');
  if (path.startsWith('/pause')) router.push('/pause');
  else if (path.startsWith('/checkin')) router.push('/checkin');
  else if (path.startsWith('/decide')) router.push(path as '/decide');
}

function RootLayout() {
  const { markInteractive } = useObserve();
  const loaded = useLoaded();
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    loadState().then(onForeground);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && onForeground());
    const timer = setInterval(tick, 1000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);

  const ready = loaded && fontsLoaded;
  useEffect(() => {
    if (ready) markInteractive();
  }, [ready, markInteractive]);

  // Tapping "Tap to start your pause", "pass ended" or "is ready" opens the right screen.
  useEffect(() => {
    if (!ready || !lastResponse) return;
    openFromUrl(lastResponse.notification.request.content.data?.url);
  }, [ready, lastResponse]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: color.night }} />;

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.night },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="pause" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="pass" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkin" options={{ animation: 'fade' }} />
        <Stack.Screen name="decide" options={{ animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </View>
  );
}

export default Sentry.wrap(ObserveRoot.wrap(RootLayout));
