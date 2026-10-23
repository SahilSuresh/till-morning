import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, font, gradient, radius, type } from './theme';

export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);
export const springOut = Easing.bezier(0.34, 1.56, 0.64, 1);

// ---- Reduce Motion -------------------------------------------------------

let reduceMotion = false;
const rmListeners = new Set<() => void>();
AccessibilityInfo.isReduceMotionEnabled().then((v) => {
  reduceMotion = v;
  rmListeners.forEach((l) => l());
});
AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
  reduceMotion = v;
  rmListeners.forEach((l) => l());
});
export function useReduceMotion() {
  return useSyncExternalStore(
    (l) => {
      rmListeners.add(l);
      return () => rmListeners.delete(l);
    },
    () => reduceMotion,
  );
}

// ---- Button --------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'white' | 'ghost' | 'danger';

const buttonLook: Record<ButtonVariant, { bg?: string; text: string; border?: string; edge: string }> = {
  primary: { text: color.white, edge: color.blueEdge },
  secondary: { bg: '#1E2256', text: color.text, border: '#343A86', edge: '#343A86' },
  white: { bg: color.white, text: '#2B2FB8', edge: 'rgba(6,6,40,0.38)' },
  ghost: { bg: 'rgba(255,255,255,0.1)', text: color.white, border: 'rgba(255,255,255,0.32)', edge: 'rgba(6,6,40,0.3)' },
  danger: { bg: '#2A1638', text: '#FF9F94', border: '#6B2A45', edge: '#6B2A45' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const look = buttonLook[variant];
  const rm = useReduceMotion();
  // The prototype's .tapped bump: scale .94 → 1.04 → 1 in .34 s, on the UI thread.
  const bump = useRef(new Animated.Value(1)).current;
  const playBump = () => {
    if (rm) return;
    bump.setValue(0.94);
    Animated.sequence([
      Animated.timing(bump, { toValue: 1.04, duration: 150, easing: easeOut, useNativeDriver: true }),
      Animated.timing(bump, { toValue: 1, duration: 190, easing: easeOut, useNativeDriver: true }),
    ]).start();
  };
  return (
    <Animated.View style={[{ alignSelf: 'stretch', transform: [{ scale: bump }] }, style]}>
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        playBump();
        onPress?.();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      style={{ opacity: disabled ? 0.38 : 1, alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <View
          style={{
            borderRadius: radius.pill,
            backgroundColor: look.edge,
            paddingBottom: pressed ? 1 : 4,
            marginTop: pressed ? 3 : 0,
          }}
        >
          <View
            style={[
              styles.btn,
              { backgroundColor: look.bg, borderColor: look.border, borderWidth: look.border ? 1.5 : 0 },
            ]}
          >
            {variant === 'primary' && (
              <LinearGradient colors={gradient.primary} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />
            )}
            {icon}
            <Text style={[styles.btnText, { color: look.text }]}>{label}</Text>
          </View>
        </View>
      )}
    </Pressable>
    </Animated.View>
  );
}

export function TextLink({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 10 }}>
      <Text style={[{ fontFamily: font.bodyBold, fontSize: 15, color: color.blueLight, textAlign: 'center' }, style]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---- Card ----------------------------------------------------------------

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={{ borderRadius: radius.card, backgroundColor: color.cardEdge, paddingBottom: 3 }}>
      <View style={[styles.card, style]}>{children}</View>
    </View>
  );
}

// ---- Chips ---------------------------------------------------------------

type ChipTone = 'mint' | 'sun' | 'peach' | 'lilac' | 'paper' | 'dark' | 'glass' | 'white';
const chipLook: Record<ChipTone, { bg: string; text: string; border?: string }> = {
  mint: { bg: 'rgba(94,233,181,0.15)', text: color.mintText },
  sun: { bg: 'rgba(255,201,77,0.16)', text: color.sunText },
  peach: { bg: 'rgba(255,143,120,0.16)', text: color.coralText },
  lilac: { bg: 'rgba(167,139,250,0.2)', text: '#CDBDFF' },
  paper: { bg: '#1E2256', text: color.text2, border: '#2E3374' },
  dark: { bg: 'rgba(255,255,255,0.16)', text: color.white },
  glass: { bg: 'rgba(255,255,255,0.12)', text: color.white, border: 'rgba(255,255,255,0.26)' },
  white: { bg: color.white, text: color.inkOnBright },
};

export function Chip({ label, tone = 'paper', icon, size = 12.5 }: { label: string; tone?: ChipTone; icon?: ReactNode; size?: number }) {
  const look = chipLook[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: look.bg,
        borderWidth: look.border ? 1.5 : 0,
        borderColor: look.border,
      }}
    >
      {icon}
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: size, color: look.text }}>{label}</Text>
    </View>
  );
}

// ---- Option card (radio) -------------------------------------------------

type OptTone = 'blue' | 'violet';
const optSel: Record<OptTone, { sel: string; hi: string; edge: string }> = {
  blue: { sel: '#1C2468', hi: '#5B76FF', edge: '#3A52E0' },
  violet: { sel: '#261D66', hi: '#A78BFA', edge: '#6D4FD6' },
};

export function OptionCard({
  label,
  sub,
  selected,
  onPress,
  tone = 'blue',
  right,
  round = true,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  tone?: OptTone;
  right?: ReactNode;
  round?: boolean;
}) {
  const s = optSel[tone];
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      {({ pressed }) => (
        <View
          style={{
            borderRadius: radius.opt,
            backgroundColor: selected ? s.edge : color.cardEdge,
            paddingBottom: pressed ? 1 : 3,
            marginTop: pressed ? 2 : 0,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderRadius: radius.opt,
              borderWidth: selected ? 2.5 : 1.5,
              borderColor: selected ? s.hi : color.cardEdge,
              backgroundColor: selected ? s.sel : color.card,
              paddingHorizontal: 16,
              paddingVertical: 15,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{label}</Text>
              {sub ? <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text> : null}
            </View>
            {right}
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: round ? 13 : 9,
                borderWidth: 2,
                borderColor: selected ? s.hi : '#3A3F86',
                backgroundColor: selected ? s.hi : color.field,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: color.white }} />}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ---- Tag (choice chip) ---------------------------------------------------

export function Tag({
  label,
  selected,
  onPress,
  onDark,
  large,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onDark?: boolean;
  large?: boolean;
}) {
  const bg = selected ? (onDark ? color.white : color.blue) : onDark ? 'rgba(255,255,255,0.1)' : '#1A1E50';
  const border = selected ? (onDark ? color.white : color.blue) : onDark ? 'rgba(255,255,255,0.36)' : '#2E3374';
  const text = selected ? (onDark ? '#2B2FB8' : color.white) : onDark ? color.white : '#E4E3FF';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <View
        style={{
          borderRadius: radius.pill,
          borderWidth: 1.5,
          borderColor: border,
          backgroundColor: bg,
          paddingHorizontal: large ? 18 : 12,
          paddingVertical: large ? 9 : 5,
        }}
      >
        <Text style={{ fontFamily: font.bodyBold, fontSize: large ? 16 : 13.5, color: text }}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ---- Back / close circle -------------------------------------------------

export function CircleButton({
  children,
  onPress,
  onDark,
  label,
}: {
  children: ReactNode;
  onPress: () => void;
  onDark?: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {children}
    </Pressable>
  );
}

// ---- Rise-in entrance ----------------------------------------------------

export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const rm = useReduceMotion();
  const v = useRef(new Animated.Value(rm ? 1 : 0)).current;
  useEffect(() => {
    if (rm) return;
    Animated.timing(v, { toValue: 1, duration: 500, delay: 140 + delay, easing: easeOut, useNativeDriver: true }).start();
  }, [rm, v, delay]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

// ---- Toast ---------------------------------------------------------------

type ToastMsg = { id: number; text: string };
let toastMsg: ToastMsg | null = null;
const toastListeners = new Set<() => void>();
let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(text: string) {
  toastMsg = { id: Date.now(), text };
  toastListeners.forEach((l) => l());
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMsg = null;
    toastListeners.forEach((l) => l());
  }, 2600);
  AccessibilityInfo.announceForAccessibility(text);
}

export function ToastHost() {
  const msg = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toastMsg,
  );
  const insets = useSafeAreaInsets();
  const [shown, setShown] = useState<ToastMsg | null>(null);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (msg) {
      setShown(msg);
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: 340, easing: springOut, useNativeDriver: true }).start();
    } else {
      Animated.timing(v, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShown(null));
    }
  }, [msg, v]);
  if (!shown) return null;

  // "+10 XP · text" renders the XP part as a mint chip.
  const m = shown.text.match(/^([+−-]\d+ XP) · (.*)$/);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        alignItems: 'center',
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: color.toast,
          borderColor: color.toastBorder,
          borderWidth: 1.5,
          borderRadius: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
          maxWidth: 360,
        }}
      >
        {m && (
          <View
            style={{
              borderRadius: radius.pill,
              paddingHorizontal: 8,
              paddingVertical: 2,
              backgroundColor: m[1].startsWith('+') ? 'rgba(94,233,181,0.2)' : 'rgba(255,143,120,0.22)',
            }}
          >
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: m[1].startsWith('+') ? '#7EF0C6' : color.coralText }}>
              {m[1]}
            </Text>
          </View>
        )}
        <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.text, flexShrink: 1 }}>{m ? m[2] : shown.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  btnText: { fontFamily: font.display, fontSize: 19, lineHeight: 23 },
  card: {
    backgroundColor: color.card,
    borderColor: color.cardEdge,
    borderWidth: 1.5,
    borderRadius: radius.card,
    padding: 18,
  },
});
