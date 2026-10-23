import { Text, View } from 'react-native';

import { Chip } from '../components';
import { color, font, type } from '../theme';

const EARN: [string, string][] = [
  ['Close an app at the shield', '+2'],
  ['Finish the pause and leave', '+10'],
  ['Park it in the waiting room', '+5'],
  ['Decide on a want after its wait, any answer', '+10'],
  ['Check in after a pass, any honest answer', '+10'],
  ['Fill a Morning card (10 calm days)', '+50'],
];
const LOSE: [string, string][] = [
  ['Switch every shield off', '−10'],
  ['Unshield an app', '−5'],
];

const Row = ({ t, x, tone }: { t: string; x: string; tone: 'mint' | 'peach' }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
    <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 19, color: color.text }}>{t}</Text>
    <Chip tone={tone} label={x} />
  </View>
);

/** "How XP works" (P:L2096–2100): what earns XP, what loses it, and the small print. */
export function XpRules() {
  return (
    <View>
      {EARN.map(([t, x]) => (
        <Row key={t} t={t} x={x} tone="mint" />
      ))}
      <View style={{ height: 1.5, backgroundColor: color.divider, marginHorizontal: 12, marginVertical: 4 }} />
      {LOSE.map(([t, x]) => (
        <Row key={t} t={t} x={x} tone="peach" />
      ))}
      <Text style={[type.small, { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8 }]}>
        You only lose XP for weakening your own protection, never for being away or for an honest answer. Your rank never goes down. Repeat
        opens of the same app earn XP once every 30 minutes. A third pass in a day means a short wait. Ranks take months, not days.
      </Text>
    </View>
  );
}
