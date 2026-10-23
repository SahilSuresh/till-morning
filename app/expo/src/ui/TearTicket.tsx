import * as Haptics from 'expo-haptics';
import { CaretRightIcon } from 'phosphor-react-native';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppLabel } from '../../modules/tm-native';
import { knownApp } from '../lib/core';
import { springOut, toast, useReduceMotion } from './components';
import { font } from './theme';

const TEAR_AT = 70;
const H = 98;
const STUB = 104;
const NOTCH = 8;

/**
 * The violet ticket's main part (.tk-main, P:L297/304): a 120° gradient, rounded on the left,
 * with the two half-circle notches cut where it meets the stub. `dashedRight` draws the used
 * ticket's perforation (.usedtk, P:L313) as an SVG line, since one-sided dashed borders render
 * solid on iOS.
 */
export function TicketMain({
  width,
  height,
  radius,
  rightRadius = 0,
  dashedRight,
  children,
}: {
  width: number;
  height: number;
  radius: number;
  rightRadius?: number;
  dashedRight?: boolean;
  children?: ReactNode;
}) {
  const w = Math.max(width, NOTCH * 2 + radius);
  const r = radius;
  const d = `M${r},0 H${w - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${w},${NOTCH} V${height - NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${w - NOTCH},${height} H${r} A${r},${r} 0 0 1 0,${height - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`;
  // CSS 120deg: the gradient line points right and a little down, long enough to reach both corners.
  const a = (120 * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(height * dy)) / 2;
  return (
    <View style={{ width: w, height }}>
      <Svg width={w} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="tk" gradientUnits="userSpaceOnUse" x1={w / 2 - dx * half} y1={height / 2 - dy * half} x2={w / 2 + dx * half} y2={height / 2 + dy * half}>
            <Stop offset="0" stopColor="#7E3FF2" />
            <Stop offset="1" stopColor="#B455F0" />
          </LinearGradient>
        </Defs>
        <Path d={d} fill="url(#tk)" />
        {dashedRight && <Line x1={w - 1.25} y1={NOTCH + 2} x2={w - 1.25} y2={height - NOTCH - 2} stroke="rgba(255,255,255,0.6)" strokeWidth={2.5} strokeDasharray="6 4" />}
      </Svg>
      <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, paddingRight: 16 + rightRadius, justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

/** .tk-label / .tk-min / .tk-app */
export const tk = {
  label: { fontFamily: font.bodyHeavy, fontSize: 11.5, lineHeight: 15, color: 'rgba(255,255,255,0.85)' },
  min: { fontFamily: font.display, fontSize: 30, lineHeight: 31.5, color: '#FFFFFF' },
  app: { fontFamily: font.bodyBold, fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.85)' },
} as const;

/** The stub (.tk-stub, P:L301/306): notches on the left, rounded on the right, a dashed tear line. */
function StubShape({ waiting }: { waiting: boolean }) {
  const r = 18;
  const d = `M${NOTCH},0 H${STUB - r} A${r},${r} 0 0 1 ${STUB},${r} V${H - r} A${r},${r} 0 0 1 ${STUB - r},${H} H${NOTCH} A${NOTCH},${NOTCH} 0 0 0 0,${H - NOTCH} V${NOTCH} A${NOTCH},${NOTCH} 0 0 0 ${NOTCH},0 Z`;
  return (
    <Svg width={STUB} height={H} style={StyleSheet.absoluteFill}>
      <Path d={d} fill={waiting ? '#4B3F7A' : '#9B4CF4'} />
      <Line x1={1.25} y1={NOTCH + 2} x2={1.25} y2={H - NOTCH - 2} stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeDasharray="6 4" />
    </Svg>
  );
}

/** The app's name on the ticket: the name we know, Apple's own label, or "Your shop apps". */
function TicketApp({ app, appKey }: { app: string; appKey?: string | null }) {
  if (knownApp(app) || !appKey)
    return (
      <Text numberOfLines={1} style={tk.app}>
        {knownApp(app) ? app : 'Your shop apps'}
      </Text>
    );
  return <AppLabel appKey={appKey} mode="title" size={12.5} color="#FFFFFF" style={{ height: 17, opacity: 0.85 }} />;
}

/**
 * The Shopping Pass ticket. Drag the stub right past 70 pt to tear it and start the pass.
 * A plain tap only wiggles it; VoiceOver activation tears it directly.
 */
export function TearTicket({
  minutes,
  app,
  appKey,
  waitSeconds,
  onTear,
}: {
  minutes: number;
  app: string;
  appKey?: string | null;
  waitSeconds: number; // 3rd+ pass of the day: the stub can't be torn for this long
  onTear: () => void;
}) {
  const rm = useReduceMotion();
  const dx = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const unlockBounce = useRef(new Animated.Value(1)).current;
  const [torn, setTorn] = useState(false);
  const [wait, setWait] = useState(waitSeconds);
  const [mainW, setMainW] = useState(0);
  const tornRef = useRef(false);
  const waitRef = useRef(waitSeconds);
  waitRef.current = wait;
  const onTearRef = useRef(onTear);
  onTearRef.current = onTear;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => {
      setWait((w) => w - 1);
      if (wait === 1 && !rm) {
        // .unlock: .95 → 1.04 → 1
        unlockBounce.setValue(0.95);
        Animated.timing(unlockBounce, { toValue: 1, duration: 500, easing: springOut, useNativeDriver: true }).start();
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [wait, rm, unlockBounce]);

  // .tk-arrow: nudge 5 pt right and back every 1.2 s
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 5, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, nudge]);

  const tear = () => {
    if (tornRef.current) return;
    tornRef.current = true;
    setTorn(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // translate(170, 70) rotate(32deg), fading out (.5 s, cubic-bezier(.4, 0, .2, 1))
    const ease = Easing.bezier(0.4, 0, 0.2, 1);
    Animated.parallel([
      Animated.timing(dx, { toValue: 170, duration: rm ? 1 : 500, easing: ease, useNativeDriver: true }),
      Animated.timing(fly, { toValue: 1, duration: rm ? 1 : 450, easing: ease, useNativeDriver: true }),
    ]).start();
    setTimeout(() => onTearRef.current(), rm ? 50 : 480);
  };
  const tearRef = useRef(tear);
  tearRef.current = tear;

  const doWiggle = () => {
    if (rm) return;
    wiggle.setValue(0);
    Animated.timing(wiggle, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !tornRef.current,
      onMoveShouldSetPanResponder: (_, g) => !tornRef.current && Math.abs(g.dx) > 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (waitRef.current > 0 || tornRef.current) return;
        const x = Math.max(0, g.dx);
        dx.setValue(x);
        // The prototype tears as soon as the stub passes the line, without waiting for the finger to lift.
        if (x > TEAR_AT) tearRef.current();
      },
      onPanResponderRelease: (_, g) => {
        if (tornRef.current) return;
        if (waitRef.current > 0) {
          toast('Take a few more seconds first');
          return;
        }
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
          doWiggle();
          toast('Drag the stub to the right to tear it');
        }
        Animated.spring(dx, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
      },
      onPanResponderTerminate: () => {
        if (!tornRef.current) Animated.spring(dx, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  const waiting = wait > 0;
  const stubTransform = [
    { translateX: dx },
    { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 70] }) },
    {
      // rotate(min(18, dx / 5)) while dragging, then on to 32deg as it flies off
      rotate: Animated.add(
        dx.interpolate({ inputRange: [0, 90], outputRange: [0, 18], extrapolate: 'clamp' }),
        fly.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }),
      ).interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
    },
    // .wiggle: rotate −8, 6, −4, 2, 0 over .6 s
    { rotate: wiggle.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ['0deg', '-8deg', '6deg', '-4deg', '2deg', '0deg'] }) },
    { scale: unlockBounce },
  ];

  return (
    <View
      style={{ height: H, flexDirection: 'row', shadowColor: '#020312', shadowOpacity: 0.5, shadowRadius: 9, shadowOffset: { width: 0, height: 8 } }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Tear the ticket to start your ${minutes}-minute pass`}
      accessibilityState={{ disabled: waiting }}
      onAccessibilityTap={() => (waiting ? AccessibilityInfo.announceForAccessibility('Take a few more seconds first') : tear())}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => (waiting ? AccessibilityInfo.announceForAccessibility('Take a few more seconds first') : tear())}
    >
      <View style={{ flex: 1 }} onLayout={(e) => setMainW(e.nativeEvent.layout.width)}>
        {mainW > 0 && (
          <TicketMain width={mainW} height={H} radius={18}>
            <Text style={tk.label}>{torn ? 'Pass started' : 'Shopping pass'}</Text>
            <Text style={tk.min}>{minutes} min</Text>
            <TicketApp app={app} appKey={appKey} />
          </TicketMain>
        )}
      </View>
      <Animated.View
        {...pan.panHandlers}
        style={{
          width: STUB,
          height: H,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: stubTransform,
        }}
      >
        <StubShape waiting={waiting} />
        <Text style={{ fontFamily: font.display, fontSize: 15, lineHeight: 16.5, color: waiting ? '#C9CBF0' : '#FFFFFF', textAlign: 'center' }}>
          {waiting ? `Wait ${wait}s` : 'Tear to start'}
        </Text>
        {!waiting && (
          <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: nudge }] }}>
            <CaretRightIcon size={15} color="#FFFFFF" weight="bold" />
            <CaretRightIcon size={15} color="#FFFFFF" weight="bold" />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}
