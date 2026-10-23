import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { useAppState } from '../lib/store';
import { rankFor } from '../lib/xp';
import { easeOut, useReduceMotion } from './components';
import { Medal } from './Medal';
import type { SpotRef } from './Spotlight';
import { color, font, type } from './theme';

const fmtN = (n: number) => Math.round(n).toLocaleString('en-GB');

// XP shown the last time a rank card was on screen (the prototype's shownXp / shownRank):
// XP earned since then fills the bar from there and counts the number up.
let shownXp: number | null = null;
let shownRank = 0;

/** The number counts from `from` to `to` over 1 s after .35 s (data-count in the prototype). Remount (key) to replay. */
function CountUp({ from, to }: { from: number | null; to: number }) {
  const [t, setT] = useState(from === null ? 1 : 0);
  useEffect(() => {
    if (from === null) return;
    let raf = 0;
    const start = Date.now() + 350;
    const step = () => {
      const k = Math.min(1, Math.max(0, (Date.now() - start) / 1000));
      setT(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from]);
  // cubic-bezier(.2,.8,.2,1) is close to an ease-out cubic
  return <>{fmtN(from === null ? to : from + (to - from) * (1 - Math.pow(1 - t, 3)))}</>;
}

/**
 * rankCard() from the prototype (P:L2001–2009): medal, rank name over its title, "All ranks ›",
 * the amber XP bar and "1,250 / 1,600 XP · 350 XP to Gold I". Tapping anywhere opens Ranks.
 */
export function RankCard({ targetRef }: { targetRef?: SpotRef }) {
  const total = useAppState((s) => s.xp.total);
  const rm = useReduceMotion();
  const { rank, next, index } = rankFor(total);
  const pctOf = (xp: number) => (next ? Math.max(0, Math.min(1, (xp - rank.threshold) / (next.threshold - rank.threshold))) : 1);

  // Grow from what was last shown, each time the card comes on screen with new XP.
  const [from, setFrom] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (shownXp === null) {
        shownXp = total;
        shownRank = index;
        return;
      }
      if (total > shownXp && !rm) setFrom(index !== shownRank ? rank.threshold : shownXp);
      shownXp = total;
      shownRank = index;
    }, [total, index, rank.threshold, rm]),
  );

  // The fill is a full-width bar slid left, so its rounded end stays round while it grows.
  const [w, setW] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const toPct = pctOf(total);
  const fromPct = from === null ? null : pctOf(from);
  useEffect(() => {
    if (!w) return;
    const to = -(1 - toPct) * w;
    if (fromPct === null) {
      x.setValue(to);
      return;
    }
    x.setValue(-(1 - fromPct) * w);
    const a = Animated.timing(x, { toValue: to, duration: 1000, delay: 350, easing: easeOut, useNativeDriver: true });
    a.start(({ finished }) => {
      if (finished) setFrom(null);
    });
    return () => a.stop();
  }, [w, toPct, fromPct, x]);

  return (
    <Pressable
      onPress={() => router.push('/ranks')}
      accessibilityRole="button"
      accessibilityLabel={`${rank.name}, ${rank.title}. See all ranks`}
      accessibilityHint={next ? `${fmtN(total)} of ${fmtN(next.threshold)} XP` : `${fmtN(total)} XP, top rank`}
    >
      <View ref={targetRef} collapsable={false} style={{ borderRadius: 24, backgroundColor: '#2A2FB0', paddingBottom: 3 }}>
        <LinearGradient
          colors={['#5A48F2', '#3D5AFE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Medal metal={rank.metal} tier={rank.name.split(' ')[1]} size={58} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 14, lineHeight: 18, color: '#FFFFFF' }}>{rank.name}</Text>
              <Text style={[type.h2, { color: '#FFFFFF' }]}>{rank.title}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.9 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: '#FFFFFF' }}>All ranks</Text>
              <CaretRightIcon size={13} weight="bold" color="#FFFFFF" />
            </View>
          </View>

          <View
            onLayout={(e) => setW(e.nativeEvent.layout.width)}
            style={{ marginTop: 16, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}
          >
            <Animated.View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: color.sun,
                width: w || `${Math.round(toPct * 100)}%`,
                transform: [{ translateX: w ? x : 0 }],
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
              {next ? (
                <>
                  <CountUp key={from ?? 'still'} from={from} to={total} /> / {fmtN(next.threshold)} XP
                </>
              ) : (
                `${fmtN(total)} XP`
              )}
            </Text>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
              {next ? `${fmtN(next.threshold - total)} XP to ${next.name}` : 'Top rank'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}
