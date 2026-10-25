import { useEffect, useState } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import type { ParkedWant } from '../../lib/store';
import { useReduceMotion } from '../components';
import type { SpotRef } from '../Spotlight';
import { color, font } from '../theme';
import { Pressable } from '../Pressable';

// Night Trolley · Part 1 (Today, option B "the route"): tonight as a flight-tracker timeline.
// Every parked want rides a trolley from the shop shutting to the Morning Till at 08:00.

const MOON = '#FFE7A3';
const DAWN = '#FFB59A';
const ROW = 56; // every row is the same height, so the line and the dots always line up
const DOT = 24;

const pad = (n: number) => String(n).padStart(2, '0');
const hh = (h: number) => `${pad(h)}:00`;

/** The trolley glyph (also used in the Lock Screen countdown later). */
export function TrolleyIcon({ size = 26, colour = MOON }: { size?: number; colour?: string }) {
  return (
    <Svg width={size} height={size * 0.82} viewBox="0 0 64 52">
      <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={colour} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 14h38l-6 18H24z" fill={colour} opacity={0.2} />
      <Circle cx={25} cy={44} r={5.5} fill={colour} />
      <Circle cx={49} cy={44} r={5.5} fill={colour} />
    </Svg>
  );
}

type Stop = { key: string; at: number; title: string; sub?: string; end?: boolean };

/** Tonight's window: when the shop shuts (night lock start, or 23:00) until 08:00. */
export function tonight(now: number, startHour: number) {
  const d = new Date(now);
  const end = new Date(now);
  end.setHours(8, 0, 0, 0);
  if (d.getHours() >= 8) end.setDate(end.getDate() + 1);
  const start = new Date(end);
  start.setDate(start.getDate() - (startHour >= 8 ? 1 : 0));
  start.setHours(startHour, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime(), night: now >= start.getTime() && now < end.getTime() };
}

function stopsFor(startHour: number, start: number, end: number, nightLockOn: boolean): Stop[] {
  const at = (h: number) => {
    const t = new Date(end);
    t.setHours(h, 0, 0, 0);
    return t.getTime() > end ? t.getTime() - 86400000 : t.getTime();
  };
  const list: Stop[] = [{ key: 'shut', at: start, title: 'Shop shuts', sub: nightLockOn ? 'Night lock on' : 'Pauses get longer' }];
  if (startHour !== 0) list.push({ key: 'midnight', at: at(0), title: 'Midnight aisle' });
  if (startHour < 3 || startHour >= 8) list.push({ key: 'stock', at: at(3), title: 'Stockroom' });
  list.push({ key: 'till', at: end, title: 'Morning Till', sub: 'You decide', end: true });
  return list;
}

/** Where the trolley is, in words, for the status line. */
function whereNow(stops: Stop[], now: number) {
  const passed = stops.filter((s) => s.at <= now);
  const last = passed[passed.length - 1];
  const next = stops.find((s) => s.at > now);
  if (!last) return 'waiting at the shop';
  if (next?.end && next.at - now < 60 * 60000) return 'nearly at the till';
  if (last.key === 'shut') return now - last.at < 45 * 60000 ? 'just left the shop' : 'on its way';
  if (last.key === 'midnight') return 'past the midnight aisle';
  return 'in the stockroom';
}

const until = (ms: number) => {
  const m = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${pad(m % 60)}m` : `${m}m`;
};

export function TrolleyRoute({
  now: nowProp,
  startHour,
  nightLockOn,
  open,
  heroRef,
  trolleyRef,
  onTrolley,
  onReady,
  checkedLine,
}: {
  now: number;
  startHour: number;
  nightLockOn: boolean;
  open: ParkedWant[];
  heroRef: SpotRef;
  trolleyRef: SpotRef;
  onTrolley: () => void;
  onReady: () => void;
  checkedLine: string;
}) {
  const rm = useReduceMotion();
  // The countdown moves every half minute without re-rendering the rest of Today.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const now = Math.max(nowProp, tick);
  const { start, end, night } = tonight(now, startHour);
  const stops = stopsFor(startHour, start, end, nightLockOn);
  const onBoard = open.filter((w) => w.readyAt > now).length;
  const ready = open.filter((w) => w.readyAt <= now).length;
  const value = open.filter((w) => w.readyAt > now).reduce((sum, w) => sum + (w.price ?? 0), 0);

  // The trolley sits after the last stop it has passed (before the first one during the day).
  const passed = night ? stops.filter((s) => s.at <= now).length : 0;
  type Row = { kind: 'stop'; stop: Stop; done: boolean } | { kind: 'trolley' };
  const rows: Row[] = [];
  stops.forEach((s, i) => {
    if (i === passed) rows.push({ kind: 'trolley' });
    rows.push({ kind: 'stop', stop: s, done: i < passed });
  });
  const trolleyIndex = rows.findIndex((r) => r.kind === 'trolley');
  const lineTop = DOT / 2;
  const lineHeight = (rows.length - 1) * ROW;
  const filled = trolleyIndex * ROW;

  // A little wobble on the trolley wheel every few seconds.
  const wob = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3200),
        Animated.timing(wob, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(wob, { toValue: -0.7, duration: 140, useNativeDriver: true }),
        Animated.timing(wob, { toValue: 0.35, duration: 120, useNativeDriver: true }),
        Animated.timing(wob, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [rm, wob]);
  const rotate = wob.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  const heroSmall = night ? 'Morning Till opens in' : 'Tonight’s trolley rolls at';
  const heroBig = night ? until(end - now) : hh(startHour);
  const heroLine = night
    ? `Right on time · ${whereNow(stops, now)}`
    : onBoard
      ? `${onBoard} ${onBoard === 1 ? 'thing is' : 'things are'} already waiting`
      : 'Shop’s open. Your trolley is empty.';

  return (
    <View>
      {/* Hero: one big number */}
      <View ref={heroRef} collapsable={false} accessible accessibilityLabel={`${heroSmall} ${heroBig}. ${heroLine}`}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: color.text3 }}>{heroSmall}</Text>
        <Text style={{ fontFamily: font.display, fontSize: 44, lineHeight: 50, color: color.text, fontVariant: ['tabular-nums'] }}>{heroBig}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: night ? color.mint : MOON }} />
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, color: color.text2 }}>{heroLine}</Text>
        </View>
      </View>

      {/* The route */}
      <View style={{ marginTop: 22, position: 'relative' }} accessibilityRole="list" accessibilityLabel="Tonight’s route">
        <View
          style={{
            position: 'absolute',
            left: DOT / 2 - 1.5,
            top: lineTop,
            width: 3,
            height: lineHeight,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.16)',
          }}
        />
        <View style={{ position: 'absolute', left: DOT / 2 - 1.5, top: lineTop, width: 3, height: filled, borderRadius: 2, backgroundColor: MOON }} />
        {rows.map((r) =>
          r.kind === 'trolley' ? (
            <Pressable
              key="trolley"
              ref={trolleyRef}
              collapsable={false}
              onPress={onTrolley}
              accessibilityRole="button"
              accessibilityLabel={`Your trolley, ${onBoard ? `${onBoard} on board` : 'empty'}. Open the waiting room`}
              style={({ pressed }) => ({ height: ROW, flexDirection: 'row', alignItems: 'flex-start', gap: 14, opacity: pressed ? 0.7 : 1 })}
            >
              <Animated.View style={{ width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center', transform: [{ rotate }] }}>
                <View style={{ position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,231,163,0.14)' }} />
                <TrolleyIcon size={26} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 22, color: MOON }}>Your trolley</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, color: color.text2 }}>
                  {onBoard ? `${onBoard} ${onBoard === 1 ? 'thing' : 'things'} on board${value ? ` · £${Math.round(value)}` : ''}` : 'Empty · lovely and light'}
                </Text>
              </View>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12, color: MOON, marginTop: 3 }}>{night ? 'now' : 'waiting'}</Text>
            </Pressable>
          ) : (
            <Pressable
              key={r.stop.key}
              disabled={!(r.stop.end && ready)}
              onPress={onReady}
              accessibilityRole={r.stop.end && ready ? 'button' : undefined}
              style={{ height: ROW, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}
            >
              <View
                style={{
                  width: DOT,
                  height: DOT,
                  borderRadius: DOT / 2,
                  borderWidth: 3,
                  borderColor: r.stop.end ? DAWN : r.done ? MOON : 'rgba(255,255,255,0.3)',
                  backgroundColor: r.done ? MOON : '#11143A',
                }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20, color: r.stop.end ? DAWN : r.done ? color.text2 : color.text }}>
                  {r.stop.title}
                </Text>
                {r.stop.end && ready ? (
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: color.mint }}>{ready} ready to decide · tap</Text>
                ) : r.stop.sub ? (
                  <Text style={{ fontFamily: font.bodySemi, fontSize: 12.5, color: r.stop.end ? DAWN : color.text3 }}>{r.stop.sub}</Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: r.stop.end ? DAWN : color.text2, fontVariant: ['tabular-nums'], marginTop: 1 }}>
                {pad(new Date(r.stop.at).getHours())}:{pad(new Date(r.stop.at).getMinutes())}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <Text style={{ marginTop: 2, fontFamily: font.bodyBold, fontSize: 12.5, color: color.text3 }}>{checkedLine}</Text>
    </View>
  );
}
