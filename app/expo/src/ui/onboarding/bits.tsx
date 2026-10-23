import { type ReactNode, useEffect } from 'react';
import { Platform, Pressable, type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useReduceMotion } from '../components';
import { font } from '../theme';

const SPRING = Easing.bezier(0.34, 1.56, 0.64, 1); // --spring

/** The prototype's .pop-in (scale .5 → 1 and a fade, .55s spring) for things that aren't mascots. */
export function PopIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const rm = useReduceMotion();
  const v = useSharedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    v.set(withDelay(delay, withTiming(1, { duration: 550, easing: SPRING })));
    return () => cancelAnimation(v);
  }, [rm, v, delay]);
  const pop = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value), transform: [{ scale: 0.5 + 0.5 * v.value }] }));
  return <Animated.View style={[style, pop]}>{children}</Animated.View>;
}

/** A tinted icon tile (.tile): 44 px, radius 14, mint by default. */
export function IconTile({ children, size = 44, bg = 'rgba(94,233,181,0.14)' }: { children: ReactNode; size?: number; bg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: 14, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </View>
  );
}

/** .uk-l: a 28 px letter tile on a bright colour. */
export function LetterTile({ letter, bg }: { letter: string; bg: string }) {
  return (
    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, lineHeight: 19, color: '#14163A' }}>{letter}</Text>
    </View>
  );
}

/** .wt-lab: a small monospace capitals label. */
export function MonoLabel({ children, color }: { children: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
        fontWeight: '700',
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.96,
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * The prototype's .link: bold, with a 2 px underline 4 px below the text. iOS can't set the
 * thickness or offset of a text underline, so it's drawn as a line under the label.
 */
export function UnderlineLink({ label, onPress, color, size = 15, style }: { label: string; onPress: () => void; color: string; size?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', alignItems: 'stretch' }}>
      <Text style={[{ fontFamily: font.bodyBold, fontSize: size, lineHeight: size + 3, color }, style]}>{label}</Text>
      <View style={{ height: 2, borderRadius: 1, backgroundColor: color, marginTop: 2 }} />
    </Pressable>
  );
}
