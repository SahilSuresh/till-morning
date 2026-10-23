import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { Icon } from 'phosphor-react-native';
import { type ComponentRef, forwardRef, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import R from 'react-native-reanimated';

import { useAppState } from '../../lib/store';
import { easeOut, useReduceMotion } from '../components';
import { useBoundaryNow } from './clock';
import { EASE, popIn, SPRING } from './motion';
import { setTabMotion, tabMotion } from './roomView';
import { font } from '../theme';

// The prototype's tab bar and tab switching (P:L216–221, 370–376, 514–515, 2194–2197, 2838–2882).

export const TAB_ORDER = ['index', 'waiting', 'me', 'settings'] as const;

type TabButtonProps = TabTriggerSlotProps & { label: string; Icon: Icon; badge?: number };

/**
 * One tab. Inactive: icon over a small label. Active: grows (flex-grow 1.7, .3 s), turns blue
 * (#5873FF → #4361FF, .25 s) and lays out in a row; its icon pops in (.4 s spring).
 */
export const TabButton = forwardRef<ComponentRef<typeof Pressable>, TabButtonProps>(function TabButton(
  { isFocused, label, Icon, badge, onPress, style: _style, ...rest },
  ref,
) {
  const rm = useReduceMotion();
  const on = !!isFocused;
  // The icon pops when the tab becomes active, not when the app first opens.
  const [wasOn, setWasOn] = useState(on);
  const [popped, setPopped] = useState(false);
  if (on !== wasOn) {
    setWasOn(on);
    setPopped(on);
  }
  const pop = popped && on && !rm;

  return (
    <R.View
      style={{
        flexBasis: 0,
        flexShrink: 1,
        minWidth: 0,
        flexGrow: on ? 1.7 : 1,
        transitionProperty: 'flexGrow',
        transitionDuration: rm ? 0 : 300,
        transitionTimingFunction: EASE,
      }}
    >
      <Pressable
        ref={ref}
        {...rest}
        onPress={(e) => {
          Haptics.selectionAsync().catch(() => {});
          setTabMotion(0);
          onPress?.(e);
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={badge ? `${label}, ${badge} ready` : label}
        style={{ flex: 1, borderRadius: 999 }}
      >
        {/* Active background: gradient, glow (0 4px 14px rgba(67,97,255,.45)) and a 1 px inset highlight */}
        <R.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 999,
            backgroundColor: '#4361FF',
            shadowColor: '#4361FF',
            shadowOpacity: 0.45,
            shadowRadius: 7,
            shadowOffset: { width: 0, height: 4 },
            opacity: on ? 1 : 0,
            transitionProperty: 'opacity',
            transitionDuration: rm ? 0 : 250,
          }}
        >
          <LinearGradient colors={['#5873FF', '#4361FF']} style={{ position: 'absolute', inset: 0, borderRadius: 999 }} />
          <View style={{ position: 'absolute', inset: 0, borderRadius: 999, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
        </R.View>
        <View style={{ flex: 1, flexDirection: on ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: on ? 7 : 1 }}>
          <R.View style={pop ? { animationName: popIn, animationDuration: 400, animationTimingFunction: SPRING } : null}>
            <Icon size={21} weight="bold" color={on ? '#FFFFFF' : '#8E93CC'} />
          </R.View>
          <Text numberOfLines={1} style={{ fontFamily: font.bodyHeavy, fontSize: on ? 14.5 : 10.5, color: on ? '#FFFFFF' : '#8E93CC' }}>
            {label}
          </Text>
        </View>
        {/* .tabbadge: top −6, right 6 of the button, ringed in the bar's colour */}
        {!!badge && (
          <View
            accessible={false}
            importantForAccessibility="no-hide-descendants"
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
    </R.View>
  );
});

/** The Waiting tab with its "ready" badge, which updates the moment a want becomes ready. */
export const WaitingTabButton = forwardRef<ComponentRef<typeof Pressable>, Omit<TabButtonProps, 'badge'>>(function WaitingTabButton(props, ref) {
  const parked = useAppState((s) => s.parked);
  const now = useBoundaryNow(parked.filter((w) => !w.decided).map((w) => w.readyAt));
  const ready = parked.filter((w) => !w.decided && w.readyAt <= now).length;
  return <TabButton ref={ref} {...props} badge={ready} />;
});

/**
 * A tab's content. When it comes into focus it fades in (.26 s), or slides 36 px in the
 * direction of a swipe (.3 s), as #scr.enter[data-t="tab" | "tabL" | "tabR"] does.
 */
export function TabScene({ focused, children }: { focused: boolean; children: ReactNode }) {
  const rm = useReduceMotion();
  const [fade] = useState(() => new Animated.Value(1));
  const [x] = useState(() => new Animated.Value(0));
  const was = useRef(focused);

  useEffect(() => {
    if (focused && !was.current) {
      const dir = tabMotion.dir;
      setTabMotion(0);
      if (!rm) {
        fade.setValue(0);
        x.setValue(dir * 36);
        Animated.parallel([
          Animated.timing(fade, { toValue: 1, duration: dir ? 300 : 260, easing: easeOut, useNativeDriver: true }),
          Animated.timing(x, { toValue: 0, duration: 300, easing: easeOut, useNativeDriver: true }),
        ]).start();
      }
    } else if (focused) {
      // First visit: the screen's own rise-in plays instead.
      setTabMotion(0);
    }
    was.current = focused;
  }, [focused, rm, fade, x]);

  return <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

/**
 * Swipe left or right on a tab's content to move between tabs. The content follows the finger a
 * little (48 px at most, 14 px at the ends); past 60 px it moves on.
 */
export function SwipeTabs({ children }: { children: ReactNode }) {
  const { switchTab, getTrigger } = useTabTrigger({ name: 'index' });
  const rm = useReduceMotion();
  const latest = useRef({ switchTab, getTrigger, rm });
  useEffect(() => {
    latest.current = { switchTab, getTrigger, rm };
  });
  const [pull] = useState(() => new Animated.Value(0));

  const responder = useMemo(() => {
    const target = (dir: 1 | -1) => {
      const i = TAB_ORDER.findIndex((n) => latest.current.getTrigger(n)?.isFocused) + dir;
      return i >= 0 && i < TAB_ORDER.length ? TAB_ORDER[i] : null;
    };
    const settle = () => Animated.timing(pull, { toValue: 0, duration: 250, easing: easeOut, useNativeDriver: true }).start();
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_, g) => {
        if (latest.current.rm) return;
        const edge = !target(g.dx < 0 ? 1 : -1);
        pull.setValue(Math.sign(g.dx) * Math.min(edge ? 14 : 48, Math.abs(g.dx) * (edge ? 0.12 : 0.3)));
      },
      onPanResponderRelease: (_, g) => {
        const dir = g.dx < 0 ? 1 : -1;
        const to = Math.abs(g.dx) > 60 ? target(dir) : null;
        if (!to) return settle();
        Haptics.selectionAsync().catch(() => {});
        setTabMotion(dir);
        pull.setValue(0);
        latest.current.switchTab(to, {});
      },
      onPanResponderTerminate: settle,
    });
  }, [pull]);

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{
        flex: 1,
        transform: [{ translateX: pull }],
        opacity: pull.interpolate({ inputRange: [-160, 0, 160], outputRange: [0, 1, 0] }),
      }}
    >
      {children}
    </Animated.View>
  );
}
