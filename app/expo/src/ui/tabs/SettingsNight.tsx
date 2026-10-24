import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';

import { useReduceMotion } from '../components';
import { color, font } from '../theme';

// Settings, in the Night Trolley world: "Your night shop" at the top, whose purple shutter is down
// while the shields are on and rolls up when they're off.

const MOON = '#FFE7A3';
const FRONT_H = 64;

/** The little shop front; the shutter follows the shields (down = on). */
function Shop({ down }: { down: boolean }) {
  const rm = useReduceMotion();
  const v = useAnimatedValue(down ? 1 : 0);
  useEffect(() => {
    const a = Animated.timing(v, { toValue: down ? 1 : 0, duration: rm ? 0 : 700, easing: Easing.inOut(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [down, rm, v]);
  return (
    <View
      style={{ width: 74, height: FRONT_H, borderRadius: 10, backgroundColor: '#121548', overflow: 'hidden', borderWidth: 2, borderColor: '#3A3F86' }}
      accessibilityElementsHidden
    >
      {/* the lit window */}
      <LinearGradient colors={['#FFF3C4', '#FFE7A3', '#FFC94D']} style={{ position: 'absolute', left: 9, right: 9, top: 20, bottom: 8, borderRadius: 5 }} />
      {/* the shutter */}
      <Animated.View
        style={{
          position: 'absolute',
          left: 4,
          right: 4,
          top: 13,
          height: FRONT_H - 13,
          overflow: 'hidden',
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-(FRONT_H - 13), 0] }) }],
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={{ height: 6, backgroundColor: i % 2 ? '#5B3FD0' : '#7B4DFF', marginBottom: 1 }} />
        ))}
      </Animated.View>
      {/* awning */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 13, flexDirection: 'row' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? '#F2F0FF' : '#A78BFA' }} />
        ))}
      </View>
    </View>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <View style={{ borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(167,139,250,0.16)' }}>
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, color: '#C4B5FD' }}>{text}</Text>
    </View>
  );
}

/** "Your night shop": the shields, night lock and pause at a glance. */
export function NightShopCard({ on, apps, nightLock, pauseSeconds }: { on: boolean; apps: string; nightLock: string | null; pauseSeconds: number }) {
  return (
    <View
      style={{ borderRadius: 22, backgroundColor: '#15184A', paddingBottom: 3 }}
      accessible
      accessibilityLabel={`Your night shop. ${on ? `Shutters down on ${apps}` : 'Shutters up, apps open straight away'}`}
    >
      <LinearGradient
        colors={['#1E2256', '#2A2470']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, borderWidth: 1, borderColor: '#3A3F86', padding: 12, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <Shop down={on} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: font.display, fontSize: 18, lineHeight: 23, color: color.text }}>Your night shop</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, lineHeight: 18, color: on ? MOON : color.coralText }}>
            {on ? `Shutters down on ${apps}` : 'Shutters up. Apps open straight away.'}
          </Text>
          <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {nightLock && <Pill text={`Night lock ${nightLock}`} />}
            <Pill text={`Pause ${pauseSeconds} s`} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
