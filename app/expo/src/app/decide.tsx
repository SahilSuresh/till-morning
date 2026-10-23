import { router, useLocalSearchParams } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { decideWant, formatDuration, readyWants } from '../lib/core';
import { maybeAskReview } from '../lib/review';
import { useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { PauseBackground } from '../ui/backgrounds';
import { Button, TextLink, toast } from '../ui/components';
import { color, type } from '../ui/theme';

/** "Still want it?" for a parked want that's ready. */
export default function Decide() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const parked = useAppState((s) => s.parked);
  const want = parked.find((w) => w.id === params.id && !w.decided) ?? readyWants()[0];

  if (!want) {
    return (
      <View style={{ flex: 1, backgroundColor: color.night, padding: 24, paddingTop: insets.top + 40 }}>
        <Text style={type.h1}>Nothing to decide</Text>
        <Text style={[type.body, { marginTop: 8 }]}>When a parked want is ready, it shows up here.</Text>
        <View style={{ marginTop: 24 }}>
          <Button label="Back to Today" onPress={() => router.replace('/')} />
        </View>
      </View>
    );
  }

  const decide = (d: 'let_go' | 'kept') => {
    const r = award(10, d === 'let_go' ? 'Let a want go' : 'Decided to keep a want');
    const goal = decideWant(want.id, d);
    if (goal) setTimeout(() => toast(goal), 2900);
    if (d === 'let_go') {
      router.replace('/');
      setTimeout(() => toast(xpToast(r, 'Let go')), 400);
      if (!goal) maybeAskReview();
    } else {
      // You waited, so this one's on purpose: straight to a pass, no pause.
      router.replace({ pathname: '/pass', params: { app: want.app } });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      <View style={{ flex: 1, paddingTop: insets.top + 40, paddingHorizontal: 28, alignItems: 'center' }}>
        <Image source={require('../../assets/mascots/bubble.webp')} style={{ width: 140, height: 140 }} resizeMode="contain" />
        <Text style={[type.h2, { color: color.white82, marginTop: 12, textAlign: 'center' }]}>
          {want.what || `Something from ${want.app}`}
        </Text>
        <Text style={[type.display, { color: '#FFFFFF', marginTop: 6, textAlign: 'center' }]}>Still want it?</Text>
        <Text style={[type.body, { color: color.white82, marginTop: 10, textAlign: 'center' }]}>
          You waited {formatDuration(Date.now() - want.parkedAt)}. Any honest answer earns the same 10 XP.
        </Text>
        <Text style={[type.small, { color: 'rgba(255,255,255,0.7)', marginTop: 10, textAlign: 'center' }]}>
          Let it go and it goes on your shelf. Still want it and you get a Shopping Pass with no pause.
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'stretch', gap: 12, paddingBottom: insets.bottom + 20 }}>
          <Button variant="white" label="Still want it" onPress={() => decide('kept')} />
          <Button variant="ghost" label="Let it go" onPress={() => decide('let_go')} />
          <TextLink label="Decide later" style={{ color: 'rgba(255,255,255,0.7)' }} onPress={() => router.replace('/')} />
        </View>
      </View>
    </View>
  );
}
