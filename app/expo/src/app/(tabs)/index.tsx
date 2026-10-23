import { router, useIsFocused } from 'expo-router';
import {
  CalendarCheckIcon,
  ClipboardTextIcon,
  LockKeyIcon,
  MicrophoneIcon,
  PackageIcon,
  PiggyBankIcon,
  SparkleIcon,
  TicketIcon,
} from 'phosphor-react-native';
import { type ComponentRef, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasTmNative } from '../../../modules/tm-native';
import { type MyApp, myApps } from '../../lib/apps';
import { endPass, formatReady, shieldChosenApps } from '../../lib/core';
import { hh, nightOn, pauseSeconds, risky } from '../../lib/rules';
import { getState, setState, useAppState } from '../../lib/store';
import { COACH_TIPS, nextUnlock, recapDue } from '../../lib/week';
import { xpToast } from '../../lib/xp';
import { TopGlow } from '../../ui/backgrounds';
import { Button, Rise, toast } from '../../ui/components';
import { Spotlight, type SpotRef } from '../../ui/Spotlight';
import { useBoundaryNow } from '../../ui/tabs/clock';
import { openRoomOn } from '../../ui/tabs/roomView';
import { useTarget } from '../../ui/tabs/spot';
import {
  CheckInNudge,
  type NextStep,
  NextStepRow,
  PassButton,
  PassTicket,
  SaleBanner,
  ShieldChip,
  shieldedList,
  shieldedTitle,
  StatusCard,
  TryPill,
  useShieldSummary,
  WaitCard,
} from '../../ui/tabs/TodayParts';
import { WhichAppSheet } from '../../ui/WhichAppSheet';
import { type } from '../../ui/theme';

const greeting = (now: number) => {
  const h = new Date(now).getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const hhmm = (at: number) => {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// COACH_TIPS (src/lib/week.ts) in order, and what each one points at (data-coach in the prototype).
const COACH_KEYS = ['status', 'wait', 'pass', 'try'] as const;
type CoachKey = (typeof COACH_KEYS)[number];
const COACH_RADIUS: Record<CoachKey, number> = { status: 22, wait: 22, pass: 999, try: 999 };

/**
 * Today, the prototype's calmHome() (P:L1985–2000): "Calm Today: one card, at most one next
 * step, then the pass button. Everything else lives in Me."
 */
export default function Today() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const pass = useAppState((s) => s.pass);
  const checkIn = useAppState((s) => s.pendingCheckIn);
  const shieldsOn = useAppState((s) => s.shieldsOn);
  const offUntil = useAppState((s) => s.offUntil);
  const lapsed = useAppState((s) => s.lapsed);
  const subscribed = useAppState((s) => s.subscribed);
  const parked = useAppState((s) => s.parked);
  const settings = useAppState((s) => s.settings);
  const coachStep = useAppState((s) => s.coachStep);
  const parcels = useAppState((s) => s.queue.length);
  useAppState((s) => s.unlocked.length + s.trialAt + s.recapSeenWeek); // week-one cards and the Sunday recap
  const setupDone = useAppState(
    (s) =>
      `${Object.keys(s.habits).length > 0 ? 1 : 0}${s.budgetTotal > 0 || s.budgetSkipped ? 1 : 0}${s.passSet ? 1 : 0}${s.note ? 1 : 0}${s.bankLock ? 1 : 0}${s.setupHidden ? 1 : 0}`,
  );
  const offApps = useAppState((s) => s.offApps);

  const open = parked.filter((w) => !w.decided);
  const now = useBoundaryNow([...open.map((w) => w.readyAt), offUntil]);
  const summary = useShieldSummary();
  const shielded = summary.apps + summary.categories;

  const offTill = shieldsOn && offUntil > now;
  const on = subscribed && shieldsOn && !lapsed && !offTill;
  const night = nightOn(now);
  const showBottom = !lapsed && shielded > 0;

  // "Shields on" stamps in on the first arrival after the paywall, and whenever the shields come back on.
  const [stampChip, setStampChip] = useState(() => getState().coachStep === 0);
  const wasOn = useRef(on);
  useEffect(() => {
    if (on && !wasOn.current) setStampChip(true);
    wasOn.current = on;
  }, [on]);
  useEffect(() => {
    if (!stampChip) return;
    const t = setTimeout(() => setStampChip(false), 3200);
    return () => clearTimeout(t);
  }, [stampChip]);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const statusRef: SpotRef = useRef(null);
  const waitRef: SpotRef = useRef(null);
  const passRef: SpotRef = useRef(null);
  const tryRef: SpotRef = useRef(null);
  const [whichApps, setWhichApps] = useState<MyApp[] | null>(null);

  const shieldsBackOn = () => {
    const r = shieldChosenApps();
    toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
  };

  // ---- Status card ----
  const status = (() => {
    if (lapsed)
      return {
        face: 'off' as const,
        title: 'No shields right now',
        sub: 'Your plan has ended, so your apps open with no pause.',
        action: <Button label="See plans" onPress={() => router.push('/paywall')} />,
      };
    if (offTill) {
      const tomorrow = new Date(offUntil).toDateString() !== new Date(now).toDateString();
      return {
        face: 'off' as const,
        title: 'Shields are off till tomorrow',
        sub: `They come back on by themselves at ${hhmm(offUntil)}${tomorrow ? ' tomorrow' : ' this morning'}. Nothing else changes.`,
        action: <Button variant="secondary" label="Turn them back on now" onPress={shieldsBackOn} />,
      };
    }
    if (!shieldsOn)
      return {
        face: 'off' as const,
        title: 'Shields are off',
        sub: 'Your apps open with no pause right now.',
        action: <Button label="Turn shields back on" onPress={shieldsBackOn} />,
      };
    if (shielded === 0)
      return {
        face: 'off' as const,
        title: 'No apps shielded',
        sub: 'Pick the apps that get you, and Till Morning puts a pause in front of them.',
        action: <Button label="Choose apps" onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })} />,
      };
    const timeLine = night
      ? `Night lock is on till ${hh(settings.nlTo)}: park it or close it.`
      : risky(now)
        ? `It’s your risky hour, so pauses are ${pauseSeconds(now)} seconds.`
        : settings.nlOn
          ? `Pauses get longer from 22:00. Night lock from ${hh(settings.nlFrom)}.`
          : 'Pauses get longer from 22:00.';
    const title = shieldedTitle(summary);
    return { face: 'on' as const, title, sub: `${shieldedList(summary)}. ${timeLine}`, working: true };
  })();

  // ---- Waiting room card ----
  const readyN = open.filter((w) => w.readyAt <= now).length;
  const waiting = open.filter((w) => w.readyAt > now).sort((a, b) => a.readyAt - b.readyAt);
  const wait = (() => {
    if (readyN)
      return {
        tone: 'ready' as const,
        label: 'Ready now',
        count: readyN,
        title: `${readyN} ready to decide`,
        sub: 'You slept on it. Now you get the final say.',
        view: 'ready' as const,
      };
    if (waiting.length) {
      const first = waiting[0].readyAt;
      const when = formatReady(first, now); // "08:00 tomorrow"
      const day = when.endsWith('today') ? 'later today' : when.endsWith('tomorrow') ? 'tomorrow' : `on ${when.split(' ').slice(1).join(' ')}`;
      return {
        tone: 'waiting' as const,
        label: `Ready at ${hhmm(first)}`,
        count: waiting.length,
        title: `${waiting.length} parked want${waiting.length === 1 ? '' : 's'}`,
        sub: `Decide with a clear head ${day}`,
        view: 'waiting' as const,
      };
    }
    return { tone: 'empty' as const, label: 'Waiting room', title: 'Nothing parked', sub: 'When a want hits, park it till morning.', view: null };
  })();

  // ---- At most one next step: week-one card, Sunday recap, a parcel, then what's left of setup ----
  const next: NextStep | null = (() => {
    if (lapsed) return null;
    const unlock = nextUnlock();
    if (unlock)
      return {
        key: `unlock-${unlock.k}`,
        Icon: SparkleIcon,
        weight: 'fill',
        tone: 'sun',
        isNew: true,
        chip: `New · day ${unlock.day}`,
        title: unlock.t,
        sub: unlock.kick,
        go: () => router.push({ pathname: '/unlock', params: { k: unlock.k } }),
      };
    if (recapDue(now))
      return {
        key: 'recap',
        Icon: CalendarCheckIcon,
        tone: 'lav',
        title: 'Your week with Till Morning',
        sub: 'Sunday recap: pauses, waits and passes',
        go: () => router.push('/recap'),
      };
    if (parcels)
      return {
        key: 'parcel',
        Icon: PackageIcon,
        tone: 'sun',
        title: parcels > 1 ? `${parcels} parcels to open` : 'A parcel to open',
        sub: 'You finished a sticker goal',
        go: () => router.push('/parcel'),
      };
    if (!subscribed || setupDone[5] === '1') return null;
    const setup: (NextStep & { done: boolean })[] = [
      ...(hasTmNative
        ? [{ key: 'habits', Icon: ClipboardTextIcon, tone: 'hush' as const, title: 'Pick a habit for each app', sub: 'So each shield asks the right question', go: () => router.push('/apps'), done: setupDone[0] === '1' }]
        : []),
      { key: 'budget', Icon: PiggyBankIcon, tone: 'sun', title: 'Set a monthly budget', sub: 'One total, split across your apps', go: () => router.push('/budget'), done: setupDone[1] === '1' },
      { key: 'passintro', Icon: TicketIcon, tone: 'lav', title: 'Meet the Shopping Pass', sub: 'How to shop on purpose, and your usual pass length', go: () => router.push('/passintro'), done: setupDone[2] === '1' },
      { key: 'note', Icon: MicrophoneIcon, tone: 'lav', title: 'Record a note from calm you', sub: 'It plays in your pause', go: () => router.push('/note'), done: setupDone[3] === '1' },
      { key: 'bank', Icon: LockKeyIcon, tone: 'mint', title: 'Add a bank limit (optional)', sub: 'An extra barrier your bank enforces', go: () => router.push('/bank'), done: setupDone[4] === '1' },
    ];
    return setup.find((x) => !x.done) ?? null;
  })();

  // ---- Bottom block actions ----
  const getPass = () => {
    if (night) return toast(`Shopping Passes sleep till ${hh(settings.nlTo)}. Park it till morning instead.`);
    // With app names from iOS, pick the app first; older installs pause for every app.
    const apps = myApps().filter((a) => a.token && !offApps.includes(a.key));
    if (hasTmNative && apps.length) return setWhichApps(apps);
    router.push({ pathname: '/pause', params: { app: 'your shop apps' } });
  };
  const tryIt = () =>
    toast(
      summary.names.length
        ? `Go to your Home Screen and open ${summary.names[0]} or another shielded app.`
        : 'Go to your Home Screen and open one of your shielded apps.',
    );

  // ---- First-time tour (P:L1840–1867, 2252–2262): starts 1.9 s after Today appears ----
  const coachDue = coachStep >= 0 && focused && subscribed && !lapsed;
  const [coachOn, setCoachOn] = useState(false);
  useEffect(() => {
    if (!coachDue) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      setCoachOn(true);
    }, 1900);
    return () => {
      clearTimeout(t);
      setCoachOn(false);
    };
  }, [coachDue]);
  const targets: Record<CoachKey, SpotRef | null> = {
    status: statusRef,
    wait: waitRef,
    pass: showBottom && !pass ? passRef : null,
    try: showBottom ? tryRef : null,
  };
  const steps = COACH_KEYS.map((k, i) => ({ k, ...COACH_TIPS[i] })).filter((s) => targets[s.k]);
  const ci = Math.max(0, Math.min(coachStep, steps.length - 1));
  const step = coachOn && coachDue ? steps[ci] : undefined;
  const rect = useTarget(step ? targets[step.k] : null, !!step, step ? COACH_RADIUS[step.k] : 22, 30);
  const last = ci === steps.length - 1;

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: 16 }}>
        <Rise style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text accessibilityRole="header" style={type.h1}>
            {greeting(now)}
          </Text>
          <ShieldChip on={on} play={stampChip} />
        </Rise>

        {checkIn && (
          <Rise style={{ marginTop: 20 }}>
            <CheckInNudge pass={checkIn} />
          </Rise>
        )}

        {pass && (
          <Rise delay={30} style={{ marginTop: 20 }}>
            <PassTicket pass={pass} onEnd={() => endPass(true)} />
          </Rise>
        )}

        <Rise delay={30} style={{ marginTop: 20 }}>
          <StatusCard targetRef={statusRef} face={status.face} title={status.title} sub={status.sub} action={status.action} working={status.working} />
        </Rise>

        {!lapsed && (
          <Rise delay={60} style={{ marginTop: 12 }}>
            <WaitCard
              targetRef={waitRef}
              tone={wait.tone}
              label={wait.label}
              count={wait.count}
              title={wait.title}
              sub={wait.sub}
              onPress={() => {
                if (wait.view) openRoomOn(wait.view);
                router.navigate('/waiting');
              }}
            />
          </Rise>
        )}

        {!lapsed && settings.sale && (
          <Rise delay={40} style={{ marginTop: 12 }}>
            <SaleBanner />
          </Rise>
        )}

        {next && (
          <Rise key={next.key} delay={60} style={{ marginTop: 16 }}>
            <NextStepRow step={next} />
          </Rise>
        )}
      </ScrollView>

      {/* Between the content and the tab bar, not over the content */}
      {showBottom && (
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, gap: 12, alignItems: 'center' }}>
          <TryPill targetRef={tryRef} onPress={tryIt} />
          {!pass && <PassButton targetRef={passRef} night={night} nightTo={hh(settings.nlTo)} onPress={getPass} />}
        </View>
      )}

      <WhichAppSheet visible={!!whichApps} apps={whichApps ?? []} onClose={() => setWhichApps(null)} />

      <Spotlight
        visible={!!step && !!rect}
        target={rect}
        title={step?.t ?? ''}
        body={step?.d ?? ''}
        step={ci}
        steps={steps.length}
        next={last ? 'Open an app' : 'Next'}
        onNext={() => {
          if (!last) return setState({ coachStep: ci + 1 });
          setState({ coachStep: -1 });
          tryIt();
        }}
        onSkip={() => setState({ coachStep: -1 })}
        skipLabel={last ? 'Later' : 'Skip'}
      />
    </View>
  );
}
