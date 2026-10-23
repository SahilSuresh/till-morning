import { ArrowUp, Check, LockKey } from 'phosphor-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';

import { useReduceMotion } from '../components';
import { color, font, type } from '../theme';

/**
 * Shown under iOS's Screen Time alert while it's up (as Opal and BePresent do): iOS draws
 * "Don't Allow" in blue and "Continue" in grey, so people need telling which one to tap.
 */
export function AskingHint() {
  const rm = useReduceMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (rm) return;
    bob.set(withRepeat(withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(bob);
  }, [rm, bob]);
  const arrow = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(220)} style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
      <Animated.View style={arrow}>
        <ArrowUp size={30} weight="bold" color="#FFFFFF" />
      </Animated.View>
      <Text style={[type.h2, { marginTop: 8, textAlign: 'center' }]}>Tap Continue</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <LockKey size={15} weight="bold" color={color.mintText} />
        <Text style={[type.small, { textAlign: 'center' }]}>Your data never leaves your phone</Text>
      </View>
    </Animated.View>
  );
}

/** "Screen Time connected", held for a moment before setup moves on. */
export function ConnectedNote() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 64 }} accessibilityLiveRegion="polite">
      <Animated.View entering={ZoomIn.duration(400)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color.mint, alignItems: 'center', justifyContent: 'center' }}>
        <Check size={18} weight="bold" color="#0B3B33" />
      </Animated.View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22, color: color.mintText }}>Screen Time connected</Text>
    </Animated.View>
  );
}
