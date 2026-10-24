import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import { Animated, Easing, Pressable, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppLabel } from '../../../modules/tm-native';
import type { MyApp } from '../../lib/apps';
import { formatDuration, knownApp, priceText } from '../../lib/core';
import type { ParkedWant } from '../../lib/store';
import { useReduceMotion } from '../components';
import { CaretRightIcon } from '../ph';
import type { SpotRef } from '../Spotlight';
import { StFace } from '../StFace';
import { color, font } from '../theme';

// Today, kept simple: your trolley first (the big card: what's waiting), then a smaller card
// for the shields (which apps), then the pass button. Night Trolley colours throughout.

const MOON = '#FFE7A3';
const ICON = 34;
const MAX_ICONS = 7;
const MAX_ROWS = 3;
const ITEM_COLOURS = ['#A78BFA', '#5EE9B5', MOON];

function Card({ children, art, targetRef, onPress, label }: { children: ReactNode; art?: ReactNode; targetRef: SpotRef; onPress?: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={label}>
      {({ pressed }) => (
        <View
          ref={targetRef}
          collapsable={false}
          style={{ borderRadius: 22, backgroundColor: '#15184A', paddingBottom: 3, transform: [{ scale: pressed ? 0.985 : 1 }] }}
        >
          <LinearGradient
            colors={['#1E2256', '#2A2470']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, borderWidth: 1, borderColor: '#3A3F86', padding: 16 }}
          >
            {children}
          </LinearGradient>
          {art}
        </View>
      )}
    </Pressable>
  );
}

/** A big trolley with one box per thing on board (up to three), giving a little roll now and then. */
function TrolleyArt({ items, width = 112 }: { items: number; width?: number }) {
  const rm = useReduceMotion();
  const roll = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const t = (toValue: number, duration: number) => Animated.timing(roll, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([Animated.delay(3400), t(1, 240), t(-0.6, 260), t(0.25, 220), t(0, 220)]));
    loop.start();
    return () => loop.stop();
  }, [rm, roll]);
  const n = Math.min(items, 3);
  return (
    <Animated.View
      style={{
        transform: [
          { translateX: roll.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] }) },
          { rotate: roll.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) },
        ],
      }}
    >
      <Svg width={width} height={(width * 52) / 64} viewBox="0 0 64 52">
        {n > 0 && <Rect x={23} y={4} width={11} height={12} rx={2} fill={ITEM_COLOURS[0]} transform="rotate(-8 28 10)" />}
        {n > 1 && <Rect x={35} y={2} width={10} height={14} rx={2} fill={ITEM_COLOURS[1]} />}
        {n > 2 && <Rect x={46} y={7} width={10} height={9} rx={2} fill={ITEM_COLOURS[2]} transform="rotate(7 51 11)" />}
        <Path d="M18 14h40l-6 18H24z" fill="#3A2F8F" opacity={0.94} />
        <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={MOON} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={25} cy={44} r={4.8} fill={MOON} />
        <Circle cx={49} cy={44} r={4.8} fill={MOON} />
      </Svg>
    </Animated.View>
  );
}

const left = (w: ParkedWant, now: number) => {
  const ms = w.readyAt - now;
  if (ms > 36 * 3600000) return new Date(w.readyAt).toLocaleDateString('en-GB', { weekday: 'short' });
  return formatDuration(ms).replace(' min', 'm').replace(' h', 'h');
};

/** The big card: your trolley and what's waiting in it, ready ones first. */
export function TrolleyCard({
  targetRef,
  open,
  now,
  sub,
  onSeeAll,
  onReady,
}: {
  targetRef: SpotRef;
  open: ParkedWant[];
  now: number;
  sub?: string;
  onSeeAll: () => void;
  onReady: () => void;
}) {
  const ready = open.filter((w) => w.readyAt <= now);
  const waiting = open.filter((w) => w.readyAt > now).sort((a, b) => a.readyAt - b.readyAt);
  const rows = [...ready, ...waiting].slice(0, MAX_ROWS);
  const more = open.length - rows.length;
  const name = (w: ParkedWant) => w.what || (knownApp(w.app) ? `Something from ${w.app}` : 'Something you wanted');
  return (
    <Card
      targetRef={targetRef}
      onPress={open.length ? onSeeAll : undefined}
      label={
        open.length
          ? `Your trolley: ${open.length} waiting${ready.length ? `, ${ready.length} ready to decide` : ''}. Open the waiting room`
          : 'Your trolley is empty'
      }
    >
      {/* Title on the left, the big trolley on the right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: font.display, fontSize: 24, lineHeight: 29, color: color.text }}>Your trolley</Text>
          <Text style={{ marginTop: 2, fontFamily: font.bodyBold, fontSize: 13, lineHeight: 18, color: color.text2 }}>
            {open.length ? `${open.length} ${open.length === 1 ? 'thing' : 'things'} on board` : 'Empty · lovely and light'}
          </Text>
          {sub ? <Text style={{ marginTop: 2, fontFamily: font.bodyBold, fontSize: 12.5, lineHeight: 17, color: MOON }}>{sub}</Text> : null}
        </View>
        <TrolleyArt items={open.length} />
      </View>

      {rows.length ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          {rows.map((w) => {
            const isReady = w.readyAt <= now;
            return (
              <Pressable
                key={w.id}
                onPress={isReady ? onReady : onSeeAll}
                accessibilityRole="button"
                accessibilityLabel={`${name(w)}. ${isReady ? 'Ready to decide' : `${left(w, now)} left`}`}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                })}
              >
                {/* a tiny purple shelf tag */}
                <View
                  style={{
                    width: 24,
                    height: 18,
                    borderTopRightRadius: 5,
                    borderBottomRightRadius: 5,
                    backgroundColor: isReady ? '#E2789A' : '#7C4DFF',
                    justifyContent: 'center',
                  }}
                >
                  <View style={{ marginLeft: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: '#1E2256' }} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.text }}>
                    {name(w)}
                  </Text>
                  <Text numberOfLines={1} style={{ fontFamily: font.bodySemi, fontSize: 12, color: color.text3 }}>
                    {knownApp(w.app) ? `${w.app} · ` : ''}
                    {priceText(w)}
                  </Text>
                </View>
                <View
                  style={{
                    borderRadius: 99,
                    paddingHorizontal: 9,
                    paddingVertical: 3,
                    backgroundColor: isReady ? 'rgba(94,233,181,0.16)' : 'rgba(255,231,163,0.12)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: isReady ? font.bodyHeavy : font.display,
                      fontSize: 12.5,
                      color: isReady ? color.mintText : MOON,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {isReady ? 'Decide' : left(w, now)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: '#C4B5FD' }}>
              {more > 0 ? `See all ${open.length} in the waiting room` : 'Open the waiting room'}
            </Text>
            <CaretRightIcon size={14} weight="bold" color="#C4B5FD" />
          </View>
        </View>
      ) : (
        <Text style={{ marginTop: 10, fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: color.text2 }}>
          When a want hits, park it and it waits here till morning.
        </Text>
      )}
    </Card>
  );
}

/** The smaller card: whether the shields are working, and which apps, as their icons. */
export function ShieldsCard({
  targetRef,
  on,
  title,
  line,
  apps,
  categories,
  action,
  onPress,
}: {
  targetRef: SpotRef;
  on: boolean;
  title: string;
  line: string;
  apps: MyApp[];
  categories: number;
  action?: ReactNode;
  onPress?: () => void;
}) {
  const shown = apps.slice(0, MAX_ICONS);
  const more = apps.length - shown.length;
  const names = apps.map((a) => a.name).filter((n): n is string => !!n && knownApp(n));
  return (
    <Card targetRef={targetRef} onPress={onPress} label={`${title}. ${names.length ? names.join(', ') + '. ' : ''}${line}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <StFace size={44} off={!on} breathe={on} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 22, color: color.text }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, lineHeight: 17, color: color.text2 }} numberOfLines={2}>
            {line}
          </Text>
        </View>
        {onPress ? <CaretRightIcon size={18} weight="bold" color={color.text3} /> : null}
      </View>
      {on && (shown.length > 0 || categories > 0) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
          {shown.map((a) => (
            <View
              key={a.key}
              style={{
                width: ICON,
                height: ICON,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {a.token ? (
                <AppLabel appKey={a.key} mode="icon" size={24} align="center" style={{ width: ICON, height: ICON }} />
              ) : (
                <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: color.text }}>{(a.name ?? '?').charAt(0).toUpperCase()}</Text>
              )}
            </View>
          ))}
          {more > 0 && <Bubble text={`+${more}`} />}
          {categories > 0 && <Bubble text={categories === 1 ? '+ a category' : `+ ${categories} categories`} wide />}
        </View>
      )}
      {action ? <View style={{ marginTop: 14 }}>{action}</View> : null}
    </Card>
  );
}

function Bubble({ text, wide }: { text: string; wide?: boolean }) {
  return (
    <View
      style={{
        height: ICON,
        minWidth: ICON,
        paddingHorizontal: wide ? 12 : 0,
        borderRadius: 10,
        backgroundColor: 'rgba(167,139,250,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: '#C4B5FD' }}>{text}</Text>
    </View>
  );
}
