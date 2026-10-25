import { router } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { protectedCount } from '../lib/core';
import { useAppState } from '../lib/store';
import { rankFor } from '../lib/xp';
import { Button, Card, Rise } from '../ui/components';
import { IconShield } from '../ui/icons';
import { color, font, type } from '../ui/theme';
import { Pressable } from '../ui/Pressable';

/** Protection is paused (V.paused, L1685): shown when the plan ends and every shield is lifted. */
export default function Paused() {
  const insets = useSafeAreaInsets();
  const xp = useAppState((s) => s.xp.total);
  const { rank } = rankFor(xp);
  const c = protectedCount();
  const n = c.apps + c.categories;

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 28, paddingBottom: 16, alignItems: 'center' }}>
        <Image source={require('../../assets/mascots/welcome.webp')} style={{ width: 176, height: 176 }} resizeMode="contain" accessibilityLabel="The mascot hugging a giant pause button" />
        <Rise delay={100}>
          <Text style={[type.display, { marginTop: 16, textAlign: 'center' }]}>Protection is paused</Text>
        </Rise>
        <Rise delay={170}>
          <Text style={[type.body, { marginTop: 12, textAlign: 'center' }]}>Your plan has ended, so Till Morning lifted every shield. Your apps work normally again.</Text>
        </Rise>
        <Rise delay={250} style={{ alignSelf: 'stretch', marginTop: 24 }}>
          <Card style={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,201,77,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🏆</Text>
              </View>
              <Text style={[type.title, { flex: 1 }]}>
                Your {rank.name} rank and {xp.toLocaleString('en-GB')} XP are safe
              </Text>
            </View>
            <View style={{ height: 1.5, backgroundColor: color.divider }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.19)', alignItems: 'center', justifyContent: 'center' }}>
                <IconShield size={22} color="#CBBBFF" />
              </View>
              <Text style={[type.title, { flex: 1 }]}>{n ? `Your ${n} protected app${n === 1 ? '' : 's'} and your waiting room are saved` : 'Your waiting room and settings are saved'}</Text>
            </View>
          </Card>
        </Rise>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <Button label="Turn protection back on" onPress={() => router.replace('/paywall')} />
        <Pressable onPress={() => router.replace('/')} accessibilityRole="button" style={{ paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 17, color: '#93A5FF' }}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}
