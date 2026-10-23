import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setState, useAppState } from '../lib/store';
import { METAL_NAMES, rankFor } from '../lib/xp';
import { Button, springOut, useReduceMotion } from '../ui/components';
import { Medal } from '../ui/Medal';
import { color, font, type } from '../ui/theme';

const CONFETTI = ['#FFC94D', '#5EE9B5', '#FF8F78', '#A78BFA', '#93A5FF', '#FFFFFF'];

/** V.rankup (L1603): confetti, medal, "{Rank} unlocked!", XP count-up, the six metals. */
export default function RankUp() {
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const total = useAppState((s) => s.xp.total);
  const { rank, next, index } = rankFor(total);
  const pop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const burst = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const [shown, setShown] = useState(rm ? total : Math.max(0, total - 60));
  const pieces = useRef(
    Array.from({ length: 28 }).map((_, i) => ({
      x: (Math.random() - 0.5) * 360,
      y: -80 - Math.random() * 220,
      r: Math.random() * 540 - 270,
      c: CONFETTI[i % CONFETTI.length],
      w: 6 + Math.random() * 6,
    })),
  ).current;

  useEffect(() => {
    setState({ rankSeen: index });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (rm) return;
    Animated.parallel([
      Animated.timing(pop, { toValue: 1, duration: 650, easing: springOut, useNativeDriver: true }),
      Animated.timing(burst, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    let v = Math.max(0, total - 60);
    const t = setInterval(() => {
      v = Math.min(total, v + Math.ceil((total - v) / 6) || 1);
      setShown(v);
      if (v >= total) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [index, total, rm, pop, burst]);

  const share = () =>
    Share.share({ message: `I reached ${rank.name} (${rank.title}) on Till Morning, shopping on purpose.` }).catch(() => {});

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <LinearGradient colors={['#3B2B97', color.night]} locations={[0, 0.72]} style={{ position: 'absolute', inset: 0 }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
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
          <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
            <Medal metal={rank.metal} tier={rank.name.split(' ')[1]} size={150} />
          </Animated.View>
        </View>

        <Text style={[type.display, { color: '#FFFFFF', textAlign: 'center', marginTop: 28 }]}>
          <Text style={{ color: color.sun }}>{rank.name}</Text> unlocked!
        </Text>
        <Text style={[type.h2, { color: color.white82, marginTop: 4 }]}>{rank.title}</Text>
        <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 12 }]}>
          {shown.toLocaleString('en-GB')} XP of choosing on purpose.{next ? ` ${next.name} is next.` : ''}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}>
          {METAL_NAMES.map((m) => (
            <Medal key={m} metal={m} size={34} locked={METAL_NAMES.indexOf(m) > METAL_NAMES.indexOf(rank.metal)} />
          ))}
        </View>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20, gap: 12 }}>
        <Button label="Keep going" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <Button variant="secondary" label="Share my rank" onPress={share} />
        <Text style={[type.small, { textAlign: 'center' }]}>Your share card shows your rank, never your money.</Text>
      </View>
    </View>
  );
}
