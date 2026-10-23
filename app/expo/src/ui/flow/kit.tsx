import { LinearGradient } from 'expo-linear-gradient';
import type { Icon, IconWeight } from 'phosphor-react-native';
import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { easeOut, springOut, useReduceMotion } from '../components';

// Small pieces shared by the core-loop screens (pause, pass, check-in, decide, urgent) and Settings.

// ---- Tinted icon tiles (.tile.bg-*, P:L91–96) -----------------------------

export const TILE = {
  mint: { bg: 'rgba(94,233,181,0.14)', fg: '#6EF0BF' },
  sun: { bg: 'rgba(255,201,77,0.15)', fg: '#FFD46E' },
  peach: { bg: 'rgba(255,143,120,0.15)', fg: '#FFAA97' },
  lav: { bg: 'rgba(167,139,250,0.19)', fg: '#CBBBFF' },
  // .bg-hush always comes with .text-azure-light in the prototype
  hush: { bg: '#1F2358', fg: '#93A5FF' },
} as const;
export type TileTone = keyof typeof TILE;

export function Tile({
  tone,
  Icon: I,
  size = 40,
  iconSize = size / 2,
  weight = 'bold',
  style,
}: {
  tone: TileTone;
  Icon: Icon;
  size?: number;
  iconSize?: number;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: 14, backgroundColor: TILE[tone].bg, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <I size={iconSize} color={TILE[tone].fg} weight={weight} />
    </View>
  );
}

// ---- Layout ---------------------------------------------------------------

/** pb-11 in the prototype's 852 pt frame: the home indicator plus ~10 pt. */
export function useFootPad() {
  return Math.max(useSafeAreaInsets().bottom + 10, 24);
}
/** pt-14 headers sit just under the status bar. */
export function useHeadPad() {
  return useSafeAreaInsets().top + 6;
}

// ---- Entrances (.rise / .pop-in / .popnow, P:L410) ------------------------

/** True once the screen's entrance has played; things that mount later appear without a delay. */
export function useEntered(ms = 1100) {
  const r = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      r.current = true;
    }, ms);
    return () => clearTimeout(t);
  }, [ms]);
  return r;
}

/**
 * .rise (14 pt up, .5 s ease) or .pop-in (scale .5 → 1, .55 s spring) after the 140 ms screen base
 * plus `d`. `after` skips it for things mounted once the entrance is over; `now` plays it with no delay.
 */
export function Enter({
  children,
  d = 0,
  pop,
  now,
  after,
  style,
}: {
  children: ReactNode;
  d?: number;
  pop?: boolean;
  now?: boolean;
  after?: RefObject<boolean>;
  style?: StyleProp<ViewStyle>;
}) {
  const rm = useReduceMotion();
  const [still] = useState(() => rm || !!after?.current);
  const v = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    Animated.timing(v, {
      toValue: 1,
      duration: pop ? (now ? 500 : 550) : 500,
      delay: now ? 0 : 140 + d,
      easing: pop ? springOut : easeOut,
      useNativeDriver: true,
    }).start();
  }, [still, v, d, pop, now]);
  const transform = pop
    ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]
    : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }];
  return (
    <Animated.View style={[style, { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform }]}>
      {children}
    </Animated.View>
  );
}

// ---- Backgrounds ----------------------------------------------------------

function Radial({ id, cx, cy, rx, ry, from, fromOpacity = 1, to, toOpacity = 0, at }: {
  id: string; cx: number; cy: number; rx: number; ry: number; from: string; fromOpacity?: number; to: string; toOpacity?: number; at: number;
}) {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx={cx} cy={cy} rx={rx} ry={ry} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={from} stopOpacity={fromOpacity} />
          <Stop offset={at} stopColor={to} stopOpacity={toOpacity} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100" height="100" fill={`url(#${id})`} />
    </Svg>
  );
}

/** .nl-sky (P:L1911): a soft indigo glow over a deep night. */
export function NlSky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#0D0F33', '#070818']} style={StyleSheet.absoluteFill} />
      <Radial id="nl" cx={50} cy={22} rx={70} ry={40} from="#262A7A" to="#262A7A" at={0.7} />
    </View>
  );
}

/** .wr-full (P:L610): the waiting room's lit night, for parked and decide. */
export function WrFull() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0D0F2E' }]} pointerEvents="none">
      <Radial id="wr" cx={50} cy={20} rx={120} ry={70} from="#2A2D7A" to="#0D0F2E" toOpacity={1} at={0.65} />
    </View>
  );
}

// ---- Progress (reading a screenshot) --------------------------------------

/** A 6 pt gradient bar that fills towards 90% while a screenshot is read on the phone. */
export function ReadingBar() {
  const rm = useReduceMotion();
  const v = useRef(new Animated.Value(0.04)).current;
  useEffect(() => {
    if (rm) {
      v.setValue(0.6);
      return;
    }
    Animated.timing(v, { toValue: 0.9, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [rm, v]);
  return (
    <View style={{ marginTop: 8, height: 6, borderRadius: 3, backgroundColor: '#23275E', overflow: 'hidden' }}>
      <Animated.View style={{ flex: 1, transformOrigin: 'left', transform: [{ scaleX: v }] }}>
        <LinearGradient colors={['#4361FF', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 3 }} />
      </Animated.View>
    </View>
  );
}

// ---- Overlays -------------------------------------------------------------

const DIM = 'rgba(4,5,22,0.62)';

/**
 * A bottom sheet like the prototype's (.sheet-wrap.items-end + .sheet-in, P:L234/454): the night dims
 * in .22 s and the sheet rises in .42 s; closing reverses faster. Tall content scrolls (max 92%).
 */
export function BottomSheet({
  visible,
  onClose,
  label,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const rm = useReduceMotion();
  const pad = Math.max(useSafeAreaInsets().bottom + 4, 24);
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [sheetH, setSheetH] = useState(0);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(v, { toValue: 1, duration: rm ? 0 : 420, easing: easeOut, useNativeDriver: true }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: rm ? 0 : 240, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, rm, v]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: DIM, opacity: v }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
      </Animated.View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={label}
          onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}
          style={{
            maxHeight: height * 0.92,
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [sheetH || height, 0] }) }],
          }}
        >
          <View
            style={{
              backgroundColor: '#14173F',
              borderTopWidth: 1.5,
              borderLeftWidth: 1.5,
              borderRightWidth: 1.5,
              borderColor: '#2E3374',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              paddingTop: 12,
              flexShrink: 1,
            }}
          >
            <View style={{ alignSelf: 'center', width: 40, height: 6, borderRadius: 3, backgroundColor: '#343A80', marginBottom: 16 }} />
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: pad }}
              style={{ flexGrow: 0 }}
            >
              {children}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** A centred dialog (.dlg-in, P:L456): pops in with the spring over the dimmed night. */
export function Dialog({ visible, label, children }: { visible: boolean; label: string; children: ReactNode }) {
  const rm = useReduceMotion();
  const dim = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) {
      dim.setValue(0);
      pop.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(dim, { toValue: 1, duration: rm ? 0 : 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pop, { toValue: 1, duration: rm ? 0 : 420, easing: springOut, useNativeDriver: true }),
    ]).start();
  }, [visible, rm, dim, pop]);
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: DIM, opacity: dim }]} />
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }} pointerEvents="box-none">
        <Animated.View
          accessibilityViewIsModal
          accessibilityLabel={label}
          style={{
            backgroundColor: '#161942',
            borderColor: '#2E3374',
            borderWidth: 1.5,
            borderRadius: 28,
            padding: 24,
            shadowColor: '#000000',
            shadowOpacity: 0.55,
            shadowRadius: 25,
            shadowOffset: { width: 0, height: 20 },
            opacity: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
