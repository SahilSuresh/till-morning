import { useEffect } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { color, font } from '../theme';

// The waiting room when it's empty, in the Night Trolley world: the moon-yellow rail with ghost
// tags swaying on it (one says where your next want will hang), an empty trolley rolling gently
// under the moon and stars, and a few friendly words. Ready and Let go get their own words.

const MOON = '#FFE7A3';

/** A value looping 0 → 1 forever (0 under Reduce Motion). */
function useLoop(duration: number, delay = 0) {
  const rm = useReduceMotion();
  const v = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }));
    const t = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [rm, v, duration, delay]);
  return v;
}

const WORDS = {
  waiting: {
    title: 'Your trolley is empty',
    body: 'Lovely and light. When a want hits, park it in the pause or from a screenshot, and it hangs here till morning.',
    ghost: 'Your next want hangs here',
  },
  ready: {
    title: 'Nothing ready yet',
    body: 'Things come back here when their wait is over, often at 08:00 when the Morning Till opens.',
    ghost: 'Ready ones turn pink here',
  },
  letgo: {
    title: 'Your let-go shelf is empty',
    body: 'Each thing you let go lands here and counts towards a sticker. Just the things, never money totals.',
    ghost: 'Let go of one, it shows here',
  },
} as const;

export function RoomEmptyNight({ view }: { view: keyof typeof WORDS }) {
  const w = WORDS[view];
  const sway = useLoop(4200);
  const roll = useLoop(5200, 400);
  const tw = useLoop(3600);
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${w.title}. ${w.body}`}>
      {/* the rail with ghost tags swaying from it */}
      <View style={{ alignSelf: 'stretch' }}>
        <View style={{ height: 8, justifyContent: 'center', marginHorizontal: -6 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 4, backgroundColor: MOON, opacity: 0.16 }} />
          <View style={{ height: 3, borderRadius: 2, backgroundColor: MOON }} />
          <View style={{ position: 'absolute', left: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: MOON }} />
          <View style={{ position: 'absolute', right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: MOON }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 }}>
          {[0.55, 1, 0.55].map((o, i) => (
            <Animated.View
              key={i}
              style={{
                width: i === 1 ? '46%' : '22%',
                alignItems: 'center',
                opacity: o,
                transformOrigin: 'top',
                transform: [
                  {
                    rotate: sway.interpolate({
                      inputRange: [0, 0.25, 0.5, 0.75, 1],
                      outputRange: i === 1 ? ['0deg', '2.5deg', '0deg', '-2.5deg', '0deg'] : ['0deg', '-2deg', '0deg', '2deg', '0deg'],
                    }),
                  },
                ],
              }}
            >
              <View style={{ width: 1.6, height: 16, backgroundColor: '#C4B5FD' }} />
              <View
                style={{
                  alignSelf: 'stretch',
                  height: i === 1 ? 58 : 46,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: 'rgba(196,181,253,0.6)',
                  backgroundColor: 'rgba(106,61,232,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
              >
                <View style={{ position: 'absolute', top: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(196,181,253,0.7)' }} />
                {i === 1 && <Text style={{ marginTop: 8, fontFamily: font.bodyHeavy, fontSize: 12, color: '#C4B5FD', textAlign: 'center' }}>{w.ghost}</Text>}
              </View>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* the night with an empty trolley rolling gently */}
      <View style={{ marginTop: 22, width: 220, height: 120, alignItems: 'center', justifyContent: 'flex-end' }}>
        {[
          [6, 12, 3],
          [88, 6, 2.5],
          [70, 30, 2],
          [18, 46, 2],
          [96, 52, 3],
        ].map(([x, y, s], i) => {
          const a = (i * 0.27) % 0.8;
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: s,
                height: s,
                borderRadius: s / 2,
                backgroundColor: i % 3 === 0 ? MOON : '#FFFFFF',
                opacity: tw.interpolate({ inputRange: [0, a, a + 0.1, a + 0.2, 1], outputRange: [0.25, 0.25, 1, 0.25, 0.25] }),
              }}
            />
          );
        })}
        <View style={{ position: 'absolute', right: 18, top: 0 }}>
          <Svg width={34} height={34}>
            <Defs>
              <Mask id="emptyMoon">
                <Rect width={34} height={34} fill="#FFFFFF" />
                <Circle cx={26.5} cy={10} r={15.5} fill="#000000" />
              </Mask>
            </Defs>
            <Circle cx={17} cy={17} r={16} fill={MOON} mask="url(#emptyMoon)" />
          </Svg>
        </View>
        <Animated.View
          style={{
            transform: [
              { translateX: roll.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-34, 34, -34] }) },
              { rotate: roll.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['-2deg', '0deg', '2deg', '0deg', '-2deg'] }) },
            ],
          }}
        >
          <Svg width={96} height={78} viewBox="0 0 64 52">
            <Path d="M18 14h40l-6 18H24z" fill="#3A2F8F" opacity={0.7} />
            <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={MOON} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={25} cy={44} r={4.6} fill={MOON} />
            <Circle cx={49} cy={44} r={4.6} fill={MOON} />
          </Svg>
        </Animated.View>
        <View style={{ alignSelf: 'stretch', height: 1.5, borderRadius: 1, backgroundColor: 'rgba(167,139,250,0.45)' }} />
      </View>

      <Text style={{ marginTop: 16, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: color.text, textAlign: 'center' }}>{w.title}</Text>
      <Text style={{ marginTop: 6, fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20, color: color.text2, textAlign: 'center', paddingHorizontal: 8 }}>
        {w.body}
      </Text>
    </View>
  );
}
