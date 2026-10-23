import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAND_LABEL, formatReady } from '../../lib/core';
import { type ParkedWant, setState, useAppState } from '../../lib/store';
import { TAB_TIPS } from '../../lib/week';
import { TipSheet } from '../../ui/TipSheet';
import { Card, Rise } from '../../ui/components';
import { IconMoon } from '../../ui/icons';
import { useTabBarSpace } from '../../ui/layout';
import { color, font, type } from '../../ui/theme';

type View_ = 'waiting' | 'ready' | 'letgo';

// Gradients for the let-go shelf, so each thing gets its own colour.
const SHELF = [
  ['#7E3FF2', '#B455F0'],
  ['#3F5BFF', '#5B76FF'],
  ['#1FA67A', '#5EE9B5'],
  ['#E0663F', '#FF8F78'],
  ['#C98A12', '#FFC94D'],
] as const;

function useMinuteClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function Waiting() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const parked = useAppState((s) => s.parked);
  const now = useMinuteClock();
  const ready = parked.filter((w) => !w.decided && w.readyAt <= now);
  const waiting = parked.filter((w) => !w.decided && w.readyAt > now).sort((a, b) => a.readyAt - b.readyAt);
  const letGo = parked.filter((w) => w.decided === 'let_go').reverse();
  const [view, setView] = useState<View_>(ready.length ? 'ready' : 'waiting');
  const tipDue = useAppState((s) => s.subscribed && !s.tabTips.waiting && s.coachStep < 0);

  const segments: [View_, string, number][] = [
    ['waiting', 'Waiting', waiting.length],
    ['ready', 'Ready', ready.length],
    ['letgo', 'Let go', letGo.length],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: tabSpace }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View>
            <Text style={type.small}>Every want waits its turn</Text>
            <Text style={type.h1}>Waiting room</Text>
          </View>
          <Image source={require('../../../assets/mascots/shieldm.webp')} style={{ width: 56, height: 56 }} resizeMode="contain" />
        </Rise>

        {/* Segmented control */}
        <Rise delay={60} style={{ marginTop: 16 }}>
          <View
            accessibilityRole="tablist"
            style={{ flexDirection: 'row', backgroundColor: '#12153A', borderRadius: 999, padding: 4, borderWidth: 1.5, borderColor: '#2E3374' }}
          >
            {segments.map(([k, label, n]) => {
              const on = view === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setView(k)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center', backgroundColor: on ? color.blue : 'transparent' }}
                >
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: on ? '#FFFFFF' : color.text2 }}>
                    {label} {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Rise>

        <Rise delay={100} style={{ marginTop: 16, gap: 12 }}>
          {view === 'waiting' &&
            (waiting.length ? (
              waiting.map((w) => <WantTag key={w.id} want={w} now={now} />)
            ) : (
              <Empty text="Nothing is waiting. Next time you want something, choose “Park it till morning” in the pause." />
            ))}
          {view === 'ready' &&
            (ready.length ? (
              ready.map((w) => <WantTag key={w.id} want={w} now={now} ready />)
            ) : (
              <Empty text="Nothing is ready yet. Wants come back here when their wait is over, often at 08:00." />
            ))}
          {view === 'letgo' &&
            (letGo.length ? (
              <>
                <Text style={type.small}>Things you wanted, waited for and let go. Just the things, no money totals.</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {letGo.map((w, i) => (
                    <LinearGradient
                      key={w.id}
                      colors={SHELF[i % SHELF.length]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, maxWidth: '100%' }}
                    >
                      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14.5, color: '#FFFFFF' }}>{w.what || `Something from ${w.app}`}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </>
            ) : (
              <Empty text="Your let-go shelf is empty. When you let something go, it lands here." />
            ))}
        </Rise>

        <Text style={[type.small, { textAlign: 'center', marginTop: 18 }]}>
          The rule: the more it costs, the longer it waits, and it’s never ready at night.
        </Text>
      </ScrollView>
      <TipSheet
        visible={tipDue}
        title={TAB_TIPS.waiting.t}
        body={TAB_TIPS.waiting.d}
        next="Got it"
        onNext={() => setState((s) => ({ tabTips: { ...s.tabTips, waiting: true } }))}
      />
    </View>
  );
}

/** A parked want as a paper tag: name, app and price band, with its "Decide" stamp. */
function WantTag({ want, now, ready }: { want: ParkedWant; now: number; ready?: boolean }) {
  return (
    <Pressable
      onPress={() => ready && router.push({ pathname: '/decide', params: { id: want.id } })}
      disabled={!ready}
      accessibilityRole={ready ? 'button' : undefined}
      accessibilityHint={ready ? 'Decide whether you still want it' : undefined}
    >
      <View style={{ backgroundColor: color.paper, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#2C24A3', alignItems: 'center', justifyContent: 'center' }}>
          <IconMoon size={22} color="#C4B5FD" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.display, fontSize: 18, color: color.inkOnBright }}>{want.what || `Something from ${want.app}`}</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, color: color.paperLabel }}>
            {want.app} · {BAND_LABEL[want.band]}
          </Text>
        </View>
        <View
          style={{
            transform: [{ rotate: '-6deg' }],
            borderWidth: 2.5,
            borderColor: ready ? '#1FA67A' : color.blue,
            borderRadius: 9,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontFamily: font.display, fontSize: 13.5, color: ready ? '#1FA67A' : color.blue }}>
            {ready ? 'Decide now' : `Decide ${formatReady(want.readyAt, now)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card>
      <Text style={[type.body, { color: color.text2 }]}>{text}</Text>
    </Card>
  );
}
