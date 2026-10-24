import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { ScrollView, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, { Easing, type LayoutAnimation, type SharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useObSpace } from './space';

/**
 * Setup's step changes, as the prototype's screen motion (P:L368–399):
 *  fwd / back: the new content slides in (in-right / in-left .34s, 70 ms late) while the old slides
 *              out (out-left / out-right .2s ease-in); footers cross-fade; the header stays still.
 *  fade:       the new step fades in over .32s (after the hold, and "Play it again").
 * Entrances inside a step (Rise, pop-ins, highlight pops) start from `base`: 140 ms after a slide,
 * 50 ms after a fade.
 */
export const NAV = { none: 0, fwd: 1, back: 2, fade: 3 } as const;
export type Nav = (typeof NAV)[keyof typeof NAV];

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const EASE_IN = Easing.bezier(0.42, 0, 1, 1);
const EASE_OUT = Easing.bezier(0, 0, 0.58, 1);

type LayoutFn = () => LayoutAnimation;
type Motion = {
  base: number;
  bodyIn?: LayoutFn;
  bodyOut?: LayoutFn;
  footIn?: LayoutFn;
  footOut?: LayoutFn;
  tourIn?: LayoutFn;
};

const MotionContext = createContext<Motion>({ base: 140 });

/**
 * The layout animations for the step bodies. They read the direction from `nav` on the UI thread
 * when they start, so the outgoing step slides the right way even though it last rendered before
 * the tap. Under Reduce Motion steps simply swap.
 */
export function useStepMotion(nav: SharedValue<number>, current: Nav, reduce: boolean): Motion {
  const anims = useMemo(() => {
    if (reduce) return {};
    const still = (opacity: number): LayoutAnimation => {
      'worklet';
      return { initialValues: { opacity }, animations: { opacity: withTiming(opacity, { duration: 0 }) } };
    };
    const bodyIn = (): LayoutAnimation => {
      'worklet';
      const m = nav.value;
      if (m === NAV.fade) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 320, easing: EASE_OUT }) } };
      if (m !== NAV.fwd && m !== NAV.back) return still(1);
      return {
        initialValues: { opacity: 0, transform: [{ translateX: m === NAV.fwd ? 34 : -34 }] },
        animations: {
          opacity: withDelay(70, withTiming(1, { duration: 340, easing: EASE })),
          transform: [{ translateX: withDelay(70, withTiming(0, { duration: 340, easing: EASE })) }],
        },
      };
    };
    const bodyOut = (): LayoutAnimation => {
      'worklet';
      const m = nav.value;
      if (m === NAV.fade) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 320, easing: EASE_IN }) } };
      if (m !== NAV.fwd && m !== NAV.back) return still(0);
      return {
        initialValues: { opacity: 1, transform: [{ translateX: 0 }] },
        animations: {
          opacity: withTiming(0, { duration: 200, easing: EASE_IN }),
          transform: [{ translateX: withTiming(m === NAV.fwd ? -34 : 34, { duration: 200, easing: EASE_IN }) }],
        },
      };
    };
    const footIn = (): LayoutAnimation => {
      'worklet';
      const m = nav.value;
      if (m === NAV.fade) return { initialValues: { opacity: 0 }, animations: { opacity: withTiming(1, { duration: 320, easing: EASE_OUT }) } };
      if (m !== NAV.fwd && m !== NAV.back) return still(1);
      return { initialValues: { opacity: 0 }, animations: { opacity: withDelay(80, withTiming(1, { duration: 260, easing: EASE_OUT })) } };
    };
    const footOut = (): LayoutAnimation => {
      'worklet';
      const m = nav.value;
      if (m === NAV.fade) return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 320, easing: EASE_IN }) } };
      if (m !== NAV.fwd && m !== NAV.back) return still(0);
      return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 120, easing: EASE_IN }) } };
    };
    // The tour slide's own entrance (.tour-in: 26 px and a fade over .4s).
    const tourIn = (): LayoutAnimation => {
      'worklet';
      if (nav.value !== NAV.fwd) return bodyIn();
      return {
        initialValues: { opacity: 0, transform: [{ translateX: 26 }] },
        animations: {
          opacity: withTiming(1, { duration: 400, easing: EASE }),
          transform: [{ translateX: withTiming(0, { duration: 400, easing: EASE }) }],
        },
      };
    };
    return { bodyIn, bodyOut, footIn, footOut, tourIn };
  }, [nav, reduce]);

  return useMemo(() => ({ ...anims, base: current === NAV.fade ? 50 : 140 }), [anims, current]);
}

export function StepMotionProvider({ value, children }: { value: Motion; children: ReactNode }) {
  return <MotionContext value={value}>{children}</MotionContext>;
}

/** The current step's layout animations, for extra layers a step draws outside `StepBody`. */
export function useStepAnims() {
  return useContext(MotionContext);
}

/** When this step's entrances start (the prototype's --base): add a `--d` to it. */
export function useStepBase() {
  return useContext(MotionContext).base;
}

/** `Rise` already waits 140 ms; this turns a prototype `--d` into its `delay`. */
export function useRiseDelay() {
  const base = useStepBase();
  return (d: number) => base - 140 + d;
}

/**
 * One step: a body (scrolling by default) that slides, and a footer pinned to the bottom that
 * cross-fades, like the prototype's `.scroll` + `foot()` (px-7 pt-3 pb-11).
 */
export function StepBody({
  children,
  footer,
  scroll = true,
  contentStyle,
  footerStyle,
  enter = 'slide',
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  enter?: 'slide' | 'tour';
}) {
  const m = useContext(MotionContext);
  const sp = useObSpace();
  return (
    <>
      <Animated.View entering={enter === 'tour' ? m.tourIn : m.bodyIn} exiting={m.bodyOut} style={{ flex: 1 }}>
        {scroll ? (
          // Centred in the space between the header and the footer, so short screens don't leave a gap at the bottom.
          <ScrollView contentContainerStyle={[{ flexGrow: 1, justifyContent: 'center' }, contentStyle]} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentStyle]}>{children}</View>
        )}
      </Animated.View>
      {footer ? (
        <Animated.View
          entering={m.footIn}
          exiting={m.footOut}
          style={[{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: sp.bottom(44) }, footerStyle]}
        >
          {footer}
        </Animated.View>
      ) : null}
    </>
  );
}
