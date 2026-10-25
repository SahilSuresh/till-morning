import { router } from 'expo-router';
import { CameraIcon, CheckCircleIcon, CheckIcon, ReceiptIcon, WalletIcon, WarningCircleIcon } from '../ui/ph';
import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppLabel, hasTmNative } from '../../modules/tm-native';
import { track } from '../lib/analytics';
import { knownApp } from '../lib/core';
import { pickScreenshot, readScreenshot } from '../lib/ocr';
import { bump } from '../lib/progress';
import { type CheckInAnswer, getState, setState, useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { Chip, OptionCard, springOut, TextLink, toast, useReduceMotion } from '../ui/components';
import { Dialog, Enter, ReadingBar, Tile, useFootPad, useHeadPad } from '../ui/flow/kit';
import { IconReceipt } from '../ui/icons';
import { TicketMain, tk } from '../ui/TearTicket';
import { color, font, type } from '../ui/theme';
import { Pressable } from '../ui/Pressable';

const ANSWERS: { id: CheckInAnswer; label: string }[] = [
  { id: 'stuck', label: 'Bought only what I planned' },
  { id: 'didnt_buy', label: 'Didn’t buy anything' },
  { id: 'bought_else', label: 'Bought something else too' },
];

type Proof = null | 'reading' | 'fail' | { total: number; under: boolean };

const REASON_LABEL = { specific: 'Something specific', browsing: 'Just browsing', unsure: 'Not sure yet' } as const;
const money = (v: number | string) => {
  const n = +v;
  return `£${Number.isInteger(n) ? n : n.toFixed(2)}`;
};

/** The paper receipt's zigzag bottom (.receipt mask, P:L210): 16 pt teeth, 8 pt deep, centred. */
function Zigzag({ width }: { width: number }) {
  const mid = width / 2;
  // How far down the paper reaches at x: 8 at each tooth's point (centred), 0 in the notches between.
  const y = (x: number) => {
    const p = (((x - mid) % 16) + 16) % 16;
    return 8 - Math.abs(p > 8 ? p - 16 : p);
  };
  let d = `M0,0 L0,${y(0)}`;
  const first = mid - 16 * Math.ceil(mid / 16);
  for (let x = first; x <= width + 16; x += 8) {
    if (x <= 0 || x >= width) continue;
    d += ` L${x},${y(x)}`;
  }
  d += ` L${width},${y(width)} L${width},0 Z`;
  return (
    <Svg width={width} height={8} style={{ marginTop: -0.5 }}>
      <Path d={d} fill={color.paper} />
    </Svg>
  );
}

export default function CheckIn() {
  const headPad = useHeadPad();
  const footPad = useFootPad();
  const rm = useReduceMotion();
  const pass = useAppState((s) => s.pendingCheckIn);
  const [askHelp, setAskHelp] = useState(false);
  const [proof, setProof] = useState<Proof>(null);
  const [receiptW, setReceiptW] = useState(0);
  const stamp = useRef(new Animated.Value(rm ? 1 : 0)).current;

  useEffect(() => {
    if (rm) return;
    // .usedstamp.stamp-in: .55 s spring, 380 ms in
    Animated.timing(stamp, { toValue: 1, duration: 550, delay: 380, easing: springOut, useNativeDriver: true }).start();
  }, [rm, stamp]);

  useEffect(() => {
    if (!pass && !askHelp) router.replace('/');
  }, [pass, askHelp]);
  if (!pass) return <View style={{ flex: 1, backgroundColor: color.night }} />;

  const plan = `${pass.need || REASON_LABEL[pass.reason]}${pass.limit ? `, up to £${pass.limit}` : ''}`;
  const lim = parseFloat(pass.limit) || 0;
  const named = knownApp(pass.app);

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

  const again = (
    <TextLink
      label="Try another screenshot"
      underline
      style={{ fontSize: 13.5, textAlign: 'left' }}
      containerStyle={{ alignSelf: 'flex-start', paddingVertical: 0, marginTop: 8 }}
      onPress={() => setProof(null)}
    />
  );
  // .proof (P:L1750): dashed before a screenshot, solid once there's an answer
  const proofBox = (solid: boolean) => ({
    marginTop: 16,
    alignSelf: 'stretch' as const,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: solid ? ('solid' as const) : ('dashed' as const),
    borderColor: solid ? '#2E3374' : '#3A4096',
    backgroundColor: solid ? '#1C2057' : color.card,
  });

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: headPad, paddingHorizontal: 28, paddingBottom: 16, alignItems: 'center' }}>
        {/* The used ticket (.usedtk, P:L312) */}
        <Enter>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel="Your Shopping Pass ticket, stamped used"
            style={{ width: 236, height: 92, shadowColor: '#020312', shadowOpacity: 0.5, shadowRadius: 9, shadowOffset: { width: 0, height: 8 } }}
          >
            <TicketMain width={236} height={92} radius={16} dashedRight>
              <Text style={tk.label}>Shopping pass</Text>
              <Text style={tk.min}>{pass.minutes} min</Text>
              {named || !pass.key ? (
                <Text numberOfLines={1} style={tk.app}>
                  {named ? pass.app : 'Your shop apps'}
                </Text>
              ) : (
                <AppLabel appKey={pass.key} mode="both" size={12.5} color="#FFFFFF" style={{ height: 18, opacity: 0.85 }} />
              )}
            </TicketMain>
            <Animated.View
              style={{
                position: 'absolute',
                right: -4,
                top: 22,
                opacity: stamp.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
                transform: [
                  { scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
                  { rotate: stamp.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-14deg'] }) },
                ],
                borderWidth: 3,
                borderColor: '#D61F4B',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 4,
                backgroundColor: 'rgba(255,240,243,0.94)',
              }}
            >
              <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 24, color: '#D61F4B' }}>Used</Text>
            </Animated.View>
          </View>
        </Enter>

        <Enter d={90}>
          <Text style={[type.small, { marginTop: 16, textAlign: 'center' }]}>
            {pass.wholeSelection
              ? 'Your Shopping Pass ended, so your shop apps are locked again.'
              : named
                ? `Your ${pass.app} pass ended, so ${pass.app} is locked again.`
                : 'Your Shopping Pass ended, so the app is locked again.'}
          </Text>
        </Enter>
        <Enter d={150}>
          <Text accessibilityRole="header" style={[type.h1, { marginTop: 8, textAlign: 'center' }]}>
            Did you stick to the plan?
          </Text>
        </Enter>

        {/* Paper receipt with a zigzag bottom edge (.receipt-wrap, P:L209) */}
        <Enter
          d={220}
          style={{ alignSelf: 'stretch', marginTop: 20, shadowColor: '#020312', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 8 } }}
        >
          <View onLayout={(e) => setReceiptW(e.nativeEvent.layout.width)}>
            <View style={{ backgroundColor: color.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconReceipt size={15} />
                <Text style={[type.label, { color: color.paperLabel }]}>Your plan</Text>
              </View>
              <Text style={[type.title, { color: color.inkOnBright, marginTop: 4 }]}>{plan}</Text>
            </View>
            {receiptW > 0 && <Zigzag width={receiptW} />}
          </View>
        </Enter>

        {lim > 0 &&
          (proof === null ? (
            <Pressable onPress={addProof} accessibilityRole="button" style={({ pressed }) => [proofBox(false), { opacity: pressed ? 0.8 : 1 }]}>
              <Tile tone="hush" Icon={CameraIcon} size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Text style={type.title}>
                  Add your checkout screenshot <Text style={{ fontFamily: font.bodySemi, color: color.text3 }}>(optional)</Text>
                </Text>
                <Text style={type.small}>Stayed under your {money(lim)} limit? Prove it for +15 bonus XP and proof-only stickers.</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                  <Tile tone="sun" Icon={ReceiptIcon} size={36} iconSize={20} style={{ borderRadius: 12 }} />
                  <Tile tone="sun" Icon={WalletIcon} size={36} iconSize={20} style={{ borderRadius: 12 }} />
                </View>
              </View>
            </Pressable>
          ) : proof === 'reading' ? (
            <View style={proofBox(false)} accessibilityLiveRegion="polite">
              <Tile tone="hush" Icon={CameraIcon} size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Text style={type.title}>Reading your screenshot…</Text>
                <Text style={type.small}>On this phone. The picture never leaves it.</Text>
                <ReadingBar />
              </View>
            </View>
          ) : proof === 'fail' ? (
            <View style={proofBox(true)}>
              <Tile tone="peach" Icon={WarningCircleIcon} size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <Text style={type.title}>Couldn’t find a total</Text>
                <Text style={type.small}>Try a screenshot that shows the order total, like the last checkout page.</Text>
                {again}
              </View>
            </View>
          ) : (
            <Enter now style={proofBox(true)}>
              <Tile tone={proof.under ? 'mint' : 'peach'} Icon={proof.under ? CheckIcon : WarningCircleIcon} size={44} iconSize={22} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {proof.under && <CheckCircleIcon size={17} color={color.mint} weight="fill" />}
                  <Text style={type.title}>{proof.under ? 'Under your limit' : 'Over your limit'}</Text>
                </View>
                <Text style={[type.small, { fontVariant: ['tabular-nums'] }]}>
                  Checkout total {money(proof.total)} · your limit {money(lim)}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: font.bodyBold, fontSize: 13, lineHeight: 18, color: proof.under ? color.mint : color.coralText }}>
                  {proof.under
                    ? 'Pick “Bought only what I planned” for +15 bonus XP and a step to a proof-only sticker.'
                    : 'No bonus this time. An honest answer still earns 10 XP.'}
                </Text>
                {again}
              </View>
            </Enter>
          ))}

        <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 20 }}>
          {ANSWERS.map((a, i) => (
            <Enter key={a.id} d={290 + i * 80}>
              <OptionCard
                label={a.label}
                selected={false}
                radio="none"
                paddingVertical={16}
                accessibilityRole="button"
                onPress={() => answer(a.id)}
                right={<Chip tone="mint" label="+10 XP" />}
              />
            </Enter>
          ))}
        </View>

        <Enter d={540}>
          <Text style={[type.small, { textAlign: 'center', marginTop: 20 }]}>Every honest answer earns the same 10 XP. This is for you, not a test.</Text>
        </Enter>
      </ScrollView>

      <View style={{ paddingHorizontal: 32, paddingTop: 4, paddingBottom: footPad, alignItems: 'center' }}>
        <TextLink label="Skip" underline onPress={skip} style={{ fontSize: 17 }} containerStyle={{ paddingVertical: 12, paddingHorizontal: 24 }} />
      </View>

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

/** SHEETS.helped (P:L2195): one tap, no radios, popping in over the dimmed night. */
function HelpPrompt({ visible, onDone }: { visible: boolean; onDone: (helped: boolean | null) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const options = ['Yes, I changed my mind', 'Yes, I thought it through', 'Not really'];
  return (
    <Dialog visible={visible} label="Did this pause help?">
      <Text accessibilityRole="header" style={[type.h2, { fontSize: 24, lineHeight: 28.8 }]}>
        Did this pause help?
      </Text>
      <Text style={[type.small, { marginTop: 4 }]}>One tap. It helps us make Till Morning better for you.</Text>
      <View style={{ gap: 8, marginTop: 16 }}>
        {options.map((o, i) => (
          <OptionCard
            key={o}
            label={o}
            radio="none"
            paddingVertical={14}
            accessibilityRole="button"
            selected={picked === i}
            onPress={() => {
              setPicked(i);
              setTimeout(() => onDone(i < 2), 250);
            }}
          />
        ))}
      </View>
      <TextLink label="Not now" style={{ color: color.text3 }} containerStyle={{ alignSelf: 'stretch', marginTop: 12, paddingVertical: 8 }} onPress={() => onDone(null)} />
    </Dialog>
  );
}
