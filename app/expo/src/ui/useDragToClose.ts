import * as Haptics from 'expo-haptics';
import { useCallback, useMemo } from 'react';
import { Animated, Easing, PanResponder, useAnimatedValue } from 'react-native';

/**
 * Drag a sheet down to close it, like iOS sheets: it follows your finger (with a little resistance
 * when pulled up), closes past ~110 pt or on a quick flick, otherwise springs back.
 * Spread `handlers` on the part you can grab (the handle and header), add `drag` to translateY.
 */
export function useDragToClose(onClose: () => void) {
  const drag = useAnimatedValue(0);

  const handlers = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
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
      }).panHandlers,
    [drag, onClose],
  );

  /** Put the sheet back in place (call when it opens again). */
  const reset = useCallback(() => drag.setValue(0), [drag]);
  return { drag, handlers, reset };
}
