import { Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { ObserveRoot, useObserve } from 'expo-observe';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';

import { initAnalytics } from '../lib/analytics';
import { processShieldLog, syncShields, tick } from '../lib/core';
import { initCrashReporting, Sentry } from '../lib/crashes';
import { Notifications } from '../lib/notify';
import { checkGoals, goalToast, rollDay } from '../lib/progress';
import { initPurchases } from '../lib/purchases';
import { loadState, useLoaded } from '../lib/store';
import { toast, ToastHost } from '../ui/components';
import { color } from '../ui/theme';

initCrashReporting();
initAnalytics();
initPurchases();

function onForeground() {
  rollDay();
  syncShields();
  const ended = tick();
  if (ended) toast(ended);
  const toasts = processShieldLog();
  const goal = goalToast(checkGoals());
  if (toasts.length) toast(toasts[toasts.length - 1]);
  if (goal) setTimeout(() => toast(goal), toasts.length ? 2800 : 0);
}

const handledResponses = new Set<string>();

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
    const timer = setInterval(() => {
      const ended = tick();
      if (ended) toast(ended);
    }, 1000);
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
    const id = `${lastResponse.notification.request.identifier}:${lastResponse.notification.date}`;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);
    openFromUrl(lastResponse.notification.request.content.data?.url);
    // So a notification tapped once doesn't reopen the same screen on the next launch.
    Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
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
        <Stack.Screen name="parcel" options={{ animation: 'fade' }} />
        <Stack.Screen name="urgent" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
      <ToastHost />
    </View>
  );
}

export default Sentry.wrap(ObserveRoot.wrap(RootLayout));
