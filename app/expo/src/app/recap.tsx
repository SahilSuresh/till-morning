import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DAY_NAMES } from '../lib/rules';
import { getState, setState, useAppState } from '../lib/store';
import { thisWeek } from '../lib/week';
import { rankFor } from '../lib/xp';
import { Button, CircleButton, Rise } from '../ui/components';
import { IconX } from '../ui/icons';
import { color, font, type } from '../ui/theme';

/** Sunday recap (V.recap, L1562): counts from the last 7 days. Never pounds. */
export default function Recap() {
  const insets = useSafeAreaInsets();
  const s = useAppState((x) => x);
  const since = Date.now() - 7 * 86400000;
  const pauses = s.pauseLog.filter((p) => p.at >= since);
  const left = pauses.filter((p) => p.outcome === 'left' || p.outcome === 'walked').length;
  const parked = s.parked.filter((w) => w.parkedAt >= since);
  const letGo = parked.filter((w) => w.decided === 'let_go').length;
  const checkins = s.checkinLog.filter((c) => c.at >= since);
  const kept = checkins.filter((c) => c.answer === 'stuck' || c.answer === 'didnt_buy').length;
  const { next } = rankFor(s.xp.total);
  const late = pauses.filter((p) => {
    const h = new Date(p.at).getHours();
    return h >= 22 || h < 5;
  });
  const byDay = [0, 1, 2, 3, 4, 5, 6].map((d) => late.filter((p) => (new Date(p.at).getDay() + 6) % 7 === d).length);
  const top = byDay.indexOf(Math.max(...byDay));
  const date = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

  useEffect(() => {
    setState({ recapSeenWeek: thisWeek() });
  }, []);

  const rows: [string, string, boolean?][] = [
    ['Pauses', String(pauses.length)],
    ['You left it', String(left), true],
    ['Parked, then let go', `${letGo} of ${parked.length}`],
    ['Passes kept to plan', `${kept} of ${checkins.length}`],
  ];

  const share = () =>
    Share.share({
      message: `My week with Till Morning: ${pauses.length} pauses, left it ${left} times, let go of ${letGo} things. Shopping on purpose.`,
    }).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: color.text3 }}>{date}</Text>
        <CircleButton label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <IconX />
        </CircleButton>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
        <Rise>
          <Text style={[type.h1, { marginTop: 8 }]}>Your week with Till Morning</Text>
        </Rise>
        <Rise delay={60} style={{ marginTop: 20, backgroundColor: color.paper, borderRadius: 22, padding: 18, gap: 10 }}>
          {rows.map(([t, v, mint]) => (
            <View key={t} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.inkOnBright }}>{t}</Text>
              <Text style={{ fontFamily: font.display, fontSize: 22, color: mint ? '#0E8A60' : color.inkOnBright }}>{v}</Text>
            </View>
          ))}
        </Rise>
        <Rise delay={100} style={{ marginTop: 12, backgroundColor: color.paper, borderRadius: 22, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 26 }}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15.5, color: color.inkOnBright }}>{next ? `${next.name} next` : 'Top rank reached'}</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.paperLabel }}>
              {next ? `${next.threshold - s.xp.total} XP to go · ` : ''}
              {getState().got.length} sticker{getState().got.length === 1 ? '' : 's'} so far
            </Text>
          </View>
        </Rise>
        {late.length > 0 && <Text style={[type.small, { marginTop: 16 }]}>Busiest night: {DAY_NAMES[top]} after 22:00.</Text>}
        <Text style={[type.small, { marginTop: 8 }]}>Counts from the last 7 days. Never pounds.</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20 }}>
        <Button variant="secondary" label="Share my week" onPress={share} />
      </View>
    </View>
  );
}
