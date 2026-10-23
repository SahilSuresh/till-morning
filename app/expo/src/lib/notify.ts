import * as Notifications from 'expo-notifications';

import type { ParkedWant, ShoppingPass } from './store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function askNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false, allowProvisional: false },
  });
  return next.granted;
}

const passId = (p: ShoppingPass) => `tm_pass_end_${p.id}`;
const parkId = (w: ParkedWant) => `tm_park_${w.id}`;

export async function schedulePassEnd(p: ShoppingPass) {
  await Notifications.scheduleNotificationAsync({
    identifier: passId(p),
    content: {
      title: 'Till Morning',
      body: p.urgent
        ? p.app && p.app !== 'this app' ? `${p.app} is locked again. Sleep well.` : 'Locked again. Sleep well.'
        : p.wholeSelection
          ? 'Your Shopping Pass ended. Tap to check in.'
          : p.app && p.app !== 'this app' ? `Your ${p.app} pass ended. Tap to check in.` : 'Your Shopping Pass ended. Tap to check in.',
      sound: 'default',
      data: { url: p.urgent ? 'tillmorning://' : 'tillmorning://checkin' },
      interruptionLevel: 'timeSensitive',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.endsAt) },
  });
  // iOS won't let an app draw a timer over another app, so the countdown comes as banners
  // on top of the shop: 2 minutes left (passes of 4+ minutes) and 30 seconds left.
  const warnings: [string, number, string][] = [
    ['2m', 120000, '2 minutes left on your Shopping Pass. Time to wrap up.'],
    ['30s', 30000, '30 seconds left. The app locks again in a moment.'],
  ];
  for (const [tag, before, body] of warnings) {
    const at = p.endsAt - before;
    if (at - p.startedAt < 60000 || at <= Date.now()) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${passId(p)}_${tag}`,
      content: { title: 'Till Morning', body, sound: 'default', interruptionLevel: 'timeSensitive' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
    }).catch(() => {});
  }
}

export function cancelPassEnd(p: ShoppingPass) {
  for (const id of [passId(p), `${passId(p)}_2m`, `${passId(p)}_30s`]) Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
  return Promise.resolve();
}

export async function scheduleParkedReady(w: ParkedWant) {
  await Notifications.scheduleNotificationAsync({
    identifier: parkId(w),
    content: {
      title: 'Till Morning',
      body: `${w.what || `Something from ${w.app}`} is ready. Still want it? Tap to decide.`,
      sound: 'default',
      data: { url: `tillmorning://decide?id=${w.id}` },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(w.readyAt) },
  });
}

export function cancelParkedReady(w: ParkedWant) {
  return Notifications.cancelScheduledNotificationAsync(parkId(w)).catch(() => {});
}

export { Notifications };
