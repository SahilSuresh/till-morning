import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { useReduceMotion } from '../components';
import type { SpotRef } from '../Spotlight';
import { color, font } from '../theme';

// Night Trolley · Part 1 finishing touches: 2C "Test the shutters" and 3C "moon, then sunrise".

const FRONT_H = 58;

/** A tiny night shop whose purple shutter rolls down and up on a loop (option 2C, in our colours). */
function ShopFront() {
  const rm = useReduceMotion();
  const y = useRef(new Animated.Value(rm ? 0 : -FRONT_H)).current;
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
      <Animated.View style={{ position: 'absolute', left: 4, right: 4, top: 12, height: FRONT_H - 12, transform: [{ translateY: y }], overflow: 'hidden', borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }}>
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
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Test the shutters. Open ${appName ?? 'a shop app'} and watch them come down`} style={{ alignSelf: 'stretch' }}>
      {({ pressed }) => (
        <View ref={targetRef} collapsable={false} style={{ transform: [{ scale: pressed ? 0.97 : 1 }] }}>
          <LinearGradient
            colors={['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 20, borderWidth: 1, borderColor: '#3A3F86', padding: 8, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
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

/**
 * The night version of the pass button (option 3C): a moon with a live countdown to when passes
 * come back; in the last two hours it turns into a rising sun ("Nearly morning").
 */
export function NightPassButton({ targetRef, endHour, onPress }: { targetRef: SpotRef; endHour: number; onPress: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const end = nextEnd(now, endHour);
  const left = end - now;
  const dawn = left <= 2 * 3600000;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dawn ? 'Nearly morning' : 'Passes sleep'}. Back at ${pad(endHour)}:00, in ${until(left)}. Park it instead`}
      style={{ alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <View ref={targetRef} collapsable={false} style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
          <LinearGradient
            colors={dawn ? ['#3B2A5E', '#6A3F6E', '#C46F6A'] : ['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 58, borderRadius: 999, borderWidth: 1, borderColor: dawn ? '#8A5A80' : '#3A3F86', flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8, paddingRight: 18 }}
          >
            {dawn ? (
              // A sun rising over the horizon.
              <View style={{ width: 42, height: 42, borderRadius: 21, overflow: 'hidden' }}>
                <LinearGradient colors={['#FFF3BF', '#FFC94D']} style={{ position: 'absolute', left: 5, right: 5, top: 12, height: 32, borderRadius: 16 }} />
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, backgroundColor: '#6A3F6E' }} />
              </View>
            ) : (
              // A crescent moon.
              <View style={{ width: 42, height: 42, borderRadius: 21, overflow: 'hidden', shadowColor: '#FFE7A3', shadowOpacity: 0.35, shadowRadius: 9 }}>
                <LinearGradient colors={['#FFF8DE', '#FFE7A3']} style={{ position: 'absolute', inset: 0, borderRadius: 21 }} />
                <View style={{ position: 'absolute', width: 42, height: 42, borderRadius: 21, left: 15, top: -5, backgroundColor: '#23256A' }} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: color.text }}>{dawn ? 'Nearly morning' : 'Passes sleep'}</Text>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: dawn ? '#FFD9C8' : color.text3 }}>
                Back at {pad(endHour)}:00{dawn ? '' : ' · park it instead'}
              </Text>
            </View>
            <Text style={{ fontFamily: font.display, fontSize: 17, color: dawn ? '#FFD9A8' : '#FFE7A3', fontVariant: ['tabular-nums'] }}>{until(left)}</Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
