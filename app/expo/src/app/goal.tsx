import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GOAL_HOW, GOALS, STICKER_IMG, STICKER_NAME } from '../lib/progress';
import { useAppState } from '../lib/store';
import { Button, Card, CircleButton, Rise } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

/** V.goal from the prototype: what a sticker goal counts, your progress, and how to get it. */
export default function Goal() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ k?: string }>();
  useAppState((s) => s); // re-render as progress changes
  const g = GOALS.find((x) => x.k === params.k) ?? GOALS[4];
  const how = GOAL_HOW[g.k];
  const got = useAppState((s) => s.got.includes(g.k));
  const waiting = useAppState((s) => s.queue.includes(g.k));
  const v = Math.min(g.get(), g.n);
  const pct = Math.round((v / g.n) * 100);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const cta = () => {
    const [, to] = how.cta;
    if (to === 'waiting' || to === 'ready') router.replace('/waiting');
    else if (to === 'pass') router.replace({ pathname: '/pause', params: { app: 'your shop apps' } });
    else if (to === 'settings') router.replace('/rules');
    else back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Sticker goal</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 8, paddingBottom: 16 }}>
        <Rise style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 34,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: got ? '#FFF6D8' : '#1C2057',
              overflow: 'hidden',
              shadowColor: '#15184A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 0,
            }}
          >
            {g.special && !got && <LinearGradient colors={['#FFE38F', '#B48CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />}
            {STICKER_IMG[g.k] ? (
              <Image source={STICKER_IMG[g.k]!} style={{ width: 96, height: 96, opacity: got ? 1 : g.special ? 0.8 : 0.45 }} resizeMode="contain" />
            ) : (
              <Text style={{ fontFamily: font.display, fontSize: 40, color: color.inkOnBright }}>£</Text>
            )}
          </View>
          {g.special && (
            <View style={{ marginTop: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#FFE38F' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12, color: color.inkOnBright }}>Proof only</Text>
            </View>
          )}
          <Text style={{ marginTop: 12, fontFamily: font.bodyHeavy, fontSize: 13, letterSpacing: 0.8, color: color.sun }}>
            {STICKER_NAME[g.k].toUpperCase()} STICKER
          </Text>
          <Text style={[type.h1, { textAlign: 'center', marginTop: 4 }]}>{g.task}</Text>
        </Rise>

        <Rise delay={60} style={{ marginTop: 20 }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text style={type.label}>Your progress</Text>
              <Text style={{ fontFamily: font.display, fontSize: 22, color: color.text }}>
                {v} of {g.n}
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 99, backgroundColor: '#23275E', marginTop: 10, overflow: 'hidden' }}>
              <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 10, width: `${pct}%`, borderRadius: 99 }} />
            </View>
            <Text style={[type.small, { marginTop: 8 }]}>
              {got ? 'Earned. It’s on your sticker shelf.' : waiting ? 'Done! Your parcel is waiting on Today.' : `${g.n - v} to go.`}
            </Text>
            {how.today && !got && (
              <View style={{ marginTop: 10, borderRadius: 14, backgroundColor: 'rgba(94,233,181,0.1)', paddingHorizontal: 12, paddingVertical: 9 }}>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19, color: '#A8F5D6' }}>{how.today()}</Text>
              </View>
            )}
          </Card>
        </Rise>

        <Rise delay={100}>
          <Text style={[type.h2, { marginTop: 24, marginBottom: 8 }]}>What counts</Text>
          <Text style={type.body}>{how.what}</Text>
          <Text style={[type.h2, { marginTop: 24, marginBottom: 12 }]}>How to get it</Text>
          <View style={{ gap: 10 }}>
            {how.steps.map((t, i) => (
              <View key={t} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#2A2F7A', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: '#C9D3FF' }}>{i + 1}</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 16, lineHeight: 22, color: '#E4E3FA', paddingTop: 3 }}>{t}</Text>
              </View>
            ))}
          </View>
          <Text style={[type.small, { marginTop: 20 }]}>Stickers only come from things Till Morning can check. They can’t be bought.</Text>
        </Rise>
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: insets.bottom + 20 }}>
        {got ? (
          <Button label="Back to Me" onPress={back} />
        ) : waiting ? (
          <Button label="Open your parcel" onPress={() => router.replace('/parcel')} />
        ) : (
          <Button label={how.cta[0]} onPress={cta} />
        )}
      </View>
    </View>
  );
}
