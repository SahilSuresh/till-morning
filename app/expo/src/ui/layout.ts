import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating tab bar. */
export const TAB_BAR_HEIGHT = 64;

/** Bottom padding a tab screen needs so nothing hides behind the floating tab bar. */
export function useTabBarSpace() {
  return useSafeAreaInsets().bottom + 8 + TAB_BAR_HEIGHT + 16;
}
