import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { decideWant, formatDuration, knownApp, priceText, readyWants } from '../lib/core';
import { chooseApp } from '../lib/apps';
import { maybeAskReview } from '../lib/review';
import { workTime } from '../lib/rules';
import { getState, useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { Button, CircleButton, toast } from '../ui/components';
import { BigTag } from '../ui/flow/BigTag';
import { Enter, useFootPad, useHeadPad, WrFull } from '../ui/flow/kit';
import { StFace } from '../ui/StFace';
import { color, type } from '../ui/theme';

/** "Still want it?" for a parked want that's ready (V.decide, P:L1640). */
export default function Decide() {
  const headPad = useHeadPad();
  const footPad = useFootPad();
  // Two buttons side by side, as in the prototype; stacked where the labels wouldn't fit.
  const narrow = useWindowDimensions().width < 380;
  const params = useLocalSearchParams<{ id?: string }>();
  const parked = useAppState((s) => s.parked);
  const want = parked.find((w) => w.id === params.id && !w.decided) ?? readyWants()[0];

  if (!want) {
    return (
      <View style={{ flex: 1 }}>
        <WrFull />
        <View style={{ flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }}>
          <StFace size={84} />
          <Text accessibilityRole="header" style={[type.h1, { marginTop: 20, textAlign: 'center' }]}>
            Nothing to decide
          </Text>
          <Text style={[type.body, { marginTop: 8, textAlign: 'center' }]}>When a parked want is ready, it shows up here.</Text>
        </View>
        <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad }}>
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
      if (want.key) chooseApp(want.key);
      router.replace({
        pathname: '/pass',
        params: { app: want.app, fromRoom: '1', need: want.what, limit: want.price ? String(want.price) : '' },
      });
    }
  };

  const named = knownApp(want.app);
  const price = priceText(want);
  const work = want.band === 'exact' && want.price ? ` · about ${workTime(want.price)} of work` : '';
  return (
    <View style={{ flex: 1 }}>
      <WrFull />
      <View style={{ paddingTop: headPad, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row' }}>
        <CircleButton label="Decide later" onPress={() => router.replace('/')}>
          <ArrowLeftIcon size={20} color={color.text} weight="bold" />
        </CircleButton>
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 12, paddingHorizontal: 28, paddingBottom: 16, alignItems: 'center' }}>
        <BigTag
          name={want.what || (named ? `Something from ${want.app}` : 'Something you wanted')}
          app={want.app}
          appKey={want.key}
          meta={named ? `${want.app} · ${price}${work}` : `${price.charAt(0).toUpperCase()}${price.slice(1)}${work}`}
          stamp="Ready"
        />
        <Enter d={220}>
          <Text accessibilityRole="header" style={[type.display, { marginTop: 32, textAlign: 'center' }]}>
            Still want it?
          </Text>
        </Enter>
        <Enter d={290}>
          <Text style={[type.body, { marginTop: 12, textAlign: 'center' }]}>
            {want.buddy ? `${getState().buddy.name.trim() || 'Your friend'} let this one skip the wait.` : `You waited ${formatDuration(Date.now() - want.parkedAt)}.`} Any
            honest answer earns the same 10 XP.
          </Text>
        </Enter>
        <Enter d={340}>
          <Text style={[type.small, { marginTop: 12, textAlign: 'center' }]}>
            Let it go and it goes on your shelf. Still want it and you get a Shopping Pass with no pause.
          </Text>
        </Enter>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad, flexDirection: narrow ? 'column-reverse' : 'row', gap: 12 }}>
        <View style={{ flex: narrow ? undefined : 1 }}>
          <Button variant="secondary" label="Let it go" onPress={() => decide('let_go')} />
        </View>
        <View style={{ flex: narrow ? undefined : 1 }}>
          <Button label="Still want it" onPress={() => decide('kept')} />
        </View>
      </View>
    </View>
  );
}
