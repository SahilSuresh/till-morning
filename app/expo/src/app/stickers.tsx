import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { GOALS, STICKER_IMG, STICKER_NAME, type StickerKey } from '../lib/progress';
import { useAppState } from '../lib/store';
import { Button, CircleButton, useReduceMotion } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { PackageIcon } from '../ui/ph';
import { color, font, type } from '../ui/theme';

// The sticker book: every sticker in one place. Earned ones in full colour on a cream disc with a
// little wobble; the rest as silhouettes with a progress ring. Tap any of them to see how to get it.

const MOON = '#FFE7A3';
const RING = 2 * Math.PI * 38;

export default function Stickers() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ from?: string }>();
  const got = useAppState((s) => s.got);
  const queue = useAppState((s) => s.queue);
  const cnt = useAppState((s) => s.cnt);
  const parked = useAppState((s) => s.parked);
  const stamps = useAppState((s) => s.stamps);
  const cards = useAppState((s) => s.cardsFilled);
  const values = useMemo(
    () => GOALS.map((g) => Math.min(g.get(), g.n)),
    // g.get() reads these through getState().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cnt, parked, stamps, cards],
  );
  const back = () => (router.canGoBack() ? router.back() : router.replace(params.from === 'me' ? '/me' : '/'));

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text accessibilityRole="header" style={[type.h2, { flex: 1 }]}>
          Sticker book
        </Text>
        <View style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,231,163,0.14)' }}>
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: MOON }}>
            {got.length} of {GOALS.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
        {/* the book's page */}
        <View style={{ borderRadius: 26, backgroundColor: '#15184A', paddingBottom: 4 }}>
          <LinearGradient
            colors={['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, borderWidth: 1, borderColor: '#3A3F86', paddingVertical: 18, paddingHorizontal: 10 }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 }}>
              {GOALS.map((g, i) => (
                <Slot key={g.k} k={g.k} index={i} has={got.includes(g.k)} waiting={queue.includes(g.k)} v={values[i]} n={g.n} special={!!g.special} />
              ))}
            </View>
          </LinearGradient>
        </View>

        {queue.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Button
              variant="night"
              icon={<PackageIcon size={20} weight="bold" color="#FFFFFF" />}
              label={queue.length > 1 ? `Open ${queue.length} parcels` : 'Open your parcel'}
              onPress={() => router.push('/parcel')}
            />
          </View>
        )}

        <Text style={[type.small, { marginTop: 18, textAlign: 'center' }]}>
          Stickers can’t be bought. Finish a goal and its sticker arrives in a parcel on Today. Tap any sticker to see how to earn it.
        </Text>
      </ScrollView>
    </View>
  );
}

/** One sticker's place in the book. */
function Slot({
  k,
  index,
  has,
  waiting,
  v,
  n,
  special,
}: {
  k: StickerKey;
  index: number;
  has: boolean;
  waiting: boolean;
  v: number;
  n: number;
  special: boolean;
}) {
  const rm = useReduceMotion();
  const pop = useAnimatedValue(rm ? 1 : 0);
  const wob = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    Animated.timing(pop, { toValue: 1, duration: 520, delay: 80 + index * 70, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }).start();
    if (!has) return;
    const t = (toValue: number, duration: number) => Animated.timing(wob, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([Animated.delay(2600 + index * 300), t(1, 180), t(-0.7, 200), t(0.3, 160), t(0, 160)]));
    loop.start();
    return () => loop.stop();
  }, [rm, pop, wob, index, has]);

  const src = STICKER_IMG[k];
  const frac = has || waiting ? 1 : v / n;
  return (
    <Animated.View
      style={{
        width: '33.33%',
        alignItems: 'center',
        opacity: pop.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
      }}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/goal', params: { k } })}
        accessibilityRole="button"
        accessibilityLabel={has ? `${STICKER_NAME[k]}, earned` : `${STICKER_NAME[k]}, locked, ${v} of ${n}. Show how to get it`}
        style={({ pressed }) => ({ alignItems: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] })}
      >
        <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
          {/* progress ring (full and moon-yellow once earned) */}
          <Svg width={88} height={88} style={{ position: 'absolute' }}>
            <Circle cx={44} cy={44} r={38} stroke="rgba(196,181,253,0.18)" strokeWidth={4} fill="none" />
            <Circle
              cx={44}
              cy={44}
              r={38}
              stroke={has ? MOON : waiting ? color.mint : '#9B5CF6'}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - frac)}
              transform="rotate(-90 44 44)"
            />
          </Svg>
          <Animated.View
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: has ? '#FFF6D8' : '#14173F',
              borderWidth: has ? 0 : 1.5,
              borderStyle: 'dashed',
              borderColor: 'rgba(196,181,253,0.45)',
              transform: [{ rotate: wob.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] }) }],
            }}
          >
            {special && has && (
              <LinearGradient colors={['#FFE38F', '#B48CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            )}
            {src ? (
              <View style={{ width: 52, height: 52, opacity: has ? 1 : 0.55 }}>
                <Image source={src} style={{ width: 52, height: 52 }} resizeMode="contain" />
                {!has && <Image source={src} tintColor="#3A3F86" style={{ position: 'absolute', width: 52, height: 52 }} resizeMode="contain" />}
              </View>
            ) : (
              <Text style={{ fontFamily: font.display, fontSize: 28, color: has ? color.inkOnBright : '#5A5F9E' }}>£</Text>
            )}
          </Animated.View>
        </View>
        <Text numberOfLines={1} style={{ marginTop: 6, fontFamily: font.bodyHeavy, fontSize: 12.5, color: has ? color.text : color.text2 }}>
          {STICKER_NAME[k]}
        </Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 11.5, color: has ? MOON : waiting ? color.mintText : color.text3, fontVariant: ['tabular-nums'] }}>
          {has ? 'Earned' : waiting ? 'In a parcel' : `${v} / ${n}`}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
