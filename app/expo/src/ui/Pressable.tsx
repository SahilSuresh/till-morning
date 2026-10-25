import type { ComponentProps } from 'react';
import { type GestureResponderEvent, Pressable as RNPressable } from 'react-native';

import { play, playCount, type Sound } from '../lib/sound';

/**
 * React Native's Pressable, with a sound: every tap makes a soft "tap" unless the press already
 * played its own sound (next, back, a chip, a switch…), so nothing ever plays twice.
 * Pass `sound={null}` for a silent press, or another sound name. `ref` passes straight through.
 */
export function Pressable({ onPress, sound = 'tap', ...rest }: ComponentProps<typeof RNPressable> & { sound?: Sound | null }) {
  const handle = onPress
    ? (e: GestureResponderEvent) => {
        const before = playCount();
        onPress(e);
        if (sound && !rest.disabled && playCount() === before) play(sound);
      }
    : undefined;
  return <RNPressable {...rest} onPress={handle} />;
}
