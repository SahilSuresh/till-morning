import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  ReduceMotion,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { useReduceMotion } from '../components';
import { color, font, type } from '../theme';
import { StepBody, useStepAnims } from './StepMotion';

// The first screen (P:L1119–1126, logic P:L2773–2803): sale noise jiggling around one button, a crescent
// moon (Night Trolley). Holding it for 2.5 s fills the ring and the moon grows full while the noise slows and
// fades; then it goes BOOM: a flash, a shockwave and rays, and the moon turns into the sun. Letting go early resets.

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
const MOON = '#FFE7A3';
const RAYS = Array.from({ length: 12 }, (_, i) => i * 30);

/** One sunbeam shooting out from the middle when the moon becomes the sun. */
function Ray({ angle, boom }: { angle: number; boom: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(boom.value, [0, 0.12, 0.7, 1], [0, 1, 0.9, 0.55]),
    transform: [
      { rotate: `${angle}deg` },
      { translateY: interpolate(boom.value, [0, 0.4, 1], [-40, -104, -96]) },
      { scaleY: interpolate(boom.value, [0, 0.35, 1], [0.2, 1.4, 1]) },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', width: 7, height: 34, marginLeft: -3.5, marginTop: -17, left: '50%', top: '50%', borderRadius: 4, backgroundColor: '#FFD3A8' }, style]} />;
}

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
  const boom = useSharedValue(0); // the moon turning into the sun, 0 → 1
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}), 120);
    if (!rm) boom.set(withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    timer.current = setTimeout(onHeld, rm ? 0 : 1100);
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
  // The moon's shadow slides off as you hold: a crescent becomes a full moon.
  const shade = useAnimatedProps(() => ({ cx: 76 + 70 * k.value }));
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));
  const moonStyle = useAnimatedStyle(() => ({ opacity: interpolate(boom.value, [0, 0.3], [1, 0], 'clamp') }));
  const sunStyle = useAnimatedStyle(() => ({
    opacity: interpolate(boom.value, [0, 0.12], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(boom.value, [0, 0.35, 0.65, 1], [0.5, 1.5, 1.18, 1.25]) }],
  }));
  const waveStyle = useAnimatedStyle(() => ({
    opacity: interpolate(boom.value, [0, 0.08, 0.8], [0, 0.9, 0], 'clamp'),
    transform: [{ scale: interpolate(boom.value, [0, 0.8], [0.7, 4.6], 'clamp') }],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: interpolate(boom.value, [0, 0.14, 0.6], [0, 0.85, 0], 'clamp') }));

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
          <Animated.View style={[{ width: 168, height: 168 }, pressStyle]}>
            {/* BOOM: a shockwave ring, rays, and the sun where the moon was */}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 34, top: 34, width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#FFE6CF' }, waveStyle]} />
            {!rm && RAYS.map((a) => <Ray key={a} angle={a} boom={boom} />)}
            <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 28, top: 28, width: 112, height: 112, borderRadius: 56, shadowColor: '#FFB59A', shadowOpacity: 0.9, shadowRadius: 24, backgroundColor: '#FFC48A' }, sunStyle]}>
              <LinearGradient colors={['#FFF1C9', '#FFC48A', '#F0899F']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={{ flex: 1, borderRadius: 56 }} />
            </Animated.View>
            {/* the moon, filling up as you hold */}
            <Animated.View style={moonStyle}>
              <Svg width={168} height={168} viewBox="0 0 120 120">
                <Defs>
                  <ClipPath id="holdMoon">
                    <Circle cx={60} cy={60} r={39} />
                  </ClipPath>
                </Defs>
                <Circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={6} />
                <AnimatedCircle
                  cx={60}
                  cy={60}
                  r={52}
                  fill="none"
                  stroke={MOON}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={`${RING_C} ${RING_C}`}
                  rotation={-90}
                  originX={60}
                  originY={60}
                  animatedProps={ring}
                />
                <Circle cx={60} cy={60} r={42} fill={MOON} opacity={0.14} />
                <Circle cx={60} cy={60} r={39} fill={MOON} />
                <G clipPath="url(#holdMoon)">
                  <AnimatedCircle cy={54} r={39} fill="#1E2058" animatedProps={shade} />
                </G>
              </Svg>
            </Animated.View>
          </Animated.View>
        </Pressable>
        {/* A fixed full-width box with the words pinned across it, so any label sits exactly in the middle */}
        <View style={{ marginTop: 20, alignSelf: 'stretch', height: 26 }}>
          <Text
            key={label}
            numberOfLines={1}
            style={[type.h2, { position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center' }]}
            accessibilityLiveRegion="polite"
          >
            {label}
          </Text>
        </View>
        <Text style={[type.small, { marginTop: 4, alignSelf: 'stretch', textAlign: 'center' }]}>to pause the noise</Text>
      </StepBody>
      {/* the warm flash of the boom, over everything */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFE6CF' }, flashStyle]} />
    </>
  );
}
