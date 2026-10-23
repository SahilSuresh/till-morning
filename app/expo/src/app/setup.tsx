import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { track } from '../lib/analytics';
import { PROTECTED_ID, protectedCount, shieldChosenApps } from '../lib/core';
import { askNotificationPermission } from '../lib/notify';
import { setState } from '../lib/store';
import { requestScreenTimeAccess } from '../lib/screenTime';
import { PauseBackground } from '../ui/backgrounds';
import { BreathRing } from '../ui/BreathRing';
import { Button, Card, Chip, CircleButton, Rise, TextLink } from '../ui/components';
import { IconChevrons, IconLock, IconMoon, IconShield, IconX } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

type Step = 'welcome' | 'story' | 'screenTime' | 'ukApps' | 'notify' | 'demo' | 'tour';
const ORDER: Step[] = ['welcome', 'story', 'screenTime', 'ukApps', 'notify', 'demo', 'tour'];

export default function Setup() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<Step>(params.step === 'picker' ? 'ukApps' : 'welcome');
  const [picker, setPicker] = useState(params.step === 'picker');
  const [denied, setDenied] = useState(false);
  const idx = ORDER.indexOf(step);

  // Setup ends on the paywall; starting the free week (or restoring) turns the shields on.
  const finish = () => {
    track('onboarding_completed');
    router.push('/paywall');
  };
  const afterNotify = () => setStep('demo');

  const allowScreenTime = async () => {
    try {
      const status = await requestScreenTimeAccess();
      if (status === 2) {
        track('screen_time_authorized');
        setDenied(false);
        setStep('ukApps');
      } else setDenied(true);
    } catch {
      setDenied(true);
    }
  };

  const onPickerDone = () => {
    setPicker(false);
    const c = protectedCount();
    if (c.apps + c.categories > 0) {
      // A fresh pick replaces any apps switched off on the Your apps page.
      setState({ offApps: [] });
      track('apps_selected', { apps: c.apps, categories: c.categories });
      if (params.step === 'picker') {
        shieldChosenApps();
        router.back();
      } else setStep('notify');
    }
  };

  if (step === 'welcome') return <Welcome onNext={() => setStep('story')} />;
  if (step === 'story') return <Story onBack={() => setStep('welcome')} onNext={() => setStep('screenTime')} />;
  if (step === 'demo') return <Demo onBack={() => setStep('notify')} onNext={() => setStep('tour')} />;
  if (step === 'tour') return <Tour onBack={() => setStep('demo')} onNext={finish} />;

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <CircleButton label="Back" onPress={() => (idx > 0 ? setStep(ORDER[idx - 1]) : router.back())}>
          <IconX size={18} />
        </CircleButton>
        <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <LinearGradient
            colors={gradient.progress}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 8, width: `${(idx / (ORDER.length - 1)) * 100}%` }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 28, paddingBottom: insets.bottom + 24 }}>
        {step === 'screenTime' && (
          <>
            <Rise>
              <Image source={require('../../assets/mascots/shieldm.webp')} style={{ width: 120, height: 120, alignSelf: 'center' }} resizeMode="contain" />
              <Text style={[type.h1, { marginTop: 16 }]}>Let Till Morning put up the shield</Text>
              <Text style={[type.body, { marginTop: 8 }]}>
                Your iPhone will ask for Screen Time access. It lets Till Morning shield only the apps you pick.
              </Text>
            </Rise>
            <Rise delay={60} style={{ marginTop: 18 }}>
              <Card style={{ gap: 14 }}>
                {['Till Morning can’t see inside your shop apps', 'Everything stays on your phone', 'Switch it off anytime in Settings'].map((t, i) => (
                  <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(94,233,181,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                      {i === 0 ? <IconLock size={18} color="#6EF0BF" /> : <IconShield size={18} color="#6EF0BF" />}
                    </View>
                    <Text style={[type.title, { flex: 1 }]}>{t}</Text>
                  </View>
                ))}
              </Card>
            </Rise>
            {denied && (
              <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: color.error, marginTop: 16 }}>
                Till Morning can’t shield apps without Screen Time. Tap Allow Screen Time to try again.
              </Text>
            )}
            <View style={{ flex: 1, minHeight: 24 }} />
            <Button label="Allow Screen Time" onPress={allowScreenTime} />
            <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>Next, a quick tip on which apps to pick.</Text>
          </>
        )}

        {step === 'ukApps' && (
          <>
            <Rise>
              <Text style={type.h1}>Pick the apps that get you</Text>
              <Text style={[type.body, { marginTop: 8 }]}>Next, Apple shows your apps. Tick Shopping & Food. It already includes:</Text>
            </Rise>
            <Rise delay={60} style={{ marginTop: 16, gap: 10 }}>
              <Card>
                <Text style={type.title}>Deliveroo, Just Eat, Uber Eats</Text>
              </Card>
              <Card>
                <Text style={type.title}>SHEIN, Temu, ASOS, Vinted</Text>
              </Card>
              <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#343A80', borderRadius: 20, padding: 16, marginTop: 4 }}>
                <Text style={type.label}>Also worth shielding</Text>
                <Text style={[type.title, { marginTop: 4 }]}>Klarna, Clearpay, PayPal</Text>
                <Text style={type.small}>In Finance. Pay later makes it feel free.</Text>
              </View>
            </Rise>
            <Text style={[type.small, { marginTop: 14 }]}>
              Shielding Klarna’s app won’t stop pay-later inside a shop’s own checkout. The pause on the shop app still catches you first.
            </Text>
            <View style={{ flex: 1, minHeight: 24 }} />
            <Button label="Open Apple’s app list" onPress={() => setPicker(true)} />
          </>
        )}

        {step === 'notify' && (
          <>
            <Rise>
              <Image source={require('../../assets/mascots/bubble.webp')} style={{ width: 120, height: 120, alignSelf: 'center' }} resizeMode="contain" />
              <Text style={[type.h1, { marginTop: 16 }]}>One tap into your pause</Text>
              <Text style={[type.body, { marginTop: 8 }]}>
                When you tap “I still want to shop” on a shield, Till Morning sends a nudge that opens your pause. It also tells you when a pass ends and when a parked want is ready.
              </Text>
            </Rise>
            <Rise delay={60} style={{ marginTop: 16 }}>
              <Chip tone="lilac" label="No marketing. Only your own pauses and passes." />
            </Rise>
            <View style={{ flex: 1, minHeight: 24 }} />
            <Button
              label="Allow notifications"
              onPress={async () => {
                await askNotificationPermission();
                afterNotify();
              }}
            />
            <TextLink label="Not now" style={{ color: color.text3 }} onPress={afterNotify} />
          </>
        )}
      </ScrollView>

      {picker && (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={PROTECTED_ID}
          includeEntireCategory
          style={{ width: 1, height: 1, position: 'absolute' }}
          onDismissRequest={onPickerDone}
        />
      )}
    </View>
  );
}

// ---- Story: "The 11 PM scroll" --------------------------------------------

const STARS = [
  [16, 18, 1.6],
  [78, 12, 1.2],
  [62, 30, 1.4],
  [28, 44, 1.1],
  [88, 52, 1.5],
  [8, 66, 1.2],
  [44, 8, 1.3],
  [70, 70, 1.1],
];

function SetupHead({ onBack, step, onDark }: { onBack: () => void; step: number; onDark?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <CircleButton label="Back" onDark={onDark} onPress={onBack}>
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconChevrons size={16} />
        </View>
      </CircleButton>
      <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
        <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: `${(step / 5) * 100}%` }} />
      </View>
    </View>
  );
}

function Story({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#2B1D72', '#0D0F2E']} style={{ position: 'absolute', inset: 0 }} />
      {STARS.map(([x, y, r], i) => (
        <View key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: 'rgba(255,255,255,0.7)' }} />
      ))}
      <SetupHead onBack={onBack} step={1} onDark />
      <View style={{ flex: 1, paddingHorizontal: 32, paddingTop: 24 }}>
        <Rise>
          <View style={{ width: 96, height: 96, borderRadius: 30, backgroundColor: color.sun, borderWidth: 3, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }}>
            <IconMoon size={50} color={color.inkOnBright} />
          </View>
        </Rise>
        <Rise delay={120}>
          <Text style={[type.display, { marginTop: 28 }]}>
            The <Text style={{ backgroundColor: color.sun, color: color.inkOnBright }}> 11 PM </Text> scroll
          </Text>
        </Rise>
        <Rise delay={220}>
          <Text style={{ marginTop: 20, fontFamily: font.body, fontSize: 18, lineHeight: 28, color: 'rgba(243,242,255,0.9)' }}>
            It starts with one harmless tap. Thirty minutes later, you’ve bought a designer cat bed and three “limited edition” mugs you didn’t need.
          </Text>
          <Text style={{ marginTop: 16, fontFamily: font.bodyBold, fontSize: 18, color: color.sun }}>Sound familiar? We’ve all been there.</Text>
        </Rise>
      </View>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 24 }}>
        <Button variant="white" label="Next" onPress={onNext} />
      </View>
    </View>
  );
}

// ---- Demo: "This is your pause" (5 seconds, once) -------------------------

function Demo({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const insets = useSafeAreaInsets();
  const [run, setRun] = useState(0);
  const [left, setLeft] = useState(5);
  useEffect(() => {
    const started = Date.now();
    setLeft(5);
    const t = setInterval(() => {
      const l = Math.max(0, 5 - (Date.now() - started) / 1000);
      setLeft(l);
      if (l <= 0) clearInterval(t);
    }, 200);
    return () => clearInterval(t);
  }, [run]);
  const done = left <= 0;

  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      <SetupHead onBack={onBack} step={4} onDark />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, alignItems: 'center', paddingTop: 8 }}>
        <Chip tone="glass" size={13} label="Try it once" />
        <Text style={[type.h1, { color: '#FFFFFF', marginTop: 12, textAlign: 'center' }]}>This is your pause</Text>
        <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 6 }]}>
          When you open a shielded app and still want in, you breathe with this circle first.
        </Text>
        <View style={{ marginTop: 16 }}>
          <BreathRing total={5} left={left} done={done} size={220} />
        </View>
        {done && (
          <Rise style={{ alignSelf: 'stretch', marginTop: 18, gap: 8 }}>
            {[
              ['I’ll leave it', '+10 XP', 'mint'],
              ['Park it till morning', '+5 XP', 'sun'],
              ['Shop with a plan', 'Shopping Pass', 'lilac'],
            ].map(([t, x, tone]) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 16, color: '#FFFFFF' }}>{t}</Text>
                <Chip tone={tone as 'mint' | 'sun' | 'lilac'} label={x} />
              </View>
            ))}
            <TextLink label="Play it again" style={{ color: 'rgba(243,242,255,0.85)', textDecorationLine: 'underline' }} onPress={() => setRun((r) => r + 1)} />
          </Rise>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingTop: 10, paddingBottom: insets.bottom + 24 }}>
        <Button variant="white" label="Got it" onPress={onNext} />
      </View>
    </View>
  );
}

// ---- Tour: "When a want hits / Park it till morning" -----------------------

function Tour({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <SetupHead onBack={onBack} step={5} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, paddingTop: 12 }}>
        <Chip tone="lilac" size={13} label="When a want hits" />
        <Rise style={{ marginTop: 16, borderRadius: 26, overflow: 'hidden', height: 260 }}>
          <LinearGradient colors={['#2B1D72', '#0D0F2E']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {STARS.slice(0, 5).map(([x, y, r], i) => (
              <View key={i} style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: 'rgba(255,255,255,0.7)' }} />
            ))}
            <View style={{ width: 210, backgroundColor: color.paper, borderRadius: 16, padding: 16, alignItems: 'center', transform: [{ rotate: '-4deg' }] }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#2C24A3', marginBottom: 10 }} />
              <Text style={{ fontFamily: font.display, fontSize: 18, color: color.inkOnBright, textAlign: 'center' }}>Something from SHEIN</Text>
              <View style={{ marginTop: 12, borderWidth: 3, borderColor: color.blue, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, transform: [{ rotate: '-6deg' }] }}>
                <Text style={{ fontFamily: font.display, fontSize: 15, color: color.blue }}>Decide 08:00 tomorrow</Text>
              </View>
            </View>
          </LinearGradient>
        </Rise>
        <Text style={[type.h1, { marginTop: 24 }]}>Park it till morning</Text>
        <Text style={[type.body, { marginTop: 8 }]}>No name or price needed. The app stays shielded, and you decide tomorrow with a clear head.</Text>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingTop: 10, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Text style={[type.small, { textAlign: 'center' }]}>More arrives on Today during your first week.</Text>
        <Button label="Continue" onPress={onNext} />
      </View>
    </View>
  );
}

// ---- Welcome: hold to pause the noise -------------------------------------

const PILLS = ['70% OFF!', 'Only 2 left', 'Last chance', 'Ends in 0:59', 'Free delivery', '3 people viewing', 'Add to basket?', 'BUY 1 GET 1', 'Flash sale', 'Trending now'];
const SPOTS = [
  [8, 6],
  [56, 10],
  [20, 20],
  [62, 26],
  [4, 66],
  [54, 70],
  [18, 80],
  [60, 84],
  [30, 90],
  [6, 36],
];

function Welcome({ onNext }: { onNext: () => void }) {
  const insets = useSafeAreaInsets();
  const hold = useRef(new Animated.Value(0)).current;
  const jiggle = useRef(new Animated.Value(0)).current;
  const noise = useRef(new Animated.Value(1)).current; // the sale pills' opacity (native side)
  const [phase, setPhase] = useState<'idle' | 'holding' | 'early' | 'paused' | 'welcome'>('idle');
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1, duration: 260, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [jiggle]);

  const start = () => {
    setPhase('holding');
    // Two values on purpose: the SVG ring can only animate on the JS side, while the pills
    // also wiggle on the native side. Sharing one value between them crashes React Native.
    anim.current = Animated.parallel([
      Animated.timing(hold, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: false }),
      Animated.timing(noise, { toValue: 0, duration: 2500, easing: Easing.linear, useNativeDriver: true }),
    ]);
    anim.current.start(({ finished }) => {
      if (!finished) return;
      setPhase('paused');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => setPhase('welcome'), 650);
    });
  };
  const release = () => {
    if (phase !== 'holding') return;
    anim.current?.stop();
    Animated.parallel([
      Animated.timing(hold, { toValue: 0, duration: 300, useNativeDriver: false }),
      Animated.timing(noise, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setPhase('early');
  };

  if (phase === 'welcome') {
    return (
      <View style={{ flex: 1, backgroundColor: color.night, paddingTop: insets.top + 40, paddingHorizontal: 28, paddingBottom: insets.bottom + 24 }}>
        <Rise style={{ alignItems: 'center' }}>
          <Image source={require('../../assets/mascots/welcome.webp')} style={{ width: 180, height: 180 }} resizeMode="contain" />
        </Rise>
        <Rise delay={60}>
          <Text style={[type.display, { marginTop: 18 }]}>
            Shop on{' '}
            <Text style={{ backgroundColor: color.sun, color: color.inkOnBright }}> purpose. </Text>
          </Text>
          <Text style={[type.body, { marginTop: 10 }]}>
            That was Till Morning: a pause between you and the apps that make you spend. Anything you want waits its turn.
          </Text>
        </Rise>
        <Rise delay={120} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          <Chip tone="mint" label="No bank links" />
          <Chip tone="mint" label="Stays on your phone" />
          <Chip tone="mint" label="No shaming" />
        </Rise>
        <View style={{ flex: 1 }} />
        <Button label="Let’s get started" onPress={onNext} />
        <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>7 days free, then pick a plan</Text>
      </View>
    );
  }

  const C = 2 * Math.PI * 92;
  const noiseOpacity = noise;
  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      {PILLS.map((p, i) => (
        <Animated.View
          key={p}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${SPOTS[i][0]}%`,
            top: `${SPOTS[i][1]}%`,
            opacity: noiseOpacity,
            transform: [{ rotate: jiggle.interpolate({ inputRange: [-1, 1], outputRange: [i % 2 ? '-4deg' : '3deg', i % 2 ? '3deg' : '-4deg'] }) }],
          }}
        >
          <View style={{ backgroundColor: i % 3 === 0 ? color.coral : i % 3 === 1 ? color.sun : '#1E2256', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: i % 3 === 2 ? color.text : color.inkOnBright }}>{p}</Text>
          </View>
        </Animated.View>
      ))}

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable onPressIn={start} onPressOut={release} accessibilityRole="button" accessibilityLabel="Press and hold to pause the noise" onAccessibilityTap={() => setPhase('welcome')}>
          <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={200} height={200} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={100} cy={100} r={92} stroke="rgba(255,255,255,0.14)" strokeWidth={8} fill="none" />
              <AnimatedRing hold={hold} c={C} />
            </Svg>
            <View style={{ width: 168, height: 168, borderRadius: 84, overflow: 'hidden' }}>
              <LinearGradient colors={gradient.primary} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 14 }}>
                <View style={{ width: 16, height: 56, borderRadius: 6, backgroundColor: '#FFFFFF' }} />
                <View style={{ width: 16, height: 56, borderRadius: 6, backgroundColor: '#FFFFFF' }} />
              </LinearGradient>
            </View>
          </View>
        </Pressable>
        <Text style={[type.h2, { marginTop: 22 }]}>
          {phase === 'holding' ? 'Keep holding…' : phase === 'paused' ? 'Paused.' : 'Press and hold'}
        </Text>
        <Text style={[type.small, { marginTop: 4 }]}>{phase === 'early' ? 'Hold a little longer' : 'to pause the noise'}</Text>
      </View>
      <TextLink label="Skip" style={{ color: color.text3 }} onPress={() => setPhase('welcome')} />
      <View style={{ height: 40 }} />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function AnimatedRing({ hold, c }: { hold: Animated.Value; c: number }) {
  return (
    <AnimatedCircle
      cx={100}
      cy={100}
      r={92}
      stroke="#B9CBFF"
      strokeWidth={8}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${c} ${c}`}
      strokeDashoffset={hold.interpolate({ inputRange: [0, 1], outputRange: [c, 0] })}
    />
  );
}
