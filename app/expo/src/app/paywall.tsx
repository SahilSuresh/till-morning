import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { config, links } from '../lib/config';
import { protectedCount, shieldChosenApps } from '../lib/core';
import { Notifications } from '../lib/notify';
import { buy, getPlans, type Plans, restorePurchases } from '../lib/purchases';
import { getState, setState, useAppState } from '../lib/store';
import { TopGlow } from '../ui/backgrounds';
import { Button, Rise, TextLink, toast } from '../ui/components';
import { color, font, type } from '../ui/theme';

const dt = (days: number) => new Date(Date.now() + days * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** "Your free week" (V.paywall, L1383). The billed price stays the biggest number (Apple's rule). */
export default function Paywall() {
  const insets = useSafeAreaInsets();
  const plan = useAppState((s) => s.plan);
  const [remind, setRemind] = useState(true);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [busy, setBusy] = useState(false);
  const count = protectedCount();
  const apps = count.apps + count.categories;

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlans({}));
  }, []);

  // Live App Store prices, with the planned prices as a fallback while they load.
  const yearlyPrice = plans?.yearly?.product.priceString ?? '£29.99';
  const monthlyPrice = plans?.monthly?.product.priceString ?? '£4.99';
  const perMonth = plans?.yearly?.product.pricePerMonthString ?? `£${(29.99 / 12).toFixed(2)}`;
  const yearly = plan === 'yearly';
  const price = yearly ? `${yearlyPrice} a year` : `${monthlyPrice} a month`;

  const done = async () => {
    const now = Date.now();
    // Coming back after a lapse keeps the first week, tips and tour as they were.
    const returning = getState().lapsed || getState().trialAt > 0;
    setState({ subscribed: true, lapsed: false, onboarded: true, appsChosen: true, ...(returning ? {} : { trialAt: now, day: '', coachStep: 0 }) });
    shieldChosenApps();
    if (remind) {
      const when = new Date(now + 5 * 86400000);
      when.setHours(10, 0, 0, 0);
      Notifications.scheduleNotificationAsync({
        identifier: 'tm_trial_reminder',
        content: {
          title: 'Till Morning',
          body: `Your free week ends on ${new Date(now + 7 * 86400000).toLocaleDateString('en-GB', { weekday: 'long' })}. ${price} starts then. Cancel any time in Settings before.`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      }).catch(() => {});
    }
    router.replace('/');
    setTimeout(() => toast('Your shields are up'), 500);
  };

  const start = async () => {
    const pkg = yearly ? plans?.yearly : plans?.monthly;
    if (!pkg) {
      Alert.alert('The App Store isn’t ready yet', 'The plans couldn’t load. Check your connection and try again.');
      return;
    }
    setBusy(true);
    try {
      const r = await buy(pkg);
      if (r === 'active') await done();
    } catch (e) {
      Alert.alert('Purchase didn’t go through', String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    try {
      if (await restorePurchases()) await done();
      else toast('No active subscription found');
    } catch (e) {
      Alert.alert('Could not restore purchases', String(e));
    }
  };

  const step = (dot: string, title: string, sub: string) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot, marginTop: 5 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: color.inkOnBright }}>{title}</Text>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: color.paperLabel }}>{sub}</Text>
      </View>
    </View>
  );

  const planRow = (id: 'yearly' | 'monthly', name: string, amount: string) => {
    const on = plan === id;
    return (
      <Pressable
        onPress={() => setState({ plan: id })}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 18,
          borderWidth: on ? 2.5 : 1.5,
          borderColor: on ? '#5B76FF' : color.cardEdge,
          backgroundColor: on ? '#1C2468' : color.card,
          paddingHorizontal: 16,
          paddingVertical: 15,
        }}
      >
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? '#5B76FF' : '#3A3F86', alignItems: 'center', justifyContent: 'center' }}>
          {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B76FF' }} />}
        </View>
        <Text style={[type.title, { flex: 1 }]}>{name}</Text>
        {id === 'yearly' && (
          <View style={{ backgroundColor: color.sun, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11, color: color.inkOnBright }}>Best value</Text>
          </View>
        )}
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16.5, color: color.text }}>{amount}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 30, paddingHorizontal: 24, paddingBottom: 16 }}>
        <Rise>
          <Text style={[type.h1, { textAlign: 'center' }]}>Your free week</Text>
        </Rise>
        <Rise delay={60} style={{ marginTop: 20 }}>
          <View style={{ backgroundColor: '#F4F3FF', borderRadius: 22, padding: 18, gap: 14 }}>
            {step('#4361FF', 'Today', `Shields go up on ${apps || 'your'} app${apps === 1 ? '' : 's'}`)}
            {step('#8B5CF6', `Day 5 · ${dt(5)}`, remind ? 'We remind you the plan starts soon' : 'No reminder. You turned it off below.')}
            {step('#14163A', `Day 7 · ${dt(7)}`, `${price} starts. Cancel any time before.`)}
            <View style={{ borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#C9C8E6' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 19, color: color.inkOnBright }}>Total</Text>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 19, color: color.inkOnBright }}>{price}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 }}>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: color.paperLabel }}>Due today</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: color.paperLabel }}>£0.00</Text>
            </View>
          </View>
        </Rise>
        <Rise delay={120} style={{ marginTop: 16, gap: 10 }}>
          {planRow('yearly', `Yearly · ${perMonth} a month`, yearlyPrice)}
          {planRow('monthly', 'Monthly', monthlyPrice)}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1.5, borderColor: color.cardEdge, backgroundColor: color.card, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <Text style={[type.title, { flex: 1 }]}>Remind me on day 5</Text>
            <Switch value={remind} onValueChange={setRemind} trackColor={{ true: color.blue, false: '#2B2F69' }} ios_backgroundColor="#2B2F69" />
          </View>
        </Rise>
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingTop: 10, paddingBottom: insets.bottom + 16, alignItems: 'center', gap: 8 }}>
        {busy ? <ActivityIndicator color="#FFFFFF" style={{ height: 60 }} /> : <Button label="Start my free week" onPress={start} disabled={!plans} />}
        <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, lineHeight: 17, color: color.text2, textAlign: 'center' }}>
          Cancel anytime in Settings at least 24 hours before your trial ends.
        </Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[
            ['Restore purchases', restore],
            ['Terms', () => Linking.openURL(links.terms)],
            ['Privacy', () => Linking.openURL(links.privacy)],
          ].map(([label, fn]) => (
            <Pressable key={label as string} onPress={fn as () => void} accessibilityRole="link" hitSlop={6}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: color.text2, textDecorationLine: 'underline' }}>{label as string}</Text>
            </Pressable>
          ))}
        </View>
        {config.isTestBuild && <TextLink label="Skip (test build only)" style={{ color: color.text3, fontSize: 13 }} onPress={done} />}
      </View>
    </View>
  );
}
