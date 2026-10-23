import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endPass, formatReady, protectedCount, readyWants, shieldChosenApps } from '../../lib/core';
import { useAppState } from '../../lib/store';
import { TopGlow } from '../../ui/backgrounds';
import { Button, Card, Chip, Rise } from '../../ui/components';
import { IconHourglass, IconMoon, IconShield, IconTicket } from '../../ui/icons';
import { useTabBarSpace } from '../../ui/layout';
import { RankCard } from '../../ui/RankCard';
import { color, font, gradient, type } from '../../ui/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export default function Today() {
  const insets = useSafeAreaInsets();
  const s = useAppState((st) => st);
  const now = useNow();
  const tabSpace = useTabBarSpace();

  const counts = protectedCount();
  const shielded = counts.apps + counts.categories;
  const ready = readyWants(now);
  const waiting = s.parked.filter((w) => !w.decided && w.readyAt > now);

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: tabSpace + 76, gap: 14 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={type.h1}>{greeting()}</Text>
          {s.shieldsOn ? (
            <Chip tone="mint" label="Shields on" icon={<IconShield size={13} />} />
          ) : (
            <Chip tone="paper" label="Shields off" />
          )}
        </View>

        {/* Check-in nudge */}
        {s.pendingCheckIn && (
          <Rise>
            <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button">
              <View style={{ borderRadius: 22, backgroundColor: color.sunEdge, paddingBottom: 3 }}>
                <View style={{ borderRadius: 22, backgroundColor: color.sun, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(20,22,58,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <IconTicket size={22} color={color.inkOnBright} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.title, { color: color.inkOnBright }]}>{s.pendingCheckIn.wholeSelection ? 'Your Shopping Pass ended' : `Your ${s.pendingCheckIn.app} pass ended`}</Text>
                    <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.inkOnBright }}>How did it go?</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Rise>
        )}

        {/* Live pass */}
        {s.pass && (
          <Rise>
            <View style={{ borderRadius: 22, backgroundColor: '#5427B8', paddingBottom: 3 }}>
              <LinearGradient
                colors={gradient.ticket}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
                style={{ borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[type.title, { color: '#FFFFFF' }]}>{s.pass.wholeSelection ? 'Shopping pass' : `${s.pass.app} pass`}</Text>
                  <Text numberOfLines={2} style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                    {(s.pass.need || { specific: 'Something specific', browsing: 'Just browsing', unsure: 'Not sure yet' }[s.pass.reason]) +
                      (s.pass.limit ? `, up to £${s.pass.limit}` : '')}
                  </Text>
                  <Pressable onPress={() => endPass(true)} accessibilityRole="button" hitSlop={8} style={{ marginTop: 8 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, color: '#FFFFFF', textDecorationLine: 'underline' }}>End it now</Text>
                  </Pressable>
                </View>
                <View style={{ width: 0, alignSelf: 'stretch', borderLeftWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.36)' }} />
                <View style={{ alignItems: 'center', minWidth: 64 }}>
                  <Text style={{ fontFamily: font.display, fontSize: 24, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
                    {mmss(s.pass.endsAt - now)}
                  </Text>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>left</Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    height: 5,
                    backgroundColor: 'rgba(255,255,255,0.32)',
                    width: `${Math.max(0, Math.min(100, ((s.pass.endsAt - now) / (s.pass.endsAt - s.pass.startedAt)) * 100))}%`,
                  }}
                />
              </LinearGradient>
            </View>
          </Rise>
        )}

        {/* Status */}
        <Rise delay={40}>
          <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
            <Image source={require('../../../assets/mascots/shieldm.webp')} style={{ width: 84, height: 84 }} resizeMode="contain" />
            {!s.shieldsOn ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>Shields are off</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button label="Turn shields back on" onPress={shieldChosenApps} />
                </View>
              </>
            ) : shielded === 0 ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>No apps shielded</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button label="Choose apps" onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })} />
                </View>
              </>
            ) : (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>
                  {counts.categories > 0
                    ? `${counts.categories === 1 ? 'A whole category' : `${counts.categories} categories`}${counts.apps ? ` and ${counts.apps} more` : ''} shielded`
                    : counts.apps === 1
                      ? '1 app is shielded'
                      : `${counts.apps} apps are shielded`}
                </Text>
                <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>Pauses get longer from 22:00.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.mint }} />
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.mintText }}>Shields working</Text>
                </View>
              </>
            )}
          </Card>
        </Rise>

        {/* Waiting room */}
        <Rise delay={80}>
          <Pressable onPress={() => router.push('/waiting')} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ready.length ? 'rgba(94,233,181,0.14)' : 'rgba(167,139,250,0.19)',
                }}
              >
                {ready.length ? <IconHourglass size={22} color="#6EF0BF" /> : <IconMoon size={22} color="#CBBBFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: ready.length ? color.mintText : color.text3 }]}>
                  {ready.length ? 'Ready now' : waiting.length ? `Ready ${formatReady(Math.min(...waiting.map((w) => w.readyAt)), now)}` : 'Waiting room'}
                </Text>
                <Text style={type.title}>
                  {ready.length
                    ? `${ready.length} ready to decide`
                    : waiting.length
                      ? `${waiting.length} parked ${waiting.length === 1 ? 'want' : 'wants'}`
                      : 'Nothing parked'}
                </Text>
                <Text style={type.small}>
                  {ready.length
                    ? 'You slept on it. Now you get the final say.'
                    : waiting.length
                      ? 'Decide with a clear head.'
                      : 'When a want hits, park it till morning.'}
                </Text>
              </View>
            </Card>
          </Pressable>
        </Rise>

        {/* Rank */}
        <Rise delay={120}>
          <RankCard />
        </Rise>
      </ScrollView>

      {/* Fixed footer above the tab bar: Need to shop? */}
      {!s.pass && (
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: tabSpace - 4 }}>
          <Pressable
            onPress={() => router.push({ pathname: '/pause', params: { app: 'your shop apps' } })}
            accessibilityRole="button"
            accessibilityHint="You get the usual pause first"
          >
            {({ pressed }) => (
              <View style={{ borderRadius: 999, backgroundColor: '#4B2BB0', paddingBottom: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 }}>
                <LinearGradient
                  colors={gradient.passPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <IconTicket size={20} />
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, color: '#FFFFFF' }}>Need to shop? Get a pass</Text>
                </LinearGradient>
              </View>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
