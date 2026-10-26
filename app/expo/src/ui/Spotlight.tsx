import { LinearGradient } from 'expo-linear-gradient';
import { type ComponentRef, type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Text, useAnimatedValue, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { play } from '../lib/sound';
import { useReduceMotion } from './components';
import { Pressable } from './Pressable';
import { StFace } from './StFace';
import { font } from './theme';

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

// Night Trolley's tips: the screen dims to night, a moon-yellow outline glows round the real thing,
// and a purple shelf tag drops in on a string from it and swings to rest. Between steps of the tour
// the spotlight glides to the next thing, then the next tag drops in.

const MOON = '#FFE7A3';
const DIM = 'rgba(9,7,34,0.8)';
const PAD = 6; // outline gap round the target
const STRING = 20; // string from the outline to the tag
const SIDE = 16; // the tag's side margins
const B = 2000; // the dim is one huge border round the hole (bigger than any screen), so the hole keeps its round corners
const GLIDE = 420;

const holeOf = (t: SpotRect) => ({ x: t.x - PAD, y: t.y - PAD, w: t.width + PAD * 2, h: t.height + PAD * 2, r: t.radius + PAD });

export function Spotlight({
  active,
  target,
  tipKey,
  label,
  title,
  body,
  step,
  steps,
  next,
  onNext,
  onSkip,
  skipLabel = 'Skip',
}: {
  /** The tip (or tour) is on. It shows once its target has been measured, and stays up between steps. */
  active: boolean;
  /** Where the real thing is, or null while the next step's target is being measured. */
  target: SpotRect | null;
  /** Changes with each step, so each tag drops in fresh. */
  tipKey: string;
  /** Small caps on the tag, e.g. "Quick tour". */
  label: string;
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

  // The first tag of this session drops in straight away; later ones wait for the glide.
  const [firstKey, setFirstKey] = useState<string | null>(null);
  if (active && target && firstKey === null) setFirstKey(tipKey);
  if (!active && firstKey !== null) setFirstKey(null);
  const open = active && firstKey !== null;

  // The hole (dim, outline and glow all follow these).
  const hx = useAnimatedValue(0);
  const hy = useAnimatedValue(0);
  const hw = useAnimatedValue(0);
  const hh = useAnimatedValue(0);
  const hr = useAnimatedValue(0);
  const placed = useRef(false);
  useEffect(() => {
    if (!open) placed.current = false;
  }, [open]);

  const tx = target?.x;
  const ty = target?.y;
  const tw = target?.width;
  const th = target?.height;
  const tr = target?.radius;
  useLayoutEffect(() => {
    if (tx === undefined || ty === undefined || tw === undefined || th === undefined || tr === undefined) return;
    const h = holeOf({ x: tx, y: ty, width: tw, height: th, radius: tr });
    const pairs: [Animated.Value, number][] = [
      [hx, h.x],
      [hy, h.y],
      [hw, h.w],
      [hh, h.h],
      [hr, h.r],
    ];
    if (!placed.current || rm) {
      placed.current = true;
      pairs.forEach(([v, to]) => v.setValue(to));
      return;
    }
    const glide = Animated.parallel(
      pairs.map(([v, to]) => Animated.timing(v, { toValue: to, duration: GLIDE, easing: Easing.inOut(Easing.cubic), useNativeDriver: false })),
    );
    glide.start();
    return () => glide.stop();
  }, [tx, ty, tw, th, tr, rm, hx, hy, hw, hh, hr]);

  // A soft glow keeps pulsing out of the outline.
  const pulse = useAnimatedValue(0);
  useEffect(() => {
    if (!open || rm) return;
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }), Animated.delay(500)]),
    );
    pulse.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [open, rm, pulse]);

  const finishing = !steps || step === steps - 1;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onSkip ?? onNext} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* Night everywhere except the hole */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Animated.add(hx, -B),
            top: Animated.add(hy, -B),
            width: Animated.add(hw, B * 2),
            height: Animated.add(hh, B * 2),
            borderWidth: B,
            borderRadius: Animated.add(hr, B),
            borderColor: DIM,
            // Clipping makes iOS draw this border on the GPU instead of as one giant image.
            overflow: 'hidden',
          }}
        />
        {/* Taps outside the tag do nothing. */}
        <Pressable style={{ position: 'absolute', inset: 0 }} accessible={false} />
        {/* The moon-yellow outline, with its glow */}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', left: hx, top: hy, width: hw, height: hh, borderRadius: hr }}>
          {!rm && target && (
            <Animated.View
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: holeOf(target).r,
                borderWidth: 5,
                borderColor: MOON,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                transform: [
                  { scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
                  { scaleY: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
                ],
              }}
            />
          )}
          <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: hr, borderWidth: 2.5, borderColor: MOON }} />
        </Animated.View>

        {target && (
          <Tag
            key={tipKey}
            target={target}
            W={W}
            H={H}
            delay={tipKey === firstKey ? 120 : GLIDE - 40}
            rm={rm}
            label={label}
            title={title}
            body={body}
            step={step}
            steps={steps}
            next={next}
            finishing={finishing}
            onNext={onNext}
            onSkip={onSkip}
            skipLabel={skipLabel}
          />
        )}
      </View>
    </Modal>
  );
}

/** The purple shelf tag on its string. It drops in, swings to rest, and pops a little sound. */
function Tag({
  target,
  W,
  H,
  delay,
  rm,
  label,
  title,
  body,
  step,
  steps,
  next,
  finishing,
  onNext,
  onSkip,
  skipLabel,
}: {
  target: SpotRect;
  W: number;
  H: number;
  delay: number;
  rm: boolean;
  label: string;
  title: string;
  body: string;
  step?: number;
  steps?: number;
  next: string;
  finishing: boolean;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel: string;
}) {
  const hole = holeOf(target);
  // Below the thing when it's in the top half, above it otherwise.
  const below = hole.y + hole.h / 2 < H / 2;
  const anchor = Math.min(W - SIDE - 40, Math.max(SIDE + 40, hole.x + hole.w / 2)) - SIDE;

  const drop = useAnimatedValue(rm ? 1 : 0);
  const swing = useAnimatedValue(0);
  const moon = useAnimatedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    const k = below ? 1 : 0.5;
    const sw = (to: number, duration: number) => Animated.timing(swing, { toValue: to * k, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    swing.setValue(5 * k);
    const a = Animated.parallel([
      Animated.timing(drop, { toValue: 1, duration: 440, delay, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.sequence([Animated.delay(delay + 160), sw(-3, 380), sw(1.8, 360), sw(-0.9, 320), sw(0.35, 280), sw(0, 240)]),
      Animated.sequence([Animated.delay(delay + 260), Animated.spring(moon, { toValue: 1, friction: 4, tension: 150, useNativeDriver: true })]),
    ]);
    a.start();
    const t = setTimeout(() => play('pop'), delay + 60);
    return () => {
      a.stop();
      clearTimeout(t);
    };
  }, [rm, below, delay, drop, swing, moon]);

  const string = <View style={{ marginLeft: anchor - 1, width: 2, height: STRING, backgroundColor: '#C4B5FD' }} />;
  const eyelet = (
    <View
      style={{
        position: 'absolute',
        left: anchor - 7,
        ...(below ? { top: -7 } : { bottom: -3 }),
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#140F3C',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.7)',
      }}
    />
  );

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: SIDE,
        right: SIDE,
        ...(below ? { top: hole.y + hole.h } : { bottom: H - hole.y }),
        transformOrigin: [anchor, below ? 0 : '100%', 0],
        opacity: drop.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [below ? -22 : 22, 0] }) },
          { rotate: swing.interpolate({ inputRange: [-1, 1], outputRange: ['-1deg', '1deg'] }) },
        ],
      }}
    >
      {/* the knot on the outline */}
      {below && <View style={{ position: 'absolute', left: anchor - 4, top: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: MOON }} />}
      {below && string}
      <View
        accessibilityViewIsModal
        style={{
          borderRadius: 22,
          backgroundColor: '#4524A8',
          paddingBottom: 4,
          shadowColor: '#05031A',
          shadowOpacity: 0.55,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 14 },
        }}
      >
        <LinearGradient
          colors={['#6A3DE8', '#9B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 22, paddingTop: below ? 16 : 14, paddingHorizontal: 16, paddingBottom: below ? 14 : 18 }}
        >
          {/* a few stars on the tag */}
          <Svg width={40} height={26} style={{ position: 'absolute', right: 14, top: 10 }} pointerEvents="none">
            <Path d="M30 2 L31.6 6.4 L36 8 L31.6 9.6 L30 14 L28.4 9.6 L24 8 L28.4 6.4 Z" fill={MOON} opacity={0.8} />
            <Circle cx={12} cy={16} r={1.8} fill={MOON} opacity={0.55} />
            <Circle cx={22} cy={23} r={1.2} fill="#FFFFFF" opacity={0.5} />
          </Svg>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: '#E3D9FF' }}>{label}</Text>
            {steps && steps > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} accessibilityLabel={`Tip ${(step ?? 0) + 1} of ${steps}`}>
                {Array.from({ length: steps }).map((_, i) => {
                  const lit = i <= (step ?? 0);
                  const now = i === step;
                  return (
                    <Animated.View
                      key={i}
                      style={now ? { transform: [{ scale: moon.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] } : undefined}
                    >
                      <Svg width={11} height={11}>
                        <Circle
                          cx={5.5}
                          cy={5.5}
                          r={lit ? 5.5 : 4.4}
                          fill={lit ? MOON : 'none'}
                          stroke={lit ? 'none' : 'rgba(255,231,163,0.55)'}
                          strokeWidth={1.4}
                        />
                      </Svg>
                    </Animated.View>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 10 }}>
            <View
              style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,231,163,0.22)', alignItems: 'center', justifyContent: 'center' }}
            >
              <StFace size={42} ring={false} breathe={!rm} />
            </View>
            <View style={{ flex: 1, paddingRight: 18 }}>
              <Text style={{ fontFamily: font.display, fontSize: 19, lineHeight: 23, color: '#FFFFFF' }}>{title}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 20, color: 'rgba(255,255,255,0.86)', marginTop: 4 }}>{body}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 16 }}>
            <View style={{ flex: 1 }} />
            {onSkip && (
              <Pressable onPress={onSkip} sound="back" accessibilityRole="button" hitSlop={10}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 14.5, color: '#E3D9FF' }}>{skipLabel}</Text>
              </Pressable>
            )}
            <Pressable onPress={onNext} sound={finishing ? 'chime' : 'next'} accessibilityRole="button" hitSlop={6}>
              {({ pressed }) => (
                <View style={{ borderRadius: 99, backgroundColor: '#C99A3E', paddingBottom: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 }}>
                  <View style={{ borderRadius: 99, backgroundColor: MOON, paddingHorizontal: 20, paddingVertical: 9 }}>
                    <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: '#2A1E6E' }}>{next}</Text>
                  </View>
                </View>
              )}
            </Pressable>
          </View>
        </LinearGradient>
        {eyelet}
      </View>
      {!below && string}
      {!below && <View style={{ position: 'absolute', left: anchor - 4, bottom: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: MOON }} />}
    </Animated.View>
  );
}
