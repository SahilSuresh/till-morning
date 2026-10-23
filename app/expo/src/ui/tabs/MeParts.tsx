import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused } from 'expo-router';
import { CaretRightIcon, CheckCircleIcon, MicrophoneIcon, PackageIcon } from '../ph';
import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import R, { css } from 'react-native-reanimated';

import { lockDays, TIERS, tierFor } from '../../lib/budget';
import { GOALS, STICKER_IMG, STICKER_NAME } from '../../lib/progress';
import { dayKey, useAppState } from '../../lib/store';
import { Button, Card, Chip, useReduceMotion } from '../components';
import { NotePlayer } from '../NotePlayer';
import { Seal } from '../Seal';
import { color, font, gradient, type } from '../theme';
import { Tile } from './Tile';

// ---- Sticker goals (meExtras, P:L2107–2112; CSS P:L1741–1759) ---------------------------------

const foil = css.keyframes({ from: { transform: [{ translateX: 0 }] }, to: { transform: [{ translateX: -120 }] } });

/** .sp-chip: a foil pill, linear-gradient(90deg, #FFE38F, #F3D1FF, #FFE38F) sliding past (3 s). */
function ProofChip() {
  const rm = useReduceMotion();
  const focused = useIsFocused();
  return (
    <View style={{ alignSelf: 'flex-start', marginBottom: 3, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 1 }}>
      <R.View
        style={[
          { position: 'absolute', left: 0, top: 0, bottom: 0, width: 240 },
          !rm && { animationName: foil, animationDuration: 3000, animationIterationCount: 'infinite', animationTimingFunction: 'linear', animationPlayState: focused ? 'running' : 'paused' },
        ]}
      >
        <LinearGradient
          colors={['#FFE38F', '#F3D1FF', '#FFE38F', '#F3D1FF', '#FFE38F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </R.View>
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, letterSpacing: 0.2, color: '#14163A' }}>Proof only</Text>
    </View>
  );
}

/** A sticker image. Not earned yet: grey (a tinted copy laid over it) and faded, as filter: grayscale() brightness() does. */
function StickerImg({ k, got, special }: { k: string; got: boolean; special?: boolean }) {
  const src = STICKER_IMG[k as keyof typeof STICKER_IMG];
  if (!src) return <Text style={{ fontFamily: font.display, fontSize: 20, color: got ? color.inkOnBright : '#6E72AA' }}>£</Text>;
  return (
    <View style={{ width: 40, height: 40, opacity: got ? 1 : special ? 0.75 : 0.45 }}>
      <Image source={src} style={{ width: 40, height: 40 }} resizeMode="contain" />
      {!got && (
        <Image
          source={src}
          tintColor={special ? '#A9A4C8' : '#4C4F78'}
          style={{ position: 'absolute', width: 40, height: 40, opacity: special ? 0.4 : 0.85 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

export function StickerGoals() {
  const got = useAppState((s) => s.got);
  const queue = useAppState((s) => s.queue);
  // Only what the goals count: re-renders when one of these changes, not on every state change.
  const cnt = useAppState((s) => s.cnt);
  const parked = useAppState((s) => s.parked);
  const stamps = useAppState((s) => s.stamps);
  const cards = useAppState((s) => s.cardsFilled);
  const challenge = useAppState((s) => s.settings.challenge + s.settings.challengeAt);
  const focused = useIsFocused();
  const day = focused ? dayKey() : '';
  const values = useMemo(
    () => GOALS.map((g) => Math.min(g.get(), g.n)),
    // g.get() reads these through getState(); the day moves the challenge goal on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cnt, parked, stamps, cards, challenge, day],
  );

  return (
    <Card style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text accessibilityRole="header" style={type.h2}>
          Sticker goals
        </Text>
        <Chip tone="sun" label={`${got.length} of ${GOALS.length}`} />
      </View>
      <Text style={[type.small, { marginTop: 4 }]}>Finish a goal to earn its sticker. They can’t be bought. Tap one to see how.</Text>
      <View style={{ marginTop: 8 }}>
        {GOALS.map((g, i) => {
          const has = got.includes(g.k);
          const done = queue.includes(g.k);
          const v = values[i];
          return (
            <Pressable
              key={g.k}
              onPress={() => router.push({ pathname: '/goal', params: { k: g.k } })}
              accessibilityRole="button"
              accessibilityLabel={`${g.task}, ${v} of ${g.n}. Show how to get it`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 2, borderTopWidth: i ? 1.5 : 0, borderColor: color.divider }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: has ? '#FFF6D8' : '#1C2057',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: g.special ? 1.5 : 0,
                  borderColor: 'rgba(255,227,143,0.6)',
                }}
              >
                {g.special && <LinearGradient colors={['#FFE38F', '#B48CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />}
                <StickerImg k={g.k} got={has} special={g.special} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                {g.special && <ProofChip />}
                <Text style={type.title}>{has ? STICKER_NAME[g.k] : g.task}</Text>
                {has ? (
                  <Text style={type.small}>{g.task}</Text>
                ) : done ? (
                  <Text style={[type.small, { color: color.sun }]}>Done! Open your parcel below</Text>
                ) : (
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: '#23275E', marginTop: 6, overflow: 'hidden' }}>
                    <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 6, borderRadius: 3, width: `${Math.round((v / g.n) * 100)}%` }} />
                  </View>
                )}
              </View>
              {has || done ? (
                <CheckCircleIcon size={20} weight="fill" color={color.mint} />
              ) : (
                <Text style={[type.small, { fontVariant: ['tabular-nums'] }]}>
                  {v} / {g.n}
                </Text>
              )}
              <CaretRightIcon size={18} weight="bold" color={color.text3} />
            </Pressable>
          );
        })}
      </View>
      {queue.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Button
            variant="secondary"
            icon={<PackageIcon size={20} weight="bold" color={color.text} />}
            label={queue.length > 1 ? `Open ${queue.length} parcels` : 'Open your parcel'}
            onPress={() => router.push('/parcel')}
          />
        </View>
      )}
    </Card>
  );
}

// ---- Note from calm you (P:L2113–2114) ---------------------------------------------------------

export function NoteCard() {
  const note = useAppState((s) => s.note);
  if (note) {
    return (
      <Card style={{ padding: 16 }}>
        <Text accessibilityRole="header" style={type.h2}>
          Your note from calm you
        </Text>
        <View style={{ marginTop: 12 }}>
          <NotePlayer note={note} onDark={false} />
        </View>
        <Text style={[type.small, { marginTop: 8 }]}>It plays in every pause.</Text>
        <Pressable onPress={() => router.push('/note')} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.blueLight, textDecorationLine: 'underline' }}>Record a new one</Text>
        </Pressable>
      </Card>
    );
  }
  return (
    <Pressable onPress={() => router.push('/note')} accessibilityRole="button" accessibilityLabel="A note from calm you. Record a few words. They play in your pause.">
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Tile tone="lav" Icon={MicrophoneIcon} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={type.title}>A note from calm you</Text>
          <Text style={type.small}>Record a few words. They play in your pause.</Text>
        </View>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.blueLight, textDecorationLine: 'underline' }}>Record</Text>
      </Card>
    </Pressable>
  );
}

// ---- Bank limit seal (moved here from Today) ----------------------------------------------------

export function BankSealCard({ at }: { at: number }) {
  const d = lockDays(at);
  const ti = tierFor(d);
  const t = TIERS[ti];
  const nx = TIERS[ti + 1];
  const pct = nx ? Math.round(((d - t.from) / (nx.from - t.from)) * 100) : 100;
  return (
    <Pressable onPress={() => router.push('/bank')} accessibilityRole="button" accessibilityLabel={`${t.name} seal, day ${d}. Bank limit, self-reported`}>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Seal size={52} tier={ti} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={type.title}>{t.name} seal</Text>
          <Text style={type.small}>Bank limit, self-reported</Text>
          <View style={{ marginTop: 6, height: 6, borderRadius: 3, backgroundColor: '#23275E', overflow: 'hidden' }}>
            <LinearGradient colors={[t.c[1], t.c[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 6, width: `${pct}%` }} />
          </View>
          <Text style={[type.small, { marginTop: 4 }]}>{nx ? `${nx.from - d} day${nx.from - d === 1 ? '' : 's'} to ${nx.name}` : 'Top seal reached'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: font.display, fontSize: 26, lineHeight: 28, color: t.c[1] }}>{d}</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.text2, marginTop: 2 }}>day{d === 1 ? '' : 's'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}
