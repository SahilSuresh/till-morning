import { memo, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { font } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 170;
const R = 70;
const C = 2 * Math.PI * R; // 439.82

/**
 * The urgent door's one-minute ring (.u-ring, P:L1482): it drains on the UI thread in one
 * linear animation, and only the number re-renders, once a second. `onDone` fires once at zero.
 */
export const CountRing = memo(function CountRing({ total, startedAt, onDone }: { total: number; startedAt: number; onDone: () => void }) {
  const rm = useReduceMotion();
  const [secs, setSecs] = useState(() => Math.ceil(Math.max(0, total - (Date.now() - startedAt) / 1000)));
  const p = useSharedValue(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const leftNow = () => Math.max(0, total - (Date.now() - startedAt) / 1000);
    const l = leftNow();
    p.value = 1 - l / total;
    if (!rm) p.value = withTiming(1, { duration: l * 1000, easing: Easing.linear });
    const t = setInterval(() => {
      const left = leftNow();
      setSecs(Math.ceil(left));
      if (rm) p.value = 1 - left / total;
      if (left <= 0) {
        clearInterval(t);
        doneRef.current();
      }
    }, 250);
    return () => {
      clearInterval(t);
      cancelAnimation(p);
    };
  }, [total, startedAt, rm, p]);

  const ring = useAnimatedProps(() => ({ strokeDashoffset: C * p.value }));

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={secs > 0 ? `${secs} seconds left` : 'The minute is up'}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.14)" strokeWidth={7} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#B9CBFF"
          strokeWidth={7}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${C} ${C}`}
          animatedProps={ring}
        />
      </Svg>
      <Text style={{ fontFamily: font.display, fontSize: 52, lineHeight: 52, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{secs}</Text>
      <Text style={{ marginTop: 4, fontFamily: font.bodyBold, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>seconds</Text>
    </View>
  );
});
