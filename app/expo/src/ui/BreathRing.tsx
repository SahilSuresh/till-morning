import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from './components';
import { IconCheck } from './icons';
import { font } from './theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 244;
const R = 110;
const CIRC = 2 * Math.PI * R; // 691.15

/** Breathing cycle from the prototype: 7.5 s when the length divides by 7.5, otherwise 5 s; inhale = first 45%. */
export function breathCycle(total: number) {
  return total % 7.5 === 0 ? 7.5 : 5;
}

export function cueFor(elapsed: number, total: number) {
  const cycle = breathCycle(total);
  return (elapsed % cycle) / cycle < 0.45 ? 'breathe in' : 'breathe out';
}

/** The pause ring: starts full and empties as time runs down; the orb breathes inside it. */
export function BreathRing({
  total,
  left,
  done,
  size = SIZE,
}: {
  total: number;
  left: number;
  done: boolean;
  size?: number;
}) {
  const rm = useReduceMotion();
  const scale = useRef(new Animated.Value(0.6)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const checkPop = useRef(new Animated.Value(0)).current;

  // Ring progress, updated with the countdown (.25 s linear in the prototype).
  useEffect(() => {
    Animated.timing(offset, {
      toValue: CIRC * (1 - left / total),
      duration: 250,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [left, total, offset]);

  // Orb: 0.6 → 1 on the inhale (45%), back to 0.6 on the exhale.
  useEffect(() => {
    if (done || rm) {
      Animated.timing(scale, { toValue: done ? 0.95 : 0.8, duration: 600, useNativeDriver: true }).start();
      return;
    }
    const cycle = breathCycle(total) * 1000;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: cycle * 0.45, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.6, duration: cycle * 0.55, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [done, rm, total, scale]);

  useEffect(() => {
    if (!done) return;
    checkPop.setValue(0);
    Animated.spring(checkPop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  }, [done, checkPop]);

  const k = size / SIZE;
  const orb = 204 * k;
  const elapsed = total - left;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: orb, height: orb, transform: [{ scale }] }}>
        <Svg width={orb} height={orb}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={done ? 'rgb(214,226,255)' : 'rgb(200,216,255)'} stopOpacity={done ? 0.46 : 0.72} />
              <Stop offset={done ? '0.58' : '0.52'} stopColor={done ? 'rgb(190,206,255)' : 'rgb(150,170,255)'} stopOpacity={done ? 0.2 : 0.3} />
              <Stop offset={done ? '0.72' : '0.71'} stopColor="rgb(150,170,255)" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={orb / 2} cy={orb / 2} r={orb / 2} fill="url(#orb)" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.16)" strokeWidth={8} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#B9CBFF"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={offset}
        />
      </Svg>

      <View style={{ alignItems: 'center' }} accessible accessibilityLabel={done ? 'Your call' : `${Math.ceil(left)} seconds left`}>
        {done ? (
          <Animated.View style={{ transform: [{ scale: checkPop }] }}>
            <IconCheck size={56 * k} />
          </Animated.View>
        ) : (
          <Text
            style={{
              fontFamily: font.display,
              fontSize: 64 * k,
              lineHeight: 70 * k,
              color: '#FFFFFF',
              fontVariant: ['tabular-nums'],
              textShadowColor: 'rgba(28,18,110,0.6)',
              textShadowRadius: 10,
              textShadowOffset: { width: 0, height: 1 },
            }}
          >
            {Math.max(1, Math.ceil(left))}
          </Text>
        )}
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
          {done ? 'your call' : cueFor(elapsed, total)}
        </Text>
      </View>
    </View>
  );
}
