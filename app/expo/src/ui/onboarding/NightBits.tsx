import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Text, useAnimatedValue, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Mask, Path, Rect } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { color, font } from '../theme';

// Night Trolley touches for onboarding: one moving thing per screen, all in our colours.
// Sizes follow the screen (smaller on an SE, a touch bigger on a Pro Max). Still under Reduce Motion.

const MOON = '#FFE7A3';
const BOUNCE = Easing.out(Easing.back(1.6));
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** How big the pictures should be on this phone, against the 852 pt tall iPhone they were drawn on. */
export function useFit() {
  const { height } = useWindowDimensions();
  return Math.max(0.74, Math.min(1.08, height / 852));
}

/** A value that goes 0 → 1 once, after `delay` ms (1 straight away under Reduce Motion). */
function useOnce(delay: number, duration: number, easing = BOUNCE) {
  const rm = useReduceMotion();
  const v = useAnimatedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [rm, v, delay, duration, easing]);
  return v;
}

/** A value that loops 0 → 1 forever (stays 0 under Reduce Motion). */
function useLoop(duration: number, delay = 0) {
  const rm = useReduceMotion();
  const v = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [rm, v, duration, delay]);
  return v;
}

/** A few twinkling stars spread over a box. */
function Stars({ spots }: { spots: [number, number, number][] }) {
  const tw = useLoop(3600);
  return (
    <>
      {spots.map(([x, y, s], i) => {
        const a = (i * 0.27) % 0.8;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: i % 3 === 0 ? MOON : '#FFFFFF',
              opacity: tw.interpolate({ inputRange: [0, a, a + 0.1, a + 0.2, 1], outputRange: [0.25, 0.25, 1, 0.25, 0.25] }),
            }}
          />
        );
      })}
    </>
  );
}

// ---- 2 Welcome ----------------------------------------------------------------------------

// The trolley drawing is 64 × 52; these are its basket items in that space.
const ITEMS: { x: number; y: number; w: number; h: number; r: number; c: string }[] = [
  { x: 23, y: 3, w: 11, h: 12, r: -8, c: '#A78BFA' },
  { x: 35, y: 1, w: 10, h: 14, r: 0, c: '#5EE9B5' },
  { x: 46, y: 6, w: 10, h: 9, r: 7, c: MOON },
];

/**
 * Welcome: the trolley rolls in under the stars and parks with a wobble, three things drop into
 * its basket one after another, then it gives a little hop now and then.
 */
export function TrolleyScene({ delay = 0 }: { delay?: number }) {
  const k = useFit();
  const W = Math.round(160 * k);
  const s = W / 64;
  const roll = useOnce(delay, 750, Easing.out(Easing.back(1.3)));
  const hop = useLoop(3800, delay + 2200);
  return (
    <View style={{ width: W + 90, height: Math.round(W * 0.82) + 34, alignItems: 'center', justifyContent: 'flex-end' }} accessibilityElementsHidden>
      <Stars
        spots={[
          [4, 8, 3],
          [88, 4, 2.5],
          [70, 26, 2],
          [14, 40, 2],
          [96, 46, 3],
        ]}
      />
      <Animated.View
        style={{
          width: W,
          height: W * 0.8125,
          opacity: roll.interpolate({ inputRange: [0, 0.2], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateX: roll.interpolate({ inputRange: [0, 1], outputRange: [-280, 0] }) },
            { rotate: roll.interpolate({ inputRange: [0, 0.7, 0.85, 1], outputRange: ['0deg', '4deg', '-2deg', '0deg'] }) },
            { translateY: hop.interpolate({ inputRange: [0, 0.06, 0.12, 0.16, 1], outputRange: [0, -7, 0, -2, 0] }) },
          ],
        }}
      >
        {/* things dropping into the basket, behind its front */}
        {ITEMS.map((it, i) => (
          <DropIn key={i} delay={delay + 820 + i * 170} style={{ position: 'absolute', left: it.x * s, top: it.y * s, width: it.w * s, height: it.h * s }}>
            <View style={{ flex: 1, borderRadius: 2.5 * s, backgroundColor: it.c, transform: [{ rotate: `${it.r}deg` }] }} />
          </DropIn>
        ))}
        <Svg width={W} height={W * 0.8125} viewBox="0 0 64 52" style={{ position: 'absolute' }}>
          <Path d="M18 14h40l-6 18H24z" fill="#3A2F8F" opacity={0.94} />
          <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={MOON} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx={25} cy={44} r={4.6} fill={MOON} />
          <Circle cx={49} cy={44} r={4.6} fill={MOON} />
        </Svg>
      </Animated.View>
      <View style={{ width: W + 40, height: 1.5, marginTop: 2, borderRadius: 1, backgroundColor: 'rgba(167,139,250,0.45)' }} />
    </View>
  );
}

function DropIn({ delay, style, children }: { delay: number; style: object; children: ReactNode }) {
  const v = useOnce(delay, 520, Easing.bounce);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.12], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** A small purple shelf tag that pops in at `delay`, then keeps a gentle sway. */
export function PopTag({ delay, icon, label, index = 0 }: { delay: number; icon?: ReactNode; label: string; index?: number }) {
  const v = useOnce(delay, 420, Easing.out(Easing.back(2.2)));
  const sway = useLoop(3200 + index * 400, delay + 600);
  return (
    <Animated.View
      style={{
        transformOrigin: 'left',
        opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
          { rotate: sway.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '2deg', '0deg', '-2deg', '0deg'] }) },
        ],
      }}
    >
      <View style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, backgroundColor: '#4524A8', paddingBottom: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingLeft: 9,
            paddingRight: 11,
            paddingVertical: 7,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            backgroundColor: '#6A3DE8',
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color.night, borderWidth: 1.5, borderColor: MOON }} />
          {icon}
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: '#FFFFFF' }}>{label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ---- 3 Story -------------------------------------------------------------------------------

/** Story: 23:34 on the clock while a cat bed and three mugs drop into a basket and stick out of the top. */
export function BasketFill({ delay = 0 }: { delay?: number }) {
  const k = useFit();
  const W = Math.round(180 * k);
  const H = Math.round(110 * k);
  const items = ['🛏️', '☕', '☕', '☕'];
  const rim = H * 0.42; // where the basket starts
  return (
    <View style={{ width: W, alignItems: 'flex-start' }} accessibilityElementsHidden>
      <Text style={{ fontFamily: font.display, fontSize: 30 * k, lineHeight: 34 * k, color: MOON, fontVariant: ['tabular-nums'] }}>23:34</Text>
      <View style={{ marginTop: 8, width: W, height: H }}>
        {/* the back of the basket */}
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          <Path d={`M${W * 0.04} ${rim} H${W * 0.96}`} stroke="rgba(255,231,163,0.5)" strokeWidth={3} strokeLinecap="round" />
        </Svg>
        {items.map((e, i) => (
          <Drop key={i} delay={delay + 250 + i * 220} left={W * 0.1 + i * W * 0.2} top={rim - 22 * k}>
            <Text style={{ fontSize: 32 * k }}>{e}</Text>
          </Drop>
        ))}
        {/* the front of the basket, over the bottom of the things in it */}
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          <Path d={`M${W * 0.03} ${rim + 8} H${W * 0.97} L${W * 0.88} ${H - 3} H${W * 0.12} Z`} fill="rgba(58,47,143,0.94)" stroke={MOON} strokeWidth={3} strokeLinejoin="round" />
          <Path d={`M${W * 0.36} ${rim + 8} V${H - 3} M${W * 0.64} ${rim + 8} V${H - 3}`} stroke="rgba(255,231,163,0.3)" strokeWidth={2} />
        </Svg>
      </View>
    </View>
  );
}

function Drop({ delay, left, top, children }: { delay: number; left: number; top: number; children: ReactNode }) {
  const v = useOnce(delay, 480, Easing.bounce);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        opacity: v.interpolate({ inputRange: [0, 0.12], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ---- 4 Screen Time ------------------------------------------------------------------------

const SHOP_TILES: [string, string][] = [
  ['S', '#FF8F78'],
  ['T', '#FF9F43'],
  ['A', '#5B76FF'],
  ['D', '#5EE9B5'],
  ['J', '#FFC94D'],
  ['U', '#A78BFA'],
];

/** Screen Time: the night shop. Its purple shutter rolls down over the app window, then back up. */
export function ShopShutters({ delay = 0 }: { delay?: number }) {
  const rm = useReduceMotion();
  const k = useFit();
  const v = useAnimatedValue(rm ? 0.5 : 0);
  useEffect(() => {
    if (rm) return;
    const t = (toValue: number, duration: number) => Animated.timing(v, { toValue, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([Animated.delay(900), t(1, 800), Animated.delay(1300), t(0, 650)]));
    const start = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [rm, v, delay]);
  const W = Math.round(210 * k);
  const H = Math.round(126 * k);
  const tile = Math.round(46 * k);
  return (
    <View style={{ width: W, height: H, borderRadius: 14, backgroundColor: '#121548', borderWidth: 2, borderColor: '#3A3F86', overflow: 'hidden' }} accessibilityElementsHidden>
      <View style={{ position: 'absolute', left: 14, right: 14, top: 22 * k + 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 * k, justifyContent: 'center' }}>
        {SHOP_TILES.map(([l, bg]) => (
          <View key={l} style={{ width: tile, height: tile * 0.76, borderRadius: 9, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15 * k, color: '#14163A' }}>{l}</Text>
          </View>
        ))}
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          top: 22 * k,
          height: H - 22 * k,
          overflow: 'hidden',
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-(H - 22 * k), 0] }) }],
        }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <View key={i} style={{ height: 7, marginBottom: 1, backgroundColor: i % 2 ? '#5B3FD0' : '#7B4DFF' }} />
        ))}
      </Animated.View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 22 * k, flexDirection: 'row' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#F2F0FF' : '#A78BFA' }} />
        ))}
      </View>
    </View>
  );
}

// ---- 5 UK apps ----------------------------------------------------------------------------

/** UK apps: one moon-yellow shelf, its letter tiles hopping on one after another, with the names under it. */
export function ShelfRow({ tiles, caption, delay = 0 }: { tiles: [string, string][]; caption: string; delay?: number }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 6, height: 40, alignItems: 'flex-end' }}>
        {tiles.map(([l, bg], i) => (
          <Hop key={l + i} delay={delay + i * 110}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: '#14163A' }}>{l}</Text>
            </View>
          </Hop>
        ))}
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: MOON, opacity: 0.85 }} />
      <Text style={{ fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20, color: color.text }}>{caption}</Text>
    </View>
  );
}

function Hop({ delay, children }: { delay: number; children: ReactNode }) {
  const v = useOnce(delay, 450, Easing.out(Easing.back(2)));
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 0.2], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// ---- 6 Notifications -------------------------------------------------------------------------

const NOTES: [string, string][] = [
  ['Tap to start your pause', 'now'],
  ['Your pass ends in 1 minute', '1m ago'],
  ['Pink trainers is ready to decide', '08:00'],
];

/** A crescent moon drawn with a mask, so it works on any background. */
function Crescent({ size, fill = MOON, id }: { size: number; fill?: string; id: string }) {
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <Mask id={id}>
          <Rect width={size} height={size} fill="#FFFFFF" />
          <Circle cx={size * 0.78} cy={size * 0.3} r={r * 0.92} fill="#000000" />
        </Mask>
      </Defs>
      <Circle cx={r} cy={r} r={r - 1} fill={fill} mask={`url(#${id})`} />
    </Svg>
  );
}

/**
 * Notifications: three real-looking Till Morning banners drop in one after another (your pause,
 * a pass ending, something ready), the top one gets a tap, over a moon whose glow breathes.
 */
export function NotifStack({ delay = 0 }: { delay?: number }) {
  const k = useFit();
  const glow = useLoop(3200, delay);
  const tap = useLoop(3000, delay + 2000);
  const M = Math.round(84 * k);
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }} accessibilityElementsHidden>
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {NOTES.map(([t, when], i) => (
          <Banner key={t} delay={delay + i * 260} text={t} when={when} dim={i > 0} tap={i === 0 ? tap : undefined} />
        ))}
      </View>
      <View style={{ marginTop: 26 * k, width: M, height: M, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: M * 1.5,
            height: M * 1.5,
            borderRadius: M * 0.75,
            backgroundColor: MOON,
            opacity: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.2, 0.08] }),
            transform: [{ scale: glow.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 1.08, 0.9] }) }],
          }}
        />
        <DropIn delay={delay + 120} style={{}}>
          <Crescent size={M} id="notifMoon" />
        </DropIn>
      </View>
    </View>
  );
}

function Banner({ delay, text, when, dim, tap }: { delay: number; text: string; when: string; dim: boolean; tap?: Animated.Value }) {
  const v = useOnce(delay, 560, Easing.out(Easing.back(1.4)));
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, dim ? 0.75 : 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) },
          { scale: tap ? tap.interpolate({ inputRange: [0, 0.08, 0.16, 1], outputRange: [1, 0.97, 1, 1] }) : dim ? 0.97 : 1 },
        ],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 11,
        borderRadius: 18,
        backgroundColor: 'rgba(242,240,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(242,240,255,0.2)',
        overflow: 'hidden',
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#7C4DFF', alignItems: 'center', justifyContent: 'center' }}>
        <Crescent size={20} id={`bannerMoon${text.length}`} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: '#FFFFFF' }}>Till Morning</Text>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 11.5, color: color.text3 }}>{when}</Text>
        </View>
        <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.text2 }} numberOfLines={1}>
          {text}
        </Text>
      </View>
      {/* a finger tap on the top banner */}
      {tap && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: '55%',
            top: '50%',
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderRadius: 20,
            backgroundColor: '#FFFFFF',
            opacity: tap.interpolate({ inputRange: [0, 0.04, 0.3, 1], outputRange: [0, 0.35, 0, 0] }),
            transform: [{ scale: tap.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1.8, 1.8] }) }],
          }}
        />
      )}
    </Animated.View>
  );
}

// ---- 7 The pause demo --------------------------------------------------------------------------

/**
 * The pause timer as a moon: a moon-yellow ring fills over the seconds while the moon in the
 * middle waxes from a crescent to full, with the seconds left on it and "Breathe in / out" under it.
 */
export function MoonTimer({ seconds, delay = 0, onDone }: { seconds: number; delay?: number; onDone?: () => void }) {
  const rm = useReduceMotion();
  const k = useFit();
  const S = Math.round(220 * k);
  const R = S / 2 - 8;
  const C = 2 * Math.PI * R;
  const m = Math.round(S * 0.5); // the moon
  const progress = useAnimatedValue(0);
  const breathe = useLoop(seconds * 1000, delay);
  const [left, setLeft] = useState(() => (rm ? 0 : seconds));

  useEffect(() => {
    if (rm) {
      progress.setValue(1);
      onDone?.();
      return;
    }
    const a = Animated.timing(progress, { toValue: 1, duration: seconds * 1000, delay, easing: Easing.linear, useNativeDriver: false });
    a.start();
    let n = seconds;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        n -= 1;
        setLeft(n);
        if (n <= 0) {
          clearInterval(tick);
          onDone?.();
        }
      }, 1000);
    }, delay);
    return () => {
      a.stop();
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rm, seconds, delay]);

  const done = left <= 0;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }} accessible accessibilityLabel={done ? 'Pause done' : `${left} seconds left`}>
        {/* a soft halo that swells as you breathe in and settles as you breathe out */}
        <Animated.View
          style={{
            position: 'absolute',
            width: S * 0.86,
            height: S * 0.86,
            borderRadius: S,
            backgroundColor: MOON,
            opacity: breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.06, 0.18, 0.06] }),
            transform: [{ scale: breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.88, 1.06, 0.88] }) }],
          }}
        />
        <Svg width={S} height={S} style={{ position: 'absolute' }}>
          <Circle cx={S / 2} cy={S / 2} r={R} stroke="rgba(255,255,255,0.18)" strokeWidth={8} fill="none" />
          <AnimatedCircle
            cx={S / 2}
            cy={S / 2}
            r={R}
            stroke={MOON}
            strokeWidth={8}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [C, 0] })}
            transform={`rotate(-90 ${S / 2} ${S / 2})`}
          />
        </Svg>
        {/* the moon waxing to full */}
        <Svg width={m} height={m}>
          <Defs>
            <ClipPath id="timerMoon">
              <Circle cx={m / 2} cy={m / 2} r={m / 2 - 1} />
            </ClipPath>
          </Defs>
          <Circle cx={m / 2} cy={m / 2} r={m / 2 - 1} fill={MOON} />
          <G clipPath="url(#timerMoon)">
            <AnimatedCircle
              cx={progress.interpolate({ inputRange: [0, 1], outputRange: [m * 0.68, m * 1.7] })}
              cy={m * 0.42}
              r={m / 2 - 1}
              fill="#2A1E6E"
            />
          </G>
        </Svg>
        <Text style={{ position: 'absolute', fontFamily: font.display, fontSize: 40 * k, color: done ? '#2A1E6E' : '#FFFFFF', fontVariant: ['tabular-nums'] }}>
          {done ? '✓' : left}
        </Text>
      </View>
      <Animated.Text
        style={{
          marginTop: 8,
          fontFamily: font.bodyHeavy,
          fontSize: 15,
          color: MOON,
          opacity: breathe.interpolate({ inputRange: [0, 0.1, 0.4, 0.5, 0.6, 0.9, 1], outputRange: [0.4, 1, 1, 0.4, 1, 1, 0.4] }),
        }}
      >
        {done ? 'Done. Now you choose.' : left > seconds / 2 ? 'Breathe in' : 'Breathe out'}
      </Animated.Text>
    </View>
  );
}
