import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasTmNative } from '../../modules/tm-native';
import { track } from '../lib/analytics';
import { pickScreenshot, readScreenshot } from '../lib/ocr';
import { bump } from '../lib/progress';
import { type CheckInAnswer, getState, setState, useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { Chip, OptionCard, springOut, TextLink, toast, useReduceMotion } from '../ui/components';
import { IconReceipt } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

const ANSWERS: { id: CheckInAnswer; label: string }[] = [
  { id: 'stuck', label: 'Bought only what I planned' },
  { id: 'didnt_buy', label: 'Didn’t buy anything' },
  { id: 'bought_else', label: 'Bought something else too' },
];

type Proof = null | 'reading' | 'fail' | { total: number; under: boolean };

const REASON_LABEL = { specific: 'Something specific', browsing: 'Just browsing', unsure: 'Not sure yet' } as const;

export default function CheckIn() {
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const pass = useAppState((s) => s.pendingCheckIn);
  const [askHelp, setAskHelp] = useState(false);
  const [proof, setProof] = useState<Proof>(null);
  const stamp = useRef(new Animated.Value(rm ? 1 : 0)).current;

  useEffect(() => {
    if (rm) return;
    Animated.timing(stamp, { toValue: 1, duration: 500, delay: 380, easing: springOut, useNativeDriver: true }).start();
  }, [rm, stamp]);

  useEffect(() => {
    if (!pass && !askHelp) router.replace('/');
  }, [pass, askHelp]);
  if (!pass) return <View style={{ flex: 1, backgroundColor: color.night }} />;

  const plan = `${pass.need || REASON_LABEL[pass.reason]}${pass.limit ? `, up to £${pass.limit}` : ''}`;
  const lim = parseFloat(pass.limit) || 0;

  const addProof = async () => {
    if (!hasTmNative) return toast('Reading screenshots needs the latest Till Morning install');
    const uri = await pickScreenshot().catch(() => null);
    if (!uri) return;
    setProof('reading');
    try {
      const r = await readScreenshot(uri);
      setProof(r.total ? { total: r.total, under: r.total <= lim } : 'fail');
    } catch {
      setProof('fail');
    }
  };

  const answer = (a: CheckInAnswer) => {
    const r = award(10, 'Checked in after a pass');
    // Proof only: a checkout screenshot under the limit you set earns +15 and counts for the receipt stickers.
    const proved = a === 'stuck' && proof && typeof proof === 'object' && proof.under;
    if (proved) {
      award(15, 'Proved you stayed under your limit');
      const g = bump('underLimit');
      if (g) setTimeout(() => toast(g), 5400);
    }
    const done = getState().checkInsDone + 1;
    setState((s) => ({ pendingCheckIn: null, checkInsDone: done, checkinLog: [...s.checkinLog, { at: Date.now(), answer: a }].slice(-100) }));
    track('check_in_completed');
    toast(xpToast(r, proved ? 'Under your limit, with proof. Great self-control' : 'Thanks for being honest'));
    const goal = bump('checkin');
    if (goal) setTimeout(() => toast(goal), 2700);
    // "Did this pause help?" after the first pass, then every third.
    if (done === 1 || done % 3 === 0) setTimeout(() => setAskHelp(true), 900);
    else router.replace('/');
  };

  const skip = () => {
    setState({ pendingCheckIn: null });
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, alignItems: 'center' }}>
        {/* The used ticket */}
        <View style={{ width: 236, height: 92 }}>
          <LinearGradient
            colors={gradient.ticket}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.6 }}
            style={{ flex: 1, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>Shopping pass</Text>
            <Text style={{ fontFamily: font.display, fontSize: 28, color: '#FFFFFF' }}>{pass.minutes} min</Text>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' }}>{pass.app}</Text>
          </LinearGradient>
          <Animated.View
            style={{
              position: 'absolute',
              right: -4,
              top: 22,
              opacity: stamp,
              transform: [
                { scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
                { rotate: stamp.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '-14deg'] }) },
              ],
              borderWidth: 3,
              borderColor: '#D61F4B',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: 'rgba(255,240,243,0.94)',
            }}
          >
            <Text style={{ fontFamily: font.display, fontSize: 24, color: '#D61F4B' }}>Used</Text>
          </Animated.View>
        </View>

        <Text style={[type.small, { marginTop: 14, textAlign: 'center' }]}>
          {pass.wholeSelection
            ? 'Your Shopping Pass ended, so your shop apps are locked again.'
            : `Your ${pass.app} pass ended, so ${pass.app} is locked again.`}
        </Text>
        <Text style={[type.h1, { marginTop: 8, textAlign: 'center' }]}>Did you stick to the plan?</Text>

        {/* Paper receipt with a zigzag bottom edge */}
        <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
          <View style={{ backgroundColor: color.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <IconReceipt />
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: color.paperLabel }}>Your plan</Text>
            </View>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 16.5, color: color.inkOnBright, marginTop: 6 }}>{plan}</Text>
          </View>
          <View style={{ flexDirection: 'row', height: 8, overflow: 'hidden' }}>
            {Array.from({ length: 40 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  marginTop: -8,
                  backgroundColor: color.paper,
                  transform: [{ rotate: '45deg' }],
                  marginRight: -4.7,
                }}
              />
            ))}
          </View>
        </View>

        {lim > 0 && (
          <View style={{ alignSelf: 'stretch', marginTop: 16, backgroundColor: color.card, borderColor: '#2E3374', borderWidth: 1.5, borderRadius: 20, padding: 16 }}>
            {proof === null ? (
              <Pressable onPress={addProof} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 26 }}>🧾</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>
                    Add your checkout screenshot <Text style={type.small}>(optional)</Text>
                  </Text>
                  <Text style={type.small}>Stayed under your £{pass.limit} limit? Prove it for +15 bonus XP and proof-only stickers.</Text>
                </View>
              </Pressable>
            ) : proof === 'reading' ? (
              <View>
                <Text style={type.title}>Reading your screenshot…</Text>
                <Text style={type.small}>On this phone. The picture never leaves it.</Text>
              </View>
            ) : proof === 'fail' ? (
              <View>
                <Text style={type.title}>Couldn’t find a total</Text>
                <Text style={type.small}>Try a screenshot that shows the order total, like the last checkout page.</Text>
                <TextLink label="Try another screenshot" onPress={() => setProof(null)} />
              </View>
            ) : (
              <View>
                <Text style={[type.title, { color: proof.under ? color.mintText : '#FFAB98' }]}>{proof.under ? '✓ Under your limit' : 'Over your limit'}</Text>
                <Text style={type.small}>
                  Checkout total £{proof.total.toFixed(2)} · your limit £{pass.limit}
                </Text>
                <Text style={[type.small, { marginTop: 4 }]}>
                  {proof.under
                    ? 'Pick “Bought only what I planned” for +15 bonus XP and a step to a proof-only sticker.'
                    : 'No bonus this time. An honest answer still earns 10 XP.'}
                </Text>
                <TextLink label="Try another screenshot" onPress={() => setProof(null)} />
              </View>
            )}
          </View>
        )}

        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 20 }}>
          {ANSWERS.map((a) => (
            <OptionCard key={a.id} label={a.label} selected={false} onPress={() => answer(a.id)} right={<Chip tone="mint" label="+10 XP" />} />
          ))}
        </View>

        <Text style={[type.small, { textAlign: 'center', marginTop: 16 }]}>
          Every honest answer earns the same 10 XP. This is for you, not a test.
        </Text>
        <TextLink label="Skip" onPress={skip} style={{ fontSize: 17, marginTop: 4 }} />
      </ScrollView>

      <HelpPrompt
        visible={askHelp}
        onDone={(helped) => {
          setAskHelp(false);
          if (helped !== null) {
            setState((s) => ({ pauseHelped: { yes: s.pauseHelped.yes + (helped ? 1 : 0), asked: s.pauseHelped.asked + 1 } }));
            toast(helped ? 'Glad it helped' : 'Thanks. We’ll keep improving the pause.');
          }
          router.replace('/');
        }}
      />
    </View>
  );
}

function HelpPrompt({ visible, onDone }: { visible: boolean; onDone: (helped: boolean | null) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = ['Yes, I changed my mind', 'Yes, I thought it through', 'Not really'];
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(6,6,28,0.6)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: color.card, borderColor: '#2E3374', borderWidth: 1.5, borderRadius: 28, padding: 24 }}>
          <Text style={[type.h1, { fontSize: 24, lineHeight: 28 }]}>Did this pause help?</Text>
          <Text style={[type.body, { marginTop: 6 }]}>One tap. It helps us make Till Morning better for you.</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            {options.map((o, i) => (
              <OptionCard
                key={o}
                label={o}
                selected={picked === i}
                onPress={() => {
                  setPicked(i);
                  setTimeout(() => onDone(i < 2), 250);
                }}
              />
            ))}
          </View>
          <TextLink label="Not now" style={{ color: color.text3 }} onPress={() => onDone(null)} />
        </View>
      </View>
    </Modal>
  );
}
