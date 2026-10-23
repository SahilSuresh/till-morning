import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The prototype is drawn on a 393 × 852 iPhone whose safe areas are 59 pt at the top and 34 pt at
// the bottom. These turn its distances from the screen edges (pt-14, pb-11, …) into the same
// distances on the phone in hand, with a floor for phones that have a home button.
const PROTO_TOP = 59;
const PROTO_BOTTOM = 34;

export function useObSpace() {
  const insets = useSafeAreaInsets();
  return {
    /** A prototype padding measured from the top of the screen: pt-14 = 56, pt-20 = 80. */
    top: (px: number) => Math.max(insets.top + px - PROTO_TOP, px - 32),
    /** A prototype padding measured from the bottom of the screen: pb-11 = 44, pb-10 = 40. */
    bottom: (px: number) => Math.max(insets.bottom + px - PROTO_BOTTOM, px - 24),
  };
}
