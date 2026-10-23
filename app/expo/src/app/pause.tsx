import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SMS from 'expo-sms';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraIcon, ChatCircleIcon, CheckCircleIcon, MoonStarsIcon, SparkleIcon, WarningCircleIcon } from '../ui/ph';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { hasTmNative } from '../../modules/tm-native';
import { track } from '../lib/analytics';
import { pickScreenshot, readScreenshot } from '../lib/ocr';
import {
  BAND_LABEL,
  formatDuration,
  formatReady,
  isTakeawayApp,
  knownApp,
  logPause,
  parkPrice,
  parkWant,
  priceText,
  recentShieldedApp,
  startCoolOff,
  waitFor,
} from '../lib/core';
import { bump } from '../lib/progress';
import { activeChallenge, DAY_NAMES, hh, nextTreat, nightOn, pauseSeconds, risky, saleOn, shopLinkLabel, workTime } from '../lib/rules';
import { getState, type ParkedWant, type PriceBand, setState, useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { PauseBackground } from '../ui/backgrounds';
import { BreathRing } from '../ui/BreathRing';
import { NotePlayer } from '../ui/NotePlayer';
import { Button, Chip, easeOut, Tag, TextLink, toast, useReduceMotion } from '../ui/components';
import { BigTag } from '../ui/flow/BigTag';
import { BottomSheet, Enter, NlSky, Tile, useFootPad, useHeadPad, WrFull } from '../ui/flow/kit';
import { IconClock, IconHourglass, IconTimer } from '../ui/icons';
import { StFace } from '../ui/StFace';
import { color, font, type } from '../ui/theme';

const hhmm = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/**
 * True facts for this pause (pauseFact() in the prototype, P:L2417). Bold parts are wrapped in **.
 * One is shown per pause, turning with each pause you finish; the dots say how many there are.
 */
function pauseFacts(app: string) {
  const s = getState();
  const now = Date.now();
  const f: string[] = [];
  const it = knownApp(app) ? app : 'it';
  const forApp = s.pauseLog.filter((p) => p.app === app).slice(-5);
  const left = forApp.filter((p) => p.outcome === 'left' || p.outcome === 'walked' || p.outcome === 'parked').length;
  if (forApp.length >= 2 && left >= 1) {
    const prev = forApp[forApp.length - 1];
    const a = new Date(now).setHours(0, 0, 0, 0);
    const b = new Date(prev.at).setHours(0, 0, 0, 0);
    const dd = Math.round((a - b) / 86400000);
    const when = dd === 0 ? 'earlier today' : dd === 1 ? 'yesterday' : DAY_NAMES[(new Date(prev.at).getDay() + 6) % 7];
    f.push(`You left ${it} **${left} of the last ${forApp.length} times**.${dd < 7 ? ` Last time was ${when} at ${hhmm(prev.at)}.` : ''}`);
  }
  const waiting = s.parked.filter((w) => !w.decided && w.readyAt > now);
  if (waiting.length === 1) f.push(`**1 thing** is already parked, ready at ${hhmm(waiting[0].readyAt)}.`);
  if (waiting.length > 1) f.push(`**${waiting.length} things** are parked, waiting their turn.`);
  const ch = activeChallenge();
  if (ch) f.push(`Day **${ch.day} of ${ch.len}** of your ${ch.name.toLowerCase()}.`);
  const treat = nextTreat(now);
  if (treat && s.takeawaysChosen) f.push(`Your next treat night is **${treat.name}**${treat.days > 1 ? `, ${treat.days} days away` : ''}.`);
  const h = new Date(now).getHours();
  if (h >= 22 || h < 5) f.push(`It’s **${hhmm(now)}**. A want made this late can wait till 8.`);
  const wk = s.pauseLog.filter((p) => now - p.at < 7 * 86400000 && (p.outcome === 'left' || p.outcome === 'walked')).length;
  if (wk) f.push(`You’ve walked away **${wk} time${wk === 1 ? '' : 's'}** this week.`);
  if (!f.length) f.push('Most wants fade in a few minutes. **Watch this one.**');
  const k = s.pauseLog.length % f.length;
  return { text: f[k], k, n: f.length };
}

// "What's this one about?" (REASONS / COACH in the prototype)
const REASONS = { bored: 'Bored', badday: 'Bad day', ad: 'Saw an ad', need: 'I need it' } as const;
type Reason = keyof typeof REASONS;
const COACH: Record<Reason, (n: number) => string> = {
  bored: (n) =>
    n > 1
      ? `That’s want number ${n} that started with boredom. Park it and see if it still matters tomorrow?`
      : 'Boredom wants feel urgent and fade fast. Park it and see if it still matters tomorrow?',
  badday: (n) => `Bad days have been behind ${n} of your wants. Buying usually helps for about an hour. Park it, and look again when today is over?`,
  ad: (n) => `Ads are built for this exact minute${n > 1 ? `, and it’s the ${n}th time one started a want` : ''}. It’ll still be there in the morning.`,
  need: () => 'If you need it, you’ll still need it at 08:00. Parking it costs you nothing.',
};

function Bold({ text, style }: { text: string; style: object }) {
  const parts = text.split('**');
  return (
    <Text style={style}>
      {parts.map((p, i) => (
        <Text key={i} style={i % 2 ? { fontFamily: font.bodyHeavy, color: '#FFFFFF' } : undefined}>
          {p}
        </Text>
      ))}
    </Text>
  );
}

/**
 * The countdown lives here so only the ring re-renders while it runs (4 times a second);
 * the rest of the pause renders once, and again when the choices unlock.
 */
const PauseRing = memo(function PauseRing({ total, startedAt, onDone }: { total: number; startedAt: number; onDone: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, total - (Date.now() - startedAt) / 1000));
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, total - (Date.now() - startedAt) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        doneRef.current();
      }
    }, 250);
    return () => clearInterval(t);
  }, [total, startedAt]);
  return <BreathRing total={total} left={left} done={left <= 0} />;
});

/** "What's this one about?" with the coach's reply. Answering only re-renders this part. */
function Question() {
  const [answer, setAnswer] = useState<Reason | null>(null);
  const answerReason = (r: Reason) => {
    setState((s) => {
      const reasons = { ...s.reasons };
      if (answer) reasons[answer] = Math.max(0, (reasons[answer] ?? 1) - 1);
      reasons[r] = (reasons[r] ?? 0) + 1;
      return { reasons };
    });
    setAnswer(r);
  };
  return (
    <>
      <Enter d={120}>
        <Text accessibilityRole="header" style={[type.h2, { fontSize: 24, lineHeight: 28.8, color: color.text, textAlign: 'center', marginTop: 20 }]}>
          What’s this one about?
        </Text>
      </Enter>
      <Enter d={200} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
        {(Object.keys(REASONS) as Reason[]).map((r) => (
          <Tag key={r} large onDark label={REASONS[r]} selected={answer === r} onPress={() => answerReason(r)} />
        ))}
      </Enter>
      {answer && (
        <Enter key={answer} pop now style={{ alignSelf: 'stretch', marginTop: 16 }}>
          <View
            accessibilityLiveRegion="polite"
            style={{ flexDirection: 'row', gap: 9, backgroundColor: 'rgba(13,15,46,0.45)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 }}
          >
            <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <SparkleIcon size={14} color="#FFFFFF" weight="fill" />
            </View>
            <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19.6, color: '#FFFFFF' }}>
              {COACH[answer](getState().reasons[answer] ?? 1)}
            </Text>
          </View>
        </Enter>
      )}
    </>
  );
}

/** .bd-card (P:L1927): the easy meals you've got at home, on takeaway pauses. */
function MealsCard({ meals }: { meals: { n: string; e: string; m: number }[] }) {
  return (
    <Enter
      d={200}
      style={{
        alignSelf: 'stretch',
        marginTop: 16,
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 6,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: 'rgba(243,242,255,0.7)', marginBottom: 4 }}>You’ve got at home</Text>
      {meals.map((m) => (
        <View key={m.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 }}>
          <Text style={{ fontSize: 20 }} accessibilityElementsHidden>
            {m.e}
          </Text>
          <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 16, color: color.text }}>{m.n}</Text>
          {m.m ? <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: 'rgba(243,242,255,0.65)' }}>{m.m} min</Text> : null}
        </View>
      ))}
    </Enter>
  );
}

/** .pfact + .pdots (P:L1749/1795): one true fact, and a dot for each fact this pause could show. */
function Fact({ fact }: { fact: { text: string; k: number; n: number } }) {
  return (
    <>
      <Enter
        d={200}
        style={{
          marginTop: 16,
          maxWidth: 330,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 18,
          backgroundColor: 'rgba(13,15,46,0.32)',
        }}
      >
        <View style={{ marginTop: 1 }}>
          <IconClock size={18} color={color.text} />
        </View>
        <Bold text={fact.text} style={{ flexShrink: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20.25, color: color.text }} />
      </Enter>
      {fact.n > 1 && (
        <Enter d={240} style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 14 }}>
          {Array.from({ length: Math.min(fact.n, 5) }, (_, i) => (
            <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === fact.k % 5 ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </Enter>
      )}
    </>
  );
}

/** "z z" beside the sleeping face (.nl-z, P:L1913). */
function SleepZ() {
  const rm = useReduceMotion();
  const v = useRef(new Animated.Value(rm ? 1 : 0)).current;
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, v]);
  return (
    <Animated.Text
      accessibilityElementsHidden
      style={{
        position: 'absolute',
        right: -30,
        top: -6,
        fontFamily: font.bodyHeavy,
        fontSize: 20,
        letterSpacing: 3,
        color: '#8EA2FF',
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [2, -4] }) }],
      }}
    >
      z z
    </Animated.Text>
  );
}

export default function Pause() {
  const headPad = useHeadPad();
  const footPad = useFootPad();
  const rm = useReduceMotion();
  const params = useLocalSearchParams<{ app?: string; preview?: string }>();
  // "See how night lock looks" in Settings: the real screen, with nothing recorded.
  const preview = params.preview === 'night';

  // Which app is this about? From Home it's passed in; from the shield, the extension recorded it.
  const { app, key } = useMemo(() => {
    if (params.app) return { app: params.app, key: null as string | null };
    const recent = recentShieldedApp();
    return { app: recent?.name ?? 'your shop apps', key: recent?.key ?? null };
  }, [params.app]);
  const named = knownApp(app);

  const total = useMemo(() => pauseSeconds(), []);
  const why = useMemo(() => [risky() ? 'late night' : '', saleOn() ? 'sale week' : ''].filter(Boolean).join(', '), []);
  const night = useMemo(() => preview || nightOn(), [preview]);
  // Backup dinner: shown on takeaway apps when you've saved easy meals.
  const dinner = useMemo(() => {
    const meals = getState().meals;
    const takeaway = isTakeawayApp(true) || (!!key && getState().habits[key] === 'takeaways');
    return meals.length && !params.app && takeaway ? meals : null;
  }, [params.app, key]);
  const fact = useMemo(() => pauseFacts(app), [app]);
  const note = useAppState((s) => s.note);
  const askQuestion = useState(() => getState().settings.askQuestion)[0];

  const [startedAt] = useState(Date.now);
  const [done, setDone] = useState(false);
  const [sheet, setSheet] = useState<null | 'quick' | 'full'>(null);
  const [parked, setParked] = useState<ParkedWant | null>(null);
  const finished = useRef(false);
  const onDone = useCallback(() => setDone(true), []);

  useEffect(() => {
    if (!done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    AccessibilityInfo.announceForAccessibility('Whatever you pick is fine');
  }, [done]);

  // Walking away mid-pause counts as leaving (+10 XP).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'background' || finished.current || done || night) return;
      finished.current = true;
      const r = award(10, `Walked away from ${app} during the pause`, { app, gap: true });
      logPause(app, 'walked');
      startCoolOff(app, key);
      track('pause_completed', { outcome: 'walked' });
      router.replace('/');
      setTimeout(() => toast(xpToast(r, 'You walked away')), 600);
    });
    return () => sub.remove();
  }, [app, key, done, night]);

  // The three choices unlock one after another (.unlock: .95 → 1.04 → 1, 90 ms apart).
  const unlock = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!done) return;
    if (rm) {
      unlock.forEach((v) => v.setValue(1));
      return;
    }
    Animated.stagger(
      90,
      unlock.map((v) => Animated.timing(v, { toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true })),
    ).start();
  }, [done, rm, unlock]);
  const unlockStyle = (i: number) =>
    done ? { transform: [{ scale: unlock[i].interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.95, 1.04, 1] }) }] } : undefined;

  const leave = () => {
    finished.current = true;
    const r = award(10, `Left ${app} after the pause`, { app, gap: true });
    logPause(app, 'left');
    startCoolOff(app, key);
    const goal = bump('leave');
    track('pause_completed', { outcome: 'left' });
    router.replace('/');
    setTimeout(() => toast(xpToast(r, named ? `You left ${app}` : 'You left it')), 400);
    if (goal) setTimeout(() => toast(goal), 2900);
  };

  const shop = () => {
    finished.current = true;
    logPause(app, 'shop');
    track('pause_completed', { outcome: 'shop' });
    router.replace({ pathname: '/pass', params: { app } });
  };

  const park = (what: string, band: PriceBand, extra: ParkExtra = {}) => {
    finished.current = true;
    const name = what.trim() || (extra.price ? `${named ? `${app} basket` : 'Your basket'}${extra.items ? `, ${extra.items} items` : ''}` : '');
    const want = parkWant(app, name, band, key, extra);
    award(5, `Parked a want from ${app}`, { app });
    logPause(app, 'parked');
    track('pause_completed', { outcome: 'parked' });
    setSheet(null);
    setParked(want);
  };

  if (parked) return <ParkedScreen want={parked} />;

  // Night lock: no pause and no passes, only park it, close it, or the urgent door (P:L1433).
  if (night) {
    const to = getState().settings.nlTo;
    const meals = dinner?.map((m) => m.n.charAt(0).toLowerCase() + m.n.slice(1));
    const mealLine = meals?.length
      ? `You’ve got ${meals.length > 1 ? `${meals.slice(0, -1).join(', ')} or ${meals[meals.length - 1]}` : meals[0]} at home.`
      : '';
    return (
      <View style={{ flex: 1 }}>
        <NlSky />
        <View style={{ flex: 1, paddingHorizontal: 32, alignItems: 'center' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: headPad + 40 }}>
            <View>
              <StFace size={100} sleep />
              <SleepZ />
            </View>
            <Text accessibilityRole="header" style={{ marginTop: 24, fontSize: 26, lineHeight: 32.5, fontWeight: '700', color: color.text, textAlign: 'center' }}>
              It’s late. {named ? app : 'It'} can wait till morning.
            </Text>
            <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '600', color: '#9EA3D9', textAlign: 'center' }}>Night lock is on until {hh(to)}</Text>
            {mealLine ? (
              <Text
                style={{
                  marginTop: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(94,233,181,0.1)',
                  color: '#A8F5D6',
                  fontSize: 15,
                  lineHeight: 20.25,
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                {mealLine}
              </Text>
            ) : null}
            {preview && (
              <View style={{ marginTop: 18 }}>
                <Chip tone="glass" label="Preview: this is what you see during night lock" />
              </View>
            )}
          </View>
          <View style={{ alignSelf: 'stretch', gap: 8, paddingBottom: Math.max(footPad + 4, 28) }}>
            {preview ? (
              <Button label="Close the preview" onPress={() => router.back()} />
            ) : (
              <>
                <Pressable onPress={() => setSheet('quick')} accessibilityRole="button">
                  {({ pressed }) => (
                    <View style={{ borderRadius: 14, backgroundColor: '#5B3FD0', paddingBottom: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 }}>
                      <View style={{ height: 52, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                        <BgGradient />
                        <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>Park it till morning</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    finished.current = true;
                    startCoolOff(app, key);
                    router.replace('/');
                  }}
                  style={({ pressed }) => ({
                    height: 50,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: '#343A80',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 17, fontWeight: '600', color: color.text }}>{named ? `Close ${app}` : 'Close the app'}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => router.replace({ pathname: '/urgent', params: { app } })}
                  style={{ alignSelf: 'center', marginTop: 6, padding: 6 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: color.text3, textDecorationLine: 'underline' }}>It’s urgent</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
        <ParkSheet app={app} mode={sheet} onMode={setSheet} onPark={park} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      <View style={{ paddingTop: headPad, paddingHorizontal: 32, alignItems: 'center' }}>
        <Chip
          tone="glass"
          size={13}
          icon={<IconTimer size={15} />}
          label={`${total}-second pause${named ? ` · ${app}` : ''}${why ? ` · ${why}` : ''}`}
        />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 8, alignItems: 'center' }} bounces={false}>
        <View style={{ marginTop: 16 }}>
          <PauseRing total={total} startedAt={startedAt} onDone={onDone} />
        </View>

        {note && (
          <Enter d={80} style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <NotePlayer note={note} />
          </Enter>
        )}

        {askQuestion ? (
          <Question />
        ) : (
          <Enter d={120}>
            <Text accessibilityRole="header" style={[type.h1, { color: color.text, textAlign: 'center', marginTop: 24 }]}>
              {dinner ? 'Hungry, or just tired?' : 'Take a breath. Do you still want it?'}
            </Text>
          </Enter>
        )}

        {dinner ? <MealsCard meals={dinner} /> : <Fact fact={fact} />}
      </ScrollView>

      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad, gap: 12 }}>
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(243,242,255,0.75)', textAlign: 'center' }}>
          {done ? 'Whatever you pick is fine' : 'Just breathe. Choices come in a moment.'}
        </Text>
        <Animated.View style={unlockStyle(0)}>
          <Button variant="white" label="I’ll leave it" onPress={leave} disabled={!done} />
        </Animated.View>
        <Animated.View style={unlockStyle(1)}>
          <Button variant="ghost" label="Park it till morning" icon={<IconHourglass size={20} />} onPress={() => setSheet('quick')} disabled={!done} />
        </Animated.View>
        <Animated.View style={unlockStyle(2)}>
          <Pressable
            onPress={shop}
            disabled={!done}
            accessibilityRole="button"
            accessibilityState={{ disabled: !done }}
            style={{ paddingVertical: 6, opacity: done ? 1 : 0.4 }}
          >
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: 'rgba(243,242,255,0.8)', textAlign: 'center', textDecorationLine: 'underline' }}>
              {shopLinkLabel()}
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      <ParkSheet app={app} mode={sheet} onMode={setSheet} onPark={park} />
    </View>
  );
}

/** .nl-park's linear-gradient(90deg, #8B6CFF, #A57BFF). */
function BgGradient() {
  return <LinearGradient colors={['#8B6CFF', '#A57BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />;
}

// ---- Park it till morning: quick and expanded sheet (SHEETS.park, P:L2219) ----

const BANDS: PriceBand[] = ['unsure', 'under20', '20to50', '50to100', 'over100'];
type ParkExtra = { price?: number; items?: number; buddy?: boolean };

const friendName = () => getState().buddy.name.trim() || 'Your friend';
const hoursOfWork = (price: number, wage: number) => formatDuration((price / wage) * 3600 * 1000);

function ParkSheet({
  app,
  mode,
  onMode,
  onPark,
}: {
  app: string;
  mode: null | 'quick' | 'full';
  onMode: (m: null | 'quick' | 'full') => void;
  onPark: (what: string, band: PriceBand, extra?: ParkExtra) => void;
}) {
  const [what, setWhat] = useState('');
  const [band, setBand] = useState<PriceBand>('unsure');
  const [price, setPrice] = useState(0);
  const [items, setItems] = useState<number | undefined>();
  const [snap, setSnap] = useState<'idle' | 'reading' | 'done' | 'fail'>('idle');
  const [asked, setAsked] = useState(false);
  // The last open mode, so the content stays put while the sheet slides away.
  const [shown, setShown] = useState<'quick' | 'full'>('quick');
  if (mode && mode !== shown) setShown(mode);
  const buddy = getState().buddy;
  const friend = buddy.name.trim() || 'your friend';
  const named = knownApp(app);
  const App = named ? app : 'The app';
  const { readyAt, chips } = waitFor(band, Date.now(), price);
  const now = Date.now();
  const wage = getState().settings.wage || 12;
  const extra = (yes?: boolean): ParkExtra => ({ price: band === 'exact' ? price : undefined, items: band === 'exact' ? items : undefined, buddy: yes });

  const snapBasket = async () => {
    if (!hasTmNative) return toast('Reading screenshots needs the latest Till Morning install');
    const uri = await pickScreenshot().catch(() => null);
    if (!uri) return;
    setSnap('reading');
    try {
      const r = await readScreenshot(uri);
      if (!r.total) {
        setSnap('fail');
        return;
      }
      setPrice(Math.round(r.total * 100) / 100);
      setItems(r.items);
      setBand('exact');
      setSnap('done');
    } catch {
      setSnap('fail');
    }
  };

  const askFriend = async () => {
    const hi = buddy.name.trim() ? `Hey ${buddy.name.trim()},` : 'Hey,';
    const thing = what.trim() || 'this';
    const cost = band === 'exact' && price ? ` for £${price}` : '';
    const text = `${hi} I’m trying not to impulse buy. Can I get ${thing}${cost} now, or should I sleep on it?`;
    try {
      if (await SMS.isAvailableAsync()) {
        await SMS.sendSMSAsync(buddy.phone.trim() ? [buddy.phone.trim()] : [], text);
        setAsked(true);
      } else toast('This phone can’t send texts');
    } catch {
      toast('Couldn’t open Messages');
    }
  };

  const title = <Text style={[type.h2, { fontSize: 24, lineHeight: 28.8 }]}>Park it till morning</Text>;

  return (
    <BottomSheet visible={mode !== null} onClose={() => onMode(null)} label="Park it till morning">
      {shown === 'quick' ? (
        <>
          {title}
          <Text style={[type.small, { marginTop: 4 }]}>
            You don’t need to know what it is or what it costs. {App} stays shielded, and you decide with a clear head.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, backgroundColor: '#1C2057', borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16 }}>
            <Tile tone="hush" Icon={MoonStarsIcon} size={48} iconSize={24} />
            <View>
              <Text style={type.small}>Ready</Text>
              <Text style={[type.num, { fontSize: 24, lineHeight: 30, color: color.text }]}>{formatReady(waitFor('unsure', now).readyAt, now)}</Text>
            </View>
          </View>
          <View style={{ marginTop: 20, gap: 8 }}>
            <Button label="Park it" icon={<IconHourglass size={20} />} onPress={() => onPark('', 'unsure')} />
            <TextLink label="Add what it is or a rough price" containerStyle={{ paddingVertical: 8 }} onPress={() => onMode('full')} />
            <TextLink label="Cancel" style={{ color: color.text3, fontFamily: font.bodySemi }} containerStyle={{ paddingVertical: 4 }} onPress={() => onMode(null)} />
          </View>
        </>
      ) : (
        <>
          {title}
          <Text style={[type.small, { marginTop: 4 }]}>All of this is optional. {App} stays shielded while it waits.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 }}>
            <Text style={type.label}>What is it?</Text>
            <Text style={[type.label, { fontFamily: font.bodySemi }]}>optional</Text>
          </View>
          <TextInput
            value={what}
            onChangeText={setWhat}
            maxLength={40}
            accessibilityLabel="What is it? Optional"
            placeholder={named ? `Something from ${app}` : 'Something you wanted'}
            placeholderTextColor={color.placeholder}
            style={{
              backgroundColor: color.field,
              borderColor: color.fieldBorder,
              borderWidth: 1.5,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontFamily: font.bodySemi,
              fontSize: 17,
              color: color.text,
            }}
          />
          <Text style={[type.label, { marginTop: 16, marginBottom: 8 }]}>Roughly how much?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="Roughly how much?">
            {price > 0 && <Tag label={`£${price}${items ? `, ${items} items` : ''}`} selected={band === 'exact'} onPress={() => setBand('exact')} />}
            {BANDS.map((b) => (
              <Tag key={b} label={BAND_LABEL[b]} selected={band === b} onPress={() => setBand(b)} />
            ))}
          </View>
          <Pressable
            onPress={snapBasket}
            disabled={snap === 'reading'}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: '#343A80',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            {snap === 'done' ? (
              <CheckCircleIcon size={24} color={color.mint} weight="fill" />
            ) : snap === 'fail' ? (
              <WarningCircleIcon size={24} color={color.coralText} weight="bold" />
            ) : (
              <CameraIcon size={24} color={color.blueLight} weight="bold" />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[type.title, { color: color.text }]}>
                {snap === 'reading' ? 'Reading your screenshot…' : snap === 'done' ? 'Basket read from your screenshot' : snap === 'fail' ? 'Couldn’t find a total' : 'Snap your basket'}
              </Text>
              <Text style={type.small}>
                {snap === 'done' || snap === 'reading'
                  ? 'Read on this phone. The picture never leaves it.'
                  : snap === 'fail'
                    ? 'Try a screenshot that shows the basket total.'
                    : 'Pick a screenshot of the basket and it fills this in'}
              </Text>
            </View>
          </Pressable>
          {/* .wr-rule: how long it waits and why */}
          <View style={{ marginTop: 16, backgroundColor: '#12153A', borderColor: color.cardEdge, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <Text style={type.small}>It waits</Text>
              <Text style={[type.num, { fontSize: 26, lineHeight: 31, color: color.blueLight }]}>{formatDuration(readyAt - now)}</Text>
            </View>
            <Text style={[type.small, { textAlign: 'right' }]}>Ready {formatReady(readyAt, now)}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {chips.map((c) => (
                <Chip key={c} tone="lilac" label={c} />
              ))}
            </View>
            <Text style={[type.small, { marginTop: 8 }]}>
              {band === 'exact' && price ? `That’s about ${hoursOfWork(price, wage)} of your work.` : 'Snap your basket to see the price and the hours of work.'}
            </Text>
          </View>
          <View style={{ marginTop: 16, gap: 8 }}>
            {asked ? (
              <>
                <Text style={[type.title, { textAlign: 'center' }]}>What did {friend} say?</Text>
                <Button label="They said go for it" onPress={() => onPark(what, band, extra(true))} />
                <Button variant="secondary" label="They said sleep on it" onPress={() => onPark(what, band, extra())} />
              </>
            ) : (
              <>
                <Button label="Park it" icon={<IconHourglass size={20} />} onPress={() => onPark(what, band, extra())} />
                {buddy.on && parkPrice(band, price) > 50 && (
                  <Button
                    variant="secondary"
                    icon={<ChatCircleIcon size={20} color={color.text} weight="bold" />}
                    label={`Ask ${friend} if it can skip the wait`}
                    onPress={askFriend}
                  />
                )}
              </>
            )}
            <TextLink label="Cancel" containerStyle={{ paddingVertical: 8 }} onPress={() => onMode(null)} />
          </View>
        </>
      )}
    </BottomSheet>
  );
}

// ---- After parking (V.parked, P:L1626) -------------------------------------

function ParkedScreen({ want }: { want: ParkedWant }) {
  const headPad = useHeadPad();
  const footPad = useFootPad();
  const morning = new Date(want.readyAt).getHours() === 8 && new Date(want.readyAt).getMinutes() === 0;
  const when = formatReady(want.readyAt);
  const named = knownApp(want.app);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, []);

  const price = priceText(want);
  const work = want.band === 'exact' && want.price ? ` · about ${workTime(want.price)} of work` : '';
  return (
    <View style={{ flex: 1 }}>
      <WrFull />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: headPad + 10, paddingHorizontal: 28, paddingBottom: 16, alignItems: 'center' }}>
        <BigTag
          name={want.what || (named ? `Something from ${want.app}` : 'Something you wanted')}
          app={want.app}
          appKey={want.key}
          meta={named ? `${want.app} · ${price}${work}` : `${cap(price)}${work}`}
          stamp={want.buddy ? `${friendName()} said yes` : `Decide ${when}`}
          when={want.buddy ? undefined : `Ready ${when.split(' ')[0]}`}
        />
        <Enter d={260}>
          <Text accessibilityRole="header" style={[type.display, { textAlign: 'center', marginTop: 32 }]}>
            {want.buddy ? `${friendName()} let it through` : morning ? 'Parked. Sleep on it.' : 'Parked. Give it time.'}
          </Text>
        </Enter>
        <Enter d={330}>
          <Text style={[type.body, { textAlign: 'center', marginTop: 12 }]}>
            {want.buddy
              ? 'It’s ready to decide now, in your waiting room.'
              : `${named ? want.app : 'The app'} stays shielded. ${morning ? 'Morning-you' : 'Later-you'} gets the final say. We’ll let you know when it’s ready.`}
          </Text>
        </Enter>
        <Stamp d={420}>
          <Chip tone="mint" size={14} label="+5 XP" />
        </Stamp>
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad }}>
        <Button
          label={want.buddy ? 'Go to the waiting room' : 'Done'}
          onPress={() => {
            if (want.buddy) {
              router.replace('/waiting');
              setTimeout(() => toast('Ready to decide in your waiting room'), 400);
              return;
            }
            router.replace('/');
            setTimeout(() => toast(`Parked till ${when}`), 400);
          }}
        />
      </View>
    </View>
  );
}

/** .stamp (P:L483): lands from 2.2× with a little turn. */
function Stamp({ d, children }: { d: number; children: React.ReactNode }) {
  const rm = useReduceMotion();
  const v = useRef(new Animated.Value(rm ? 1 : 0)).current;
  useEffect(() => {
    if (rm) return;
    Animated.timing(v, { toValue: 1, duration: 500, delay: 140 + d, easing: Easing.bezier(0.34, 1.56, 0.64, 1), useNativeDriver: true }).start();
  }, [rm, v, d]);
  return (
    <Animated.View
      style={{
        marginTop: 16,
        opacity: v.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
