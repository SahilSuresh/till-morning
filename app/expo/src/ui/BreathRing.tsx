import { Check } from 'phosphor-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useReduceMotion } from './components';
import { IconCheck } from './icons';
import { font } from './theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 244;
const R = 110;
const CIRC = 2 * Math.PI * R; // 691.15
const BREATHE = Easing.inOut(Easing.ease);
const SPRING = Easing.bezier(0.34, 1.56, 0.64, 1); // --spring

/** Breathing cycle from the prototype: 7.5 s when the length divides by 7.5, otherwise 5 s; inhale = first 45%. */
export function breathCycle(total: number) {
  return total % 7.5 === 0 ? 7.5 : 5;
}

export function cueFor(elapsed: number, total: number) {
  const cycle = breathCycle(total);
  return (elapsed % cycle) / cycle < 0.45 ? 'breathe in' : 'breathe out';
}

/**
 * The pause ring: starts full and empties as time runs down; the orb breathes inside it.
 * Everything moves on the UI thread: the ring eases to each new `left` (.25 s linear, like the
 * prototype's #ring transition) and the orb loops by itself.
 *
 * `autoplay` plays a whole countdown with no updates from JavaScript (the setup demo, P:L1356):
 * the ring empties over `total` seconds after `delay` ms, the numbers count down one a second,
 * then a check fades in. `left` and `done` are ignored; remount it (a new key) to replay.
 */
export function BreathRing({
  total,
  left,
  done,
  size = SIZE,
  cue,
  orbSize,
  autoplay,
}: {
  total: number;
  left: number;
  done: boolean;
  size?: number;
  /** Show the "breathe in / breathe out / your call" line. Defaults to on, off with `autoplay`. */
  cue?: boolean;
  /** The orb's full-breath diameter. Defaults to 204 scaled with `size`. */
  orbSize?: number;
  autoplay?: { delay: number };
}) {
  const rm = useReduceMotion();
  const k = size / SIZE;
  const orb = orbSize ?? 204 * k;
  const showCue = cue ?? !autoplay;
  const playing = !!autoplay;
  const playDelay = autoplay?.delay ?? 0;

  const offset = useSharedValue(playing ? 0 : CIRC * (1 - left / total));
  const scale = useSharedValue(0.6);
  const checkPop = useSharedValue(0);

  // Ring, following the countdown it's given.
  useEffect(() => {
    if (playing) return;
    offset.set(withTiming(CIRC * (1 - left / total), { duration: 250, easing: Easing.linear }));
  }, [playing, left, total, offset]);

  // Ring, playing by itself (demo-ring: 5 s linear after .4 s).
  useEffect(() => {
    if (!playing) return;
    if (rm) {
      offset.set(CIRC);
      return;
    }
    offset.set(withDelay(playDelay, withTiming(CIRC, { duration: total * 1000, easing: Easing.linear })));
    return () => cancelAnimation(offset);
  }, [playing, playDelay, rm, total, offset]);

  // Orb: 0.6 → 1 on the inhale (45%), back to 0.6 on the exhale.
  useEffect(() => {
    const cycle = breathCycle(total) * 1000;
    const breath = () => withSequence(withTiming(1, { duration: cycle * 0.45, easing: BREATHE }), withTiming(0.6, { duration: cycle * 0.55, easing: BREATHE }));
    if (playing) {
      // One breath from the start, then it rests (the demo's #breath: --n:1, --del:0).
      if (!rm) scale.set(breath());
      return () => cancelAnimation(scale);
    }
    if (done || rm) {
      scale.set(withTiming(done ? 0.95 : 0.8, { duration: 600, easing: SPRING }));
      return;
    }
    scale.set(withRepeat(breath(), -1));
    return () => cancelAnimation(scale);
  }, [playing, done, rm, total, scale]);

  // Check: pops in when the countdown ends, or fades in after the demo's last number (in-fade .5s).
  useEffect(() => {
    if (playing) {
      checkPop.set(rm ? 1 : withDelay(playDelay + total * 1000, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })));
      return () => cancelAnimation(checkPop);
    }
    if (!done) {
      checkPop.set(0);
      return;
    }
    checkPop.set(0);
    checkPop.set(withSpring(1, { damping: 9, stiffness: 180 }));
  }, [playing, playDelay, rm, total, done, checkPop]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const orbStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const checkStyle = useAnimatedStyle(() => (playing ? { opacity: checkPop.value } : { transform: [{ scale: checkPop.value }] }));

  const orbDone = done && !playing;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessible
      accessibilityLabel={playing ? `A ${total}-second breathing pause` : done ? 'Your call' : `${Math.ceil(left)} seconds left`}
    >
      <Animated.View style={[{ position: 'absolute', width: orb, height: orb }, orbStyle]}>
        <Svg width={orb} height={orb}>
          <Defs>
            <RadialGradient id="orb" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={orbDone ? 'rgb(214,226,255)' : 'rgb(200,216,255)'} stopOpacity={orbDone ? 0.46 : 0.72} />
              <Stop offset={orbDone ? '0.58' : '0.52'} stopColor={orbDone ? 'rgb(190,206,255)' : 'rgb(150,170,255)'} stopOpacity={orbDone ? 0.2 : 0.3} />
              <Stop offset={orbDone ? '0.72' : '0.71'} stopColor="rgb(150,170,255)" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={orb / 2} cy={orb / 2} r={orb / 2} fill="url(#orb)" />
        </Svg>
      </Animated.View>

      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke="rgba(255,255,255,0.16)" strokeWidth={8} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          stroke="#B9CBFF"
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${CIRC} ${CIRC}`}
          animatedProps={ringProps}
        />
      </Svg>

      {playing ? (
        <View style={StyleSheet.absoluteFill}>
          {Array.from({ length: total }, (_, i) => (
            <CountNumber key={i} n={total - i} at={playDelay + i * 1000} hidden={rm} />
          ))}
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, checkStyle]}>
            <Check size={56} weight="bold" color="#FFFFFF" />
          </Animated.View>
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          {done ? (
            <Animated.View style={checkStyle}>
              <IconCheck size={56 * k} />
            </Animated.View>
          ) : (
            <Text
              style={{
                fontFamily: font.display,
                fontSize: 64 * k,
                lineHeight: 70 * k,
                color: '#FFFFFF',
                fontVariant: ['tabular-nums'],
                textShadowColor: 'rgba(28,18,110,0.6)',
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 1 },
              }}
            >
              {Math.max(1, Math.ceil(left))}
            </Text>
          )}
          {showCue && (
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
              {done ? 'your call' : cueFor(total - left, total)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

/** One number of the demo countdown (.demo-n): shown for exactly one second from `at` ms. */
function CountNumber({ n, at, hidden }: { n: number; at: number; hidden: boolean }) {
  const o: SharedValue<number> = useSharedValue(0);
  useEffect(() => {
    if (hidden) return;
    o.set(withDelay(at, withSequence(withTiming(1, { duration: 0 }), withDelay(1000, withTiming(0, { duration: 0 })))));
    return () => cancelAnimation(o);
  }, [at, hidden, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontFamily: font.display, fontSize: 60, lineHeight: 66, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{n}</Text>
    </Animated.View>
  );
}
