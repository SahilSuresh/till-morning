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
      body: `Your ${p.app} pass ended. Tap to check in.`,
      sound: 'default',
      data: { url: 'tillmorning://checkin' },
      interruptionLevel: 'timeSensitive',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.endsAt) },
  });
}

export function cancelPassEnd(p: ShoppingPass) {
  return Notifications.cancelScheduledNotificationAsync(passId(p)).catch(() => {});
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
