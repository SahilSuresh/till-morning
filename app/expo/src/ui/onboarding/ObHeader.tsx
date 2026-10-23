import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'phosphor-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CircleButton, useReduceMotion } from '../components';
import { color, gradient } from '../theme';
import { useObSpace } from './space';

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/**
 * Setup's header (obHead, P:L943): back arrow and the progress bar, px-6 pt-14 pb-2 gap-3.
 * `n` is out of 5 like the prototype. The fill grows from where it was over .55s (.pfill grow).
 * On the dark steps the track is rgba(255,255,255,.22) and the fill is solid white.
 */
export function ObHeader({ n, dark, onBack }: { n: number; dark?: boolean; onBack: () => void }) {
  const sp = useObSpace();
  const rm = useReduceMotion();
  const p = useSharedValue(n / 5);
  useEffect(() => {
    p.set(rm ? n / 5 : withTiming(n / 5, { duration: 550, easing: EASE }));
  }, [n, rm, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));

  return (
    <View style={{ paddingTop: sp.top(56), paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <CircleButton label="Back" onDark={dark} onPress={onBack}>
        <ArrowLeft size={20} weight="bold" color={dark ? '#FFFFFF' : color.text} />
      </CircleButton>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Setup progress"
        accessibilityValue={{ min: 0, max: 100, now: Math.round((n / 5) * 100) }}
        style={{ flex: 1, height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)' }}
      >
        <Animated.View style={[{ height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: dark ? '#FFFFFF' : color.blue }, fill]}>
          {!dark && <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
        </Animated.View>
      </View>
    </View>
  );
}
