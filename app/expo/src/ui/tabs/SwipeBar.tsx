import * as Haptics from 'expo-haptics';
import { useTabTrigger } from 'expo-router/ui';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, type StyleProp, View, type ViewStyle } from 'react-native';

import { useReduceMotion } from '../components';
import { setTabMotion } from './roomView';
import { TAB_ORDER } from './TabChrome';

/**
 * The tab bar you can swipe along, like the iPhone's own (iOS 26 tab bar / home-bar swipe):
 * press and drag on the bar and a glass lens lifts (scale 1.06), follows your finger 1:1
 * (rubber-banding past the ends), ticks a haptic at each tab, and on release springs to the
 * nearest tab — a flick carries it on. Swiping on the page itself does nothing.
 */
/** Rendered as a plain view; the routes themselves are declared by a hidden <TabList> in the layout. */
export function SwipeTabList({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const { switchTab, getTrigger } = useTabTrigger({ name: 'index' });
  const rm = useReduceMotion();
  const latest = useRef({ switchTab, getTrigger, rm });
  useEffect(() => {
    latest.current = { switchTab, getTrigger, rm };
  });

  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const [x] = useState(() => new Animated.Value(0));
  const [lift] = useState(() => new Animated.Value(0));

  const responder = useMemo(() => {
    const PAD = 6;
    const slot = () => (widthRef.current - PAD * 2) / TAB_ORDER.length;
    const centre = (i: number) => PAD + slot() * (i + 0.5);
    const current = () => Math.max(0, TAB_ORDER.findIndex((n) => latest.current.getTrigger(n)?.isFocused));
    const nearest = (px: number) => Math.max(0, Math.min(TAB_ORDER.length - 1, Math.floor((px - PAD) / slot())));
    let startX = 0;
    let lastSlot = 0;

    return PanResponder.create({
      // Only horizontal drags on the bar; taps still reach the tab buttons.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: () => {
        const i = current();
        startX = centre(i);
        lastSlot = i;
        x.setValue(startX);
        Animated.spring(lift, { toValue: 1, damping: 15, stiffness: 300, mass: 1, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        const min = centre(0);
        const max = centre(TAB_ORDER.length - 1);
        let px = startX + g.dx;
        // Rubber band past the first and last tab.
        if (px < min) px = min - (min - px) * 0.35;
        if (px > max) px = max + (px - max) * 0.35;
        x.setValue(px);
        const s = nearest(px);
        if (s !== lastSlot) {
          lastSlot = s;
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: (_, g) => {
        const from = current();
        // Project the flick a little (velocity is px/ms).
        const projected = startX + g.dx + g.vx * 120;
        let to = nearest(projected);
        // A short, slow drag springs back.
        if (Math.abs(g.dx) < slot() / 2 && Math.abs(g.vx) < 0.4) to = from;
        const rmNow = latest.current.rm;
        Animated.parallel([
          rmNow
            ? Animated.timing(x, { toValue: centre(to), duration: 150, useNativeDriver: true })
            : Animated.spring(x, { toValue: centre(to), damping: 18, stiffness: 240, mass: 0.9, useNativeDriver: true }),
          Animated.timing(lift, { toValue: 0, duration: rmNow ? 150 : 260, delay: rmNow ? 0 : 120, useNativeDriver: true }),
        ]).start();
        if (to !== from) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setTabMotion(to > from ? 1 : -1);
          latest.current.switchTab(TAB_ORDER[to], {});
        }
      },
      onPanResponderTerminate: () => {
        Animated.timing(lift, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      },
    });
  }, [x, lift]);

  const lensW = width ? ((width - 12) / TAB_ORDER.length) * 1.3 : 0;
  return (
    <View
      style={[style, { flexDirection: 'row' }]}
      {...responder.panHandlers}
      onLayout={(e) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
    >
      {children}
      {/* The glass lens that follows the finger. */}
      {width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            left: 0,
            width: lensW,
            borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
            shadowColor: '#7088FF',
            shadowOpacity: 0.55,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 0 },
            opacity: lift,
            transform: [
              { translateX: Animated.subtract(x, lensW / 2) },
              { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.06] }) },
            ],
          }}
        />
      )}
    </View>
  );
}
