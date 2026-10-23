import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, type ImageSourcePropType, type StyleProp, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { springOut, useReduceMotion } from './components';

const OUTLINE = 2.5;
// 8 directions make a smooth white die-cut edge around the transparent artwork.
const OFFSETS = [
  [OUTLINE, 0],
  [-OUTLINE, 0],
  [0, OUTLINE],
  [0, -OUTLINE],
  [OUTLINE * 0.7, OUTLINE * 0.7],
  [-OUTLINE * 0.7, OUTLINE * 0.7],
  [OUTLINE * 0.7, -OUTLINE * 0.7],
  [-OUTLINE * 0.7, -OUTLINE * 0.7],
] as const;

/**
 * A mascot sticker, as the prototype's mascot() draws it (P:L923):
 * .cut white die-cut edge + drop shadow (P:L100), .halo glow (P:L101), .float bob (4.2 s, −7 px)
 * and .pop-in (scale .5 → 1, .55 s spring). Each part can be turned off.
 */
export function Mascot({
  source,
  size,
  halo = true,
  float = true,
  pop = true,
  cut = true,
  delay = 0,
  style,
  accessibilityLabel,
}: {
  source: ImageSourcePropType;
  size: number;
  halo?: boolean;
  float?: boolean;
  pop?: boolean;
  cut?: boolean;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const rm = useReduceMotion();
  const enter = useRef(new Animated.Value(rm || !pop ? 1 : 0)).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rm) return;
    if (pop) Animated.timing(enter, { toValue: 1, duration: 550, delay, easing: springOut, useNativeDriver: true }).start();
    if (!float) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, pop, float, delay, enter, bob]);

  const haloSize = size * 1.4;
  return (
    <Animated.View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        {
          opacity: enter,
          transform: [
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
          ],
        },
        style,
      ]}
    >
      {halo && (
        <Svg
          width={haloSize}
          height={haloSize}
          style={{ position: 'absolute', left: (size - haloSize) / 2, top: (size - haloSize) / 2 }}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="rgb(92,112,255)" stopOpacity={0.5} />
              <Stop offset="0.58" stopColor="rgb(139,92,246)" stopOpacity={0.2} />
              <Stop offset="1" stopColor="rgb(139,92,246)" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={haloSize / 2} cy={haloSize / 2} r={haloSize / 2} fill="url(#halo)" />
        </Svg>
      )}
      {/* iOS draws a layer shadow from the artwork's own outline when the view has no background. */}
      <View
        style={{
          width: size,
          height: size,
          shadowColor: '#020312',
          shadowOpacity: cut ? 0.5 : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 10 },
        }}
      >
        {cut &&
          OFFSETS.map(([x, y], i) => (
            <Image
              key={i}
              source={source}
              resizeMode="contain"
              tintColor="#FFFFFF"
              style={{ position: 'absolute', width: size, height: size, transform: [{ translateX: x }, { translateY: y }] }}
            />
          ))}
        <Image source={source} resizeMode="contain" style={{ width: size, height: size }} />
      </View>
    </Animated.View>
  );
}
