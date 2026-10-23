import type { Icon, IconWeight } from 'phosphor-react-native';
import { View } from 'react-native';

/** .tile tones (P:L91–96): a soft colour square with its icon. */
export const TILE = {
  mint: { bg: 'rgba(94,233,181,0.14)', fg: '#6EF0BF' },
  sun: { bg: 'rgba(255,201,77,0.15)', fg: '#FFD46E' },
  peach: { bg: 'rgba(255,143,120,0.15)', fg: '#FFAA97' },
  lav: { bg: 'rgba(167,139,250,0.19)', fg: '#CBBBFF' },
  hush: { bg: '#1F2358', fg: '#B4B6E4' },
} as const;
export type TileTone = keyof typeof TILE;

/** A 44 px tile (w-11 h-11, radius 14) with a 22 px bold icon. */
export function Tile({ tone, Icon, size = 44, weight = 'bold' }: { tone: TileTone; Icon: Icon; size?: number; weight?: IconWeight }) {
  const t = TILE[tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size, borderRadius: 14, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon size={Math.round(size / 2)} weight={weight} color={t.fg} />
    </View>
  );
}
