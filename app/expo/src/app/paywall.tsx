import { router } from 'expo-router';
import { BellRinging } from '../ui/ph';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Linking, Pressable, ScrollView, Switch, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G } from 'react-native-svg';

import { config, links } from '../lib/config';
import { protectedCount, shieldChosenApps } from '../lib/core';
import { Notifications } from '../lib/notify';
import { buy, getPlans, type Plans, restorePurchases } from '../lib/purchases';
import { getState, setState, useAppState } from '../lib/store';
import { TopGlow } from '../ui/backgrounds';
import { Button, Rise, TextLink, toast, useReduceMotion } from '../ui/components';
import { useObSpace } from '../ui/onboarding/space';
import { color, font, type } from '../ui/theme';

const dt = (days: number) => new Date(Date.now() + days * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

// The prices set in App Store Connect, shown only until the App Store's own strings arrive.
const FALLBACK = { yearly: '£29.99', monthly: '£4.99', perMonth: `£${(29.99 / 12).toFixed(2)}` };

/** "Wednesday" for n days from now; "WED" when short. */
const weekday = (n: number, short = false) => {
  const w = new Date(Date.now() + n * 86400000).toLocaleDateString('en-GB', { weekday: short ? 'short' : 'long' });
  return short ? w.toUpperCase() : w;
};

/** What "Today" shields: apps and whole categories are counted apart (a category isn't one app). */
function shieldsLine(apps: number, categories: number) {
  const a = `${apps} app${apps === 1 ? '' : 's'}`;
  const c = `${categories} ${categories === 1 ? 'category' : 'categories'}`;
  if (apps && categories) return `Shields go up on ${a} and ${c}`;
  if (apps) return `Shields go up on ${a}`;
  if (categories) return `Shields go up on ${categories === 1 ? 'a whole category' : c} of apps`;
  return 'Shields go up on your apps';
}

/**
 * "Your free week" as "7 nights free" (Night Trolley, option C): seven moons growing to full, the terms in one
 * card, the plans as purple shelf tags. The billed price stays the biggest number (Apple's rule).
 */
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

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      {/* Centred between the top and the button, so it sits right on every iPhone size */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: sp.top(24), paddingHorizontal: 24, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Rise delay={40}>
          <Text accessibilityRole="header" accessibilityLabel="Your free week: 7 nights free" style={[type.h1, { textAlign: 'center' }]}>
            7 nights free
          </Text>
        </Rise>

        {/* Seven moons, one per night, growing to full on the night the plan starts */}
        <View style={{ marginTop: 22 }}>
          <SevenMoons remind={remind} />
        </View>

        {/* The terms in one place: due today, the reminder, when the plan starts */}
        <Rise delay={520} style={{ marginTop: 18 }}>
          <View style={{ borderRadius: 18, backgroundColor: '#1E2256', borderWidth: 1, borderColor: '#3A3F86', padding: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15.5, color: color.mintText }}>Due today</Text>
              <Text style={{ fontFamily: font.display, fontSize: 18, color: color.mintText }}>£0.00</Text>
            </View>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 19, color: color.text2 }}>
              Tonight: {shieldsLine(count.apps, count.categories).charAt(0).toLowerCase() + shieldsLine(count.apps, count.categories).slice(1)}.{' '}
              {remind ? `We remind you on ${weekday(5)}. ` : 'No reminder, you turned it off below. '}
              <Text style={{ fontFamily: font.bodyHeavy, color: color.text }}>{price}</Text> starts {weekday(7)} ({dt(7)}). Cancel any time before.
            </Text>
          </View>
        </Rise>

        <Rise delay={600} style={{ marginTop: 14 }}>
          <View accessibilityRole="radiogroup" accessibilityLabel="Choose a plan" style={{ gap: 10 }}>
            <PlanTag on={yearly} name="Yearly" sub={`${perMonth} a month`} amount={yearlyPrice} onPress={() => setState({ plan: 'yearly' })} />
            <PlanTag on={!yearly} name="Monthly" sub="Pay as you go" amount={monthlyPrice} onPress={() => setState({ plan: 'monthly' })} />
          </View>
        </Rise>

        <Rise delay={660} style={{ marginTop: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#3A3F86',
              backgroundColor: '#1E2256',
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <BellRinging size={20} weight="bold" color={MOON} />
            <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 16, lineHeight: 24, color: color.text }}>Remind me on day 5</Text>
            <Switch
              value={remind}
              onValueChange={setRemind}
              accessibilityLabel="Remind me on day 5"
              trackColor={{ true: '#7C4DFF', false: '#2B2F69' }}
              ios_backgroundColor="#2B2F69"
            />
          </View>
        </Rise>
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: sp.bottom(40), alignItems: 'center', gap: 8 }}>
        {/* Never greyed out while the plans load: tapping fetches them if they aren't in yet. */}
        <Button
          variant="night"
          label="Start my free week"
          onPress={start}
          icon={busy ? <ActivityIndicator color="#FFFFFF" /> : undefined}
          accessibilityHint={busy ? 'Opening the App Store' : undefined}
        />
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

const MOON = '#FFE7A3';
const DAWN = '#FFB59A';

/** One night's moon: a thin crescent on night 1, full on night 7 (the shadow slides off as `lit` grows). */
function NightMoon({ lit, size = 30, id }: { lit: number; size?: number; id: string }) {
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={id}>
          <Circle cx={r} cy={r} r={r - 1} />
        </ClipPath>
      </Defs>
      <Circle cx={r} cy={r} r={r - 1} fill={MOON} />
      {lit < 1 && (
        <G clipPath={`url(#${id})`}>
          <Circle cx={r + size * 0.18 + size * 0.95 * lit} cy={r - size * 0.08} r={r - 1} fill="#1E2058" />
        </G>
      )}
    </Svg>
  );
}

/** "7 nights free": the next seven nights as moons that pop in one by one; a bell on night 5, a dawn ring on night 7. */
function SevenMoons({ remind }: { remind: boolean }) {
  const rm = useReduceMotion();
  const days = Array.from({ length: 7 }, (_, i) => weekday(i + 1, true));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessible accessibilityLabel={`Seven free nights. ${remind ? 'A reminder on night 5. ' : ''}Your plan starts after night 7.`}>
      {days.map((d, i) => (
        <MoonPop key={i} delay={rm ? 0 : 120 + i * 70}>
          <View style={{ alignItems: 'center', gap: 5 }}>
            <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
              {i === 6 && <View style={{ position: 'absolute', width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: DAWN }} />}
              <NightMoon lit={(i + 1) / 7} id={`night${i}`} />
              {i === 4 && remind && (
                <View style={{ position: 'absolute', top: -8, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#7C4DFF', alignItems: 'center', justifyContent: 'center' }}>
                  <BellRinging size={11} weight="fill" color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, letterSpacing: 0.5, color: i === 6 ? DAWN : i === 4 && remind ? '#C4B5FD' : color.text3 }}>{d}</Text>
          </View>
        </MoonPop>
      ))}
    </View>
  );
}

function MoonPop({ delay, children }: { delay: number; children: ReactNode }) {
  const rm = useReduceMotion();
  const v = useAnimatedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    const a = Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.back(2)), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [rm, v, delay]);
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** A plan as a purple shelf tag: name on the left, the billed price (the biggest number) on the stub. */
function PlanTag({ on, name, sub, amount, onPress }: { on: boolean; name: string; sub: string; amount: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${name}, ${amount}. ${sub}`}>
      {({ pressed }) => (
        <View
          style={{
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            borderTopLeftRadius: 6,
            borderBottomLeftRadius: 6,
            backgroundColor: on ? '#4524A8' : '#14173F',
            paddingBottom: pressed ? 1 : 3,
            marginTop: pressed ? 2 : 0,
          }}
        >
          <LinearGradient
            colors={on ? ['#6A3DE8', '#9B5CF6'] : ['#1E2256', '#1E2256']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              minHeight: 62,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              borderWidth: on ? 0 : 1.5,
              borderColor: '#3A3F86',
            }}
          >
            {/* the eyelet, filled when picked */}
            <View style={{ marginLeft: 14, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: on ? MOON : '#8A8EC6', alignItems: 'center', justifyContent: 'center' }}>
              {on && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: MOON }} />}
            </View>
            <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: '#FFFFFF' }}>{name}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, color: on ? '#E3D9FF' : color.text3 }}>{sub}</Text>
            </View>
            <View style={{ alignSelf: 'stretch', width: 1.5, marginVertical: 10, borderLeftWidth: 1.5, borderStyle: 'dashed', borderColor: on ? 'rgba(255,255,255,0.45)' : '#3A3F86' }} />
            <Text style={{ width: 92, textAlign: 'center', fontFamily: font.display, fontSize: 21, color: on ? MOON : '#FFFFFF', fontVariant: ['tabular-nums'] }}>{amount}</Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
