import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setState, useAppState } from '../lib/store';
import { Button, Chip, CircleButton, Rise, Tag, toast } from '../ui/components';
import { IconChevrons, IconTicket } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

/** Meet the Shopping Pass (V.passIntro, L1365), from the Finish setting up card. */
export default function PassIntro() {
  const insets = useSafeAreaInsets();
  const presets = useAppState((s) => s.settings.passPresets);
  const saved = useAppState((s) => s.settings.defaultPassMinutes);
  const [mins, setMins] = useState(saved);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const save = () => {
    setState((s) => ({ passSet: true, settings: { ...s.settings, defaultPassMinutes: mins } }));
    back();
    setTimeout(() => toast(`Usual pass length: ${mins} minutes`), 300);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Shopping Pass</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 4, paddingBottom: 16, alignItems: 'center' }}>
        <Image source={require('../../assets/mascots/ticket.webp')} style={{ width: 128, height: 128 }} resizeMode="contain" accessibilityLabel="A ticket sticker with a timer" />
        <Rise delay={100}>
          <Text style={[type.h1, { textAlign: 'center', marginTop: 8 }]}>Need to shop? Get a pass.</Text>
        </Rise>
        <Rise delay={160}>
          <Text style={[type.body, { textAlign: 'center', marginTop: 12 }]}>
            If you decide to buy, set a purpose and a timer. The app locks again when time’s up. Start one from “Need to shop?” on Today, or after a pause.
          </Text>
        </Rise>
        <Rise delay={240} style={{ alignSelf: 'stretch', marginTop: 22 }}>
          <View style={{ borderRadius: 22, backgroundColor: '#5427B8', paddingBottom: 3 }}>
            <LinearGradient colors={gradient.ticket} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={{ borderRadius: 22, overflow: 'hidden' }}>
              <View style={{ height: 100, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Chip tone="dark" label="Shopping pass" icon={<IconTicket size={13} />} />
                <Text style={{ fontFamily: font.display, fontSize: 32, color: '#FFFFFF' }}>{mins} minutes</Text>
              </View>
              <View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.4)', marginHorizontal: 14 }} />
              <View style={{ height: 58, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.bodySemi, fontStyle: 'italic', fontSize: 16, color: '#FFFFFF' }}>“Birthday gift for Mum”</Text>
              </View>
            </LinearGradient>
          </View>
        </Rise>
        <Text style={[type.title, { marginTop: 22, alignSelf: 'flex-start' }]}>Your usual pass length</Text>
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
          {presets.map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <Tag label={`${m} min`} selected={mins === m} onPress={() => setMins(m)} />
            </View>
          ))}
        </View>
        <Text style={[type.small, { marginTop: 12 }]}>You can change it each time, and in Settings.</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <Button label="Save" onPress={save} />
      </View>
    </View>
  );
}
