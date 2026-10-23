import { LinearGradient } from 'expo-linear-gradient';
import { CrownIcon, DiamondIcon, type Icon, LockKeyIcon, MedalIcon, ShieldIcon, ShieldStarIcon, TrophyIcon } from 'phosphor-react-native';
import { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { METAL_COLORS } from '../lib/xp';

const METAL_ICON: Record<string, Icon> = {
  Bronze: MedalIcon,
  Silver: ShieldIcon,
  Gold: CrownIcon,
  Platinum: ShieldStarIcon,
  Diamond: DiamondIcon,
  Legend: TrophyIcon,
};

/**
 * A rank medal, as the prototype's .rk-medal (P:L622–625, 718): a metal disc
 * (linear-gradient(150deg, a, b) with a white shine at 32% 26%), a faint white ring, a soft drop
 * shadow and an inner bottom edge; the metal's icon in the middle and the tier (III, II, I) on a
 * dark pill at the bottom. Locked medals are dimmed and show a padlock.
 */
export function Medal({ metal, tier, size = 96, locked }: { metal: string; tier?: string; size?: number; locked?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [a, b] = METAL_COLORS[metal] ?? METAL_COLORS.Bronze;
  const Glyph = locked ? LockKeyIcon : (METAL_ICON[metal] ?? MedalIcon);
  const badge = Math.max(9, Math.round(size * 0.2));
  return (
    <View accessible={false} style={{ width: size, height: size }}>
      {/* 0 0 0 3px rgba(255,255,255,.18) ring, carrying the 0 6px 16px rgba(4,5,24,.35) shadow */}
      <View
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: size,
          backgroundColor: 'rgba(255,255,255,0.18)',
          shadowColor: '#040518',
          shadowOpacity: 0.35,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 6 },
        }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient colors={[a, b]} start={{ x: 0.25, y: 0.07 }} end={{ x: 0.75, y: 0.93 }} style={{ position: 'absolute', inset: 0 }} />
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Defs>
            <RadialGradient id={`${id}s`} cx={size * 0.32} cy={size * 0.26} r={size * 0.38} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id}s)`} />
        </Svg>
        {/* inset 0 −3px 0 rgba(0,0,0,.18) */}
        <View style={{ position: 'absolute', inset: 0, borderRadius: size / 2, borderBottomWidth: 3, borderColor: 'rgba(0,0,0,0.18)' }} />
        {/* .locked: grayscale(.55) brightness(.5) */}
        {locked && <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(30,32,52,0.55)' }} />}
        <Glyph size={Math.round(size * 0.46)} weight="bold" color={locked ? 'rgba(255,255,255,0.85)' : 'rgba(20,22,58,0.78)'} />
      </View>
      {tier ? (
        <View
          style={{
            position: 'absolute',
            bottom: -6,
            alignSelf: 'center',
            backgroundColor: '#14163A',
            borderColor: a,
            borderWidth: 1.5,
            borderRadius: 999,
            paddingHorizontal: 7,
            paddingVertical: 1,
          }}
        >
          <Text style={{ fontFamily: 'Georgia', fontWeight: '800', fontSize: badge, lineHeight: Math.round(badge * 1.3), letterSpacing: badge * 0.04, color: locked ? '#C9CDF0' : '#FFFFFF' }}>
            {tier}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
