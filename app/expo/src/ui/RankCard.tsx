import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { useAppState } from '../lib/store';
import { DAILY_CAP, earnedToday, rankFor } from '../lib/xp';
import { color, font, gradient } from './theme';

/** Blue rank card: rank, title, amber XP bar, XP to the next rank and XP earned today. */
export function RankCard() {
  const total = useAppState((s) => s.xp.total);
  useAppState((s) => s.xp.log.length); // re-render when XP is earned today
  const { rank, next } = rankFor(total);
  const today = earnedToday();
  const progress = next ? (total - rank.threshold) / (next.threshold - rank.threshold) : 1;

  return (
    <View style={{ borderRadius: 24, backgroundColor: '#2A2FB0', paddingBottom: 3 }}>
      <LinearGradient colors={gradient.rank} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 18 }}>
        <Text style={{ fontFamily: font.display, fontSize: 22, color: '#FFFFFF' }}>{rank.name}</Text>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.82)' }}>{rank.title}</Text>
        <View style={{ height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12, overflow: 'hidden' }}>
          <View style={{ height: 12, borderRadius: 6, width: `${Math.round(progress * 100)}%`, backgroundColor: color.sun }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: '#FFFFFF' }}>
            {total}
            {next ? ` / ${next.threshold}` : ''} XP
          </Text>
          {next && (
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
              {next.threshold - total} XP to {next.name}
            </Text>
          )}
        </View>
        <View style={{ height: 1.5, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.82)' }}>Earned today</Text>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: color.sun }}>
            {today} of {DAILY_CAP} XP
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
