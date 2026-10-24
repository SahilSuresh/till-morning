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

type ButtonVariant = 'primary' | 'night' | 'secondary' | 'white' | 'ghost' | 'danger';

const buttonLook: Record<ButtonVariant, { bg?: string; text: string; border?: string; edge: string }> = {
  primary: { text: color.white, edge: color.blueEdge },
  // Night Trolley purple, like the Shopping Pass button
  night: { text: color.white, edge: '#4B2BB0' },
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
            {variant === 'night' && (
              <LinearGradient colors={['#7C4DFF', '#A066FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]} />
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

/**
 * A text button. With `underline` (or a style asking for textDecorationLine: 'underline') it draws the
 * prototype's .link underline (P:L86): 2 px thick, 4 px under the baseline, one bar per line of text.
 */
export function TextLink({
  label,
  onPress,
  style,
  underline,
  disabled,
  containerStyle,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  style?: StyleProp<TextStyle>;
  underline?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const flat: TextStyle = StyleSheet.flatten([linkText, style]) ?? linkText;
  const bar = underline || flat.textDecorationLine === 'underline' || flat.textDecorationLine === 'underline line-through';
  const [lines, setLines] = useState<{ x: number; y: number; width: number; height: number; ascender: number; descender: number }[]>([]);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={disabled ? { disabled } : undefined}
      hitSlop={10}
      style={[{ alignSelf: 'center', paddingVertical: 10, opacity: disabled ? 0.4 : 1 }, containerStyle]}
    >
      <View>
        <Text
          onTextLayout={bar ? (e) => setLines(e.nativeEvent.lines) : undefined}
          style={[flat, bar && { textDecorationLine: 'none' }]}
        >
          {label}
        </Text>
        {bar &&
          lines.map((l, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: l.x,
                // baseline (glyphs are centred in the line box) + 4 px offset
                top: l.y + (l.height + l.ascender - l.descender) / 2 + 4,
                width: l.width,
                height: 2,
                borderRadius: 1,
                backgroundColor: (flat.color as string) ?? color.blueLight,
              }}
            />
          ))}
      </View>
    </Pressable>
  );
}
const linkText: TextStyle = { fontFamily: font.bodyBold, fontSize: 15, color: color.blueLight, textAlign: 'center' };

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
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: size, lineHeight: size * 1.35, color: look.text }}>{label}</Text>
    </View>
  );
}

// ---- Option card (radio) -------------------------------------------------

type OptTone = 'blue' | 'violet';
const optSel: Record<OptTone, { sel: string; hi: string; edge: string }> = {
  blue: { sel: '#1C2468', hi: '#5B76FF', edge: '#3A52E0' },
  violet: { sel: '#261D66', hi: '#A78BFA', edge: '#6D4FD6' },
};

/**
 * The prototype's .opt (P:L164). `radio` places the round check: 'right' (default), 'left' (.opt.reason,
 * budget split) or 'none' (check-in answers, "Did this pause help?"). `left` adds a leading tile.
 * Selected = 1.5 px border + 1 px inner ring in the highlight colour, without moving the content.
 */
export function OptionCard({
  label,
  sub,
  selected,
  onPress,
  tone = 'blue',
  right,
  round = true,
  radio = 'right',
  left,
  paddingVertical = 15,
  accessibilityRole = 'radio',
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  tone?: OptTone;
  right?: ReactNode;
  round?: boolean;
  radio?: 'left' | 'right' | 'none';
  left?: ReactNode;
  paddingVertical?: number;
  accessibilityRole?: 'radio' | 'button';
}) {
  const s = optSel[tone];
  const check = (
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
  );
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityRole === 'radio' ? { checked: selected } : undefined}
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
              borderWidth: 1.5,
              borderColor: selected ? s.hi : color.cardEdge,
              backgroundColor: selected ? s.sel : color.card,
              paddingHorizontal: 16,
              paddingVertical,
            }}
          >
            {selected && (
              <View
                pointerEvents="none"
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.opt - 1.5, borderWidth: 1, borderColor: s.hi }}
              />
            )}
            {radio === 'left' && check}
            {left}
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{label}</Text>
              {sub ? <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text> : null}
            </View>
            {right}
            {radio === 'right' && check}
          </View>
        </View>
      )}
    </Pressable>
  );
}

// ---- Tag (choice chip) ---------------------------------------------------

/**
 * The prototype's .tag (P:L157): a pill with a 2 px bottom edge on the night (none on the pause's
 * colour screens). `fill` makes it one equal column of a segmented row, with the label centred.
 */
export function Tag({
  label,
  selected,
  onPress,
  onDark,
  large,
  fill,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onDark?: boolean;
  large?: boolean;
  fill?: boolean;
  accessibilityLabel?: string;
}) {
  const bg = selected ? (onDark ? color.white : color.blue) : onDark ? 'rgba(255,255,255,0.1)' : '#1A1E50';
  const border = selected ? (onDark ? color.white : color.blue) : onDark ? 'rgba(255,255,255,0.36)' : '#2E3374';
  const text = selected ? (onDark ? '#2B2FB8' : color.white) : onDark ? color.white : '#E4E3FF';
  const edge = onDark ? 'transparent' : selected ? color.blueEdge : '#2E3374';
  const size = large ? 16 : 13.5;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={fill ? { flex: 1 } : undefined}
    >
      <View style={{ borderRadius: radius.pill, backgroundColor: edge, paddingBottom: onDark ? 0 : 2 }}>
        <View
          style={{
            borderRadius: radius.pill,
            borderWidth: 1.5,
            borderColor: border,
            backgroundColor: bg,
            paddingHorizontal: fill ? 8 : large ? 18 : 12,
            paddingVertical: large ? 9 : 5,
            alignItems: 'center',
          }}
        >
          <Text numberOfLines={fill ? 1 : undefined} style={{ fontFamily: font.bodyBold, fontSize: size, lineHeight: size * 1.3, color: text }}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ---- Back / close circle -------------------------------------------------

/** The prototype's .backbtn (P:L143): 40 px (or `size`), a faint white disc that dims while pressed. */
export function CircleButton({
  children,
  onPress,
  onDark,
  label,
  size = 40,
}: {
  children: ReactNode;
  onPress: () => void;
  onDark?: boolean;
  label: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: onDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
        opacity: pressed ? 0.7 : 1,
      })}
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
