import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppLabel } from '../../../modules/tm-native';
import type { MyApp } from '../../lib/apps';
import { formatDuration, knownApp, priceText } from '../../lib/core';
import type { ParkedWant } from '../../lib/store';
import { CaretRightIcon, ShieldCheckIcon } from '../ph';
import type { SpotRef } from '../Spotlight';
import { color, font } from '../theme';
import { TrolleyIcon } from './TrolleyRoute';

// Today, kept simple: one card for the shields (which apps), one for your trolley (what's
// waiting), then the pass button. Same night colours as the rest of Night Trolley.

const MOON = '#FFE7A3';
const ICON = 40;
const MAX_ICONS = 6;
const MAX_ROWS = 3;

function Card({ children, targetRef, onPress, label }: { children: ReactNode; targetRef: SpotRef; onPress?: () => void; label: string }) {
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
        </View>
      )}
    </Pressable>
  );
}

function Head({ icon, title, right }: { icon: ReactNode; title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <Text style={{ flex: 1, fontFamily: font.display, fontSize: 18, lineHeight: 23, color: color.text }} numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Which apps are shielded, as their icons, and whether the shields are working. */
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
      <Head
        icon={
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? 'rgba(94,233,181,0.16)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <ShieldCheckIcon size={18} weight="bold" color={on ? color.mintText : color.text3} />
          </View>
        }
        title={title}
        right={onPress ? <CaretRightIcon size={18} weight="bold" color={color.text3} /> : undefined}
      />
      {on && (shown.length > 0 || categories > 0) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {shown.map((a) => (
            <View
              key={a.key}
              style={{
                width: ICON,
                height: ICON,
                borderRadius: 11,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {a.token ? (
                <AppLabel appKey={a.key} mode="icon" size={28} align="center" style={{ width: ICON, height: ICON }} />
              ) : (
                <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, color: color.text }}>{(a.name ?? '?').charAt(0).toUpperCase()}</Text>
              )}
            </View>
          ))}
          {more > 0 && <Bubble text={`+${more}`} />}
          {categories > 0 && <Bubble text={categories === 1 ? '+ a category' : `+ ${categories} categories`} wide />}
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: on ? color.mint : color.coral }} />
        <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 13, color: color.text2 }}>{line}</Text>
      </View>
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
        borderRadius: 11,
        backgroundColor: 'rgba(167,139,250,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: '#C4B5FD' }}>{text}</Text>
    </View>
  );
}

const left = (w: ParkedWant, now: number) => {
  const ms = w.readyAt - now;
  if (ms > 36 * 3600000) return new Date(w.readyAt).toLocaleDateString('en-GB', { weekday: 'short' });
  return formatDuration(ms).replace(' min', 'm').replace(' h', 'h');
};

/** Your waiting list: up to three things in your trolley, ready ones first. */
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
      <Head
        icon={
          <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,231,163,0.12)' }}>
            <TrolleyIcon size={20} />
          </View>
        }
        title={open.length ? `Your trolley · ${open.length}` : 'Your trolley'}
        right={open.length ? <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13, color: '#C4B5FD' }}>See all</Text> : undefined}
      />
      {sub ? <Text style={{ marginTop: 4, marginLeft: 40, fontFamily: font.bodyBold, fontSize: 12.5, color: color.text3 }}>{sub}</Text> : null}

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
          {more > 0 && (
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: color.text3, textAlign: 'center' }}>+ {more} more in the waiting room</Text>
          )}
        </View>
      ) : (
        <Text style={{ marginTop: 10, fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: color.text2 }}>
          Empty. When a want hits, park it and it waits here till morning.
        </Text>
      )}
    </Card>
  );
}
