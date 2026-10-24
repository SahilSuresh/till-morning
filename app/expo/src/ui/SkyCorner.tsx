import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Easing, useAnimatedValue, View } from 'react-native';

import { useReduceMotion } from './components';

// The little sky in a sheet's corner, following the clock in Night Trolley colours:
// night: moon-yellow crescent and twinkling stars
// dawn 05:00–08:00: the moon fades and sinks, a peach-to-pink sun rises over a lavender horizon
// day: a small soft peach sun (never plain yellow)
// evening 18:00–21:00: the sun sinks into lavender, the moon and stars come back

const MOON = '#FFE7A3';
const W = 92;
const H = 46;
const HORIZON = 38; // y of the horizon line; anything below it is hidden
const SINK = 32; // how far a body drops when it has set

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => n * n * (3 - 2 * n);

/** How far up the moon and the sun are right now (0 = set, 1 = up). */
export function skyAt(at: number) {
  const d = new Date(at);
  const h = d.getHours() + d.getMinutes() / 60;
  let sun = 0;
  if (h >= 5 && h < 8) sun = (h - 5) / 3;
  else if (h >= 8 && h < 18) sun = 1;
  else if (h >= 18 && h < 21) sun = 1 - (h - 18) / 3;
  sun = ease(clamp(sun));
  return { sun, moon: 1 - sun };
}

export function SkyCorner({ bg }: { bg: string }) {
  const rm = useReduceMotion();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);
  const { sun, moon } = skyAt(now);

  // One slow loop drives the moon's rock, the stars' twinkle and the sun's glow.
  const tw = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(Animated.timing(tw, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rm, tw]);

  const twinkle = (a: number, b: number, c: number) =>
    rm
      ? { opacity: 0.7 * moon }
      : {
          opacity: tw.interpolate({ inputRange: [0, a, b, c, 1], outputRange: [0.2 * moon, 0.2 * moon, moon, 0.2 * moon, 0.2 * moon] }),
          transform: [{ scale: tw.interpolate({ inputRange: [0, a, b, c, 1], outputRange: [0.6, 0.6, 1.4, 0.6, 0.6] }) }],
        };
  const dot = (right: number, top: number, size: number, fill: string) => ({
    position: 'absolute' as const,
    right,
    top,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: fill,
  });
  const glow = rm ? 1 : tw.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });

  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, width: W, height: H, overflow: 'hidden' }}>
      {/* a dawn wash behind the sun */}
      {sun > 0 && (
        <View
          style={{
            position: 'absolute',
            right: -14,
            top: -6,
            width: 70,
            height: 56,
            borderRadius: 35,
            backgroundColor: '#E2789A',
            opacity: 0.1 * sun + 0.12 * Math.min(sun, moon) * 2,
          }}
        />
      )}

      {/* stars, only while it's dark */}
      {moon > 0.05 && (
        <>
          <Animated.View style={[dot(44, 6, 4, MOON), twinkle(0.05, 0.18, 0.32)]} />
          <Animated.View style={[dot(66, 20, 3, '#FFFFFF'), twinkle(0.38, 0.5, 0.62)]} />
          <Animated.View style={[dot(34, 30, 3, '#C4B5FD'), twinkle(0.68, 0.8, 0.92)]} />
        </>
      )}

      {/* the moon: fades and sinks as the sun comes up */}
      {moon > 0.02 && (
        <View style={{ position: 'absolute', right: 4, top: 3 + (1 - moon) * SINK, opacity: Math.pow(moon, 0.8) }}>
          <Animated.View
            style={{
              width: 24,
              height: 24,
              transform: rm
                ? []
                : [{ rotate: tw.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['-7deg', '0deg', '7deg', '0deg', '-7deg'] }) }],
            }}
          >
            {/* a soft glow (a plain disc, cheaper than a shadow) */}
            <View style={{ position: 'absolute', left: -5, top: -5, width: 34, height: 34, borderRadius: 17, backgroundColor: MOON, opacity: 0.18 }} />
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: MOON, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: 8, top: -5, width: 24, height: 24, borderRadius: 12, backgroundColor: bg }} />
            </View>
          </Animated.View>
        </View>
      )}

      {/* the sun: peach to pink, rising from behind the horizon */}
      {sun > 0.02 && (
        <View style={{ position: 'absolute', right: 30, top: 6 + (1 - sun) * SINK, opacity: Math.min(1, sun * 1.6) }}>
          <Animated.View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: '#FFB59A',
              shadowColor: '#FFB59A',
              shadowOpacity: 0.7,
              shadowRadius: 10,
              transform: [{ scale: glow }],
            }}
          >
            <LinearGradient colors={['#FFE1C2', '#FFB59A', '#F08FA6']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={{ flex: 1, borderRadius: 12 }} />
          </Animated.View>
        </View>
      )}

      {/* below the horizon: hidden, with a thin lavender line while the sun is near it */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: HORIZON, bottom: 0, backgroundColor: bg }} />
      <View
        style={{
          position: 'absolute',
          left: 10,
          right: 0,
          top: HORIZON - 1,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: '#A78BFA',
          opacity: sun > 0 && sun < 1 ? 0.7 : sun === 1 ? 0.25 : 0,
        }}
      />
    </View>
  );
}
