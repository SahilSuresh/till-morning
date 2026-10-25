import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useReduceMotion } from '../components';
import type { SpotRef } from '../Spotlight';
import { color, font } from '../theme';
import { Pressable } from '../Pressable';

// Night Trolley · Part 1 finishing touches: 2C "Test the shutters" and 3A "the sleeping ticket".

const MOON = '#FFE7A3';

const FRONT_H = 58;

/** A tiny night shop whose purple shutter rolls down and up on a loop (option 2C, in our colours). */
function ShopFront() {
  const rm = useReduceMotion();
  const y = useAnimatedValue(rm ? 0 : -FRONT_H);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(y, { toValue: 0, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(y, { toValue: -FRONT_H, duration: 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, y]);

  return (
    <View style={{ width: 66, height: FRONT_H, borderRadius: 10, backgroundColor: '#121548', overflow: 'hidden', borderWidth: 2, borderColor: '#3A3F86' }}>
      {/* lit window */}
      <LinearGradient colors={['#FFF3C4', '#FFE7A3', '#FFC94D']} style={{ position: 'absolute', left: 8, right: 8, top: 18, bottom: 7, borderRadius: 5 }} />
      {/* the shutter */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: 12,
          height: FRONT_H - 12,
          transform: [{ translateY: y }],
          overflow: 'hidden',
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={i} style={{ height: 6, backgroundColor: i % 2 ? '#5B3FD0' : '#7B4DFF', marginBottom: 1 }} />
        ))}
      </Animated.View>
      {/* awning */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 12, flexDirection: 'row' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#F2F0FF' : '#A78BFA' }} />
        ))}
      </View>
    </View>
  );
}

/** "Test the shutters": invites you to open a shielded app and watch the shield come down. */
export function ShutterTry({ targetRef, appName, onPress }: { targetRef: SpotRef; appName?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Test the shutters. Open ${appName ?? 'a shop app'} and watch them come down`}
      style={{ alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <View ref={targetRef} collapsable={false} style={{ transform: [{ scale: pressed ? 0.97 : 1 }] }}>
          <LinearGradient
            colors={['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#3A3F86',
              padding: 8,
              paddingRight: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <ShopFront />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: color.text }}>Test the shutters</Text>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: color.text2 }}>Open {appName ?? 'a shop app'} and watch them come down</Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');
const until = (ms: number) => {
  const m = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${pad(m % 60)}m` : `${m}m`;
};

/** When night lock ends (the next nlTo:00). */
function nextEnd(now: number, endHour: number) {
  const d = new Date(now);
  d.setHours(endHour, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** Two little z's drifting up from the sleeping face. */
function Zs() {
  const rm = useReduceMotion();
  const a = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [rm, a]);
  const phases = useMemo(() => [Animated.modulo(a, 1), Animated.modulo(Animated.add(a, 0.5), 1)], [a]);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 34, top: -10, width: 24, height: 30 }}>
      {phases.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            left: i ? 9 : 0,
            top: i ? 2 : 10,
            fontFamily: font.displayBold,
            fontSize: i ? 11 : 13,
            color: MOON,
            opacity: rm ? 0.8 : p.interpolate({ inputRange: [0, 0.2, 0.7, 1], outputRange: [0, 1, 0.85, 0] }),
            transform: rm
              ? []
              : [
                  { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) },
                  { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) },
                ],
          }}
        >
          z
        </Animated.Text>
      ))}
    </View>
  );
}

/** The ticket's face: a sleepy moon at night, a yawning sun waking up in the last two hours. */
function SleepyFace({ dawn }: { dawn: boolean }) {
  return (
    <View style={{ width: 44, height: 44 }}>
      <LinearGradient
        colors={dawn ? ['#FFE7A3', '#FFB547'] : ['#FFF8DE', MOON]}
        style={{ position: 'absolute', inset: 0, borderRadius: 22, backgroundColor: MOON, shadowColor: MOON, shadowOpacity: 0.4, shadowRadius: 10 }}
      />
      <Svg width={44} height={44} viewBox="0 0 44 44">
        {dawn ? (
          <>
            <Circle cx={15} cy={20} r={2.6} fill="#3B2A8C" />
            <Path d="M25 20 Q29 23.5 33 20" stroke="#3B2A8C" strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <Circle cx={22} cy={29.5} r={2.6} fill="#3B2A8C" />
          </>
        ) : (
          <>
            <Path d="M11 20 Q15 24 19 20" stroke="#3B2A8C" strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <Path d="M25 20 Q29 24 33 20" stroke="#3B2A8C" strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <Path d="M19 29 Q22 31 25 29" stroke="#3B2A8C" strokeWidth={2} strokeLinecap="round" fill="none" />
          </>
        )}
        <Circle cx={10} cy={26} r={3} fill="#FF8FB1" opacity={0.45} />
        <Circle cx={34} cy={26} r={3} fill="#FF8FB1" opacity={0.45} />
      </Svg>
      {!dawn && <Zs />}
    </View>
  );
}

const DASHES = Array.from({ length: 12 }, (_, i) => i);

/**
 * The night version of the pass button (option 3A in our colours): the Shopping Pass ticket,
 * asleep, with a moon face and drifting z's and a countdown on the stub. In the last two hours
 * it starts waking up: a yawning sun and a warmer ticket.
 */
export function SleepingTicket({ targetRef, endHour, onPress }: { targetRef: SpotRef; endHour: number; onPress: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const end = nextEnd(now, endHour);
  const left = end - now;
  const dawn = left <= 2 * 3600000;
  const back = `${pad(endHour)}:00`;
  const notch = { position: 'absolute' as const, top: '50%' as const, marginTop: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: color.night };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dawn ? 'Passes are waking up' : 'Passes are asleep'}. Back at ${back}, in ${until(left)}. Park it instead`}
      style={{ alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <View
          ref={targetRef}
          collapsable={false}
          style={{ borderRadius: 20, backgroundColor: dawn ? '#3A2266' : '#1F1860', paddingBottom: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 }}
        >
          <LinearGradient
            colors={dawn ? ['#4A2D86', '#B0607E'] : ['#2E2580', '#4A2DA6']}
            start={{ x: 0.07, y: 0.25 }}
            end={{ x: 0.93, y: 0.75 }}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              paddingLeft: 20,
              paddingRight: 18,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View style={[notch, { left: -11 }]} />
            <View style={[notch, { right: -11 }]} />
            {!dawn && (
              <>
                <View style={{ position: 'absolute', left: '46%', top: 9, width: 3, height: 3, borderRadius: 2, backgroundColor: MOON, opacity: 0.55 }} />
                <View
                  style={{ position: 'absolute', left: '62%', bottom: 10, width: 2, height: 2, borderRadius: 1, backgroundColor: '#FFFFFF', opacity: 0.45 }}
                />
              </>
            )}
            <SleepyFace dawn={dawn} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: '#FFFFFF' }} numberOfLines={1}>
                {dawn ? 'Waking up soon' : 'Passes are asleep'}
              </Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, color: dawn ? '#FFE1D2' : 'rgba(255,255,255,0.72)' }} numberOfLines={1}>
                {dawn ? `Passes back at ${back}` : `Till ${back} · park it instead`}
              </Text>
            </View>
            {/* dashed tear line, then the stub with the countdown */}
            <View style={{ alignSelf: 'stretch', width: 2, marginVertical: -4, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 0, left: 0 }}>
                {DASHES.map((i) => (
                  <View key={i} style={{ width: 2, height: 5, marginBottom: 4, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                ))}
              </View>
            </View>
            <View style={{ alignItems: 'center', minWidth: 58 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 9.5, letterSpacing: 1.1, color: dawn ? '#FFE1D2' : '#C4B5FD' }}>WAKES IN</Text>
              <Text style={{ fontFamily: font.display, fontSize: 17, color: dawn ? '#FFE1B8' : MOON, fontVariant: ['tabular-nums'] }}>{until(left)}</Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
