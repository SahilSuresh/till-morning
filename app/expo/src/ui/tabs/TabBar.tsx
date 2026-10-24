import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabTrigger } from 'expo-router/ui';
import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Pressable, type StyleProp, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAppState } from '../../lib/store';
import { useReduceMotion } from '../components';
import type { Icon } from '../ph';
import { font } from '../theme';
import { useBoundaryNow } from './clock';
import { setTabMotion } from './roomView';

export type TabDef = { name: 'index' | 'waiting' | 'me' | 'settings'; label: string; Icon: Icon };

const PAD = 6;
const GAP = 4;
const GROW = 0.8; // the active tab is 1.8× an inactive one
const SPRING = { damping: 18, stiffness: 220, mass: 0.9 };

/** Width of tab i at position p (p is a fractional tab index while dragging). */
function widthAt(i: number, p: number, unit: number) {
  'worklet';
  const w = Math.max(0, 1 - Math.abs(p - i));
  return unit * (1 + GROW * w);
}

function leftAt(i: number, p: number, unit: number) {
  'worklet';
  let x = PAD;
  for (let k = 0; k < i; k++) x += widthAt(k, p, unit) + GAP;
  return x;
}

/**
 * The tab bar. Drag along it and the tab you're on shrinks while the next one expands under your
 * finger — one tab at a time — then it springs into place. Taps glide the pill across. All motion
 * runs on the UI thread (Reanimated).
 */
export function TabBar({ tabs, style }: { tabs: TabDef[]; style?: StyleProp<ViewStyle> }) {
  const { switchTab, getTrigger } = useTabTrigger({ name: 'index' });
  const rm = useReduceMotion();
  const n = tabs.length;
  const focused = Math.max(
    0,
    tabs.findIndex((t) => getTrigger(t.name)?.isFocused),
  );

  const pos = useSharedValue(focused);
  const unit = useSharedValue(0);
  const dragging = useRef(false);
  const latest = useRef({ switchTab, focused, rm });
  useEffect(() => {
    latest.current = { switchTab, focused, rm };
  });

  // Follow route changes (taps, deep links) unless a drag is in progress.
  useEffect(() => {
    if (dragging.current) return;
    pos.value = rm ? withTiming(focused, { duration: 150 }) : withSpring(focused, SPRING);
  }, [focused, rm, pos]);

  const responder = useMemo(() => {
    let start = 0;
    let lastHalf = 0;
    const step = () => unit.value * (1 + GROW / 2) + GAP;
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => {
        dragging.current = true;
        start = latest.current.focused;
        lastHalf = start;
      },
      onPanResponderMove: (_, g) => {
        // One tab either way, with a little give at the ends.
        const lo = Math.max(0, start - 1);
        const hi = Math.min(n - 1, start + 1);
        let p = start + g.dx / step();
        if (p < lo) p = lo - (lo - p) * 0.25;
        if (p > hi) p = hi + (p - hi) * 0.25;
        pos.value = p;
        const half = Math.round(Math.max(lo, Math.min(hi, p)));
        if (half !== lastHalf) {
          lastHalf = half;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: (_, g) => {
        dragging.current = false;
        const moved = g.dx / step();
        let to = start;
        if (moved > 0.35 || g.vx > 0.35) to = Math.min(n - 1, start + 1);
        else if (moved < -0.35 || g.vx < -0.35) to = Math.max(0, start - 1);
        pos.value = latest.current.rm ? withTiming(to, { duration: 150 }) : withSpring(to, { ...SPRING, velocity: g.vx * 2 });
        if (to !== start) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setTabMotion(to > start ? 1 : -1);
          latest.current.switchTab(tabs[to].name, {});
        }
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        pos.value = withSpring(latest.current.focused, SPRING);
      },
    });
  }, [n, pos, unit, tabs]);

  // The blue pill: slides between tabs and stretches a little mid-way, like a drop of liquid.
  const pill = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(n - 1, pos.value));
    const i = Math.min(n - 2, Math.floor(p));
    const f = p - i;
    const l = leftAt(i, p, unit.value) + (leftAt(i + 1, p, unit.value) - leftAt(i, p, unit.value)) * f;
    const w = widthAt(i, p, unit.value) + (widthAt(i + 1, p, unit.value) - widthAt(i, p, unit.value)) * f;
    const stretch = Math.sin(f * Math.PI) * unit.value * 0.28;
    return { left: l - stretch / 2, width: w + stretch };
  });

  return (
    <View
      {...responder.panHandlers}
      onLayout={(e) => {
        const inner = e.nativeEvent.layout.width - PAD * 2 - GAP * (n - 1);
        unit.value = inner / (n + GROW);
      }}
      style={[style, { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: PAD, gap: GAP }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: PAD,
            bottom: PAD,
            borderRadius: 999,
            shadowColor: '#4361FF',
            shadowOpacity: 0.45,
            shadowRadius: 7,
            shadowOffset: { width: 0, height: 4 },
          },
          pill,
        ]}
      >
        <LinearGradient colors={['#5873FF', '#4361FF']} style={{ flex: 1, borderRadius: 999 }} />
        <View style={{ position: 'absolute', inset: 0, borderRadius: 999, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
      </Animated.View>
      {tabs.map((t, i) =>
        t.name === 'waiting' ? (
          <WaitingTab key={t.name} def={t} index={i} pos={pos} unit={unit} onPress={() => switchTo(i)} />
        ) : (
          <Tab key={t.name} def={t} index={i} pos={pos} unit={unit} onPress={() => switchTo(i)} />
        ),
      )}
    </View>
  );

  function switchTo(i: number) {
    if (i === focused) return;
    Haptics.selectionAsync().catch(() => {});
    setTabMotion(0);
    switchTab(tabs[i].name, {});
  }
}

function WaitingTab(props: TabProps) {
  const parked = useAppState((s) => s.parked);
  const now = useBoundaryNow(parked.filter((w) => !w.decided).map((w) => w.readyAt));
  const ready = parked.filter((w) => !w.decided && w.readyAt <= now).length;
  return <Tab {...props} badge={ready} />;
}

type TabProps = {
  def: TabDef;
  index: number;
  pos: SharedValue<number>;
  unit: SharedValue<number>;
  onPress: () => void;
  badge?: number;
};

function Tab({ def, index, pos, unit, onPress, badge }: TabProps) {
  const press = useSharedValue(1);
  const { Icon, label } = def;

  const box = useAnimatedStyle(() => ({
    width: widthAt(index, pos.value, unit.value),
    transform: [{ scale: press.value }],
  }));
  const on = useAnimatedStyle(() => {
    const w = interpolate(Math.abs(pos.value - index), [0, 1], [1, 0], Extrapolation.CLAMP);
    return { opacity: w, maxWidth: 90 * w, marginLeft: 7 * w };
  });
  const off = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(pos.value - index), [0, 0.6], [0, 1], Extrapolation.CLAMP),
  }));
  const iconOn = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs(pos.value - index), [0, 0.6], [1, 0], Extrapolation.CLAMP) }));
  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(Math.abs(pos.value - index), [0, 1], [0, -6], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View style={box}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (press.value = withTiming(0.94, { duration: 80 }))}
        onPressOut={() => (press.value = withSpring(1, { damping: 14, stiffness: 320 }))}
        accessibilityRole="tab"
        accessibilityLabel={badge ? `${label}, ${badge} ready` : label}
        style={{ flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
      >
        <Animated.View style={[{ flexDirection: 'row', alignItems: 'center' }, lift]}>
          <View style={{ width: 21, height: 21 }}>
            <Icon size={21} weight="bold" color="#8E93CC" style={{ position: 'absolute' }} />
            <Animated.View style={[{ position: 'absolute' }, iconOn]}>
              <Icon size={21} weight="bold" color="#FFFFFF" />
            </Animated.View>
          </View>
          <Animated.View style={[{ overflow: 'hidden' }, on]}>
            <Text numberOfLines={1} style={{ fontFamily: font.bodyHeavy, fontSize: 14.5, color: '#FFFFFF' }}>
              {label}
            </Text>
          </Animated.View>
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[{ position: 'absolute', bottom: 7, fontFamily: font.bodyHeavy, fontSize: 10.5, color: '#8E93CC' }, off]}
        >
          {label}
        </Animated.Text>
        {!!badge && (
          <View
            accessible={false}
            style={{
              position: 'absolute',
              top: -8,
              right: 4,
              minWidth: 22,
              height: 22,
              borderRadius: 11,
              paddingHorizontal: 5,
              backgroundColor: '#FF8F78',
              borderWidth: 2,
              borderColor: '#1B1F55',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11, color: '#14163A' }}>{badge}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
