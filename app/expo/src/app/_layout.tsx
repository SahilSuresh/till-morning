import { Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold } from '@expo-google-fonts/figtree';
import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { useFonts } from 'expo-font';
import { ObserveRoot, useObserve } from 'expo-observe';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';

import { initAnalytics } from '../lib/analytics';
import { pauseProtection, processShieldLog, syncShields, tick } from '../lib/core';
import { initCrashReporting, Sentry } from '../lib/crashes';
import { Notifications } from '../lib/notify';
import { checkGoals, goalToast, rollDay } from '../lib/progress';
import { initPurchases, isSubscribed, onSubscriptionChange } from '../lib/purchases';
import { getState, loadState, setState, useAppState, useLoaded } from '../lib/store';
import { rankFor } from '../lib/xp';
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

/** The App Store's answer on the plan. Lifts every shield once a plan we've seen active has ended. */
function onPlan(active: boolean) {
  const s = getState();
  if (active) {
    const wasLapsed = s.lapsed;
    if (!s.proSeen || s.lapsed || !s.subscribed) setState({ proSeen: true, lapsed: false, subscribed: true });
    if (wasLapsed) syncShields();
    return;
  }
  // Test builds can skip the paywall without buying; those never lapse.
  if (s.proSeen && s.subscribed && !s.lapsed) {
    pauseProtection();
    router.push('/paused');
  }
}

function checkPlan() {
  isSubscribed().then(onPlan).catch(() => {});
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
    loadState().then(() => {
      onForeground();
      checkPlan();
    });
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      onForeground();
      checkPlan();
    });
    const offPlan = onSubscriptionChange(onPlan);
    const timer = setInterval(() => {
      const ended = tick();
      if (ended) toast(ended);
    }, 1000);
    return () => {
      sub.remove();
      offPlan();
      clearInterval(timer);
    };
  }, []);

  const ready = loaded && fontsLoaded;
  useEffect(() => {
    if (ready) markInteractive();
  }, [ready, markInteractive]);

  // A new rank gets its celebration as soon as the XP lands.
  const xpTotal = useAppState((s) => s.xp.total);
  const rankSeen = useAppState((s) => s.rankSeen);
  useEffect(() => {
    if (!ready) return;
    if (rankFor(xpTotal).index > rankSeen) router.push('/rankup');
  }, [ready, xpTotal, rankSeen]);

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
        <Stack.Screen name="rankup" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ gestureEnabled: false }} />
        <Stack.Screen name="paused" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="bankseal" options={{ animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </View>
  );
}

export default Sentry.wrap(ObserveRoot.wrap(RootLayout));
