import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Text, View } from 'react-native';

import { springOut, toast, useReduceMotion } from './components';
import { IconChevrons } from './icons';
import { color, font, gradient } from './theme';

const TEAR_AT = 70;

/**
 * The Shopping Pass ticket. Drag the stub right past 70 pt to tear it and start the pass.
 * A plain tap only wiggles it; VoiceOver activation tears it directly.
 */
export function TearTicket({
  minutes,
  app,
  waitSeconds,
  onTear,
}: {
  minutes: number;
  app: string;
  waitSeconds: number; // 3rd+ pass of the day: the stub can't be torn for this long
  onTear: () => void;
}) {
  const rm = useReduceMotion();
  const dx = useRef(new Animated.Value(0)).current;
  const fly = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const nudge = useRef(new Animated.Value(0)).current;
  const unlockBounce = useRef(new Animated.Value(1)).current;
  const [torn, setTorn] = useState(false);
  const [wait, setWait] = useState(waitSeconds);
  const tornRef = useRef(false);
  const waitRef = useRef(waitSeconds);
  waitRef.current = wait;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => {
      setWait((w) => w - 1);
      if (wait === 1) {
        unlockBounce.setValue(0.95);
        Animated.timing(unlockBounce, { toValue: 1, duration: 500, easing: springOut, useNativeDriver: true }).start();
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [wait, unlockBounce]);

  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(nudge, { toValue: 5, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(nudge, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, nudge]);

  const tear = () => {
    if (tornRef.current) return;
    tornRef.current = true;
    setTorn(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.timing(fly, {
      toValue: 1,
      duration: rm ? 1 : 500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    setTimeout(onTear, rm ? 50 : 480);
  };

  const doWiggle = () => {
    wiggle.setValue(0);
    Animated.timing(wiggle, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !tornRef.current,
      onMoveShouldSetPanResponder: (_, g) => !tornRef.current && Math.abs(g.dx) > 2,
      onPanResponderMove: (_, g) => {
        if (waitRef.current > 0) return;
        dx.setValue(Math.max(0, g.dx));
      },
      onPanResponderRelease: (_, g) => {
        if (waitRef.current > 0) {
          toast('Take a few more seconds first');
          return;
        }
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) {
          doWiggle();
          toast('Drag the stub to the right to tear it');
          return;
        }
        if (g.dx > TEAR_AT) tear();
        else Animated.spring(dx, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(dx, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  const waiting = wait > 0;
  const stubTransform = [
    { translateX: Animated.add(dx, fly.interpolate({ inputRange: [0, 1], outputRange: [0, 170] })) },
    { translateY: fly.interpolate({ inputRange: [0, 1], outputRange: [0, 70] }) },
    {
      rotate: Animated.add(
        dx.interpolate({ inputRange: [0, 90], outputRange: [0, 18], extrapolate: 'clamp' }),
        fly.interpolate({ inputRange: [0, 1], outputRange: [0, 32] }),
      ).interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
    },
    { translateX: wiggle.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, 8, -4, 6, -2, 0] }) },
  ];

  return (
    <View
      style={{ height: 98, flexDirection: 'row', shadowColor: '#020312', shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`Tear the ticket to start your ${minutes}-minute pass`}
      accessibilityState={{ disabled: waiting }}
      onAccessibilityTap={() => (waiting ? AccessibilityInfo.announceForAccessibility('Take a few more seconds first') : tear())}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={() => !waiting && tear()}
    >
      <View style={{ flex: 1, borderTopLeftRadius: 18, borderBottomLeftRadius: 18, overflow: 'hidden' }}>
        <LinearGradient colors={gradient.ticket} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>Shopping pass</Text>
          <Text style={{ fontFamily: font.display, fontSize: 30, lineHeight: 34, color: '#FFFFFF' }}>{minutes} min</Text>
          <Text numberOfLines={1} style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' }}>
            {app}
          </Text>
        </LinearGradient>
      </View>
      <Animated.View
        {...pan.panHandlers}
        style={{
          width: 104,
          borderTopRightRadius: 18,
          borderBottomRightRadius: 18,
          backgroundColor: waiting ? '#4B3F7A' : '#9B4CF4',
          borderLeftWidth: 2.5,
          borderStyle: 'dashed',
          borderLeftColor: 'rgba(255,255,255,0.7)',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          opacity: fly.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [...stubTransform, { scale: unlockBounce }],
        }}
      >
        <Text style={{ fontFamily: font.display, fontSize: 15, lineHeight: 18, color: waiting ? '#C9CBF0' : '#FFFFFF', textAlign: 'center' }}>
          {torn ? 'Pass started' : waiting ? `Wait ${wait}s` : 'Tear to start'}
        </Text>
        {!waiting && !torn && (
          <Animated.View style={{ transform: [{ translateX: nudge }] }}>
            <IconChevrons size={18} />
          </Animated.View>
        )}
      </Animated.View>
      {/* Notches cut in the night colour where the stub meets the main part. */}
      <View style={{ position: 'absolute', right: 104 - 8, top: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: color.night }} />
      <View style={{ position: 'absolute', right: 104 - 8, bottom: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: color.night }} />
    </View>
  );
}
