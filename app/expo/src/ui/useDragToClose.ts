import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { Animated, Easing, type NativeScrollEvent, type NativeSyntheticEvent, PanResponder, useAnimatedValue } from 'react-native';

/**
 * Drag a sheet down to close it, like iOS sheets: it follows your finger (with a little resistance
 * when pulled up), closes past ~110 pt or on a quick flick, otherwise springs back.
 *
 * Spread `handlers` on the whole sheet and add `drag` to its translateY. A downward drag anywhere
 * closes it, except while its list is scrolled down: give that ScrollView `onScroll` (with
 * scrollEventThrottle) so a drag scrolls the list back to the top first.
 */
export function useDragToClose(onClose: () => void) {
  const drag = useAnimatedValue(0);
  const atTop = useRef(true);

  const handlers = useMemo(() => {
    const down = (g: { dx: number; dy: number }) => g.dy > 8 && g.dy > Math.abs(g.dx) * 1.3;
    // The callbacks below only run during a gesture, never while rendering.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Take a downward drag even when it starts on a row or a button, if the list is at the top.
      onMoveShouldSetPanResponderCapture: (_, g) => atTop.current && down(g),
      onMoveShouldSetPanResponder: (_, g) => down(g),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => drag.setValue(g.dy > 0 ? g.dy : g.dy / 4),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 110 || (g.dy > 30 && g.vy > 0.9)) {
          Haptics.selectionAsync().catch(() => {});
          Animated.timing(drag, { toValue: 900, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
          onClose();
        } else {
          Animated.spring(drag, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, friction: 7, tension: 90, useNativeDriver: true }).start();
      },
    }).panHandlers;
  }, [drag, onClose]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    atTop.current = e.nativeEvent.contentOffset.y <= 1;
  }, []);

  /** Put the sheet back in place (call when it opens again). */
  const reset = useCallback(() => {
    atTop.current = true;
    drag.setValue(0);
  }, [drag]);
  return { drag, handlers, reset, onScroll };
}
