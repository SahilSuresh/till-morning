import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setState } from '../lib/store';
import { type UnlockKey, WEEK1 } from '../lib/week';
import { Button, Chip, CircleButton, Rise, TextLink } from '../ui/components';
import { IconChevrons, IconHourglass, IconMoon, IconTicket } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

/** "New for you · day N" (V.unlock, L1552): one feature a day during the free week. */
export default function Unlock() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ k?: string }>();
  const u = WEEK1.find((x) => x.k === params.k) ?? WEEK1[0];

  useEffect(() => {
    setState((s) => (s.unlocked.includes(u.k) ? {} : { unlocked: [...s.unlocked, u.k] }));
  }, [u.k]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const go = () => {
    if (u.k === 'rules' || u.k === 'risky') router.replace('/rules');
    else if (u.k === 'note') router.replace('/note');
    else if (u.k === 'stickers') router.replace('/me');
    else close();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={close}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Chip tone="sun" size={13} label={`New for you · day ${u.day}`} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16 }}>
        <Chip tone="lilac" size={13} label={u.kick} />
        <Rise style={{ marginTop: 16, gap: 10 }}>
          <Art k={u.k} />
        </Rise>
        <Text style={[type.h1, { marginTop: 24 }]}>{u.t}</Text>
        <Text style={[type.body, { marginTop: 8 }]}>{u.d}</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20, gap: 4 }}>
        {u.go ? (
          <>
            <Button label={u.go} onPress={go} />
            <TextLink label="Maybe later" onPress={close} />
          </>
        ) : (
          <Button label="Got it" onPress={close} />
        )}
      </View>
    </View>
  );
}

function MiniCard({ icon, title, sub, right }: { icon: React.ReactNode; title: string; sub: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.card, borderColor: color.cardEdge, borderWidth: 1.5, borderRadius: 18, padding: 14 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color.hush, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={type.title}>{title}</Text>
        <Text style={type.small}>{sub}</Text>
      </View>
      {right}
    </View>
  );
}

function Art({ k }: { k: UnlockKey }) {
  if (k === 'plan')
    return (
      <>
        <LinearGradient colors={gradient.ticket} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={{ borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <IconTicket size={30} />
          <View style={{ flex: 1 }}>
            <Text style={[type.title, { color: '#FFFFFF' }]}>Amazon pass</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Phone charger · £15 limit</Text>
          </View>
          <Text style={{ fontFamily: font.display, fontSize: 26, color: '#FFFFFF' }}>15</Text>
        </LinearGradient>
        <MiniCard icon={<Text style={{ fontSize: 22 }}>🧾</Text>} title="Under your limit" sub="Spent £12.99 of £15" right={<Chip tone="mint" label="+15 XP" />} />
      </>
    );
  if (k === 'rules')
    return (
      <>
        <MiniCard icon={<Text style={{ fontSize: 22 }}>🔒</Text>} title="No-buy month" sub="Groceries and gifts are fine" />
        <MiniCard icon={<Text style={{ fontSize: 22 }}>🍕</Text>} title="Friday is a treat night" sub="Takeaway apps open with a hello" />
      </>
    );
  if (k === 'checkout')
    return (
      <>
        <MiniCard icon={<Text style={{ fontSize: 22 }}>📸</Text>} title="Snap your basket" sub="3 items · £46.97 read from your screenshot" />
        <View style={{ borderRadius: 999, backgroundColor: color.violet, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <IconHourglass size={18} />
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: '#FFFFFF' }}>Park the basket till morning</Text>
        </View>
      </>
    );
  if (k === 'stickers')
    return (
      <>
        <MiniCard icon={<Text style={{ fontSize: 22 }}>🧩</Text>} title="Let go of 5 things" sub="Puzzle shield sticker" right={<Text style={type.small}>3 / 5</Text>} />
        <MiniCard icon={<Text style={{ fontSize: 22 }}>🏅</Text>} title="Silver III" sub="Mindful Browser · 300 XP" />
      </>
    );
  if (k === 'risky')
    return (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 110, backgroundColor: color.card, borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: color.cardEdge }}>
          {[1, 0, 0, 0, 0, 0, 0, 1, 1, 2, 1, 2, 3, 2, 1, 1, 2, 2, 3, 4, 5, 7, 9, 8].map((v, i) => (
            <View key={i} style={{ flex: 1, height: 8 + v * 9, borderRadius: 3, backgroundColor: i >= 22 ? color.coral : '#343A86' }} />
          ))}
        </View>
        <MiniCard icon={<IconMoon size={22} color={color.blueLight} />} title="45 s pause after 22:00" sub="×2 waits in sale weeks" />
      </>
    );
  return <MiniCard icon={<Text style={{ fontSize: 22 }}>🎙️</Text>} title="“Is this worth an hour of work?”" sub="Plays in every pause" />;
}
