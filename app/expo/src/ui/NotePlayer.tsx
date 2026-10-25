import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { PauseIcon, PlayIcon } from './ph';
import { Text, View } from 'react-native';

import type { AppState } from '../lib/store';
import { color, font } from './theme';
import { Pressable } from './Pressable';

/**
 * "Your note from calm you": tap to hear your own voice (the pause's .wr-voice button, P:L604/1466).
 * On the pause it sits right under the ring; `onDark={false}` is the card version used in Me.
 */
export function NotePlayer({ note, onDark = true }: { note: NonNullable<AppState['note']>; onDark?: boolean }) {
  const player = useAudioPlayer({ uri: note.uri });
  const status = useAudioPlayerStatus(player);

  const toggle = async () => {
    if (status.playing) return player.pause();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    await player.seekTo(0);
    player.play();
  };

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Pause your note' : 'Play your note from calm you'}
      style={({ pressed }) => ({
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : color.field,
        borderColor: onDark ? 'rgba(255,255,255,0.2)' : '#2E3374',
        borderWidth: 1.5,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 10,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        {status.playing ? <PauseIcon size={15} color="#2C24A3" weight="fill" /> : <PlayIcon size={15} color="#2C24A3" weight="fill" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, lineHeight: 15, color: onDark ? 'rgba(255,255,255,0.72)' : color.text3 }}>
          Your note from calm you
        </Text>
        <Text numberOfLines={3} style={{ fontFamily: font.bodySemi, fontSize: 14, lineHeight: 18.9, color: onDark ? '#FFFFFF' : color.text }}>
          {note.text ? `“${note.text}”` : `${note.secs} seconds, in your own voice`}
        </Text>
      </View>
    </Pressable>
  );
}
