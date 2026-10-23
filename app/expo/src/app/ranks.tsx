import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeftIcon, CheckCircleIcon } from '../ui/ph';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../lib/store';
import { METAL_NAMES, RANKS, rankFor } from '../lib/xp';
import { TopGlow } from '../ui/backgrounds';
import { Card, Chip, CircleButton, Rise } from '../ui/components';
import { Medal } from '../ui/Medal';
import { XpRules } from '../ui/tabs/XpRules';
import { color, font, type } from '../ui/theme';

const fmtN = (n: number) => n.toLocaleString('en-GB');
const TIER = (name: string) => name.split(' ')[1];

/** The prototype's Ranks page (ranksTab, P:L2010–2022), opened from the rank card on Me. */
export default function Ranks() {
  const insets = useSafeAreaInsets();
  const total = useAppState((s) => s.xp.total);
  const { rank, next, index } = rankFor(total);
  const pct = next ? Math.max(0, Math.min(1, (total - rank.threshold) / (next.threshold - rank.threshold))) : 1;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/me'));

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleButton label="Back to Me" onPress={back}>
            <ArrowLeftIcon size={20} weight="bold" color={color.text} />
          </CircleButton>
          <Text accessibilityRole="header" style={type.h1}>
            Ranks
          </Text>
        </Rise>

        {/* Where you are now */}
        <Rise delay={40} style={{ marginTop: 20 }}>
          <View style={{ borderRadius: 24, backgroundColor: '#2A2FB0', paddingBottom: 3 }}>
            <LinearGradient
              colors={['#5A48F2', '#3D5AFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, alignItems: 'center' }}
            >
              <Medal metal={rank.metal} tier={TIER(rank.name)} size={96} />
              <Text style={{ marginTop: 20, fontFamily: font.bodyBold, fontSize: 14, color: '#FFFFFF' }}>You’re here</Text>
              <Text style={[type.h1, { fontSize: 30, lineHeight: 34, color: '#FFFFFF', textAlign: 'center' }]}>{rank.name}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{rank.title}</Text>
              <View style={{ marginTop: 16, alignSelf: 'stretch', height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <View style={{ height: 12, borderRadius: 6, width: `${Math.round(pct * 100)}%`, backgroundColor: color.sun }} />
              </View>
              <Text style={{ marginTop: 8, fontFamily: font.bodyBold, fontSize: 14, color: '#FFFFFF', fontVariant: ['tabular-nums'], textAlign: 'center' }}>
                {next ? `${fmtN(next.threshold - total)} XP to unlock ${next.name}` : 'You’ve reached the top rank'}
              </Text>
            </LinearGradient>
          </View>
        </Rise>

        <Rise delay={60} style={{ marginTop: 16 }}>
          <Text style={[type.small, { textAlign: 'center' }]}>Ranks never drop. You can earn up to 60 XP a day.</Text>
        </Rise>

        {/* Every metal, three tiers each */}
        {METAL_NAMES.map((metal, mi) => {
          const tiers = RANKS.map((r, i) => ({ ...r, i })).filter((r) => r.metal === metal);
          return (
            <Rise key={metal} delay={80 + mi * 30} style={{ marginTop: 16 }}>
              <Card style={{ padding: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingBottom: 4 }}>
                  <Text accessibilityRole="header" style={type.h2}>
                    {metal}
                  </Text>
                  <Text style={type.small}>{tiers[0].title}</Text>
                </View>
                {tiers.map((k) => {
                  const done = k.i < index;
                  const cur = k.i === index;
                  const need = k.threshold - total;
                  return (
                      <View
                        key={k.name}
                        accessible
                        accessibilityLabel={`${k.name}, ${fmtN(k.threshold)} XP. ${done ? 'Unlocked' : cur ? 'You’re here' : `${fmtN(need)} XP to go`}`}
                        accessibilityState={cur ? { selected: true } : undefined}
                        style={[
                          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 4 },
                          cur && {
                            backgroundColor: 'rgba(67,97,255,0.14)',
                            borderRadius: 18,
                            paddingHorizontal: 10,
                            borderWidth: 1.5,
                            borderColor: 'rgba(147,165,255,0.55)',
                          },
                        ]}
                      >
                        <Medal metal={k.metal} tier={TIER(k.name)} size={44} locked={!done && !cur} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={type.title}>{k.name}</Text>
                          <Text style={[type.small, { fontVariant: ['tabular-nums'] }]}>{fmtN(k.threshold)} XP</Text>
                        </View>
                        {done ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CheckCircleIcon size={18} weight="fill" color={color.mint} />
                            <Text style={type.small}>Unlocked</Text>
                          </View>
                        ) : cur ? (
                          <Chip tone="sun" label="You’re here" />
                        ) : (
                          <Text style={[type.small, { fontVariant: ['tabular-nums'] }]}>{fmtN(need)} XP to go</Text>
                        )}
                      </View>
                  );
                })}
              </Card>
            </Rise>
          );
        })}

        {/* How XP works */}
        <Rise delay={80 + METAL_NAMES.length * 30} style={{ marginTop: 16 }}>
          <Card style={{ padding: 8 }}>
            <Text accessibilityRole="header" style={[type.title, { paddingHorizontal: 12, paddingVertical: 8 }]}>
              How XP works
            </Text>
            <XpRules />
          </Card>
        </Rise>
      </ScrollView>
    </View>
  );
}
