import { type ReactNode, useEffect } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { color, font } from '../theme';

// Night Trolley touches for onboarding: one short moving thing per screen, all in our colours.
// Everything settles within about a second and stays still under Reduce Motion.

const MOON = '#FFE7A3';
const BOUNCE = Easing.out(Easing.back(1.6));

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

/** The trolley with a few things on board. */
export function TrolleyArt({ width = 150, items = 3 }: { width?: number; items?: number }) {
  return (
    <Svg width={width} height={(width * 52) / 64} viewBox="0 0 64 52">
      {items > 0 && <Rect x={23} y={4} width={11} height={12} rx={2} fill="#A78BFA" transform="rotate(-8 28 10)" />}
      {items > 1 && <Rect x={35} y={2} width={10} height={14} rx={2} fill={color.mint} />}
      {items > 2 && <Rect x={46} y={7} width={10} height={9} rx={2} fill={MOON} transform="rotate(7 51 11)" />}
      <Path d="M18 14h40l-6 18H24z" fill="#3A2F8F" opacity={0.94} />
      <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={MOON} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={25} cy={44} r={4.6} fill={MOON} />
      <Circle cx={49} cy={44} r={4.6} fill={MOON} />
    </Svg>
  );
}

/** Welcome: the trolley rolls in from the left, overshoots a touch, wobbles and parks. */
export function TrolleyRollIn({ delay = 0 }: { delay?: number }) {
  const v = useOnce(delay, 750, Easing.out(Easing.back(1.3)));
  return (
    <View style={{ width: 220, height: 132, alignItems: 'center', justifyContent: 'flex-end' }} accessibilityElementsHidden>
      <Animated.View
        style={{
          opacity: v.interpolate({ inputRange: [0, 0.2], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-260, 0] }) },
            { rotate: v.interpolate({ inputRange: [0, 0.7, 0.85, 1], outputRange: ['0deg', '4deg', '-2deg', '0deg'] }) },
          ],
        }}
      >
        <TrolleyArt width={150} />
      </Animated.View>
      <View style={{ alignSelf: 'stretch', height: 1.5, marginTop: 2, borderRadius: 1, backgroundColor: 'rgba(167,139,250,0.45)' }} />
    </View>
  );
}

/** A small purple shelf tag that pops in at `delay`, with an icon and a label. */
export function PopTag({ delay, icon, label }: { delay: number; icon?: ReactNode; label: string }) {
  const v = useOnce(delay, 420, Easing.out(Easing.back(2.2)));
  return (
    <Animated.View
      style={{
        opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
        ],
      }}
    >
      <View style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10, backgroundColor: '#4524A8', paddingBottom: 2 }}>
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

/** Story: 23:34 on the clock while a cat bed and three mugs drop into a basket, one by one. */
export function BasketFill({ delay = 0 }: { delay?: number }) {
  const items = ['🛏️', '☕', '☕', '☕'];
  return (
    <View style={{ width: 170, alignItems: 'flex-start' }} accessibilityElementsHidden>
      <Text style={{ fontFamily: font.display, fontSize: 30, lineHeight: 34, color: MOON, fontVariant: ['tabular-nums'] }}>23:34</Text>
      <View style={{ marginTop: 6, width: 150, height: 92 }}>
        {items.map((e, i) => (
          <Drop key={i} delay={delay + 250 + i * 220} left={14 + i * 30}>
            <Text style={{ fontSize: 26 }}>{e}</Text>
          </Drop>
        ))}
        {/* the basket */}
        <Svg width={150} height={60} style={{ position: 'absolute', bottom: 0 }}>
          <Path d="M6 6h138l-12 48H18z" fill="rgba(58,47,143,0.92)" stroke={MOON} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M40 6v48M75 6v48M110 6v48" stroke="rgba(255,231,163,0.35)" strokeWidth={2} />
        </Svg>
      </View>
    </View>
  );
}

function Drop({ delay, left, children }: { delay: number; left: number; children: ReactNode }) {
  const v = useOnce(delay, 420, Easing.bounce);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top: 26,
        opacity: v.interpolate({ inputRange: [0, 0.15], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

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
  const W = 200;
  const H = 120;
  return (
    <View
      style={{ width: W, height: H, borderRadius: 14, backgroundColor: '#121548', borderWidth: 2, borderColor: '#3A3F86', overflow: 'hidden' }}
      accessibilityElementsHidden
    >
      {/* the window of app tiles */}
      <View style={{ position: 'absolute', left: 18, right: 18, top: 32, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {SHOP_TILES.map(([l, bg]) => (
          <View key={l} style={{ width: 44, height: 34, borderRadius: 9, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: '#14163A' }}>{l}</Text>
          </View>
        ))}
      </View>
      {/* the shutter */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 6,
          right: 6,
          top: 20,
          height: H - 20,
          overflow: 'hidden',
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-(H - 20), 0] }) }],
        }}
      >
        {Array.from({ length: 13 }).map((_, i) => (
          <View key={i} style={{ height: 7, marginBottom: 1, backgroundColor: i % 2 ? '#5B3FD0' : '#7B4DFF' }} />
        ))}
      </Animated.View>
      {/* awning */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 20, flexDirection: 'row' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#F2F0FF' : '#A78BFA' }} />
        ))}
      </View>
    </View>
  );
}

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

/** Notifications: a Till Morning banner slides down, just like the real one, over a glowing moon. */
export function NotifBanner({ delay = 0 }: { delay?: number }) {
  const v = useOnce(delay, 600, Easing.out(Easing.back(1.4)));
  const moon = useOnce(delay + 100, 700, Easing.out(Easing.cubic));
  return (
    <View style={{ alignSelf: 'stretch', height: 170, alignItems: 'center' }} accessibilityElementsHidden>
      <Animated.View
        style={{
          position: 'absolute',
          top: 70,
          width: 76,
          height: 76,
          borderRadius: 38,
          opacity: moon,
          transform: [{ scale: moon.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
        }}
      >
        <View style={{ position: 'absolute', left: -14, top: -14, width: 104, height: 104, borderRadius: 52, backgroundColor: MOON, opacity: 0.14 }} />
        <Svg width={76} height={76}>
          <Circle cx={38} cy={38} r={36} fill={MOON} />
          <Circle cx={60} cy={24} r={34} fill={color.night} />
        </Svg>
      </Animated.View>
      <Animated.View
        style={{
          alignSelf: 'stretch',
          opacity: v.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) }],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 12,
          borderRadius: 20,
          backgroundColor: 'rgba(242,240,255,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(242,240,255,0.2)',
        }}
      >
        <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#7C4DFF', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={20} height={20}>
            <Circle cx={10} cy={10} r={9} fill={MOON} />
            <Circle cx={15} cy={6} r={8} fill="#7C4DFF" />
          </Svg>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: '#FFFFFF' }}>Till Morning</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.text3 }}>now</Text>
          </View>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: color.text2 }}>Tap to start your pause</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/** Demo: the moon slowly rises behind the breathing ring over `duration` ms, so waiting feels like the night passing. */
export function MoonPeek({ delay = 0, duration = 5000 }: { delay?: number; duration?: number }) {
  const v = useOnce(delay, duration, Easing.out(Easing.cubic));
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        right: -6,
        top: -10,
        width: 64,
        height: 64,
        opacity: v.interpolate({ inputRange: [0, 0.25], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [70, 0] }) }],
      }}
    >
      <View style={{ position: 'absolute', left: -12, top: -12, width: 88, height: 88, borderRadius: 44, backgroundColor: MOON, opacity: 0.16 }} />
      <Svg width={64} height={64}>
        <Circle cx={32} cy={32} r={30} fill={MOON} />
        <Circle cx={22} cy={24} r={4} fill="rgba(201,149,42,0.25)" />
        <Circle cx={40} cy={40} r={6} fill="rgba(201,149,42,0.2)" />
      </Svg>
    </Animated.View>
  );
}
