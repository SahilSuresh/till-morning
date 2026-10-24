import { type ReactNode, useEffect, useState } from 'react';
import { Animated, Easing, Text, useAnimatedValue, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

import { useReduceMotion } from './components';
import { color, font } from './theme';

// Night Trolley's shelf tag: a purple tag with an eyelet, a string up to what it hangs from
// (a little star, or your trolley once it's parked) and a moon-yellow "price" on a tear-off stub.
// Used by Today's next step (1F) and by Park it (2B).

export const MOON = '#FFE7A3';
const HOLE_X = 20;
const STUB = 76;
const EDGE = 4;
const STAR_TOP = 22; // room above the tag for the star and its string
const TROLLEY = 72; // the trolley it hangs from once parked
// Where the string ties onto the trolley: the basket's front-left corner (24, 32 in the 64 × 52 glyph).
const TIE = { x: (24 * TROLLEY) / 64, y: (32 * TROLLEY) / 64 };
const TROLLEY_TOP = TIE.y + 22;

/** The tag outline: cut corners on the left (where the eyelet is), round corners on the right. */
function tagPath(w: number, h: number, y: number) {
  const c = 16;
  const r = 14;
  return `M${c} ${y} H${w - r} Q${w} ${y} ${w} ${y + r} V${y + h - r} Q${w} ${y + h} ${w - r} ${y + h} H${c} L0 ${y + h - c} V${y + c} Z`;
}

/** A small four-point star centred on (x, y). */
function star(x: number, y: number, r: number) {
  const k = r * 0.32;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
}

/** Your trolley with a few things already on board. */
function LoadedTrolley() {
  return (
    <Svg width={TROLLEY} height={(TROLLEY * 52) / 64} viewBox="0 0 64 52">
      <Rect x={23} y={4} width={11} height={12} rx={2} fill="#A78BFA" transform="rotate(-8 28 10)" />
      <Rect x={35} y={2} width={10} height={14} rx={2} fill={color.mint} />
      <Rect x={46} y={7} width={10} height={9} rx={2} fill={MOON} transform="rotate(7 51 11)" />
      <Path d="M18 14h40l-6 18H24z" fill="#3A2F8F" opacity={0.94} />
      <Path d="M4 6h9l7 26h32l6-18H17" fill="none" stroke={MOON} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={25} cy={44} r={5.2} fill={MOON} />
      <Circle cx={49} cy={44} r={5.2} fill={MOON} />
    </Svg>
  );
}

export function ShelfTag({
  label,
  stubLabel,
  stubValue,
  hang = 'star',
  motion = 'none',
  children,
}: {
  label: string;
  stubLabel: string;
  stubValue: string;
  /** What the string goes up to: a little star, or your trolley once it's parked. */
  hang?: 'star' | 'trolley';
  /** nudge: a small swing every few seconds. drop: falls in and swings to rest. */
  motion?: 'none' | 'nudge' | 'drop';
  children: ReactNode;
}) {
  const rm = useReduceMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const top = hang === 'trolley' ? TROLLEY_TOP : STAR_TOP;
  const anchorY = hang === 'trolley' ? TIE.y : 4;

  const swing = useAnimatedValue(0);
  const drop = useAnimatedValue(motion === 'drop' && !rm ? 0 : 1);
  useEffect(() => {
    if (rm || motion === 'none') return;
    const t = (toValue: number, duration: number) => Animated.timing(swing, { toValue, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    if (motion === 'drop') {
      swing.setValue(4);
      Animated.parallel([
        Animated.timing(drop, { toValue: 1, duration: 420, delay: 120, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.sequence([Animated.delay(320), t(-2.6, 380), t(1.6, 360), t(-0.8, 320), t(0.3, 280), t(0, 240)]),
      ]).start();
      return;
    }
    const loop = Animated.loop(Animated.sequence([Animated.delay(4200), t(1, 260), t(-0.7, 380), t(0.4, 340), t(-0.18, 300), t(0, 260)]));
    loop.start();
    return () => loop.stop();
  }, [rm, motion, swing, drop]);
  const rotate = swing.interpolate({ inputRange: [-1, 1], outputRange: ['-1.3deg', '1.3deg'] });

  const { w, h } = size;
  const holeY = top + h / 2;

  return (
    <View>
      {hang === 'trolley' && (
        <Animated.View
          style={{ position: 'absolute', left: HOLE_X - TIE.x, top: 0, opacity: drop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }) }}
        >
          <LoadedTrolley />
        </Animated.View>
      )}
      <Animated.View
        style={{
          paddingTop: top,
          paddingBottom: EDGE,
          transformOrigin: [HOLE_X, anchorY, 0],
          opacity: drop.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-46, 0] }) }, { rotate }],
        }}
      >
        {w > 0 && (
          <Svg width={w} height={top + h + EDGE} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
            <Defs>
              <SvgGradient id="shelfTag" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#6A3DE8" />
                <Stop offset="1" stopColor="#9B5CF6" />
              </SvgGradient>
            </Defs>
            {/* the chunky edge underneath, like our buttons */}
            <Path d={tagPath(w, h, top + EDGE)} fill="#4524A8" />
            <Path d={tagPath(w, h, top)} fill="url(#shelfTag)" />
            {/* a few stars on the label */}
            <Path d={star(w - STUB - 18, top + 14, 4)} fill={MOON} opacity={0.75} />
            <Circle cx={w - STUB - 34} cy={top + 26} r={1.6} fill={MOON} opacity={0.5} />
            {/* tear-off stub with the "price" */}
            <Line
              x1={w - STUB}
              y1={top + 9}
              x2={w - STUB}
              y2={top + h - 9}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={2}
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            {/* the eyelet and the string up to what it hangs from */}
            <Line x1={HOLE_X} y1={hang === 'trolley' ? anchorY : 9} x2={HOLE_X} y2={holeY - 6} stroke="#C4B5FD" strokeWidth={1.6} />
            <Circle cx={HOLE_X} cy={holeY} r={6} fill={color.night} stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
            {hang === 'star' && <Path d={star(HOLE_X, 5, 5)} fill={MOON} />}
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
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: '#E3D9FF' }} numberOfLines={1}>
              {label}
            </Text>
            {children}
          </View>
          <View style={{ width: STUB, alignItems: 'center', paddingHorizontal: 4 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: '#E3D9FF' }}>{stubLabel}</Text>
            <Text style={{ fontFamily: font.display, fontSize: 19, lineHeight: 23, color: MOON }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {stubValue}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** The title and the line under it, as Today's tag shows them. */
export function TagTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 21, color: '#FFFFFF', marginTop: 2 }}>{title}</Text>
      {sub ? (
        <Text numberOfLines={2} style={{ fontFamily: font.bodySemi, fontSize: 12.5, lineHeight: 16, color: 'rgba(255,255,255,0.78)', marginTop: 1 }}>
          {sub}
        </Text>
      ) : null}
    </>
  );
}
