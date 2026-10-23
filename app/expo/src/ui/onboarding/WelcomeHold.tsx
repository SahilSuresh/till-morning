import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useReduceMotion } from '../components';
import { color, font, type } from '../theme';
import { StepBody, useStepAnims } from './StepMotion';

// The first screen (P:L1119–1126, logic P:L2773–2803): sale noise jiggling around one pause button.
// Holding it for 2.5 s fills the ring, slows the noise and fades it out; letting go early resets.

const HOLD_MS = 2500;
const RING_C = 326.7; // 2π × 52, in the button's 120-unit drawing

const PILLS: [string, string, number, number][] = [
  ['70% OFF!', '#FF5F87', 7, 10],
  ['Only 2 left', '#FFC94D', 58, 12],
  ['Last chance', '#FF8F78', 30, 20],
  ['Ends in 0:59', '#FF8F78', 4, 28],
  ['Free delivery', '#5EE9B5', 60, 27],
  ['3 people viewing', '#A78BFA', 3, 67],
  ['Add to basket?', '#7088FF', 57, 66],
  ['BUY 1 GET 1', '#A78BFA', 10, 77],
  ['Flash sale', '#FF5F87', 60, 77],
  ['Trending now', '#FFC94D', 30, 86],
];
const darkText = (bg: string) => bg === '#FFC94D' || bg === '#5EE9B5';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * One pill. `clock` counts half-swings of the .jig keyframes (.5 s each at rest, `alternate`);
 * each pill starts i × .17 s into it, like the prototype's negative animation delays.
 */
function Pill({ i, label, bg, x, y, clock, dim, still }: { i: number; label: string; bg: string; x: number; y: number; clock: SharedValue<number>; dim: SharedValue<number>; still: boolean }) {
  const style = useAnimatedStyle(() => {
    if (still) return { opacity: dim.value };
    const c = (clock.value + i * 0.34) % 2;
    const lin = c < 1 ? c : 2 - c;
    const e = lin * lin * (3 - 2 * lin); // ease-in-out
    return {
      opacity: dim.value,
      transform: [{ translateX: 2 * e }, { translateY: -3 * e }, { rotate: `${-4 + 8 * e}deg` }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: `${x}%`, top: `${y}%` }, style]}>
      <View
        style={{
          backgroundColor: bg,
          borderRadius: 999,
          paddingHorizontal: 11,
          paddingVertical: 6,
          shadowColor: '#020312',
          shadowOpacity: 0.4,
          shadowRadius: 7,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, lineHeight: 18, color: darkText(bg) ? '#14163A' : '#FFFFFF' }}>{label}</Text>
      </View>
    </Animated.View>
  );
}

type Label = 'Press and hold' | 'Keep holding…' | 'Paused.' | 'Hold a little longer';

export function WelcomeHold({ onHeld, onSkip }: { onHeld: () => void; onSkip: () => void }) {
  const rm = useReduceMotion();
  const motion = useStepAnims();
  const [label, setLabel] = useState<Label>('Press and hold');
  const k = useSharedValue(0); // hold progress 0 → 1
  const dim = useSharedValue(1); // the noise's opacity (.hpill has a .3 s opacity transition)
  const clock = useSharedValue(0);
  const press = useSharedValue(1);
  const holding = useRef(false);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The jiggle slows from .5 s to 4.5 s a swing as the ring fills (P:L2782).
  const jiggle = useFrameCallback((f) => {
    const dt = (f.timeSincePreviousFrame ?? 16.7) / 1000;
    clock.value = (clock.value + dt / (0.5 + 4 * k.value)) % 2000;
  }, !rm);
  useEffect(() => {
    jiggle.setActive(!rm && !held.current);
  }, [rm, jiggle]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const complete = () => {
    if (held.current) return;
    held.current = true;
    holding.current = false;
    jiggle.setActive(false);
    dim.set(withTiming(0, { duration: 300 }));
    press.set(withTiming(1, { duration: 200 }));
    setLabel('Paused.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    timer.current = setTimeout(onHeld, rm ? 0 : 650);
  };

  const start = () => {
    if (held.current || holding.current) return;
    holding.current = true;
    setLabel('Keep holding…');
    press.set(withTiming(0.96, { duration: 200 }));
    // The hold is the control itself, so it keeps its 2.5 s under Reduce Motion too.
    dim.set(withTiming(0.25, { duration: HOLD_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
    k.set(
      withTiming(1, { duration: HOLD_MS, easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (finished) => {
        if (finished) scheduleOnRN(complete);
      }),
    );
  };

  const release = () => {
    if (held.current || !holding.current) return;
    if (k.get() >= 1) return; // the ring is full: "Paused." is on its way
    holding.current = false;
    cancelAnimation(k);
    k.set(0); // the ring empties at once (P:L2795)
    dim.set(withTiming(1, { duration: 300 }));
    press.set(withTiming(1, { duration: 200 }));
    setLabel('Hold a little longer');
  };

  const ring = useAnimatedProps(() => ({ strokeDashoffset: RING_C * (1 - k.value) }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <>
      <Animated.View
        exiting={motion.bodyOut}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {PILLS.map(([t, bg, x, y], i) => (
          <Pill key={t} i={i} label={t} bg={bg} x={x} y={y} clock={clock} dim={dim} still={rm} />
        ))}
      </Animated.View>
      <StepBody
        scroll={false}
        contentStyle={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        footerStyle={{ paddingTop: 8, alignItems: 'center' }}
        footer={
          <Pressable onPress={onSkip} accessibilityRole="button" style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, lineHeight: 20, color: color.text3, textDecorationLine: 'underline' }}>Skip</Text>
          </Pressable>
        }
      >
        <Pressable
          onPressIn={start}
          onPressOut={release}
          pressRetentionOffset={{ top: 400, bottom: 400, left: 400, right: 400 }}
          accessibilityRole="button"
          accessibilityLabel="Press and hold to pause the noise"
          onAccessibilityTap={onSkip}
        >
          <Animated.View style={pressStyle}>
            <Svg width={168} height={168} viewBox="0 0 120 120">
              <Circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={6} />
              <AnimatedCircle
                cx={60}
                cy={60}
                r={52}
                fill="none"
                stroke="#B9CBFF"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${RING_C} ${RING_C}`}
                rotation={-90}
                originX={60}
                originY={60}
                animatedProps={ring}
              />
              <Circle cx={60} cy={60} r={39} fill="#4361FF" />
              <Rect x={48.5} y={44} width={8.5} height={32} rx={3.5} fill="#FFFFFF" />
              <Rect x={63} y={44} width={8.5} height={32} rx={3.5} fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </Pressable>
        <Text style={[type.h2, { marginTop: 20, textAlign: 'center' }]} accessibilityLiveRegion="polite">
          {label}
        </Text>
        <Text style={[type.small, { marginTop: 4, textAlign: 'center' }]}>to pause the noise</Text>
      </StepBody>
    </>
  );
}
