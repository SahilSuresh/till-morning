import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused } from 'expo-router';
import { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { GOALS, STICKER_IMG, STICKER_NAME } from '../../lib/progress';
import { dayKey, useAppState } from '../../lib/store';
import { Button } from '../components';
import { CaretRightIcon, PackageIcon } from '../ph';
import { color, font } from '../theme';
import { Pressable } from '../Pressable';

// Me, in the Night Trolley world: your stickers on a moon-yellow shelf (opening the sticker book),
// and recent decisions printed as a Till Morning receipt.

const MOON = '#FFE7A3';
const DISC = 38;

/** The sticker book's cover on Me: earned stickers first on two shelves, the next goal under them. */
export function StickerShelf() {
  const got = useAppState((s) => s.got);
  const queue = useAppState((s) => s.queue);
  const cnt = useAppState((s) => s.cnt);
  const parked = useAppState((s) => s.parked);
  const stamps = useAppState((s) => s.stamps);
  const cards = useAppState((s) => s.cardsFilled);
  const focused = useIsFocused();
  const day = focused ? dayKey() : '';
  const values = useMemo(
    () => GOALS.map((g) => Math.min(g.get(), g.n)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cnt, parked, stamps, cards, day],
  );
  // Earned first, then the ones closest to done.
  const order = GOALS.map((g, i) => ({ g, v: values[i], has: got.includes(g.k) })).sort((a, b) => Number(b.has) - Number(a.has) || b.v / b.g.n - a.v / a.g.n);
  const next = order.find((x) => !x.has && !queue.includes(x.g.k));
  const rows = [order.slice(0, 5), order.slice(5)];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/stickers', params: { from: 'me' } })}
      accessibilityRole="button"
      accessibilityLabel={`Sticker book, ${got.length} of ${GOALS.length}. Open it`}
    >
      {({ pressed }) => (
        <View style={{ borderRadius: 22, backgroundColor: '#15184A', paddingBottom: 3, transform: [{ scale: pressed ? 0.985 : 1 }] }}>
          <LinearGradient
            colors={['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, borderWidth: 1, borderColor: '#3A3F86', padding: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ flex: 1, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: color.text }}>Sticker book</Text>
              <View style={{ borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, backgroundColor: 'rgba(255,231,163,0.14)' }}>
                <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: MOON }}>
                  {got.length} of {GOALS.length}
                </Text>
              </View>
              <CaretRightIcon size={18} weight="bold" color={color.text3} />
            </View>

            {/* two little shelves */}
            <View style={{ marginTop: 12, gap: 12 }}>
              {rows.map((row, r) => (
                <View key={r}>
                  <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 6, alignItems: 'flex-end' }}>
                    {row.map(({ g, has }) => {
                      const src = STICKER_IMG[g.k];
                      return (
                        <View
                          key={g.k}
                          style={{
                            width: DISC,
                            height: DISC,
                            borderRadius: DISC / 2,
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            backgroundColor: has ? '#FFF6D8' : 'rgba(20,23,63,0.9)',
                            borderWidth: has ? 0 : 1.2,
                            borderStyle: 'dashed',
                            borderColor: 'rgba(196,181,253,0.45)',
                          }}
                        >
                          {src ? (
                            <View style={{ width: 30, height: 30, opacity: has ? 1 : 0.5 }}>
                              <Image source={src} style={{ width: 30, height: 30 }} resizeMode="contain" />
                              {!has && <Image source={src} tintColor="#3A3F86" style={{ position: 'absolute', width: 30, height: 30 }} resizeMode="contain" />}
                            </View>
                          ) : (
                            <Text style={{ fontFamily: font.display, fontSize: 17, color: has ? color.inkOnBright : '#5A5F9E' }}>£</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={{ marginTop: 4, height: 3, borderRadius: 2, backgroundColor: MOON, opacity: 0.85 }} />
                </View>
              ))}
            </View>

            {next ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.text2 }} numberOfLines={1}>
                  Next: {next.g.task}
                </Text>
                <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(196,181,253,0.18)', overflow: 'hidden' }}>
                    <LinearGradient
                      colors={['#7C4DFF', '#A066FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ height: 6, borderRadius: 3, width: `${Math.max(4, Math.round((next.v / next.g.n) * 100))}%` }}
                    />
                  </View>
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12, color: MOON, fontVariant: ['tabular-nums'] }}>
                    {next.v} / {next.g.n}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={{ marginTop: 12, fontFamily: font.bodyBold, fontSize: 13, color: MOON }}>Every sticker collected. Legend.</Text>
            )}
          </LinearGradient>
        </View>
      )}
    </Pressable>
  );
}

/** "Open your parcel" when a finished goal's sticker is waiting. */
export function ParcelButton() {
  const queue = useAppState((s) => s.queue);
  if (!queue.length) return null;
  return (
    <Button
      variant="night"
      icon={<PackageIcon size={20} weight="bold" color="#FFFFFF" />}
      label={queue.length > 1 ? `Open ${queue.length} parcels` : `Open your parcel: ${STICKER_NAME[queue[0] as keyof typeof STICKER_NAME] ?? 'a sticker'}`}
      onPress={() => router.push('/parcel')}
    />
  );
}

/** Recent decisions as a Till Morning receipt: time, what you did, and the XP it earned. */
export function DecisionsReceipt({ entries }: { entries: { at: number; label: string; amount: number }[] }) {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  return (
    <View accessibilityLabel="Recent decisions">
      <View style={{ backgroundColor: '#FFFBEF', borderTopLeftRadius: 8, borderTopRightRadius: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12, letterSpacing: 2.5, color: '#1E1B3A', textAlign: 'center' }}>TILL MORNING</Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 10.5, letterSpacing: 1, color: '#6B6890', textAlign: 'center' }}>YOUR RECENT DECISIONS</Text>
        <Dashes />
        {entries.length ? (
          entries.map((e, i) => (
            <View key={`${e.at}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 }}>
              <Text style={{ width: 42, fontFamily: font.bodyBold, fontSize: 12, color: '#6B6890', fontVariant: ['tabular-nums'] }}>
                {new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 18, color: '#1E1B3A' }}>{e.label}</Text>
              <Text
                style={{
                  fontFamily: font.bodyHeavy,
                  fontSize: 13,
                  color: e.amount > 0 ? '#1F8A62' : e.amount < 0 ? '#C2553F' : '#6B6890',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {e.amount > 0 ? '+' : e.amount < 0 ? '−' : ''}
                {Math.abs(e.amount)} XP
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ paddingVertical: 8, fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: '#1E1B3A', textAlign: 'center' }}>
            Nothing on the receipt yet. Open a shielded app from your Home Screen to make your first decision.
          </Text>
        )}
        {entries.length > 0 && (
          <>
            <Dashes />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, letterSpacing: 1, color: '#1E1B3A' }}>TOTAL</Text>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: '#4524A8', fontVariant: ['tabular-nums'] }}>
                {total >= 0 ? '+' : '−'}
                {Math.abs(total)} XP
              </Text>
            </View>
          </>
        )}
      </View>
      {/* the torn bottom edge */}
      <Svg width="100%" height={8} viewBox="0 0 100 8" preserveAspectRatio="none">
        <Path d={`M0 0 ${Array.from({ length: 20 }, (_, i) => `L${i * 5 + 2.5} 8 L${i * 5 + 5} 0`).join(' ')} Z`} fill="#FFFBEF" />
      </Svg>
    </View>
  );
}

function Dashes() {
  return (
    <View style={{ height: 1, marginVertical: 8, flexDirection: 'row', gap: 4, overflow: 'hidden' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <View key={i} style={{ width: 5, height: 1.5, backgroundColor: '#B9B5D3' }} />
      ))}
    </View>
  );
}
