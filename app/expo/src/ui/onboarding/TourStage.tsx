import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBag } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { font } from '../theme';

// The tour's stage (.tour-stage, P:L659) holding the parked-want paper tag (bigTag, P:L1099)
// with its night illustration (.night-im, P:L611–621). Real shop logos can't be used, so the
// sleeping app is a white squircle with a shopping bag.

const IM_H = 118;
const STARS: [number, number][] = [
  [38, 22],
  [62, 12],
  [84, 30],
  [24, 58],
  [72, 54],
  [52, 34],
];
const DROP = Easing.bezier(0.3, 1.4, 0.5, 1); // wr-drop
const SPRING = Easing.bezier(0.34, 1.56, 0.64, 1); // --spring
const SWAY = Easing.inOut(Easing.ease);

export function TourStage() {
  return (
    <View style={{ marginTop: 16, height: 300, borderRadius: 30, borderWidth: 1.5, borderColor: '#2E3374', overflow: 'hidden', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 18 }}>
      {/* radial-gradient(120% 90% at 50% 0%, #2B318C 0%, #171A4A 62%, #12153A 100%) */}
      <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="stage" cx="50" cy="0" rx="120" ry="90" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#2B318C" />
            <Stop offset="0.62" stopColor="#171A4A" />
            <Stop offset="1" stopColor="#12153A" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#stage)" />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <BigTag />
      </View>
    </View>
  );
}

/** .wr-bigtag: a paper tag, tilted −2°, that drops in (wr-drop .55s) and gets stamped (.45 s later). */
function BigTag() {
  const rm = useReduceMotion();
  const drop = useSharedValue(rm ? 1 : 0);
  const stamp = useSharedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    drop.set(withTiming(1, { duration: 550, easing: DROP }));
    stamp.set(withDelay(450, withTiming(1, { duration: 500, easing: SPRING })));
    return () => {
      cancelAnimation(drop);
      cancelAnimation(stamp);
    };
  }, [rm, drop, stamp]);

  const tagStyle = useAnimatedStyle(() => {
    const q = 1 - drop.value;
    return {
      opacity: Math.min(1, drop.value),
      transform: [{ rotate: '-2deg' }, { translateY: -60 * q }, { rotate: `${-10 * q}deg` }],
    };
  });
  // stamp: from scale 2.2, −10°, invisible; fully visible by 55%; lands at its −6° tilt.
  const stampStyle = useAnimatedStyle(() => {
    const p = stamp.value;
    return {
      opacity: Math.min(1, p / 0.55),
      transform: [{ scale: 2.2 - 1.2 * p }, { rotate: `${-10 + 4 * p}deg` }],
    };
  });

  return (
    <Animated.View
      accessible
      accessibilityLabel="A parked want: something from your shop app, price not known. Decide 08:00 tomorrow."
      style={[
        {
          width: '100%',
          maxWidth: 300,
          backgroundColor: '#F2F0FF',
          borderRadius: 20,
          padding: 14,
          gap: 6,
          shadowColor: '#000000',
          shadowOpacity: 0.45,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
        },
        tagStyle,
      ]}
    >
      <NightArt />
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 18, lineHeight: 24, color: '#14163A' }}>Something from your shop app</Text>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, lineHeight: 19, color: '#5D6192' }}>price not known</Text>
      <Animated.View style={[{ alignSelf: 'flex-start', marginTop: 4 }, stampStyle]}>
        <View style={{ borderWidth: 2.5, borderColor: '#2A3BC0', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 2 }}>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, lineHeight: 19, color: '#2A3BC0' }}>Decide 08:00 tomorrow</Text>
        </View>
      </Animated.View>
      {/* the punched hole */}
      <View style={{ position: 'absolute', top: 14, right: 14, width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#0D0F2E' }} />
    </Animated.View>
  );
}

/** .night-im: a night sky, a crescent moon, twinkling stars, a hill and the app asleep. */
function NightArt() {
  const [w, setW] = useState(272);
  // linear-gradient(160deg, …) across a w × 118 box: the gradient line runs through the centre.
  const a = (160 * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const len = w * Math.abs(dx) + IM_H * Math.abs(dy);
  const sx = 0.5 - (dx * len) / 2 / w;
  const sy = 0.5 - (dy * len) / 2 / IM_H;
  // radial-gradient(circle at 80% 115%, …, transparent 46%): 46% of the distance to the farthest corner.
  const gx = 0.8 * w;
  const gy = 1.15 * IM_H;
  const gr = 0.46 * Math.hypot(gx, gy);

  return (
    <View style={{ height: IM_H, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }} onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      <LinearGradient
        colors={['#1B2068', '#372C9A', '#7A4FE0']}
        locations={[0, 0.55, 1]}
        start={{ x: sx, y: sy }}
        end={{ x: 1 - sx, y: 1 - sy }}
        style={StyleSheet.absoluteFill}
      />
      <Svg width={w} height={IM_H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx={gx} cy={gy} r={gr} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="rgb(255,201,77)" stopOpacity={0.38} />
            <Stop offset="1" stopColor="rgb(255,201,77)" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="moonGlow" cx="34" cy="23" r="21" gradientUnits="userSpaceOnUse">
            <Stop offset="0.55" stopColor="rgb(255,231,163)" stopOpacity={0.55} />
            <Stop offset="1" stopColor="rgb(255,231,163)" stopOpacity={0} />
          </RadialGradient>
          {/* .moon is a box-shadow (7px −4px) of a 26 px circle: the shadow minus the circle. */}
          <Mask id="crescent">
            <Rect x="0" y="0" width={w} height={IM_H} fill="#FFFFFF" />
            <Circle cx="27" cy="27" r="13" fill="#000000" />
          </Mask>
        </Defs>
        <Rect x="0" y="0" width={w} height={IM_H} fill="url(#glow)" />
        <Circle cx="34" cy="23" r="21" fill="url(#moonGlow)" mask="url(#crescent)" />
        <Circle cx="34" cy="23" r="13" fill="#FFE7A3" mask="url(#crescent)" />
        {/* .hill: 120% wide, 62 high, 34 px below the bottom edge */}
        <Ellipse cx={w / 2} cy={IM_H + 34 - 31} rx={w * 0.6} ry={31} fill="rgba(13,15,46,0.5)" />
      </Svg>
      {STARS.map(([x, y], i) => (
        <Star key={i} x={x} y={y} delay={i * 400} />
      ))}
      <SleepingApp />
      <View style={{ position: 'absolute', right: 10, bottom: 9, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, lineHeight: 16, color: '#FFFFFF' }}>Ready 08:00</Text>
      </View>
    </View>
  );
}

/** .st: a 3 px star, twinkle 2.6s (opacity .9 ↔ .25). */
function Star({ x, y, delay }: { x: number; y: number; delay: number }) {
  const rm = useReduceMotion();
  const o = useSharedValue(0.9);
  useEffect(() => {
    if (rm) return;
    o.set(withDelay(delay, withRepeat(withSequence(withTiming(0.25, { duration: 1300, easing: SWAY }), withTiming(0.9, { duration: 1300, easing: SWAY })), -1)));
    return () => cancelAnimation(o);
  }, [rm, delay, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#FFFFFF' }, style]} />;
}

/** .obj: the app's white squircle with a soft ring, bobbing 3.2 s, with a "z z". */
function SleepingApp() {
  const rm = useReduceMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    if (rm) return;
    bob.set(withRepeat(withTiming(-4, { duration: 1600, easing: SWAY }), -1, true));
    return () => cancelAnimation(bob);
  }, [rm, bob]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View style={style}>
      <View
        style={{
          width: 74,
          height: 74,
          borderRadius: 24,
          backgroundColor: 'rgba(255,255,255,0.13)',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#040518',
          shadowOpacity: 0.45,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 12 },
        }}
      >
        <View style={{ width: 60, height: 60, borderRadius: 17, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <ShoppingBag size={36} weight="bold" color="#14163A" />
        </View>
      </View>
      <View style={{ position: 'absolute', right: 7 - 26, top: 7 - 18, flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, lineHeight: 15, color: '#DDE3FF' }}>z</Text>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11, lineHeight: 11, color: '#DDE3FF', marginLeft: 2, marginTop: -3 }}>z</Text>
      </View>
    </Animated.View>
  );
}
