import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../lib/store';
import { RANKS, rankFor } from '../../lib/xp';
import { Card, Chip, Rise } from '../../ui/components';
import { IconCaret, IconCheck } from '../../ui/icons';
import { useTabBarSpace } from '../../ui/layout';
import { RankCard } from '../../ui/RankCard';
import { color, font, type } from '../../ui/theme';

const EARN: [string, string][] = [
  ['Close an app at the shield', '+2'],
  ['Finish the pause and leave', '+10'],
  ['Park it in the waiting room', '+5'],
  ['Decide on a want after its wait, any answer', '+10'],
  ['Check in after a pass, any honest answer', '+10'],
  ['Fill a Morning card (10 calm days)', '+50'],
];
const LOSE: [string, string][] = [
  ['Switch every shield off', '−10'],
  ['Unshield an app', '−5'],
];

const Divider = () => <View style={{ height: 1.5, backgroundColor: color.divider }} />;

export default function Me() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const xp = useAppState((s) => s.xp);
  const helped = useAppState((s) => s.pauseHelped);
  const [openXp, setOpenXp] = useState(false);
  const [openRanks, setOpenRanks] = useState(false);
  const { index } = rankFor(xp.total);
  const recent = [...xp.log].reverse().slice(0, 8);

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: tabSpace, gap: 14 }}>
        <Rise>
          <Text style={type.h1}>Me</Text>
        </Rise>

        <Rise delay={40}>
          <RankCard />
        </Rise>

        {helped.asked > 0 && (
          <Rise delay={60}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(94,233,181,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <IconCheck size={22} color="#6EF0BF" />
              </View>
              <Text style={[type.title, { flex: 1 }]}>
                The pause helped {helped.yes}/{helped.asked} times
              </Text>
            </Card>
          </Rise>
        )}

        {/* Ranks ladder */}
        <Rise delay={80}>
          <Card style={{ paddingVertical: 4 }}>
            <Pressable onPress={() => setOpenRanks((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: openRanks }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[type.title, { flex: 1 }]}>Ranks</Text>
              <View style={{ transform: [{ rotate: openRanks ? '90deg' : '0deg' }] }}>
                <IconCaret />
              </View>
            </Pressable>
            {openRanks && (
              <>
                <Text style={[type.small, { marginBottom: 6 }]}>Ranks never drop. You can earn up to 60 XP a day.</Text>
                {RANKS.map((r, i) => (
                  <View key={r.name}>
                    <Divider />
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, opacity: i > index ? 0.6 : 1 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={type.title}>{r.name}</Text>
                        <Text style={type.small}>
                          {r.title} · {r.threshold.toLocaleString('en-GB')} XP
                        </Text>
                      </View>
                      {i < index ? (
                        <Chip tone="mint" label="Unlocked" />
                      ) : i === index ? (
                        <Chip tone="sun" label="You’re here" />
                      ) : (
                        <Text style={type.small}>{(r.threshold - xp.total).toLocaleString('en-GB')} XP to go</Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            )}
          </Card>
        </Rise>

        {/* How XP works */}
        <Rise delay={100}>
          <Card style={{ paddingVertical: 4 }}>
            <Pressable onPress={() => setOpenXp((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: openXp }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[type.title, { flex: 1 }]}>How XP works</Text>
              <View style={{ transform: [{ rotate: openXp ? '90deg' : '0deg' }] }}>
                <IconCaret />
              </View>
            </Pressable>
            {openXp && (
              <View style={{ paddingBottom: 12 }}>
                {EARN.map(([t, x]) => (
                  <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
                    <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14.5, color: color.text }}>{t}</Text>
                    <Chip tone="mint" label={x} />
                  </View>
                ))}
                <View style={{ marginVertical: 4 }}>
                  <Divider />
                </View>
                {LOSE.map(([t, x]) => (
                  <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
                    <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14.5, color: color.text }}>{t}</Text>
                    <Chip tone="peach" label={x} />
                  </View>
                ))}
                <Text style={[type.small, { marginTop: 6 }]}>
                  You only lose XP for weakening your own protection, never for being away or for an honest answer. Your rank never goes down. Repeat opens of the same app earn XP once every 30 minutes. A third pass in a day means a short wait. Ranks take months, not days.
                </Text>
              </View>
            )}
          </Card>
        </Rise>

        {/* Recent decisions */}
        <Rise delay={140}>
          <Text style={[type.h2, { marginTop: 6, marginBottom: 8 }]}>Recent decisions</Text>
          {recent.length ? (
            <Card style={{ paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }}>
              {recent.map((e, i) => (
                <View
                  key={`${e.at}-${i}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1.5 : 0, borderColor: color.divider }}
                >
                  <Text style={{ width: 44, fontFamily: font.bodyBold, fontSize: 12.5, color: color.text3, fontVariant: ['tabular-nums'] }}>
                    {new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 19, color: color.text }}>{e.label}</Text>
                  <Chip tone={e.amount > 0 ? 'mint' : e.amount < 0 ? 'peach' : 'paper'} label={`${e.amount > 0 ? '+' : e.amount < 0 ? '−' : ''}${Math.abs(e.amount)} XP`} />
                </View>
              ))}
            </Card>
          ) : (
            <Card>
              <Text style={[type.body, { color: color.text2 }]}>Your decisions show up here. Open a shielded app to make your first one.</Text>
            </Card>
          )}
        </Rise>
      </ScrollView>
    </View>
  );
}
