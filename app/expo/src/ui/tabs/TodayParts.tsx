import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { CaretRightIcon, HandPointingIcon, type Icon, type IconWeight, MoonStarsIcon, ShieldCheckIcon, TicketIcon } from '../ph';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Platform, Pressable, Text, View } from 'react-native';
import R from 'react-native-reanimated';

import { AppLabel } from '../../../modules/tm-native';
import { myApps } from '../../lib/apps';
import { knownApp, protectedCount } from '../../lib/core';
import type { ShoppingPass } from '../../lib/store';
import { useAppState } from '../../lib/store';
import { Card, Chip, useReduceMotion } from '../components';
import type { SpotRef } from '../Spotlight';
import { StFace } from '../StFace';
import { color, font, type } from '../theme';
import { ago, lastSeenAt, useTickWhileFocused } from './clock';
import { ringPulse, SPRING, stamp, wiggle } from './motion';
import { Tile, type TileTone } from './Tile';

// ---- What's shielded --------------------------------------------------------------------------

/**
 * The protected selection's counts and the app names iOS has told us. Native calls, so it is
 * worked out only when Today comes on screen, the app comes to the foreground, or the shields
 * or app choices change — never on every render.
 */
export function useShieldSummary() {
  const shieldsOn = useAppState((s) => s.shieldsOn);
  const appsChosen = useAppState((s) => s.appsChosen);
  const offApps = useAppState((s) => s.offApps);
  const [seen, setSeen] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setSeen((n) => n + 1);
    }, []),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') setSeen((n) => n + 1);
    });
    return () => sub.remove();
  }, []);
  return useMemo(() => {
    const c = protectedCount();
    const names = myApps()
      .filter((a) => a.token && !offApps.includes(a.key))
      .map((a) => a.name)
      .filter((n): n is string => knownApp(n));
    return { apps: c.apps, categories: c.categories, names };
    // `seen` re-reads the selection on focus and on foreground.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shieldsOn, appsChosen, offApps, seen]);
}

export type ShieldSummary = ReturnType<typeof useShieldSummary>;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function shieldedTitle({ apps, categories }: ShieldSummary) {
  if (categories > 0) return `${categories === 1 ? 'A whole category' : `${categories} categories`}${apps ? ` and ${apps} more` : ''} shielded`;
  return apps === 1 ? '1 app is shielded' : `${apps} apps are shielded`;
}

/** "SHEIN, Amazon and 1 more" when iOS has shared names, otherwise the counts. */
export function shieldedList({ apps, categories, names }: ShieldSummary) {
  const cats = categories ? plural(categories, 'category', 'categories') : '';
  if (names.length) {
    const shown = names.slice(0, 3);
    const rest = Math.max(0, apps - shown.length);
    const list = rest ? `${shown.join(', ')} and ${rest} more` : shown.join(', ');
    return cats ? `${list}, plus ${cats}` : list;
  }
  return [apps ? plural(apps, 'app', 'apps') : '', cats].filter(Boolean).join(' and ');
}

// ---- Header chip --------------------------------------------------------------------------------

/** "Shields on / off" (13 px, always with the shield). `play` stamps it in with a mint ring pulse. */
export function ShieldChip({ on, play }: { on: boolean; play: boolean }) {
  const label = on ? 'Shields on' : 'Shields off';
  return (
    <R.View
      accessible
      accessibilityLabel={label}
      style={play ? { animationName: stamp, animationDuration: 550, animationDelay: 250, animationTimingFunction: SPRING, animationFillMode: 'both' } : null}
    >
      <Chip tone={on ? 'mint' : 'paper'} size={13} label={label} icon={<ShieldCheckIcon size={14} weight="bold" color={on ? color.mintText : color.text2} />} />
      {play && (
        <R.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: 999,
            borderWidth: 3,
            borderColor: '#5EE9B5',
            opacity: 0,
            animationName: ringPulse,
            animationDuration: 1200,
            animationDelay: 350,
            animationIterationCount: 2,
            animationTimingFunction: 'ease-out',
          }}
        />
      )}
    </R.View>
  );
}

// ---- Check-in nudge -----------------------------------------------------------------------------

/** .nudge: amber tile row that wiggles once, 700 ms after it rises in. */
export function CheckInNudge({ pass }: { pass: ShoppingPass }) {
  const rm = useReduceMotion();
  const title = pass.wholeSelection || !knownApp(pass.app) ? 'Your Shopping Pass ended' : `Your ${pass.app} pass ended`;
  return (
    <R.View style={rm ? null : { animationName: wiggle, animationDuration: 600, animationDelay: 840, animationTimingFunction: 'ease-in-out' }}>
      <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button" accessibilityLabel={`${title}. How did it go?`}>
        {({ pressed }) => (
          <View style={{ borderRadius: 22, backgroundColor: color.sunEdge, paddingBottom: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 }}>
            <View style={{ borderRadius: 22, backgroundColor: color.sun, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                <TicketIcon size={22} weight="bold" color={color.inkOnBright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.title, { color: color.inkOnBright }]}>{title}</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.inkOnBright }}>How did it go?</Text>
              </View>
              <CaretRightIcon size={20} weight="bold" color={color.inkOnBright} />
            </View>
          </View>
        )}
      </Pressable>
    </R.View>
  );
}

// ---- Live pass ticket ---------------------------------------------------------------------------

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const DASHES = Array.from({ length: 16 }, (_, i) => i);

/** The countdown and the bar along the bottom: the only part of Today that ticks, once a second. */
function PassClock({ pass }: { pass: ShoppingPass }) {
  const now = useTickWhileFocused(1000);
  const left = pass.endsAt - now;
  const frac = Math.max(0, Math.min(1, left / Math.max(1, pass.endsAt - pass.startedAt)));
  return (
    <>
      <View style={{ width: 62, alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 26, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{mmss(left)}</Text>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: '#FFFFFF', marginTop: 2 }}>left</Text>
      </View>
      {/* .passbar: white at 32%, as wide as the time left */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, backgroundColor: '#FFFFFF', opacity: 0.32, transformOrigin: 'left', transform: [{ scaleX: frac }] }}
      />
    </>
  );
}

/** .ticket: the running Shopping Pass, with notches, a dashed tear line and the time left. */
export function PassTicket({ pass, onEnd }: { pass: ShoppingPass; onEnd: () => void }) {
  const title = pass.urgent ? 'Urgent · 10 minutes' : pass.wholeSelection || !knownApp(pass.app) ? 'Shopping pass' : `${pass.app} pass`;
  const line =
    (pass.need || { specific: 'Something specific', browsing: 'Just browsing', unsure: 'Not sure yet' }[pass.reason]) + (pass.limit ? `, up to £${pass.limit}` : '');
  const notch = { position: 'absolute' as const, top: '50%' as const, marginTop: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: color.night };
  return (
    <View style={{ borderRadius: 22, backgroundColor: '#5427B8', paddingBottom: 3 }}>
      <LinearGradient
        colors={['#7E3FF2', '#B455F0']}
        start={{ x: 0.07, y: 0.25 }}
        end={{ x: 0.93, y: 0.75 }}
        style={{ borderRadius: 22, overflow: 'hidden', paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={[notch, { left: -13 }]} />
        <View style={[notch, { right: -13 }]} />
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', padding: 6, alignItems: 'center', justifyContent: 'center' }}>
          {pass.key && !pass.wholeSelection ? (
            <AppLabel appKey={pass.key} mode="icon" size={24} align="center" style={{ width: 32, height: 32 }} />
          ) : (
            <TicketIcon size={24} weight="bold" color="#7E3FF2" />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[type.title, { color: '#FFFFFF' }]} numberOfLines={1}>
            {title}
          </Text>
          <Text numberOfLines={2} style={{ fontFamily: font.bodySemi, fontSize: 14, lineHeight: 18, color: 'rgba(255,255,255,0.8)' }}>
            {line}
          </Text>
          <Pressable onPress={onEnd} accessibilityRole="button" accessibilityLabel="End the pass now" hitSlop={10} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', textDecorationLine: 'underline' }}>End it now</Text>
          </Pressable>
        </View>
        {/* .perf-v: a dashed tear line, drawn as dashes (one-sided dashed borders draw solid on iOS) */}
        <View style={{ alignSelf: 'stretch', width: 2, marginVertical: -8, marginHorizontal: 2, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 0, left: 0 }}>
            {DASHES.map((i) => (
              <View key={i} style={{ width: 2, height: 6, marginBottom: 5, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.36)' }} />
            ))}
          </View>
        </View>
        <PassClock pass={pass} />
      </LinearGradient>
    </View>
  );
}

// ---- Status card --------------------------------------------------------------------------------

/** .sc-line: "Shields working · checked just now". */
function CheckedLine() {
  const lastCheckAt = useAppState((s) => s.lastCheckAt);
  const now = useTickWhileFocused(60000);
  return (
    <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(94,233,181,0.18)', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.mint }} />
      </View>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.text3 }}>Shields working · checked {ago(lastCheckAt || lastSeenAt(), now)}</Text>
    </View>
  );
}

/** statusCard() (P:L1967–1976): the face, what's shielded, and the one action when something is off. */
export function StatusCard({
  targetRef,
  face,
  title,
  sub,
  action,
  working,
  label,
}: {
  targetRef: SpotRef;
  face: 'on' | 'off';
  title: string;
  sub: string;
  action?: ReactNode;
  working?: boolean;
  label?: string;
}) {
  const focused = useIsFocused();
  return (
    <View ref={targetRef} collapsable={false}>
      <Card style={{ alignItems: 'center', paddingTop: 22, paddingHorizontal: 18, paddingBottom: 20 }}>
        <View accessible={!action} accessibilityLabel={label ?? `${title}. ${sub}`} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
          <StFace size={84} off={face === 'off'} breathe={focused} />
          <Text style={[type.h2, { marginTop: 12, textAlign: 'center' }]}>{title}</Text>
          <Text style={[type.small, { marginTop: 4, textAlign: 'center' }]}>{sub}</Text>
          {working && <CheckedLine />}
        </View>
        {action ? <View style={{ alignSelf: 'stretch', marginTop: 16 }}>{action}</View> : null}
      </Card>
    </View>
  );
}

// ---- Waiting room card --------------------------------------------------------------------------

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

/** waitCard() (P:L1977–1984; CSS P:L1775–1779). Empty: a plain card, nothing to tap. */
export function WaitCard({
  targetRef,
  tone,
  label,
  count,
  title,
  sub,
  onPress,
}: {
  targetRef: SpotRef;
  tone: 'ready' | 'waiting' | 'empty';
  label: string;
  count?: number;
  title: string;
  sub: string;
  onPress?: () => void;
}) {
  const lab = tone === 'ready' ? '#5EE9B5' : tone === 'empty' ? color.text3 : '#FFC94D';
  const labText = (
    <Text style={{ fontFamily: MONO, fontWeight: '700', fontSize: 12, letterSpacing: 0.96, textTransform: 'uppercase', color: lab }}>{label}</Text>
  );
  if (tone === 'empty') {
    return (
      <View ref={targetRef} collapsable={false} accessible accessibilityLabel={`Waiting room. ${title}. ${sub}`}>
        <Card style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
          {labText}
          <Text style={[type.title, { marginTop: 8 }]}>{title}</Text>
          <Text style={type.small}>{sub}</Text>
        </Card>
      </View>
    );
  }
  return (
    <Pressable ref={targetRef} collapsable={false} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}. ${title}. ${sub}`}>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        {labText}
        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: tone === 'ready' ? '#5EE9B5' : '#FFC94D', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: color.inkOnBright }}>{count}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={type.title}>{title}</Text>
            <Text style={type.small}>{sub}</Text>
          </View>
          <CaretRightIcon size={18} weight="bold" color={color.text3} />
        </View>
      </Card>
    </Pressable>
  );
}

// ---- Sale banner --------------------------------------------------------------------------------

/** .wr-sale */
export function SaleBanner() {
  return (
    <View accessible style={{ borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,143,120,0.5)', overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 12 }}>
      <LinearGradient colors={['#3A1430', '#2A1638']} start={{ x: 0.07, y: 0.25 }} end={{ x: 0.93, y: 0.75 }} style={{ position: 'absolute', inset: 0 }} />
      <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 20, color: '#FFAB98' }}>It’s Black Friday week</Text>
      <Text style={type.small}>Waits are doubled until Monday.</Text>
    </View>
  );
}

// ---- The one next step --------------------------------------------------------------------------

export type NextStep = {
  key: string;
  Icon: Icon;
  weight?: IconWeight;
  tone: TileTone;
  title: string;
  sub: string;
  chip?: string;
  isNew?: boolean;
  go: () => void;
};

/** nextStep() rows (P:L1870–1878): 44 px tile, title and line, caret. `.new-card` for week-one features. */
export function NextStepRow({ step }: { step: NextStep }) {
  const { Icon } = step;
  return (
    <Pressable onPress={step.go} accessibilityRole="button" accessibilityLabel={`${step.chip ? `${step.chip}. ` : ''}${step.title}. ${step.sub}`}>
      <View style={{ borderRadius: 22, backgroundColor: color.cardEdge, paddingBottom: 3 }}>
        <View
          style={{
            borderRadius: 22,
            borderWidth: 1.5,
            borderColor: step.isNew ? '#6B5A2A' : color.cardEdge,
            backgroundColor: color.card,
            overflow: 'hidden',
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {step.isNew && <LinearGradient colors={['#2A2552', '#1C2057']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />}
          <Tile tone={step.tone} Icon={Icon} weight={step.weight} />
          <View style={{ flex: 1, minWidth: 0 }}>
            {step.chip ? (
              <View style={{ marginBottom: 4 }}>
                <Chip tone="sun" size={11} label={step.chip} />
              </View>
            ) : null}
            <Text style={type.title}>{step.title}</Text>
            <Text style={type.small}>{step.sub}</Text>
          </View>
          <CaretRightIcon size={20} weight="bold" color={color.text3} />
        </View>
      </View>
    </Pressable>
  );
}

// ---- Bottom block -------------------------------------------------------------------------------

/** .try-pill: "Try the blocker: open an app". */
export function TryPill({ targetRef, onPress }: { targetRef: SpotRef; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint="Explains how to see the shield">
      {({ pressed }) => (
        <View ref={targetRef} collapsable={false} style={{ borderRadius: 99, backgroundColor: color.sunEdge, paddingBottom: pressed ? 1 : 3, marginTop: pressed ? 2 : 0 }}>
          <View style={{ borderRadius: 99, backgroundColor: color.sun, paddingHorizontal: 14, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <HandPointingIcon size={16} weight="bold" color={color.inkOnBright} />
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: color.inkOnBright }}>Try the blocker: open an app</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** .pass-cta, or .nl-sleep while the night lock is on. */
export function PassButton({ targetRef, night, nightTo, onPress }: { targetRef: SpotRef; night: boolean; nightTo: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={night ? undefined : 'You get the usual pause first'}
      style={{ alignSelf: 'stretch' }}
    >
      {({ pressed }) => (
        <View
          ref={targetRef}
          collapsable={false}
          style={{ borderRadius: 999, backgroundColor: night ? '#15184A' : '#4B2BB0', paddingBottom: pressed ? 2 : night ? 3 : 4, marginTop: pressed ? (night ? 1 : 2) : 0 }}
        >
          {night ? (
            <View style={{ height: 56, borderRadius: 999, backgroundColor: '#1E2256', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MoonStarsIcon size={18} weight="bold" color={color.text2} />
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: color.text2 }}>Passes sleep till {nightTo}</Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#7C4DFF', '#A066FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, color: '#FFFFFF' }}>Need to shop? Get a pass</Text>
            </LinearGradient>
          )}
        </View>
      )}
    </Pressable>
  );
}
