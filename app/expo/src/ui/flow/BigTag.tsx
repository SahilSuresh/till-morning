import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingBagIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AppLabel } from '../../../modules/tm-native';
import { knownApp } from '../../lib/core';
import { springOut, useReduceMotion } from '../components';
import { font } from '../theme';

const STARS: [number, number][] = [
  [38, 22],
  [62, 12],
  [84, 30],
  [24, 58],
  [72, 54],
  [52, 34],
];

/** The app inside the night picture: Apple's own icon when we have its key, else a letter or a bag. */
function AppArt({ app, appKey }: { app: string; appKey?: string | null }) {
  if (appKey) return <AppLabel appKey={appKey} mode="icon" size={30} align="center" style={{ width: 44, height: 44 }} />;
  if (knownApp(app))
    return (
      <View style={{ flex: 1, borderRadius: 10, backgroundColor: '#4361FF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 24, color: '#FFFFFF' }}>{app.charAt(0).toUpperCase()}</Text>
      </View>
    );
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ShoppingBagIcon size={30} color="#4361FF" weight="bold" />
    </View>
  );
}

/** .night-im (P:L611): the app asleep under a moon, with twinkling stars and a "Ready" time. */
function NightArt({ app, appKey, when }: { app: string; appKey?: string | null; when?: string }) {
  const rm = useReduceMotion();
  const [w, setW] = useState(272);
  const t = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rm) return;
    const tw = Animated.loop(Animated.timing(t, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    tw.start();
    b.start();
    return () => {
      tw.stop();
      b.stop();
    };
  }, [rm, t, bob]);

  const H = 118;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ height: H, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
    >
      <LinearGradient colors={['#1B2068', '#372C9A', '#7A4FE0']} locations={[0, 0.55, 1]} start={{ x: 0.33, y: 0 }} end={{ x: 0.67, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width={w} height={H}>
        <Defs>
          {/* radial-gradient(circle at 80% 115%, rgba(255,201,77,.38), transparent 46%) */}
          <RadialGradient id="sun" cx={w * 0.8} cy={H * 1.15} r={Math.hypot(w * 0.8, H * 1.15) * 0.46} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFC94D" stopOpacity={0.38} />
            <Stop offset="1" stopColor="#FFC94D" stopOpacity={0} />
          </RadialGradient>
          <Mask id="moonCut">
            <Rect x="0" y="0" width={w} height={H} fill="#FFFFFF" />
            <Circle cx={14 + 13} cy={14 + 13} r={13} fill="#000000" />
          </Mask>
        </Defs>
        <Rect x="0" y="0" width={w} height={H} fill="url(#sun)" />
        {/* .moon: a 26 pt circle whose box-shadow (7, −4) shows as a crescent */}
        <Circle cx={14 + 13 + 7} cy={14 + 13 - 4} r={13} fill="#FFE7A3" mask="url(#moonCut)" />
        {/* .hill */}
        <Ellipse cx={w / 2} cy={H + 34 - 31} rx={w * 0.6} ry={31} fill="rgba(13,15,46,0.5)" />
      </Svg>
      {STARS.map(([x, y], i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: '#FFFFFF',
            opacity: rm
              ? 0.9
              : Animated.modulo(Animated.add(t, (i * 0.4) / 2.6), 1).interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.25, 0.9] }),
          }}
        />
      ))}
      <Animated.View
        style={{
          width: 60,
          height: 60,
          borderRadius: 17,
          backgroundColor: '#FFFFFF',
          padding: 8,
          shadowColor: '#040518',
          shadowOpacity: 0.45,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 12 },
          transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
        }}
      >
        {/* box-shadow 0 0 0 7px rgba(255,255,255,.13): a faint ring */}
        <View style={{ position: 'absolute', top: -7, left: -7, right: -7, bottom: -7, borderRadius: 24, borderWidth: 7, borderColor: 'rgba(255,255,255,0.13)' }} />
        <AppArt app={app} appKey={appKey} />
        <Text style={{ position: 'absolute', right: -26, top: -18, color: '#DDE3FF', fontFamily: font.bodyHeavy, fontSize: 15, lineHeight: 15 }}>
          z<Text style={{ fontSize: 11 }}>z</Text>
        </Text>
      </Animated.View>
      {when ? (
        <View style={{ position: 'absolute', right: 10, bottom: 9, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, color: '#FFFFFF' }}>{when}</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * The prototype's bigTag() (.wr-bigtag, P:L628/1099): a paper tag tilted −2°, dropped in with a spring,
 * a hole punch, the night picture, the want's name, its app and price, and a blue stamp.
 */
export function BigTag({
  name,
  app,
  appKey,
  meta,
  stamp,
  when,
}: {
  name: string;
  app: string;
  appKey?: string | null;
  meta: string;
  stamp: string;
  when?: string;
}) {
  const rm = useReduceMotion();
  const drop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const st = useRef(new Animated.Value(rm ? 1 : 0)).current;
  useEffect(() => {
    if (rm) return;
    Animated.timing(drop, { toValue: 1, duration: 550, delay: 140, easing: Easing.bezier(0.3, 1.4, 0.5, 1), useNativeDriver: true }).start();
    Animated.timing(st, { toValue: 1, duration: 500, delay: 140 + 450, easing: springOut, useNativeDriver: true }).start();
  }, [rm, drop, st]);

  return (
    <Animated.View
      accessible
      accessibilityLabel={`${name}. ${meta}. ${stamp}`}
      style={{
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
        opacity: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
          { rotate: drop.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-2deg'] }) },
        ],
      }}
    >
      <NightArt app={app} appKey={appKey} when={when} />
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 18, lineHeight: 23, color: '#14163A', textAlign: 'left' }}>{name}</Text>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, lineHeight: 18, color: '#5D6192', textAlign: 'left' }}>{meta}</Text>
      <Animated.View
        style={{
          alignSelf: 'flex-start',
          marginTop: 4,
          borderWidth: 2.5,
          borderColor: '#2A3BC0',
          borderRadius: 8,
          paddingHorizontal: 9,
          paddingVertical: 2,
          opacity: st.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
          transform: [
            { scale: st.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
            { rotate: st.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-6deg'] }) },
          ],
        }}
      >
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: '#2A3BC0' }}>{stamp}</Text>
      </Animated.View>
      {/* hole punch */}
      <View style={{ position: 'absolute', top: 14, right: 14, width: 11, height: 11, borderRadius: 6, backgroundColor: '#0D0F2E' }} />
    </Animated.View>
  );
}
