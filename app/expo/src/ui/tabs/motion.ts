import { css, cubicBezier } from 'react-native-reanimated';

// The prototype's keyframes (P:L470–501) as Reanimated CSS animations: declared once, run on
// the UI thread. Callers leave them off when Reduce Motion is on.

export const EASE = cubicBezier(0.2, 0.8, 0.2, 1);
export const SPRING = cubicBezier(0.34, 1.56, 0.64, 1);

/** @keyframes pop-in { from { opacity: 0; scale: .5 } } */
export const popIn = css.keyframes({
  from: { opacity: 0, transform: [{ scale: 0.5 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
});

/** @keyframes stamp { 0% { opacity: 0; scale: 2.2; rotate: -10deg } 55% { opacity: 1 } } */
export const stamp = css.keyframes({
  '0%': { opacity: 0, transform: [{ scale: 2.2 }, { rotate: '-10deg' }] },
  '55%': { opacity: 1 },
  '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }] },
});

/** @keyframes ring { 0% { opacity: .9; scale: 1 } 100% { opacity: 0; scale: 1.12 1.6 } } (the header chip's values) */
export const ringPulse = css.keyframes({
  '0%': { opacity: 0.9, transform: [{ scaleX: 1 }, { scaleY: 1 }] },
  '100%': { opacity: 0, transform: [{ scaleX: 1.12 }, { scaleY: 1.6 }] },
});

/** @keyframes wiggle { 20% { rotate: -8deg } 40% { rotate: 6deg } 60% { rotate: -4deg } 80% { rotate: 2deg } } */
export const wiggle = css.keyframes({
  '0%': { transform: [{ rotate: '0deg' }] },
  '20%': { transform: [{ rotate: '-8deg' }] },
  '40%': { transform: [{ rotate: '6deg' }] },
  '60%': { transform: [{ rotate: '-4deg' }] },
  '80%': { transform: [{ rotate: '2deg' }] },
  '100%': { transform: [{ rotate: '0deg' }] },
});
