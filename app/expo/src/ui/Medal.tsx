import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { METAL_COLORS } from '../lib/xp';
import { font } from './theme';

/** A rank medal: metal gradient disc with a white die-cut edge and the tier numeral. */
export function Medal({ metal, tier, size = 96, locked }: { metal: string; tier?: string; size?: number; locked?: boolean }) {
  const [a, b] = METAL_COLORS[metal] ?? METAL_COLORS.Bronze;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, size / 28),
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        opacity: locked ? 0.35 : 1,
        shadowColor: '#020312',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      <LinearGradient colors={[a, b]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: size * 0.08, left: size * 0.2, width: size * 0.35, height: size * 0.18, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.35)' }} />
        {tier ? <Text style={{ fontFamily: font.displayBold, fontSize: size * 0.32, color: 'rgba(20,22,58,0.75)' }}>{tier}</Text> : null}
      </LinearGradient>
    </View>
  );
}
