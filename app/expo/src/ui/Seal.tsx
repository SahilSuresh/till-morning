import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { TIERS } from '../lib/budget';

const OFF = ['#4A4F95', '#2E3374', '#22265E', '#2E3374'];

// Scalloped die-cut rim: 20 bumps.
const RIM = (() => {
  let d = '';
  const N = 20;
  for (let i = 0; i < N * 2; i++) {
    const a = (i / (N * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 50.5 : 56;
    d += `${i ? 'L' : 'M'}${(60 + Math.cos(a) * r).toFixed(1)} ${(60 + Math.sin(a) * r).toFixed(1)}`;
  }
  return `${d}Z`;
})();

/** A die-cut sticker seal: scalloped rim, vault dial, padlock; the big one carries a ribbon (prototype seal()). tier -1 = not earned. */
export function Seal({ size, tier, label }: { size: number; tier: number; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const off = tier < 0;
  const c = off ? OFF : TIERS[tier].c;
  const big = size >= 90;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
      <Defs>
        <LinearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c[0]} />
          <Stop offset="0.45" stopColor={c[1]} />
          <Stop offset="1" stopColor={c[2]} />
        </LinearGradient>
        <LinearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={off ? '#5A5FA6' : '#FFFFFF'} />
          <Stop offset="1" stopColor={off ? '#3A3F86' : c[0]} />
        </LinearGradient>
        <ClipPath id={`${id}c`}>
          <Path d={RIM} />
        </ClipPath>
      </Defs>
      <Path d={RIM} fill="none" stroke={off ? '#3A3F86' : '#FFFFFF'} strokeWidth={big ? 10 : 14} strokeLinejoin="round" />
      <Path d={RIM} fill={`url(#${id}g)`} />
      <Circle cx="60" cy="60" r="41" fill="#0D0F2E" stroke={c[0]} strokeOpacity={0.55} strokeWidth="2" />
      {big &&
        Array.from({ length: 40 }).map((_, i) => {
          const a = (i / 40) * Math.PI * 2;
          const r1 = i % 5 ? 36 : 33.5;
          const r2 = 39;
          return (
            <Line
              key={i}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * r2}
              y2={60 + Math.sin(a) * r2}
              stroke={c[0]}
              strokeOpacity={i % 5 ? 0.45 : 0.9}
              strokeWidth={i % 5 ? 1.2 : 2}
              strokeLinecap="round"
            />
          );
        })}
      <Path d="M48.5 57 V48 a11.5 11.5 0 0 1 23 0 V57" fill="none" stroke={off ? '#5A5FA6' : c[0]} strokeWidth="6" strokeLinecap="round" />
      <Rect x="42" y="54" width="36" height="28" rx="7" fill={`url(#${id}b)`} />
      <Circle cx="60" cy="65" r="4" fill="#0D0F2E" />
      <Rect x="58.2" y="65" width="3.6" height="9" rx="1.8" fill="#0D0F2E" />
      {!off && (
        <G clipPath={`url(#${id}c)`}>
          <Rect x="22" y="0" width="16" height="120" fill="#FFFFFF" opacity={0.18} transform="rotate(20 60 60)" />
        </G>
      )}
      {big && label ? (
        <G>
          <Path d="M6 84 H114 L106 95 L114 106 H6 L14 95 Z" fill={c[3]} stroke="#FFFFFF" strokeWidth="3" strokeLinejoin="round" />
          <SvgText x="60" y="99.5" textAnchor="middle" fontFamily="Fredoka_600SemiBold" fontSize="12.5" fill="#FFFFFF">
            {label}
          </SvgText>
        </G>
      ) : null}
    </Svg>
  );
}
