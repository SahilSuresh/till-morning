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
import { requestScreenTimeAccess } from '../lib/screenTime';
import { setState } from '../lib/store';
import { Button, Card, Chip, CircleButton, Rise, TextLink } from '../ui/components';
import { IconLock, IconShield, IconX } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';

type Step = 'welcome' | 'screenTime' | 'ukApps' | 'notify';
const ORDER: Step[] = ['welcome', 'screenTime', 'ukApps', 'notify'];

export default function Setup() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ step?: string }>();
  const [step, setStep] = useState<Step>(params.step === 'picker' ? 'ukApps' : 'welcome');
  const [picker, setPicker] = useState(params.step === 'picker');
  const [denied, setDenied] = useState(false);
  const idx = ORDER.indexOf(step);

  const finish = () => {
    setState({ onboarded: true, appsChosen: true, day: '' });
    shieldChosenApps();
    track('onboarding_completed');
    router.replace('/');
  };

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
      track('apps_selected', { apps: c.apps, categories: c.categories });
      if (params.step === 'picker') {
        shieldChosenApps();
        router.back();
      } else setStep('notify');
    }
  };

  if (step === 'welcome') return <Welcome onNext={() => setStep('screenTime')} />;

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
                finish();
              }}
            />
            <TextLink label="Not now" style={{ color: color.text3 }} onPress={finish} />
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
