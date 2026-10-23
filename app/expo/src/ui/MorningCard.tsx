import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';

import { readyWants } from '../lib/core';
import { activeChallenge } from '../lib/rules';
import { useAppState } from '../lib/store';
import { IconCheck, IconX } from './icons';
import { font } from './theme';

/** heroCard() from the prototype: mascot bubble, title, 10 calm-day nodes ending in a chest. */
export function MorningCard() {
  const s = useAppState((st) => st);
  const n = s.stamps;
  const ready = readyWants().length;
  const waiting = s.parked.filter((w) => !w.decided).length;
  const risky = new Date().getHours() >= 22;
  const ch = activeChallenge();

  const say = ready
    ? `Morning-you has ${ready} thing${ready > 1 ? 's' : ''} to decide.`
    : s.queue.length
      ? 'There’s a parcel for you on Today.'
      : risky
        ? 'It’s your risky hour, so I’ve made the pause longer.'
        : s.dayBroken
          ? `No stamp today: ${s.brokenWhy || 'your shields went off'}. Tomorrow is a fresh start.`
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
        <View style={{ borderRadius: 26, backgroundColor: '#2A3BC0', paddingBottom: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 }}>
          <LinearGradient colors={['#5A48F2', '#3D5AFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 16, gap: 12, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -40, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.12)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image source={require('../../assets/mascots/welcome.webp')} style={{ width: 74, height: 74 }} resizeMode="contain" />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={{ backgroundColor: 'rgba(13,15,46,0.35)', borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 10, paddingVertical: 8 }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, lineHeight: 18, color: '#FFFFFF' }}>{say}</Text>
                </View>
                <Text style={{ fontFamily: font.display, fontSize: 20, color: '#FFFFFF' }}>{ch ? `${ch.name} · day ${ch.day}` : 'Shop on purpose'}</Text>
              </View>
            </View>

            {/* The track: 10 nodes and a chest */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'absolute', left: 10, right: 30, height: 6, borderRadius: 9, backgroundColor: 'rgba(13,15,46,0.35)' }} />
              <View style={{ position: 'absolute', left: 10, height: 6, borderRadius: 9, backgroundColor: '#5EE9B5', width: `${(n / 10) * 82}%` }} />
              {Array.from({ length: 10 }).map((_, i) => {
                const done = i < n;
                const now = i === n;
                const missed = now && s.dayBroken;
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: done ? '#5EE9B5' : missed ? '#3A2350' : now ? '#FFFFFF' : '#2B2F8A',
                        borderColor: done ? '#5EE9B5' : missed ? '#FF8F78' : now ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                        shadowColor: '#FFFFFF',
                        shadowOpacity: now && !missed ? 0.8 : 0,
                        shadowRadius: 8,
                      }}
                    >
                      {done && <IconCheck size={12} color="#14163A" />}
                      {missed && <IconX size={11} color="#FFAB98" />}
                    </View>
                  </View>
                );
              })}
              <View
                style={{
                  width: 32,
                  height: 26,
                  marginLeft: 4,
                  borderRadius: 5,
                  backgroundColor: '#F2B829',
                  shadowColor: '#FFC94D',
                  shadowOpacity: 0.8,
                  shadowRadius: 7,
                  alignItems: 'center',
                }}
                accessibilityLabel="50 XP when the card is full"
              >
                <View style={{ position: 'absolute', top: 0, bottom: 0, width: 6, backgroundColor: '#FFF1C9' }} />
                <View style={{ position: 'absolute', left: -2, right: -2, top: 6, height: 3, backgroundColor: '#C88A00' }} />
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
