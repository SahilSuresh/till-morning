import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { CheckIcon, XIcon } from './ph';
import { useCallback, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import R from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { activeChallenge, risky } from '../lib/rules';
import { useAppState } from '../lib/store';
import { useReduceMotion } from './components';
import { useBoundaryNow } from './tabs/clock';
import { SPRING, stamp } from './tabs/motion';
import { font, type } from './theme';

// Stamps shown the last time the card was on screen: new ones stamp in, 170 ms apart.
let shownStamps: number | null = null;
let shownCards = 0;

/** heroCard() from the prototype (P:L2023–2037, CSS P:L516–530): mascot bubble, title, 10 calm-day nodes and a chest. */
export function MorningCard() {
  const n = useAppState((s) => s.stamps);
  const cards = useAppState((s) => s.cardsFilled);
  const broken = useAppState((s) => s.dayBroken);
  const brokenWhy = useAppState((s) => s.brokenWhy);
  const parcels = useAppState((s) => s.queue.length);
  const parked = useAppState((s) => s.parked);
  useAppState((s) => s.settings.challenge + s.settings.challengeAt); // the title follows your challenge
  const now = useBoundaryNow(parked.filter((w) => !w.decided).map((w) => w.readyAt));
  const rm = useReduceMotion();

  const ready = parked.filter((w) => !w.decided && w.readyAt <= now).length;
  const waiting = parked.filter((w) => !w.decided).length;
  const ch = activeChallenge();

  const [fresh, setFresh] = useState(0);
  useFocusEffect(
    useCallback(() => {
      if (shownStamps === null) {
        shownStamps = n;
        shownCards = cards;
        return;
      }
      const f = cards === shownCards ? n - shownStamps : n;
      shownStamps = n;
      shownCards = cards;
      if (f <= 0 || rm) return;
      setFresh(f);
      const t = setTimeout(() => setFresh(0), 250 + f * 170 + 700);
      return () => clearTimeout(t);
    }, [n, cards, rm]),
  );

  const [trackW, setTrackW] = useState(0);

  const say = ready
    ? `Morning-you has ${ready} thing${ready > 1 ? 's' : ''} to decide.`
    : parcels
      ? 'There’s a parcel for you, just below.'
      : risky(now)
        ? 'It’s your risky hour, so I’ve made the pause longer.'
        : broken
          ? `No stamp today: ${brokenWhy || 'your shields went off'}. Tomorrow is a fresh start.`
          : waiting
            ? `${waiting} thing${waiting > 1 ? 's are' : ' is'} waiting their turn. No rush.`
            : 'Quiet so far. Keep it that way!';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/goal', params: { k: 'cape' } })}
      accessibilityRole="button"
      accessibilityLabel={`Morning card, ${n} of 10 calm days. Show what a calm day is`}
    >
      {({ pressed }) => (
        // box-shadow: 0 4px 0 #2A3BC0, 0 18px 40px rgba(67,97,255,.3)
        <View
          style={{
            borderRadius: 26,
            backgroundColor: '#2A3BC0',
            paddingBottom: pressed ? 1 : 4,
            marginTop: pressed ? 3 : 0,
            shadowColor: '#4361FF',
            shadowOpacity: 0.3,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 18 },
          }}
        >
          <LinearGradient colors={['#5A48F2', '#3D5AFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 16, gap: 12, overflow: 'hidden' }}>
            {/* ::after — radial-gradient(closest-side, rgba(255,255,255,.22), transparent) in the top-right corner */}
            <Svg width={200} height={200} style={{ position: 'absolute', right: -40, top: -60 }} pointerEvents="none">
              <Defs>
                <RadialGradient id="mcGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
                  <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={100} cy={100} r={100} fill="url(#mcGlow)" />
            </Svg>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* filter: drop-shadow(0 6px 10px rgba(0,0,0,.3)) */}
              <View style={{ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 6 } }}>
                <Image source={require('../../assets/mascots/welcome.webp')} style={{ width: 74, height: 74 }} resizeMode="contain" accessibilityIgnoresInvertColors />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ backgroundColor: 'rgba(13,15,46,0.35)', borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 10, paddingVertical: 8 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, lineHeight: 18, color: '#FFFFFF' }}>{say}</Text>
                </View>
                <Text style={[type.h2, { color: '#FFFFFF' }]}>{ch ? `${ch.name} · day ${ch.day}` : 'Shop on purpose'}</Text>
              </View>
            </View>

            {/* The track: 10 nodes and a chest (grid: repeat(10, 1fr) 36px) */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
              <View style={{ position: 'absolute', left: 10, right: 30, height: 6, borderRadius: 9, backgroundColor: 'rgba(13,15,46,0.35)' }} />
              <View
                style={{
                  position: 'absolute',
                  left: 10,
                  height: 6,
                  borderRadius: 9,
                  backgroundColor: '#5EE9B5',
                  width: trackW ? Math.max(0, (trackW - 46) * (n / 10)) : 0,
                }}
              />
              {Array.from({ length: 10 }).map((_, i) => {
                const done = i < n;
                const cur = i === n;
                const missed = cur && broken;
                const stampIn = done && fresh > 0 && i >= n - fresh;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    {cur && !missed && (
                      // 0 0 0 4px rgba(255,255,255,.3)
                      <View style={{ position: 'absolute', top: -4, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                    )}
                    <R.View
                      style={[
                        {
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: done ? '#5EE9B5' : missed ? '#3A2350' : cur ? '#FFFFFF' : '#2B2F8A',
                          borderColor: done ? '#5EE9B5' : missed ? '#FF8F78' : cur ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                        },
                        // 0 0 16px #FFFFFF
                        cur && !missed && { shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
                        stampIn && {
                          animationName: stamp,
                          animationDuration: 550,
                          animationDelay: 250 + (i - (n - fresh)) * 170,
                          animationTimingFunction: SPRING,
                          animationFillMode: 'both',
                        },
                      ]}
                    >
                      {done && <CheckIcon size={12} weight="bold" color="#14163A" />}
                      {missed && <XIcon size={12} weight="bold" color="#FFAB98" />}
                    </R.View>
                  </View>
                );
              })}
              <View style={{ width: 36, alignItems: 'flex-end' }} accessibilityLabel="50 XP when the card is full">
                {/* .wr-chest: linear-gradient(#FFD46E, #E7A500), glow 0 0 14px rgba(255,201,77,.8) */}
                <View style={{ width: 32, height: 26, borderRadius: 5, backgroundColor: '#F2B829', shadowColor: '#FFC94D', shadowOpacity: 0.8, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } }}>
                  <LinearGradient colors={['#FFD46E', '#E7A500']} style={{ position: 'absolute', inset: 0, borderRadius: 5 }} />
                  <View style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 6, backgroundColor: '#FFF1C9' }} />
                  <View style={{ position: 'absolute', left: -2, right: -2, top: 6, height: 3, backgroundColor: '#C88A00' }} />
                </View>
              </View>
            </View>

            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
              {n} of 10 calm days · <Text style={{ textDecorationLine: 'underline' }}>What’s a calm day?</Text>
            </Text>
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}
