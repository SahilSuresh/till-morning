import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from './components';

/**
 * The prototype's .st-face (P:L1766): a green face with two dark eyes in a white ring that
 * breathes (scale 1.04 over 6 s). `off` = grey face (shields off), `sleep` = closed eyes,
 * `ring` = the 4 px white border (off for the coach tip's 44 px face).
 */
export function StFace({
  size = 84,
  off,
  sleep,
  ring = true,
  breathe = true,
}: {
  size?: number;
  off?: boolean;
  sleep?: boolean;
  ring?: boolean;
  breathe?: boolean;
}) {
  const rm = useReduceMotion();
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rm || !breathe) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(b, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(b, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, breathe, b]);

  const pad = ring ? 4 : 0;
  const inner = size - pad * 2;
  // Eyes: 11×15 on an 84 px face (13×18 on the big one), at 37% from the top, 31% in from each side.
  const ew = Math.max(4, inner * 0.145);
  const eh = sleep ? Math.max(3, inner * 0.05) : Math.max(5, inner * 0.2);
  const top = inner * 0.37 + (sleep ? inner * 0.08 : 0);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: ring ? '#FFFFFF' : 'transparent',
        padding: pad,
        transform: [{ scale: b.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }],
      }}
    >
      <View style={{ width: inner, height: inner }}>
        <Svg width={inner} height={inner}>
          <Defs>
            <RadialGradient id="stOn" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#B9F26B" />
              <Stop offset="0.6" stopColor="#74CC2E" />
              <Stop offset="1" stopColor="#4E9E1C" />
            </RadialGradient>
            <RadialGradient id="stOff" cx="35%" cy="30%" r="75%">
              <Stop offset="0" stopColor="#D5D6EE" />
              <Stop offset="0.7" stopColor="#8A8EC6" />
            </RadialGradient>
          </Defs>
          <Circle cx={inner / 2} cy={inner / 2} r={inner / 2} fill={`url(#${off ? 'stOff' : 'stOn'})`} />
        </Svg>
        <View style={{ position: 'absolute', top, left: inner * 0.31, width: ew, height: eh, borderRadius: ew, backgroundColor: '#14163A' }} />
        <View style={{ position: 'absolute', top, right: inner * 0.31, width: ew, height: eh, borderRadius: ew, backgroundColor: '#14163A' }} />
      </View>
    </Animated.View>
  );
}
