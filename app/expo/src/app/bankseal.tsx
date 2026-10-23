import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { knownApps, lockDays, money, TIERS, tierFor } from '../lib/budget';
import { useAppState } from '../lib/store';
import { Button, Card, Chip, springOut, useReduceMotion } from '../ui/components';
import { Seal } from '../ui/Seal';
import { color, font, type } from '../ui/theme';

const CONFETTI = ['#FFC94D', '#5EE9B5', '#FF8F78', '#A78BFA', '#93A5FF', '#FFFFFF'];

/** Bank limit set (V.bankBadge, L1334): the seal, the facts, and the four seals to collect. */
export default function BankSeal() {
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const lock = useAppState((s) => s.bankLock);
  const total = useAppState((s) => s.budgetTotal);
  const l = lock ?? { at: Date.now(), amount: total };
  const days = lockDays(l.at);
  const tier = tierFor(days);
  const apps = knownApps();
  const pop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const pieces = useRef(
    Array.from({ length: 28 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 360,
      y: -80 - Math.random() * 200,
      r: Math.random() * 540 - 270,
      c: CONFETTI[i % CONFETTI.length],
      w: 6 + Math.random() * 6,
    })),
  ).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (rm) return;
    Animated.parallel([
      Animated.timing(pop, { toValue: 1, duration: 650, delay: 80, easing: springOut, useNativeDriver: true }),
      Animated.timing(burst, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [rm, pop, burst]);

  const done = () => (router.canGoBack() ? router.dismissTo('/') : router.replace('/'));
  const facts: [string, string][] = [
    ['Your card cap', l.amount ? `${money(l.amount)} a month` : 'Set in your bank app'],
    ['Protected apps', apps.length ? apps.join(', ') : 'Your shopping apps'],
    ['Set on', new Date(l.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <LinearGradient colors={['#3B2B97', color.night]} locations={[0, 0.6]} style={{ position: 'absolute', inset: 0 }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 30, paddingHorizontal: 28, paddingBottom: 16, alignItems: 'center' }}>
        <View style={{ width: 224, height: 224, alignItems: 'center', justifyContent: 'center' }}>
          {!rm &&
            pieces.map((p, i) => (
              <Animated.View
                key={i}
                style={{
                  position: 'absolute',
                  width: p.w,
                  height: p.w * 1.6,
                  borderRadius: 2,
                  backgroundColor: p.c,
                  opacity: burst.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
                    { translateY: burst.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, p.y, p.y + 420] }) },
                    { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.r}deg`] }) },
                  ],
                }}
              />
            ))}
          <Animated.View
            style={{
              transform: [
                { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.6, 1] }) },
                { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-14deg', '-4deg'] }) },
              ],
              opacity: pop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            }}
          >
            <Seal size={172} tier={tier} label={l.amount ? `${money(l.amount)} a month` : 'Card capped'} />
          </Animated.View>
        </View>
        <Chip tone="glass" label="Self-reported" />
        <Text style={[type.display, { marginTop: 12, textAlign: 'center' }]}>
          Bank limit <Text style={{ color: color.mint }}>set</Text>
        </Text>
        <Text style={[type.body, { marginTop: 12, textAlign: 'center' }]}>
          You’ve committed to a card limit{l.amount ? ` of ${money(l.amount)} a month` : ''}. Your bank declines payments over it on that card. Keep your other cards out of your shopping apps.
        </Text>

        <Card style={{ marginTop: 22, alignSelf: 'stretch', paddingVertical: 4 }}>
          {facts.map(([t, d], k) => (
            <View key={t} style={{ paddingVertical: 12, borderTopWidth: k ? 1.5 : 0, borderColor: color.divider }}>
              <Text style={type.small}>{t}</Text>
              <Text style={type.title}>{d}</Text>
            </View>
          ))}
        </Card>

        <Text style={[type.h2, { marginTop: 26, alignSelf: 'flex-start' }]}>Seals to collect</Text>
        <Card style={{ marginTop: 12, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8 }}>
          {TIERS.map((t, i) => {
            const got = days >= t.from;
            return (
              <View key={t.name} style={{ alignItems: 'center', width: 72 }} accessibilityLabel={`${t.name}, ${got ? 'earned' : `from ${t.from} days`}`}>
                <Seal size={54} tier={got ? i : -1} />
                <Text style={{ marginTop: 6, fontFamily: font.bodyBold, fontSize: 12.5, textAlign: 'center', color: got ? color.text : color.text3 }}>{t.name}</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 11.5, color: color.text3 }}>{t.from === 1 ? 'Day 1' : `${t.from} days`}</Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8, gap: 8 }}>
        <Button label="Wear the seal" onPress={done} />
        <Text style={[type.small, { textAlign: 'center' }]}>Keep your limit and your seal levels up on Today.</Text>
      </View>
    </View>
  );
}
