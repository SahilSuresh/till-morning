import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GOALS, openParcel, STICKER_IMG, STICKER_NAME, type StickerKey } from '../lib/progress';
import { useAppState } from '../lib/store';
import { PauseBackground } from '../ui/backgrounds';
import { Button, Chip, CircleButton, springOut, useReduceMotion } from '../ui/components';
import { IconX } from '../ui/icons';
import { color, font, type } from '../ui/theme';

const SLOTS = 9;

/** V.parcel from the prototype: tear open a parcel to reveal a sticker you earned. */
export default function Parcel() {
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const queue = useAppState((s) => s.queue);
  const owned = useAppState((s) => s.got.length);
  const [revealed, setRevealed] = useState<StickerKey | null>(null);
  const pop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rm || revealed) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 120, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, revealed, shake]);

  const tear = () => {
    const k = openParcel();
    if (!k) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setRevealed(k);
    if (!rm) Animated.timing(pop, { toValue: 1, duration: 600, easing: springOut, useNativeDriver: true }).start();
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const head = (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <CircleButton label="Close" onDark onPress={close}>
        <IconX />
      </CircleButton>
      <Chip tone="glass" label={`${owned} of ${SLOTS}${revealed ? '  +1' : ''}`} />
    </View>
  );

  if (revealed) {
    const task = GOALS.find((g) => g.k === revealed)?.task ?? '';
    return (
      <View style={{ flex: 1 }}>
        <PauseBackground />
        {head}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: '-6deg' }], opacity: pop }}>
            {STICKER_IMG[revealed] ? (
              <Image source={STICKER_IMG[revealed]!} style={{ width: 180, height: 180 }} resizeMode="contain" />
            ) : (
              <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFE38F', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.display, fontSize: 60, color: color.inkOnBright }}>£</Text>
              </View>
            )}
          </Animated.View>
          <View style={{ marginTop: 24 }}>
            <Chip tone="sun" size={14} label={`Sticker ${owned} of ${SLOTS}`} />
          </View>
          <Text style={[type.display, { color: '#FFFFFF', marginTop: 8, textAlign: 'center' }]}>{STICKER_NAME[revealed]}</Text>
          <Text style={[type.body, { color: color.white82, marginTop: 8, textAlign: 'center' }]}>
            For: {task}. You can’t buy stickers, only earn them.
          </Text>
        </View>
        <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20, gap: 12 }}>
          <Button variant="white" label="See my collection" onPress={() => router.replace('/me')} />
          <Button variant="ghost" label="Close" onPress={close} />
        </View>
      </View>
    );
  }

  if (!queue.length) {
    return (
      <View style={{ flex: 1 }}>
        <PauseBackground />
        {head}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Image source={require('../../assets/mascots/legend.webp')} style={{ width: 160, height: 160 }} resizeMode="contain" />
          <Text style={[type.h1, { color: '#FFFFFF', marginTop: 20, textAlign: 'center' }]}>
            {owned >= SLOTS ? 'Set complete for now' : 'No parcels yet'}
          </Text>
          <Text style={[type.body, { color: color.white82, marginTop: 8, textAlign: 'center' }]}>
            {owned >= SLOTS
              ? 'You have every sticker in this set. The next set arrives with an update.'
              : 'Finish a sticker goal in Me to get one.'}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20 }}>
          <Button variant="white" label="Close" onPress={close} />
        </View>
      </View>
    );
  }

  const why = `You finished “${GOALS.find((g) => g.k === queue[0])?.task ?? 'a sticker goal'}”. This sticker is yours.`;
  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      {head}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={[type.h1, { color: '#FFFFFF', textAlign: 'center' }]}>A parcel for you</Text>
        <Text style={[type.body, { color: color.white82, marginTop: 8, textAlign: 'center' }]}>{why}</Text>
        <Pressable onPress={tear} accessibilityRole="button" accessibilityLabel="Tear open the parcel" style={{ marginTop: 32 }}>
          <Animated.View style={{ transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] }) }] }}>
            <LinearGradient
              colors={['#FFD46E', '#E7A500']}
              style={{ width: 170, height: 190, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}
            >
              <View style={{ position: 'absolute', top: 18, left: 0, right: 0, height: 12, backgroundColor: 'rgba(255,255,255,0.6)' }} />
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color.blue, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
                <View style={{ width: 8, height: 26, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
                <View style={{ width: 8, height: 26, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>
        <View style={{ marginTop: 28 }}>
          <Chip tone="glass" size={14} label="Tap the parcel to open it" />
        </View>
        {queue.length > 1 && <Text style={[type.small, { color: color.white82, marginTop: 14 }]}>{queue.length - 1} more after this one</Text>}
      </View>
    </View>
  );
}
