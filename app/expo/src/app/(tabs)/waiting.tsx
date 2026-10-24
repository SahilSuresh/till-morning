import { router, useFocusEffect } from 'expo-router';
import { CameraIcon } from '../../ui/ph';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../lib/store';
import { TopGlow } from '../../ui/backgrounds';
import { Rise } from '../../ui/components';
import { useTabBarSpace } from '../../ui/layout';
import { Mascot } from '../../ui/Mascot';
import type { SpotRef } from '../../ui/Spotlight';
import { useBoundaryNow, useTickWhileFocused } from '../../ui/tabs/clock';
import { type RoomView, takeRoomView } from '../../ui/tabs/roomView';
import { type ScrollRef, TabTip } from '../../ui/tabs/TabTip';
import { LetGoShelf, Rail, RailTag, RoomEmpty } from '../../ui/tabs/WaitingParts';
import { color, font, type } from '../../ui/theme';

/** roomTab() from the prototype (P:L2117–2129; CSS P:L551–573). */
export default function Waiting() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const parked = useAppState((s) => s.parked);
  const sale = useAppState((s) => s.settings.sale);
  // Moves wants to Ready the moment their wait ends; the "left" pills refresh twice a minute.
  const edge = useBoundaryNow(parked.filter((w) => !w.decided).map((w) => w.readyAt));
  const tick = useTickWhileFocused(30000);
  const now = Math.max(edge, tick);

  const ready = parked.filter((w) => !w.decided && w.readyAt <= now);
  const waiting = parked.filter((w) => !w.decided && w.readyAt > now).sort((a, b) => a.readyAt - b.readyAt);
  const letGo = parked.filter((w) => w.decided === 'let_go').reverse();
  const [view, setView] = useState<RoomView>(() => takeRoomView() ?? (ready.length ? 'ready' : 'waiting'));
  const scrollRef: ScrollRef = useRef(null);
  const segRef: SpotRef = useRef(null);

  // Today's wait card picks the segment.
  useFocusEffect(
    useCallback(() => {
      const v = takeRoomView();
      if (v) setView(v);
    }, []),
  );

  const segments: [RoomView, string, number][] = [
    ['waiting', 'Waiting', waiting.length],
    ['ready', 'Ready', ready.length],
    ['letgo', 'Let go', letGo.length],
  ];

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: tabSpace }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={type.small}>Every want waits its turn</Text>
            <Text accessibilityRole="header" style={type.h1}>
              Waiting room
            </Text>
          </View>
          <Mascot source={require('../../../assets/mascots/shieldm.webp')} size={56} halo={false} float={false} pop={false} />
        </Rise>

        {/* .wr-seg */}
        <Rise delay={60} style={{ marginTop: 16 }}>
          <View
            ref={segRef}
            collapsable={false}
            accessibilityRole="tablist"
            accessibilityLabel="Waiting room"
            style={{ flexDirection: 'row', gap: 4, backgroundColor: '#12153A', borderRadius: 99, padding: 4, borderWidth: 1.5, borderColor: '#282C68' }}
          >
            {segments.map(([k, label, n]) => {
              const on = view === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setView(k)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={{ flex: 1 }}
                >
                  {/* Night Trolley purple, like the pass button */}
                  {on && <View style={{ position: 'absolute', left: 0, right: 0, top: 3, bottom: -3, borderRadius: 99, backgroundColor: '#4B2BB0' }} />}
                  <View style={{ borderRadius: 99, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', backgroundColor: on ? '#8A5BFF' : 'transparent' }}>
                    <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: on ? '#FFFFFF' : color.text2 }}>
                      {label} {n}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Rise>

        <Rise delay={100} style={{ marginTop: 16, gap: 12 }}>
          {/* Option A: the tags hang from a moon-yellow rail, each from the one above */}
          {view === 'waiting' &&
            (waiting.length ? (
              <View>
                <Rail />
                {waiting.map((w, i) => (
                  <RailTag key={w.id} want={w} now={now} ready={false} index={i} />
                ))}
              </View>
            ) : (
              <RoomEmpty text="Nothing is waiting. Next time you want something, choose “Park it till morning” in the pause, or park it from a screenshot." />
            ))}
          {view === 'ready' &&
            (ready.length ? (
              <View>
                <Rail />
                {ready.map((w, i) => (
                  <RailTag key={w.id} want={w} now={now} ready index={i} />
                ))}
              </View>
            ) : (
              <RoomEmpty text="Nothing is ready yet. Wants come back here when their wait is over, often at 08:00." />
            ))}
          {view === 'letgo' &&
            (letGo.length ? (
              <View>
                <Text style={type.small}>Things you wanted, waited for and let go. Just the things, no money totals.</Text>
                <LetGoShelf wants={letGo} />
              </View>
            ) : (
              <RoomEmpty text="Your let-go shelf is empty. When you let something go, it lands here and counts toward a sticker." />
            ))}
        </Rise>

        {view !== 'letgo' && (
          <Rise delay={140} style={{ marginTop: 16 }}>
            <Pressable
              onPress={() => router.push('/snap')}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingVertical: 16,
                borderRadius: 20,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: '#343A80',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <CameraIcon size={20} weight="bold" color={color.text2} />
              <Text style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.text2 }}>Park something from a screenshot</Text>
            </Pressable>
          </Rise>
        )}

        <Rise delay={160} style={{ marginTop: 16 }}>
          <Text style={[type.small, { textAlign: 'center' }]}>
            The rule: 1 hour for every £10, never ready at night{sale ? ', doubled in sale week' : ''}.
          </Text>
        </Rise>
      </ScrollView>

      <TabTip k="waiting" targetRef={segRef} scrollRef={scrollRef} radius={99} />
    </View>
  );
}
