import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { useReduceMotion } from '../components';
import { color, font } from '../theme';
import type { NextStep } from './TodayParts';

// Night Trolley · Part 1, option 1F in our colours: the one next step hangs from a little star
// as a purple shelf tag, with a moon-yellow "price" on a tear-off stub ("1 min").

const MOON = '#FFE7A3';
const STRING = 22; // room above the tag for the star and the string
const HOLE_X = 20;
const STUB = 76;
const EDGE = 4;

/** The tag outline: cut corners on the left (where the hole is), round corners on the right. */
function tagPath(w: number, h: number, y: number) {
  const c = 16;
  const r = 14;
  return `M${c} ${y} H${w - r} Q${w} ${y} ${w} ${y + r} V${y + h - r} Q${w} ${y + h} ${w - r} ${y + h} H${c} L0 ${y + h - c} V${y + c} Z`;
}

export function NextTag({ step }: { step: NextStep }) {
  const rm = useReduceMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const tag = step.tag ?? step.chip ?? 'Next up';
  const stub = step.stub ?? { label: 'Takes', value: '1 min' };

  // Every few seconds the tag gets a little nudge and swings back to rest.
  const swing = useAnimatedValue(0);
  useEffect(() => {
    if (rm) return;
    const t = (toValue: number, duration: number) => Animated.timing(swing, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([Animated.delay(4200), t(1, 260), t(-0.7, 380), t(0.4, 340), t(-0.18, 300), t(0, 260)]));
    loop.start();
    return () => loop.stop();
  }, [rm, swing]);
  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-1.3deg', '1.3deg'] });

  const { w, h } = size;
  const holeY = STRING + h / 2;

  return (
    <Pressable onPress={step.go} accessibilityRole="button" accessibilityLabel={`${tag}. ${step.title}. ${step.sub}. ${stub.label} ${stub.value}`}>
      {({ pressed }) => (
        <Animated.View
          style={{ paddingTop: STRING, paddingBottom: EDGE, transformOrigin: [HOLE_X, 4, 0], transform: [{ rotate }, { scale: pressed ? 0.98 : 1 }] }}
        >
          {w > 0 && (
            <Svg width={w} height={STRING + h + EDGE} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
              <Defs>
                <SvgGradient id="nextTag" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#6A3DE8" />
                  <Stop offset="1" stopColor="#9B5CF6" />
                </SvgGradient>
              </Defs>
              {/* the chunky edge underneath, like our buttons */}
              <Path d={tagPath(w, h, STRING + EDGE)} fill="#4524A8" />
              <Path d={tagPath(w, h, STRING)} fill="url(#nextTag)" />
              {/* a few stars on the label */}
              <Path d={star(w - STUB - 18, STRING + 14, 4)} fill={MOON} opacity={0.75} />
              <Circle cx={w - STUB - 34} cy={STRING + 26} r={1.6} fill={MOON} opacity={0.5} />
              {/* tear-off stub with the "price" */}
              <Line
                x1={w - STUB}
                y1={STRING + 9}
                x2={w - STUB}
                y2={STRING + h - 9}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={2}
                strokeDasharray="5 4"
                strokeLinecap="round"
              />
              {/* the eyelet and the string up to the star it hangs from */}
              <Line x1={HOLE_X} y1={9} x2={HOLE_X} y2={holeY - 6} stroke="#C4B5FD" strokeWidth={1.6} />
              <Circle cx={HOLE_X} cy={holeY} r={6} fill={color.night} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
              <Path d={star(HOLE_X, 5, 5)} fill={MOON} />
            </Svg>
          )}
          <View
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (Math.abs(width - w) > 0.5 || Math.abs(height - h) > 0.5) setSize({ w: width, h: height });
            }}
            style={{ minHeight: 80, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{ flex: 1, minWidth: 0, paddingLeft: 40, paddingRight: 12, paddingVertical: 13 }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#E3D9FF' }}>{tag}</Text>
              <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 21, color: '#FFFFFF', marginTop: 2 }}>{step.title}</Text>
              <Text numberOfLines={2} style={{ fontFamily: font.bodySemi, fontSize: 12.5, lineHeight: 16, color: 'rgba(255,255,255,0.78)', marginTop: 1 }}>
                {step.sub}
              </Text>
            </View>
            <View style={{ width: STUB, alignItems: 'center' }}>
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: '#E3D9FF' }}>{stub.label}</Text>
              <Text style={{ fontFamily: font.display, fontSize: 19, lineHeight: 23, color: MOON }}>{stub.value}</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** A small four-point star centred on (x, y). */
function star(x: number, y: number, r: number) {
  const k = r * 0.32;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
}
