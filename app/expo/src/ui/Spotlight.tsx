import { type ComponentRef, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Mask, Rect } from 'react-native-svg';

import { useReduceMotion } from './components';
import { StFace } from './StFace';
import { color, font } from './theme';
import { Pressable } from './Pressable';

export type SpotRect = { x: number; y: number; width: number; height: number; radius: number };

/** Measure a view in window coordinates, for <Spotlight target>. Returns null if it isn't on screen. */
export type SpotRef = RefObject<ComponentRef<typeof View> | null>;

export function measureSpot(ref: SpotRef, radius = 22): Promise<SpotRect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x: number, y: number, width: number, height: number) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height, radius } : null);
    });
  });
}

/** Re-measures a target whenever `deps` change; null while it isn't laid out. */
export function useSpot(ref: SpotRef, active: boolean, radius = 22, delay = 0) {
  const [rect, setRect] = useState<SpotRect | null>(null);
  const measure = useCallback(() => {
    measureSpot(ref, radius).then(setRect);
  }, [ref, radius]);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(measure, delay);
    return () => clearTimeout(t);
  }, [active, measure, delay]);
  return rect;
}

const PAD = 6;

/**
 * The prototype's coach tour (P:L1840–1867): everything dims except the real element, which gets a
 * yellow outline (.coach-hole); a paper tip with an arrow sits 14 px below it (or above, when the
 * element is in the lower half). Without a target, the tip sits at the bottom.
 */
export function Spotlight({
  visible,
  target,
  title,
  body,
  step,
  steps,
  next,
  onNext,
  onSkip,
  skipLabel = 'Skip',
}: {
  visible: boolean;
  target: SpotRect | null;
  title: string;
  body: string;
  step?: number;
  steps?: number;
  next: string;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}) {
  const { width: W, height: H } = useWindowDimensions();
  const rm = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(rm ? 1 : 0);
    fade.setValue(rm ? 1 : 0);
    if (rm) return;
    Animated.parallel([
      Animated.timing(pop, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 300, delay: 80, useNativeDriver: true }),
    ]).start();
  }, [visible, step, target?.x, target?.y, rm, pop, fade]);

  const hole = target
    ? { x: target.x - PAD, y: target.y - PAD, w: target.width + PAD * 2, h: target.height + PAD * 2, r: target.radius + PAD }
    : null;
  const below = hole ? hole.y + hole.h / 2 < H / 2 : false;
  const arrowX = hole ? Math.min(W - 36, Math.max(36, hole.x + hole.w / 2)) - 16 : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip ?? onNext} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }} pointerEvents="none">
          <Mask id="coachMask">
            <Rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />
            {hole && <Rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={hole.r} ry={hole.r} fill="#000000" />}
          </Mask>
          <Rect x={0} y={0} width={W} height={H} fill="rgba(4,5,22,0.76)" mask="url(#coachMask)" />
        </Svg>
        {/* Taps outside the tip do nothing, as in the prototype. */}
        <Pressable style={{ position: 'absolute', inset: 0 }} accessible={false} />
        {hole && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: hole.x,
              top: hole.y,
              width: hole.w,
              height: hole.h,
              borderRadius: hole.r,
              borderWidth: 2,
              borderColor: 'rgba(255,201,77,0.95)',
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
            }}
          />
        )}
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              position: 'absolute',
              left: 16,
              right: 16,
              backgroundColor: '#F4F3FF',
              borderRadius: 22,
              paddingTop: 16,
              paddingHorizontal: 16,
              paddingBottom: 14,
              shadowColor: '#000',
              shadowOpacity: 0.45,
              shadowRadius: 17,
              shadowOffset: { width: 0, height: 14 },
              opacity: fade,
            },
            hole ? (below ? { top: hole.y + hole.h + 14 } : { bottom: H - hole.y + 14 }) : { bottom: 120 },
          ]}
        >
          {hole && (
            <View
              style={{
                position: 'absolute',
                left: arrowX,
                width: 16,
                height: 16,
                backgroundColor: '#F4F3FF',
                borderRadius: 3,
                transform: [{ rotate: '45deg' }],
                ...(below ? { top: -7 } : { bottom: -7 }),
              }}
            />
          )}
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <StFace size={44} ring={false} breathe={false} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, lineHeight: 21, color: color.inkOnBright }}>{title}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 20, color: '#4A4E7A', marginTop: 3 }}>{body}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 10 }}>
            {steps && steps > 1 ? (
              <>
                <View style={{ flexDirection: 'row', gap: 5 }}>
                  {Array.from({ length: steps }).map((_, i) => (
                    <View key={i} style={{ width: i === step ? 16 : 6, height: 6, borderRadius: 99, backgroundColor: i === step ? color.blue : '#C9C8E6' }} />
                  ))}
                </View>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: '#6B6F9E' }}>
                  {(step ?? 0) + 1} of {steps}
                </Text>
              </>
            ) : null}
            <View style={{ flex: 1 }} />
            {onSkip && (
              <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14.5, color: '#6B6F9E' }}>{skipLabel}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onNext}
              accessibilityRole="button"
              style={{
                backgroundColor: color.blue,
                borderRadius: 99,
                paddingHorizontal: 18,
                paddingVertical: 9,
                shadowColor: '#2A3BC0',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 1,
                shadowRadius: 0,
              }}
            >
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: '#FFFFFF' }}>{next}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
