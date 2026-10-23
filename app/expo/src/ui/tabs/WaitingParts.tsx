import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ShoppingBagIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { AppLabel } from '../../../modules/tm-native';
import { formatDuration, formatReady, knownApp, priceText } from '../../lib/core';
import { workTime } from '../../lib/rules';
import type { ParkedWant } from '../../lib/store';
import { color, font } from '../theme';

// GRADS from the prototype (P:L967): each want gets its own colour.
const GRADS: [string, string][] = [
  ['#C9B79C', '#8C6F4E'],
  ['#F5B2C6', '#C85A82'],
  ['#9ED3F5', '#3C7FB8'],
  ['#FFD9A0', '#E08A2E'],
  ['#B9F5D8', '#2FA877'],
  ['#D8C7FF', '#7A4FE0'],
  ['#FFB4A6', '#E0573E'],
];

function gradFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return GRADS[h % GRADS.length];
}

/** CSS filter: grayscale(.75) brightness(.78), applied to a colour (both are linear, so the gradient stays exact). */
function dim(hex: string, g = 0.75, b = 0.78) {
  const r = parseInt(hex.slice(1, 3), 16);
  const gr = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  const k = 1 - g;
  const R = (0.2126 + 0.7874 * k) * r + (0.7152 - 0.7152 * k) * gr + (0.0722 - 0.0722 * k) * bl;
  const G = (0.2126 - 0.2126 * k) * r + (0.7152 + 0.2848 * k) * gr + (0.0722 - 0.0722 * k) * bl;
  const B = (0.2126 - 0.2126 * k) * r + (0.7152 - 0.7152 * k) * gr + (0.0722 + 0.9278 * k) * bl;
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v * b)));
  return `rgb(${c(R)},${c(G)},${c(B)})`;
}

/** The want's name, never "this app". */
export const wantName = (w: ParkedWant) => w.what || (knownApp(w.app) ? `Something from ${w.app}` : 'Something you wanted');

const RING_C = 2 * Math.PI * 33;

/** .wr-cring (P:L566–569): countdown ring, the want's colour inside, and the app's icon on a white badge. */
function TagRing({ want, frac, ready }: { want: ParkedWant; frac: number; ready: boolean }) {
  const [a, b] = gradFor(want.id);
  return (
    <View style={{ width: 74, height: 74 }}>
      <Svg width={74} height={74} viewBox="0 0 74 74" style={{ position: 'absolute' }}>
        <Defs>
          <SvgGradient id="wrg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#4361FF" />
            <Stop offset="1" stopColor="#8B5CF6" />
          </SvgGradient>
        </Defs>
        <Circle cx="37" cy="37" r="33" fill="none" stroke="#DCD8F7" strokeWidth="6" />
        <Circle
          cx="37"
          cy="37"
          r="33"
          fill="none"
          stroke={ready ? '#1FBF86' : 'url(#wrg)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - frac)}
          transform="rotate(-90 37 37)"
        />
      </Svg>
      <View style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderRadius: 29, overflow: 'hidden' }}>
        <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
        <View
          style={{
            position: 'absolute',
            right: 7,
            bottom: 7,
            width: 22,
            height: 22,
            borderRadius: 7,
            backgroundColor: '#FFFFFF',
            padding: 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {want.key ? (
            <AppLabel appKey={want.key} mode="icon" size={14} align="center" style={{ width: 18, height: 18 }} />
          ) : (
            <ShoppingBagIcon size={14} weight="bold" color="#4361FF" />
          )}
        </View>
      </View>
    </View>
  );
}

/** A parked want as a paper tag (tagHTML, P:L1091–1097; CSS P:L554–565). */
export function WantTag({ want, now, ready, index }: { want: ParkedWant; now: number; ready: boolean; index: number }) {
  const total = want.readyAt - want.parkedAt;
  const frac = ready || total <= 0 ? 1 : Math.min(1, Math.max(0, (now - want.parkedAt) / total));
  const name = wantName(want);
  const meta = [
    knownApp(want.app) ? want.app : null,
    priceText(want),
    want.band === 'exact' && want.price ? `about ${workTime(want.price)} of work` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={() => ready && router.push({ pathname: '/decide', params: { id: want.id } })}
      disabled={!ready}
      accessibilityRole={ready ? 'button' : undefined}
      accessibilityLabel={ready ? `${name}. ${meta}. Ready. Decide now` : `${name}. ${meta}. ${formatDuration(want.readyAt - now)} left, ready ${formatReady(want.readyAt, now)}`}
      style={{ transform: [{ rotate: index % 2 === 0 ? '-0.8deg' : '0.6deg' }] }}
    >
      {/* .isready: 0 0 0 2px #5EE9B5 and a 26 px mint glow */}
      {ready && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: 1,
            borderRadius: 20,
            backgroundColor: '#5EE9B5',
            shadowColor: '#5EE9B5',
            shadowOpacity: 0.35,
            shadowRadius: 13,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
      )}
      <View style={{ borderRadius: 18, backgroundColor: ready ? '#9BE8CB' : '#C9C4EE', paddingBottom: 3 }}>
        <View style={{ backgroundColor: '#F2F0FF', borderRadius: 18, padding: 12, flexDirection: 'row', gap: 12 }}>
          <TagRing want={want} frac={frac} ready={ready} />
          <View style={{ flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, lineHeight: 20, color: color.inkOnBright, paddingRight: 16 }}>{name}</Text>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, lineHeight: 16, color: '#5D6192' }}>{meta}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 }}>
              {ready ? (
                <>
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: '#1F8A62', flexShrink: 1 }}>Ready. Still want it?</Text>
                  <View style={{ borderRadius: 999, backgroundColor: '#2A3BC0', paddingBottom: 3 }}>
                    <View style={{ backgroundColor: color.blue, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 }}>
                      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: '#FFFFFF' }}>Decide</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ backgroundColor: '#E7E4FB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12, color: '#2A3BC0', fontVariant: ['tabular-nums'] }}>
                      {formatDuration(want.readyAt - now)} left
                    </Text>
                  </View>
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: '#2A3BC0', flexShrink: 1, textAlign: 'right' }}>{formatReady(want.readyAt, now)}</Text>
                </>
              )}
            </View>
          </View>
          {/* the punched hole */}
          <View style={{ position: 'absolute', top: 12, right: 12, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#0D0F2E' }} />
        </View>
      </View>
    </Pressable>
  );
}

/** .wr-shelf (P:L570–572): square tiles, three across, faded except the newest. */
export function LetGoShelf({ wants }: { wants: ParkedWant[] }) {
  const [w, setW] = useState(0);
  const tile = w ? (w - 16) / 3 : 0;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
      {tile > 0 &&
        wants.map((x, i) => {
          const [a, b] = gradFor(x.id);
          const fresh = i === 0;
          return (
            <View
              key={x.id}
              accessible
              accessibilityLabel={wantName(x)}
              style={[
                { width: tile, height: tile, borderRadius: 14 },
                fresh && { borderWidth: 2, borderColor: '#5EE9B5', padding: 0 },
              ]}
            >
              <LinearGradient
                colors={fresh ? [a, b] : [dim(a), dim(b)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: fresh ? 12 : 14, padding: 7, justifyContent: 'flex-end' }}
              >
                <Text
                  numberOfLines={4}
                  style={{
                    fontFamily: font.bodyHeavy,
                    fontSize: 11.5,
                    lineHeight: 14,
                    color: '#FFFFFF',
                    textShadowColor: 'rgba(0,0,0,0.6)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {wantName(x)}
                </Text>
              </LinearGradient>
            </View>
          );
        })}
    </View>
  );
}

/** .wr-empty: a dashed, centred note. */
export function RoomEmpty({ text }: { text: string }) {
  return (
    <View style={{ padding: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#343A80', borderRadius: 18 }}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: color.text3, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}
