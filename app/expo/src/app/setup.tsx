import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { DeviceMobile, EyeSlash, Heart, type Icon, LockKey, Timer, ToggleRight } from '../ui/ph';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { track } from '../lib/analytics';
import { PROTECTED_ID, protectedCount, shieldChosenApps } from '../lib/core';
import { askNotificationPermission } from '../lib/notify';
import { requestScreenTimeAccess } from '../lib/screenTime';
import { setState } from '../lib/store';
import { PauseBackground } from '../ui/backgrounds';
import { Button, Card, Chip, Rise, TextLink, useReduceMotion } from '../ui/components';
import { Hl } from '../ui/Hl';
import { IconTile, LetterTile, MonoLabel, UnderlineLink } from '../ui/onboarding/bits';
import { ObHeader } from '../ui/onboarding/ObHeader';
import { AskingHint, ConnectedNote } from '../ui/onboarding/ScreenTimeHint';
import { NAV, type Nav, StepBody, StepMotionProvider, useRiseDelay, useStepBase, useStepMotion } from '../ui/onboarding/StepMotion';
import { MoonTimer, NotifStack, PopTag, ScrollScene, ShelfRow, ShopShutters, TrolleyScene } from '../ui/onboarding/NightBits';
import { ShelfTag, TagTitle } from '../ui/ShelfTag';
import { WelcomeHold } from '../ui/onboarding/WelcomeHold';
import { color, font, type } from '../ui/theme';
import { useCalmMusic } from '../lib/sound';
import { getScreenTimeStatus } from '../lib/screenTime';

// Setup, as the prototype's onboarding (P:L1119–1363). One route; the steps slide between each
// other under a header that stays still. "Tap to start your pause" needs notifications, so the
// app adds a Notify step the prototype doesn't have.

type Step = 'hold' | 'welcome' | 'story' | 'screenTime' | 'ukApps' | 'notify' | 'demo' | 'tour';
const ORDER: Step[] = ['hold', 'welcome', 'story', 'screenTime', 'ukApps', 'notify', 'demo', 'tour'];
// Progress out of 5, as obHead(n). Notify sits between UK apps (3) and the demo (4).
const PROGRESS: Partial<Record<Step, number>> = { story: 1, screenTime: 2, ukApps: 3, notify: 3.5, demo: 4, tour: 5 };
const DARK: Step[] = ['story', 'demo'];

export default function Setup() {
  const params = useLocalSearchParams<{ step?: string }>();
  // Settings → Replay the intro: every screen again, but nothing changes (apps, permissions, plan).
  const replay = params.step === 'replay';
  // Opened from Home or Your apps just to choose apps: Apple's list opens straight away.
  const pickerOnly = params.step === 'picker';
  const rm = useReduceMotion();
  const navSV = useSharedValue<number>(NAV.none);
  const [nav, setNav] = useState<Nav>(NAV.none);
  const [step, setStep] = useState<Step>(pickerOnly ? 'ukApps' : 'hold');
  const [picker, setPicker] = useState(pickerOnly);
  const motion = useStepMotion(navSV, nav, rm);

  const go = (next: Step, how: Nav = NAV.fwd) => {
    navSV.set(how);
    setNav(how);
    setStep(next);
  };
  const back = () => {
    const i = ORDER.indexOf(step);
    if (pickerOnly || i <= 0) router.back();
    else go(ORDER[i - 1], NAV.back);
  };

  // Setup ends on the paywall; starting the free week (or restoring) turns the shields on.
  const finish = () => {
    track('onboarding_completed');
    router.push(replay ? { pathname: '/paywall', params: { replay: '1' } } : '/paywall');
  };

  // The picker reports "Done" before it has saved the selection (it saves ~0.1 s later),
  // so keep it mounted a moment and read the count once the save has landed.
  const picked = useRef(0);
  const onPickerDone = () => {
    setTimeout(() => {
      setPicker(false);
      afterPick();
    }, 450);
  };
  const afterPick = (tries = 0) => {
    const c = protectedCount();
    if (c.apps + c.categories === 0 && picked.current > 0 && tries < 5) {
      // Saved a beat late: look again rather than making them pick twice.
      setTimeout(() => afterPick(tries + 1), 400);
      return;
    }
    if (c.apps + c.categories > 0) {
      // A fresh pick replaces any apps switched off on the Your apps page.
      setState({ offApps: [] });
      track('apps_selected', { apps: c.apps, categories: c.categories });
      if (pickerOnly) {
        shieldChosenApps();
        router.back();
      } else go('notify');
    }
  };

  let body: ReactNode = null;
  switch (step) {
    case 'hold':
      body = <WelcomeHold onHeld={() => go('welcome', NAV.fade)} onSkip={() => go('welcome', NAV.fade)} />;
      break;
    case 'welcome':
      body = <Welcome onNext={() => go('story')} />;
      break;
    case 'story':
      body = <Story onNext={() => go('screenTime')} />;
      break;
    case 'screenTime':
      body = <ScreenTime replay={replay} onAllowed={() => go('ukApps')} />;
      break;
    case 'ukApps':
      body = <UkApps replay={replay} onOpen={() => (replay ? go('notify') : setPicker(true))} />;
      break;
    case 'notify':
      body = <Notify onNext={() => go('demo')} />;
      break;
    case 'demo':
      body = <Demo onNext={() => go('tour')} />;
      break;
    case 'tour':
      body = <Tour onNext={finish} />;
      break;
  }

  const n = PROGRESS[step];
  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <StepBackground step={step} />
      {n !== undefined && (
        <Animated.View exiting={rm ? undefined : FadeOut.duration(200)}>
          <ObHeader n={n} dark={DARK.includes(step)} onBack={back} />
        </Animated.View>
      )}
      <StepMotionProvider value={motion}>
        <View style={{ flex: 1 }}>
          <View key={step} style={StyleSheet.absoluteFill}>
            {body}
          </View>
        </View>
      </StepMotionProvider>

      {picker && (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={PROTECTED_ID}
          includeEntireCategory
          style={{ width: 1, height: 1, position: 'absolute' }}
          onSelectionChange={(e) => {
            picked.current = e.nativeEvent.applicationCount + e.nativeEvent.categoryCount + e.nativeEvent.webDomainCount;
          }}
          onDismissRequest={onPickerDone}
        />
      )}
    </View>
  );
}

// ---- Backgrounds: they swap at once while the content slides -------------------

// .night: six faint stars over the indigo fade (P:L115–122).
const NIGHT_STARS: [number, number, number, number][] = [
  [16, 18, 1.6, 0.8],
  [78, 12, 1.2, 0.65],
  [62, 30, 1.4, 0.55],
  [28, 44, 1.1, 0.5],
  [88, 52, 1.5, 0.55],
  [8, 66, 1.2, 0.4],
];

function StepBackground({ step }: { step: Step }) {
  if (step === 'demo') return <PauseBackground />;
  if (step !== 'story') return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#2B1D72', '#0D0F2E']} style={StyleSheet.absoluteFill} />
      {NIGHT_STARS.map(([x, y, d, a], i) => (
        <View key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: d, height: d, borderRadius: d / 2, backgroundColor: `rgba(255,255,255,${a})` }} />
      ))}
    </View>
  );
}

// ---- 1b Welcome: "Shop on purpose." (P:L1128) ------------------------------------

const TRUST: [Icon, string][] = [
  [LockKey, 'No bank links'],
  [DeviceMobile, 'Stays on your phone'],
  [Heart, 'No shaming'],
];

function Welcome({ onNext }: { onNext: () => void }) {
  const base = useStepBase();
  const rd = useRiseDelay();
  return (
    <StepBody
      contentStyle={{ paddingHorizontal: 32, paddingTop: 8, paddingBottom: 8, alignItems: 'center' }}
      footer={
        <>
          <Button sound="next" variant="night" label="Let’s get started" onPress={onNext} />
          <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>7 days free, then pick a plan</Text>
        </>
      }
    >
      <TrolleyScene delay={base} />
      <Rise delay={rd(120)}>
        <Text style={[type.display, { marginTop: 28, textAlign: 'center' }]} accessibilityLabel="Shop on purpose.">
          Shop on{' '}
          <Hl bg={color.sun} textStyle={type.display} delay={base + 280}>
            purpose.
          </Hl>
        </Text>
      </Rise>
      <Rise delay={rd(200)}>
        <Text style={[type.body, { marginTop: 16, textAlign: 'center' }]}>
          That was Till Morning: a pause between you and the apps that make you spend. Anything you want waits its turn.
        </Text>
      </Rise>
      {/* the three promises pop in one after another, as little shelf tags */}
      <View style={{ marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {TRUST.map(([Glyph, label], i) => (
          <PopTag key={label} index={i} delay={base + 1350 + i * 170} icon={<Glyph size={14} weight="bold" color="#FFFFFF" />} label={label} />
        ))}
      </View>
    </StepBody>
  );
}

// ---- 1c Story: "The 11 PM scroll" (P:L1142) ----------------------------------------

function Story({ onNext }: { onNext: () => void }) {
  const base = useStepBase();
  const rd = useRiseDelay();
  return (
    <StepBody contentStyle={{ paddingHorizontal: 32, paddingTop: 8, alignItems: 'center' }} footer={<Button sound="next" variant="white" label="Next" onPress={onNext} />}>
      {/* the story as a picture: the phone scrolling at night, the trolley filling up */}
      <ScrollScene delay={base} />
      <Rise delay={rd(120)}>
        <Text style={[type.display, { marginTop: 22, textAlign: 'center' }]} accessibilityLabel="The 11 PM scroll">
          The{' '}
          <Hl bg={color.sun} tilt={-2} textStyle={type.display} delay={base + 280}>
            11 PM
          </Hl>{' '}
          scroll
        </Text>
      </Rise>
      <Rise delay={rd(220)}>
        <Text style={{ marginTop: 14, fontFamily: font.body, fontSize: 17, lineHeight: 26, color: 'rgba(243,242,255,0.9)', textAlign: 'center' }}>
          It starts with one harmless tap. Thirty minutes later, you’ve bought a designer cat bed and three “limited edition” mugs you didn’t need.
        </Text>
      </Rise>
      <Rise delay={rd(300)}>
        <Text style={{ marginTop: 12, fontFamily: font.bodyBold, fontSize: 17, lineHeight: 25, color: color.sun, textAlign: 'center' }}>Sound familiar? We’ve all been there.</Text>
      </Rise>
    </StepBody>
  );
}

// ---- 1d Screen Time (P:L1245) -------------------------------------------------------

const SCREEN_TIME_ROWS: [Icon, string][] = [
  [EyeSlash, 'Till Morning can’t see inside your shop apps'],
  [DeviceMobile, 'Everything stays on your phone'],
  [ToggleRight, 'Switch it off anytime in Settings'],
];

function ScreenTime({ onAllowed, replay }: { onAllowed: () => void; replay?: boolean }) {
  // On a replay with Screen Time already on, the button simply moves on.
  const already = replay && getScreenTimeStatus() === 2;
  const base = useStepBase();
  const rd = useRiseDelay();
  const [denied, setDenied] = useState(false);
  // asking: iOS's alert is up · connected: shown for a moment before moving on
  const [phase, setPhase] = useState<'idle' | 'asking' | 'connected'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const allowScreenTime = async () => {
    if (phase !== 'idle') return;
    setPhase('asking');
    try {
      const status = await requestScreenTimeAccess();
      if (status === 2) {
        track('screen_time_authorized');
        setDenied(false);
        setPhase('connected');
        AccessibilityInfo.announceForAccessibility('Screen Time connected');
        timer.current = setTimeout(onAllowed, 900);
        return;
      }
      setDenied(true);
    } catch {
      setDenied(true);
    }
    setPhase('idle');
  };

  return (
    <StepBody
      contentStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 8 }}
      footer={
        phase === 'asking' ? (
          <AskingHint />
        ) : phase === 'connected' ? (
          <ConnectedNote />
        ) : (
          <>
            <Button sound="next" variant="night" label={already ? 'Next' : denied ? 'Try again' : 'Allow Screen Time'} onPress={already ? onAllowed : allowScreenTime} />
            <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>Next, a quick tip on which apps to pick.</Text>
          </>
        )
      }
    >
      <View style={{ alignItems: 'center', marginBottom: 18 }}>
        <ShopShutters delay={base} />
      </View>
      <Rise delay={rd(0)}>
        <Text style={type.h1}>Let Till Morning put up the shield</Text>
      </Rise>
      <Rise delay={rd(80)}>
        <Text style={[type.body, { marginTop: 12 }]}>Your iPhone will ask for Screen Time access. It lets Till Morning shield only the apps you pick.</Text>
      </Rise>
      {denied && phase !== 'asking' && (
        <View
          accessibilityRole="alert"
          style={{ marginTop: 16, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,143,120,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,143,120,0.32)' }}
        >
          <Text style={{ fontFamily: font.bodyBold, fontSize: 15, lineHeight: 21, color: '#FFE4DC' }}>
            Till Morning can’t shield apps without Screen Time. Tap Try again, then Continue.
          </Text>
        </View>
      )}
      <View style={{ marginTop: 24 }}>
        <Card style={{ padding: 8 }}>
          {SCREEN_TIME_ROWS.map(([Glyph, t], i) => (
            <View key={t}>
              {i > 0 && <View style={{ height: 1.5, backgroundColor: color.divider, marginHorizontal: 12 }} />}
              <Rise delay={rd(160 + i * 80)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12 }}>
                <IconTile>
                  <Glyph size={22} weight="bold" color="#6EF0BF" />
                </IconTile>
                <Text style={[type.title, { flex: 1, lineHeight: 22.7 }]}>{t}</Text>
              </Rise>
            </View>
          ))}
        </Card>
      </View>
    </StepBody>
  );
}

// ---- 1e UK apps: the one instruction screen before Apple's list (P:L1253) -------------

// Each shelf: the apps' first letters hopping on, and their names under it.
const UK_SHELVES: [[string, string][], string][] = [
  [
    [
      ['D', '#5EE9B5'],
      ['J', '#FFC94D'],
      ['U', '#A78BFA'],
    ],
    'Deliveroo, Just Eat, Uber Eats',
  ],
  [
    [
      ['S', '#FF8F78'],
      ['T', '#FF9F43'],
      ['A', '#93A5FF'],
      ['V', '#5EE9B5'],
    ],
    'SHEIN, Temu, ASOS, Vinted',
  ],
];

function UkApps({ onOpen, replay }: { onOpen: () => void; replay?: boolean }) {
  const base = useStepBase();
  const rd = useRiseDelay();
  return (
    <StepBody
      contentStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 8 }}
      footer={
        <>
          <Button sound="next" variant="night" label={replay ? 'Next' : 'Open Apple’s app list'} onPress={onOpen} />
          <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>You can change this any time.</Text>
        </>
      }
    >
      <Rise delay={rd(0)}>
        <Text style={type.h1}>Pick the apps that get you</Text>
      </Rise>
      <Rise delay={rd(60)}>
        <Text style={[type.body, { marginTop: 8 }]}>Next, Apple shows your apps. Tick Shopping & Food, then tap Done. It already includes:</Text>
      </Rise>
      <View style={{ marginTop: 18, gap: 16 }}>
        {UK_SHELVES.map(([tiles, caption], i) => (
          <ShelfRow key={caption} tiles={tiles} caption={caption} delay={base + 200 + i * 420} />
        ))}
      </View>
      <Rise delay={rd(160)} style={{ marginTop: 12 }}>
        {/* .uk-also: violet card with its own bottom edge */}
        <View style={{ borderRadius: 22, backgroundColor: '#3B2E8F', paddingBottom: 3 }}>
          <View style={{ borderRadius: 22, backgroundColor: '#1E1A55', borderWidth: 1.5, borderColor: '#7C5CFF', padding: 16 }}>
            <MonoLabel color={color.violetLight}>Also worth shielding</MonoLabel>
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <LetterTile letter="£" bg={color.sun} />
              <View style={{ flex: 1 }}>
                <Text style={type.title}>Klarna, Clearpay, PayPal</Text>
                <Text style={type.small}>In Productivity & Finance. Pay later makes it feel free.</Text>
              </View>
            </View>
          </View>
        </View>
      </Rise>
      <Rise delay={rd(220)}>
        <Text style={[type.small, { marginTop: 16 }]}>
          Shielding Klarna’s app won’t stop pay-later inside a shop’s own checkout. The pause on the shop app still catches you first.
        </Text>
      </Rise>
    </StepBody>
  );
}

// ---- 1f Notify (app only: "Tap to start your pause" is a notification) -----------------

function Notify({ onNext }: { onNext: () => void }) {
  const base = useStepBase();
  const rd = useRiseDelay();
  return (
    <StepBody
      contentStyle={{ paddingHorizontal: 28, paddingTop: 8, paddingBottom: 8, alignItems: 'center' }}
      footer={
        <>
          <Button
            sound="next"
            variant="night"
            label="Allow notifications"
            onPress={async () => {
              await askNotificationPermission();
              onNext();
            }}
          />
          <TextLink label="Not now" style={{ color: color.text3 }} onPress={onNext} />
        </>
      }
    >
      <NotifStack delay={base} />
      <Rise delay={rd(100)}>
        <Text style={[type.h1, { marginTop: 12, textAlign: 'center' }]}>One tap into your pause</Text>
      </Rise>
      <Rise delay={rd(170)}>
        <Text style={[type.body, { marginTop: 12, textAlign: 'center' }]}>
          When you tap “I still want to shop” on a shield, Till Morning sends a nudge that opens your pause. It also tells you when a pass ends and when a parked want is ready.
        </Text>
      </Rise>
      <Rise delay={rd(250)} style={{ marginTop: 20 }}>
        <Chip tone="lilac" label="No marketing. Only your own pauses and passes." />
      </Rise>
    </StepBody>
  );
}

// ---- 1g Demo: "This is your pause", 5 seconds once (P:L1351) ---------------------------

const DEMO_DELAY = 400; // the ring and numbers start .4 s in
const DEMO_SECS = 5;
const DEMO_REVEAL = DEMO_DELAY + DEMO_SECS * 1000; // the check and the choices fade in at 5.4 s
const CHOICES: [string, string, 'mint' | 'sun' | 'lilac'][] = [
  ['I’ll leave it', '+10 XP', 'mint'],
  ['Park it till morning', '+5 XP', 'sun'],
  ['Shop with a plan', 'Shopping Pass', 'lilac'],
];

function Demo({ onNext }: { onNext: () => void }) {
  const [run, setRun] = useState(0);
  return (
    <StepBody contentStyle={{ paddingHorizontal: 28, paddingBottom: 8, alignItems: 'center' }} footer={<Button sound="next" variant="white" label="Got it" onPress={onNext} />}>
      <View style={{ marginTop: 4 }}>
        <Chip tone="glass" size={13} icon={<Timer size={15} weight="bold" color="#FFFFFF" />} label="Try it once" />
      </View>
      <Text style={[type.h1, { marginTop: 12, textAlign: 'center' }]}>This is your pause</Text>
      <Text style={[type.body, { marginTop: 8, textAlign: 'center', color: color.white82 }]}>
        When you open a shielded app and still want in, you breathe with this circle first.
      </Text>
      <DemoRun key={run} again={run > 0} onReplay={() => setRun((r) => r + 1)} />
    </StepBody>
  );
}

/** One play of the demo. Everything runs on the UI thread; "Play it again" remounts it. */
function DemoRun({ again, onReplay }: { again: boolean; onReplay: () => void }) {
  const rm = useReduceMotion();
  // Soft music for the 5 seconds of the demo pause.
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setRunning(false), DEMO_REVEAL);
    return () => clearTimeout(t);
  }, []);
  useCalmMusic(running);
  const after = useSharedValue(rm ? 1 : 0);
  useEffect(() => {
    if (rm) return;
    after.set(withDelay(DEMO_REVEAL, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })));
    return () => cancelAnimation(after);
  }, [rm, after]);
  const afterStyle = useAnimatedStyle(() => ({ opacity: after.value }));

  return (
    <Animated.View
      entering={again && !rm ? FadeIn.duration(320) : undefined}
      exiting={rm ? undefined : FadeOut.duration(320)}
      style={{ alignSelf: 'stretch', alignItems: 'center' }}
    >
      <View style={{ marginTop: 20 }}>
        {/* the pause timer as a moon waxing to full while the ring fills */}
        <MoonTimer seconds={DEMO_SECS} delay={DEMO_DELAY} />
      </View>
      {/* Always in the layout, so nothing jumps when they appear. */}
      <Animated.View style={[{ alignSelf: 'stretch', marginTop: 24, gap: 8 }, afterStyle]} accessibilityRole="list" accessibilityLabel="What you can choose after the pause">
        {CHOICES.map(([t, x, tone]) => (
          <View
            key={t}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1.5,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, lineHeight: 22, color: '#FFFFFF', flexShrink: 1 }}>{t}</Text>
            <Chip tone={tone} label={x} />
          </View>
        ))}
      </Animated.View>
      <Animated.View style={[{ marginTop: 16 }, afterStyle]}>
        <UnderlineLink label="Play it again" color="rgba(243,242,255,0.85)" onPress={onReplay} />
      </Animated.View>
    </Animated.View>
  );
}

// ---- 1h Tour: "When a want hits / Park it till morning" (P:L1184, slide P:L1809) -------

function Tour({ onNext }: { onNext: () => void }) {
  return (
    <StepBody
      enter="tour"
      contentStyle={{ paddingHorizontal: 28, paddingTop: 8, paddingBottom: 8 }}
      footer={
        <>
          <Text style={[type.small, { textAlign: 'center' }]}>More arrives on Today during your first week.</Text>
          <Button sound="next" variant="night" label="Continue" onPress={onNext} style={{ marginTop: 12 }} />
        </>
      }
    >
      <Chip tone="lilac" size={13} label="When a want hits" />
      <View style={{ marginTop: 18 }}>
        <ShelfTag hang="trolley" motion="drop" dropDelay={350} label="From SHEIN" stubLabel="Price" stubValue="£20–50">
          <TagTitle title="Pink trainers" sub="Ready 08:00 tomorrow" />
        </ShelfTag>
      </View>
      <Text style={[type.h1, { marginTop: 24 }]}>Park it till morning</Text>
      <Text style={[type.body, { marginTop: 8 }]}>No name or price needed. The app stays shielded, and you decide tomorrow with a clear head.</Text>
    </StepBody>
  );
}
