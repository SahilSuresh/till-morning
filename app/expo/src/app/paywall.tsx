import { router } from 'expo-router';
import { BellRinging } from '../ui/ph';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { config, links } from '../lib/config';
import { protectedCount, shieldChosenApps } from '../lib/core';
import { Notifications } from '../lib/notify';
import { buy, getPlans, type Plans, restorePurchases } from '../lib/purchases';
import { getState, setState, useAppState } from '../lib/store';
import { TopGlow } from '../ui/backgrounds';
import { Button, Rise, TextLink, toast } from '../ui/components';
import { useObSpace } from '../ui/onboarding/space';
import { color, font, type } from '../ui/theme';

const dt = (days: number) => new Date(Date.now() + days * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// The prices set in App Store Connect, shown only until the App Store's own strings arrive.
const FALLBACK = { yearly: '£29.99', monthly: '£4.99', perMonth: `£${(29.99 / 12).toFixed(2)}` };

const INK = '#14163A';
const SUB = '#4A4E7A'; // .pw-sub / .pw-due

/** What "Today" shields: apps and whole categories are counted apart (a category isn't one app). */
function shieldsLine(apps: number, categories: number) {
  const a = `${apps} app${apps === 1 ? '' : 's'}`;
  const c = `${categories} ${categories === 1 ? 'category' : 'categories'}`;
  if (apps && categories) return `Shields go up on ${a} and ${c}`;
  if (apps) return `Shields go up on ${a}`;
  if (categories) return `Shields go up on ${categories === 1 ? 'a whole category' : c} of apps`;
  return 'Shields go up on your apps';
}

/** "Your free week" (V.paywall, P:L1383; CSS P:L1780–1792). The billed price stays the biggest number (Apple's rule). */
export default function Paywall() {
  const sp = useObSpace();
  const plan = useAppState((s) => s.plan);
  const [remind, setRemind] = useState(true);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [busy, setBusy] = useState(false);
  const count = protectedCount();

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlans({}));
  }, []);

  // Live App Store prices, with the App Store Connect prices as a fallback while they load.
  const yearlyPrice = plans?.yearly?.product.priceString ?? FALLBACK.yearly;
  const monthlyPrice = plans?.monthly?.product.priceString ?? FALLBACK.monthly;
  const perMonth = plans?.yearly?.product.pricePerMonthString ?? FALLBACK.perMonth;
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
    if (busy) return;
    setBusy(true);
    let pkg = yearly ? plans?.yearly : plans?.monthly;
    if (!pkg) {
      // The plans may have failed to load the first time: try once more before giving up.
      const fresh = await getPlans().catch(() => ({}) as Plans);
      setPlans(fresh);
      pkg = yearly ? fresh.yearly : fresh.monthly;
    }
    if (!pkg) {
      setBusy(false);
      Alert.alert('The App Store isn’t ready yet', 'The plans couldn’t load. Check your connection and try again.');
      return;
    }
    try {
      const r = await buy(pkg);
      if (r === 'active') await done();
      else if (r === 'inactive')
        Alert.alert('Almost there', 'The App Store took the purchase, but Till Morning Pro didn’t switch on. Tap Restore purchases, or try again in a minute.');
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

  // .pw-step: dot, bold title, grey line
  const step = (dot: string, title: string, sub: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 11 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot, marginTop: 5 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15.5, lineHeight: 20, color: INK }}>{title}</Text>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 18, color: SUB }}>{sub}</Text>
      </View>
    </View>
  );

  // .pw-plan + .pw-radio
  const planRow = (id: 'yearly' | 'monthly', name: string, amount: string) => {
    const on = plan === id;
    return (
      <Pressable
        onPress={() => setState({ plan: id })}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        accessibilityLabel={`${name}, ${amount}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: on ? '#93A5FF' : '#2E3374',
          backgroundColor: on ? '#1C2160' : color.card,
          paddingHorizontal: 16,
          paddingVertical: 15,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: on ? '#93A5FF' : '#5A5F9E',
            backgroundColor: on ? '#1C2160' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {on && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#93A5FF' }} />}
        </View>
        <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 16, lineHeight: 24, color: color.text }}>{name}</Text>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, lineHeight: 24, color: color.text, fontVariant: ['tabular-nums'] }}>{amount}</Text>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ paddingTop: sp.top(56), paddingHorizontal: 24, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <Rise delay={40}>
          <Text style={[type.h1, { textAlign: 'center' }]}>Your free week</Text>
        </Rise>
        <Rise delay={100} style={{ marginTop: 20 }}>
          <View accessibilityLabel="Your free week" style={{ backgroundColor: '#F4F3FF', borderRadius: 22, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 14 }}>
            <View style={{ gap: 14 }}>
              {step('#4361FF', 'Today', shieldsLine(count.apps, count.categories))}
              {step('#8B5CF6', `Day 5 · ${dt(5)}`, remind ? 'We remind you the plan starts soon' : 'No reminder. You turned it off below.')}
              {step(INK, `Day 7 · ${dt(7)}`, `${price} starts. Cancel any time before.`)}
            </View>
            {/* .pw-rule: dashed, drawn as a line (one-sided dashed borders render solid on iOS) */}
            <Svg height={1.5} width="100%" style={{ marginTop: 16, marginBottom: 10 }}>
              <Line x1="0" y1="0.75" x2="100%" y2="0.75" stroke="#C9C8E6" strokeWidth={1.5} strokeDasharray="4 3" />
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 19, lineHeight: 26, color: INK }}>Total</Text>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 19, lineHeight: 26, color: INK }}>{price}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 19, color: SUB }}>Due today</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 19, color: SUB }}>£0.00</Text>
            </View>
          </View>
        </Rise>
        <Rise delay={160} style={{ marginTop: 16 }}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Choose a plan" style={{ gap: 10 }}>
            {planRow('yearly', `Yearly · ${perMonth} a month`, yearlyPrice)}
            {planRow('monthly', 'Monthly', monthlyPrice)}
          </View>
        </Rise>
        <Rise delay={200} style={{ marginTop: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#2E3374',
              backgroundColor: color.card,
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <BellRinging size={20} weight="bold" color={color.sun} />
            <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 16, lineHeight: 24, color: color.text }}>Remind me on day 5</Text>
            <Switch
              value={remind}
              onValueChange={setRemind}
              accessibilityLabel="Remind me on day 5"
              trackColor={{ true: color.blue, false: '#2B2F69' }}
              ios_backgroundColor="#2B2F69"
            />
          </View>
        </Rise>
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: sp.bottom(40), alignItems: 'center', gap: 8 }}>
        {/* Never greyed out while the plans load: tapping fetches them if they aren't in yet. */}
        <Button label="Start my free week" onPress={start} icon={busy ? <ActivityIndicator color="#FFFFFF" /> : undefined} accessibilityHint={busy ? 'Opening the App Store' : undefined} />
        <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, lineHeight: 17, color: color.text2, textAlign: 'center' }}>
          No payment today. Cancel anytime in Settings at least 24 hours before your trial ends.
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
