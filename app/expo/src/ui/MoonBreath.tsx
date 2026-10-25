import { useEffect, useState } from 'react';
import { Animated, Easing, Text, useAnimatedValue, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G } from 'react-native-svg';

import { useReduceMotion } from './components';
import { font } from './theme';

// The pause timer as a moon (the same one as the onboarding demo): a moon-yellow ring fills as the
// seconds pass while the moon in the middle waxes from a crescent to full, with the seconds left on
// it, and a soft halo that swells and settles with "Breathe in" (4 s) and "Breathe out" (4 s).

const MOON = '#FFE7A3';
const SHADE = '#2A1E6E';
const BREATH = 8000; // one in-and-out
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function MoonBreath({ total, left, done }: { total: number; left: number; done: boolean }) {
  const rm = useReduceMotion();
  const { height } = useWindowDimensions();
  const k = Math.max(0.74, Math.min(1.08, height / 852));
  const S = Math.round(232 * k);
  const R = S / 2 - 8;
  const C = 2 * Math.PI * R;
  const m = Math.round(S * 0.5);

  // The ring and the moon glide between the ticks instead of jumping four times a second.
  const progress = useAnimatedValue(Math.min(1, Math.max(0, 1 - left / total)));
  useEffect(() => {
    const to = done ? 1 : Math.min(1, Math.max(0, 1 - left / total));
    const a = Animated.timing(progress, { toValue: to, duration: rm ? 0 : 280, easing: Easing.linear, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [left, total, done, rm, progress]);

  // Breathing: the halo swells for 4 s and settles for 4 s; the words follow it.
  const breathe = useAnimatedValue(0);
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    if (rm || done) return;
    const loop = Animated.loop(Animated.timing(breathe, { toValue: 1, duration: BREATH, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    const t = setInterval(() => setInhale((v) => !v), BREATH / 2);
    return () => {
      loop.stop();
      clearInterval(t);
    };
  }, [rm, done, breathe]);

  const secs = Math.ceil(left);
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={done ? 'Pause done' : `${secs} seconds left`}>
        <Animated.View
          style={{
            position: 'absolute',
            width: S * 0.86,
            height: S * 0.86,
            borderRadius: S,
            backgroundColor: MOON,
            opacity: rm ? 0.1 : breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.06, 0.2, 0.06] }),
            transform: rm ? [] : [{ scale: breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.86, 1.08, 0.86] }) }],
          }}
        />
        <Svg width={S} height={S} style={{ position: 'absolute' }}>
          <Circle cx={S / 2} cy={S / 2} r={R} stroke="rgba(255,255,255,0.2)" strokeWidth={8} fill="none" />
          <AnimatedCircle
            cx={S / 2}
            cy={S / 2}
            r={R}
            stroke={MOON}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] })}
            transform={`rotate(-90 ${S / 2} ${S / 2})`}
          />
        </Svg>
        <Svg width={m} height={m}>
          <Defs>
            <ClipPath id="breathMoon">
              <Circle cx={m / 2} cy={m / 2} r={m / 2 - 1} />
            </ClipPath>
          </Defs>
          <Circle cx={m / 2} cy={m / 2} r={m / 2 - 1} fill={MOON} />
          <G clipPath="url(#breathMoon)">
            <AnimatedCircle cx={progress.interpolate({ inputRange: [0, 1], outputRange: [m * 0.68, m * 1.7] })} cy={m * 0.42} r={m / 2 - 1} fill={SHADE} />
          </G>
        </Svg>
        <Text style={{ position: 'absolute', fontFamily: font.display, fontSize: 42 * k, color: done ? SHADE : '#FFFFFF', fontVariant: ['tabular-nums'] }}>
          {done ? '✓' : secs}
        </Text>
      </View>
      <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, fontFamily: font.bodyHeavy, fontSize: 16, color: MOON }}>
        {done ? 'Done. Now you choose.' : inhale ? 'Breathe in' : 'Breathe out'}
      </Text>
    </View>
  );
}
