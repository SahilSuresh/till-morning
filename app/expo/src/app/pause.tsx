import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasTmNative } from '../../modules/tm-native';
import { track } from '../lib/analytics';
import { pickScreenshot, readScreenshot } from '../lib/ocr';
import {
  BAND_LABEL,
  formatDuration,
  formatReady,
  isTakeawayApp,
  logPause,
  parkPrice,
  parkWant,
  priceText,
  recentShieldedApp,
  startCoolOff,
  waitFor,
} from '../lib/core';
import { bump } from '../lib/progress';
import { activeChallenge, hh, nextTreat, nightOn, pauseSeconds, saleOn, shopLinkLabel } from '../lib/rules';
import { getState, type ParkedWant, type PriceBand, setState, useAppState } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { PauseBackground } from '../ui/backgrounds';
import { BreathRing } from '../ui/BreathRing';
import { NotePlayer } from '../ui/NotePlayer';
import { Button, Chip, springOut, Tag, TextLink, toast, useReduceMotion } from '../ui/components';
import { IconClock, IconHourglass, IconMoon, IconTimer } from '../ui/icons';
import { color, font, type } from '../ui/theme';

const hhmm = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** One true fact for this pause (pauseFact() in the prototype). Bold parts are wrapped in **. */
function pauseFact(app: string) {
  const s = getState();
  const now = Date.now();
  const forApp = s.pauseLog.filter((p) => p.app === app).slice(-5);
  const left = forApp.filter((p) => p.outcome === 'left' || p.outcome === 'walked' || p.outcome === 'parked').length;
  if (forApp.length >= 2 && left >= 1) return `You left ${app} **${left} of the last ${forApp.length} times**.`;
  const waiting = s.parked.filter((w) => !w.decided);
  if (waiting.length === 1) return `**1 thing** is already parked, ready at ${hhmm(waiting[0].readyAt)}.`;
  if (waiting.length > 1) return `**${waiting.length} things** are parked, waiting their turn.`;
  const ch = activeChallenge();
  if (ch) return `Day **${ch.day} of ${ch.len}** of your ${ch.name.toLowerCase()}.`;
  const h = new Date(now).getHours();
  if (h >= 22 || h < 5) return `It’s **${hhmm(now)}**. A want made this late can wait till 8.`;
  const treat = nextTreat(now);
  if (treat && s.takeawaysChosen) return `Your next treat night is **${treat.name}**, ${treat.days} day${treat.days > 1 ? 's' : ''} away.`;
  return 'Most wants fade in a few minutes. **Watch this one.**';
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

export default function Pause() {
  const insets = useSafeAreaInsets();
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

  const total = useMemo(() => pauseSeconds(), []);
  const lateNight = useMemo(() => {
    const h = new Date().getHours();
    return h >= 22 || h < 5;
  }, []);
  const night = useMemo(() => preview || nightOn(), [preview]);
  // Backup dinner: shown on takeaway apps when you've saved easy meals.
  const dinner = useMemo(() => {
    const meals = getState().meals;
    const takeaway = isTakeawayApp(true) || (!!key && getState().habits[key] === 'takeaways');
    return meals.length && !params.app && takeaway ? meals : null;
  }, [params.app, key]);
  const fact = useMemo(() => pauseFact(app), [app]);
  const note = useAppState((s) => s.note);
  const askQuestion = getState().settings.askQuestion;
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

  const startedAt = useRef(Date.now()).current;
  const [left, setLeft] = useState(total);
  const done = left <= 0;
  const [sheet, setSheet] = useState<null | 'quick' | 'full'>(null);
  const [parked, setParked] = useState<ParkedWant | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, total - (Date.now() - startedAt) / 1000);
      setLeft(l);
      if (l <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [total, startedAt]);

  useEffect(() => {
    if (done) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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

  // Choices unlock one after another with a bounce.
  const unlock = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!done) return;
    if (rm) {
      unlock.forEach((v) => v.setValue(1));
      return;
    }
    Animated.stagger(
      90,
      unlock.map((v) => Animated.timing(v, { toValue: 1, duration: 500, easing: springOut, useNativeDriver: true })),
    ).start();
  }, [done, rm, unlock]);
  const unlockStyle = (i: number) =>
    done
      ? { transform: [{ scale: unlock[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.95, 1.04, 1] }) }] }
      : undefined;

  const leave = () => {
    finished.current = true;
    const r = award(10, `Left ${app} after the pause`, { app, gap: true });
    logPause(app, 'left');
    startCoolOff(app, key);
    const goal = bump('leave');
    track('pause_completed', { outcome: 'left' });
    router.replace('/');
    setTimeout(() => toast(xpToast(r, `You left ${app}`)), 400);
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
    const name = what.trim() || (extra.price ? `${app} basket${extra.items ? `, ${extra.items} items` : ''}` : '');
    const want = parkWant(app, name, band, key, extra);
    award(5, `Parked a want from ${app}`, { app });
    logPause(app, 'parked');
    track('pause_completed', { outcome: 'parked' });
    setSheet(null);
    setParked(want);
  };

  if (parked) return <ParkedScreen want={parked} />;

  // Night lock: no pause and no passes, only park it, close it, or the urgent door.
  if (night) {
    const to = getState().settings.nlTo;
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0F33' }}>
        <View style={{ flex: 1, paddingTop: insets.top + 60, paddingHorizontal: 28, alignItems: 'center' }}>
          <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(142,162,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <IconMoon size={56} color="#8EA2FF" />
          </View>
          <Text style={[type.h1, { fontSize: 26, color: '#FFFFFF', textAlign: 'center', marginTop: 24 }]}>
            It’s late. {app} can wait till morning.
          </Text>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: '#9EA3D9', marginTop: 8 }}>Night lock is on until {hh(to)}</Text>
          {preview && (
            <View style={{ marginTop: 18 }}>
              <Chip tone="glass" label="Preview: this is what you see during night lock" />
            </View>
          )}
          <View style={{ flex: 1 }} />
          <View style={{ alignSelf: 'stretch', gap: 12, paddingBottom: insets.bottom + 20 }}>
            {preview ? (
              <Button label="Close the preview" onPress={() => router.back()} />
            ) : (
              <>
            <Button label="Park it till morning" icon={<IconHourglass size={18} />} onPress={() => setSheet('quick')} />
            <Button
              variant="secondary"
              label={`Close ${app}`}
              onPress={() => {
                finished.current = true;
                startCoolOff(app, key);
                router.replace('/');
              }}
            />
            <TextLink label="It’s urgent" style={{ color: color.text3, textDecorationLine: 'underline', fontSize: 14 }} onPress={() => router.replace({ pathname: '/urgent', params: { app } })} />
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingHorizontal: 28, alignItems: 'center' }}
        bounces={false}
      >
        <Chip
          tone="glass"
          size={13}
          icon={<IconTimer size={14} />}
          label={`${total}-second pause · ${app}${lateNight ? ' · late night' : new Date().getHours() >= 22 ? ' · risky hour' : ''}${saleOn() ? ' · sale week' : ''}`}
        />
        <View style={{ marginTop: 16 }}>
          <BreathRing total={total} left={left} done={done} />
        </View>

        {askQuestion ? (
          <View style={{ alignItems: 'center', marginTop: 18, alignSelf: 'stretch' }}>
            <Text style={[type.h1, { fontSize: 24, lineHeight: 28, color: '#FFFFFF', textAlign: 'center' }]}>What’s this one about?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              {(Object.keys(REASONS) as Reason[]).map((r) => (
                <Tag key={r} large onDark label={REASONS[r]} selected={answer === r} onPress={() => answerReason(r)} />
              ))}
            </View>
            {answer && (
              <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 12 }]}>
                {COACH[answer](getState().reasons[answer] ?? 1)}
              </Text>
            )}
          </View>
        ) : dinner ? (
          <View style={{ alignSelf: 'stretch', alignItems: 'center', marginTop: 18 }}>
            <Text style={[type.h1, { color: '#FFFFFF', textAlign: 'center' }]}>Hungry, or just tired?</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 14, backgroundColor: 'rgba(94,233,181,0.1)', borderRadius: 18, padding: 14, gap: 8 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: '#A8F5D6' }}>You’ve got at home</Text>
              {dinner.map((m) => (
                <View key={m.n} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 20 }}>{m.e}</Text>
                  <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 16, color: '#FFFFFF' }}>{m.n}</Text>
                  {m.m ? <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: color.white82 }}>{m.m} min</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <Text style={[type.h1, { color: '#FFFFFF', textAlign: 'center', marginTop: 18 }]}>Take a breath. Do you still want it?</Text>
        )}

        {!answer && !dinner && <View
          style={{
            marginTop: 16,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            backgroundColor: 'rgba(13,15,46,0.32)',
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingVertical: 12,
            maxWidth: 330,
          }}
        >
          <View style={{ marginTop: 2 }}>
            <IconClock size={16} color="rgba(255,255,255,0.82)" />
          </View>
          <Bold text={fact} style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: color.white82, flexShrink: 1 }} />
        </View>}

        {note && (
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
            <NotePlayer note={note} />
          </View>
        )}

        <View style={{ flex: 1, minHeight: 20 }} />

        <View style={{ alignSelf: 'stretch', paddingBottom: insets.bottom + 20, gap: 12 }}>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(243,242,255,0.75)', textAlign: 'center' }}>
            {done ? 'Whatever you pick is fine' : 'Just breathe. Choices come in a moment.'}
          </Text>
          <Animated.View style={unlockStyle(0)}>
            <Button variant="white" label="I’ll leave it" onPress={leave} disabled={!done} />
          </Animated.View>
          <Animated.View style={unlockStyle(1)}>
            <Button
              variant="ghost"
              label="Park it till morning"
              icon={<IconHourglass size={18} />}
              onPress={() => setSheet('quick')}
              disabled={!done}
            />
          </Animated.View>
          <Animated.View style={[unlockStyle(2), { opacity: done ? 1 : 0.38 }]}>
            <Pressable onPress={shop} disabled={!done} accessibilityRole="button" style={{ paddingVertical: 8 }}>
              <Text
                style={{
                  fontFamily: font.bodyBold,
                  fontSize: 15,
                  color: 'rgba(243,242,255,0.8)',
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                }}
              >
                {shopLinkLabel()}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>

      <ParkSheet app={app} mode={sheet} onMode={setSheet} onPark={park} />
    </View>
  );
}

// ---- Park it till morning: quick and expanded sheet ----------------------

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
  const insets = useSafeAreaInsets();
  const [what, setWhat] = useState('');
  const [band, setBand] = useState<PriceBand>('unsure');
  const [price, setPrice] = useState(0);
  const [items, setItems] = useState<number | undefined>();
  const [snap, setSnap] = useState<'idle' | 'reading' | 'done' | 'fail'>('idle');
  const [asked, setAsked] = useState(false);
  const buddy = getState().buddy;
  const friend = buddy.name.trim() || 'your friend';
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

  return (
    <Modal visible={mode !== null} transparent animationType="slide" onRequestClose={() => onMode(null)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(6,6,28,0.5)' }} onPress={() => onMode(null)} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior="padding">
        <View
          style={{
            backgroundColor: color.sheet,
            borderTopWidth: 1.5,
            borderColor: '#2E3374',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#3A3F86', marginBottom: 16 }} />
          <Text style={[type.h1, { fontSize: 24, lineHeight: 28 }]}>Park it till morning</Text>

          {mode === 'quick' ? (
            <>
              <Text style={[type.body, { marginTop: 8 }]}>
                You don’t need to know what it is or what it costs. {app} stays shielded, and you decide with a clear head.
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 16,
                  backgroundColor: '#1C2057',
                  borderRadius: 22,
                  padding: 16,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.19)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconMoon size={22} color="#CBBBFF" />
                </View>
                <View>
                  <Text style={type.label}>Ready</Text>
                  <Text style={[type.h2]}>{formatReady(waitFor('unsure', now).readyAt, now)}</Text>
                </View>
              </View>
              <View style={{ marginTop: 18, gap: 4 }}>
                <Button label="Park it" icon={<IconHourglass size={18} />} onPress={() => onPark('', 'unsure')} />
                <TextLink label="Add what it is or a rough price" onPress={() => onMode('full')} />
                <TextLink label="Cancel" style={{ color: color.text3 }} onPress={() => onMode(null)} />
              </View>
            </>
          ) : (
            <>
              <Text style={[type.body, { marginTop: 8 }]}>All of this is optional. {app} stays shielded while it waits.</Text>
              <Text style={[type.label, { marginTop: 16 }]}>What is it? (optional)</Text>
              <TextInput
                value={what}
                onChangeText={setWhat}
                maxLength={40}
                placeholder={`Something from ${app}`}
                placeholderTextColor={color.placeholder}
                style={{
                  marginTop: 8,
                  backgroundColor: color.field,
                  borderColor: color.fieldBorder,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  fontFamily: font.bodySemi,
                  fontSize: 16.5,
                  color: color.text,
                }}
              />
              <Text style={[type.label, { marginTop: 16 }]}>Roughly how much?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {price > 0 && (
                  <Tag label={`£${price}${items ? `, ${items} items` : ''}`} selected={band === 'exact'} onPress={() => setBand('exact')} />
                )}
                {BANDS.map((b) => (
                  <Tag key={b} label={BAND_LABEL[b]} selected={band === b} onPress={() => setBand(b)} />
                ))}
              </View>
              <Pressable
                onPress={snapBasket}
                disabled={snap === 'reading'}
                accessibilityRole="button"
                style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#3A3F86', borderRadius: 18, padding: 12 }}
              >
                <Text style={{ fontSize: 22 }}>{snap === 'done' ? '✅' : '📸'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>
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
              <View style={{ marginTop: 16, backgroundColor: '#1C2057', borderRadius: 22, padding: 16 }}>
                <Text style={type.label}>It waits</Text>
                <Text style={{ fontFamily: font.display, fontSize: 26, color: color.blueLight }}>{formatDuration(readyAt - now)}</Text>
                <Text style={[type.small, { marginTop: 2 }]}>Ready {formatReady(readyAt, now)}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {chips.map((c) => (
                    <Chip key={c} tone="lilac" label={c} />
                  ))}
                </View>
                <Text style={[type.small, { marginTop: 8 }]}>
                  {band === 'exact' && price
                    ? `That’s about ${hoursOfWork(price, wage)} of your work.`
                    : 'Snap your basket to see the price and the hours of work.'}
                </Text>
              </View>
              <View style={{ marginTop: 18, gap: 8 }}>
                {asked ? (
                  <>
                    <Text style={[type.title, { textAlign: 'center' }]}>What did {friend} say?</Text>
                    <Button label="They said go for it" onPress={() => onPark(what, band, extra(true))} />
                    <Button variant="secondary" label="They said sleep on it" onPress={() => onPark(what, band, extra())} />
                  </>
                ) : (
                  <>
                    <Button label="Park it" icon={<IconHourglass size={18} />} onPress={() => onPark(what, band, extra())} />
                    {buddy.on && parkPrice(band, price) > 50 && (
                      <Button variant="secondary" label={`Ask ${friend} if it can skip the wait`} onPress={askFriend} />
                    )}
                  </>
                )}
                <TextLink label="Cancel" style={{ color: color.text3 }} onPress={() => onMode(null)} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---- After parking -------------------------------------------------------

function ParkedScreen({ want }: { want: ParkedWant }) {
  const insets = useSafeAreaInsets();
  const rm = useReduceMotion();
  const drop = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const stamp = useRef(new Animated.Value(rm ? 1 : 0)).current;
  const morning = new Date(want.readyAt).getHours() === 8 && new Date(want.readyAt).getMinutes() === 0;
  const when = formatReady(want.readyAt);

  useEffect(() => {
    if (rm) return;
    Animated.sequence([
      Animated.timing(drop, { toValue: 1, duration: 550, easing: springOut, useNativeDriver: true }),
      Animated.timing(stamp, { toValue: 1, duration: 500, easing: springOut, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [rm, drop, stamp]);

  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      <View style={{ flex: 1, paddingTop: insets.top + 40, paddingHorizontal: 28, alignItems: 'center' }}>
        <Animated.View
          style={{
            opacity: drop,
            transform: [
              { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] }) },
              { rotate: '-3deg' },
            ],
            width: 240,
            backgroundColor: color.paper,
            borderRadius: 18,
            padding: 18,
            alignItems: 'center',
            shadowColor: '#020312',
            shadowOpacity: 0.5,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#2C24A3', marginBottom: 12 }} />
          <Image source={require('../../assets/mascots/bubble.webp')} style={{ width: 96, height: 96 }} resizeMode="contain" />
          <Text style={{ fontFamily: font.display, fontSize: 20, color: color.inkOnBright, marginTop: 8, textAlign: 'center' }}>
            {want.what || `Something from ${want.app}`}
          </Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.paperLabel, marginTop: 2 }}>
            {want.app} · {priceText(want)}
          </Text>
          <Animated.View
            style={{
              marginTop: 14,
              opacity: stamp,
              transform: [
                { scale: stamp.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
                { rotate: stamp.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '-6deg'] }) },
              ],
              borderWidth: 3,
              borderColor: color.blue,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontFamily: font.display, fontSize: 18, color: color.blue }}>{want.buddy ? `${friendName()} said yes` : `Decide ${when}`}</Text>
          </Animated.View>
        </Animated.View>

        <Text style={[type.display, { color: '#FFFFFF', textAlign: 'center', marginTop: 32 }]}>
          {want.buddy ? `${friendName()} let it through` : morning ? 'Parked. Sleep on it.' : 'Parked. Give it time.'}
        </Text>
        <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 10 }]}>
          {want.buddy
            ? 'It’s ready to decide now, in your waiting room.'
            : `${want.app} stays shielded. ${morning ? 'Morning-you' : 'Later-you'} gets the final say. We’ll let you know when it’s ready.`}
        </Text>
        <View style={{ marginTop: 14 }}>
          <Chip tone="mint" label="+5 XP" />
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'stretch', paddingBottom: insets.bottom + 20 }}>
          <Button
            variant="white"
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
    </View>
  );
}
