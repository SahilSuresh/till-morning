import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, Text, View } from 'react-native';

import type { AppState } from '../lib/store';
import { color, font } from './theme';

/** "Your note from calm you": tap to hear your own voice (the pause's .wr-voice button, L1466). */
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
      style={{
        alignSelf: 'stretch',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: onDark ? 'rgba(255,255,255,0.12)' : color.card,
        borderColor: onDark ? 'rgba(255,255,255,0.22)' : '#2E3374',
        borderWidth: 1.5,
        borderRadius: 18,
        padding: 12,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 15, color: color.blue }}>{status.playing ? '❚❚' : '▶'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>Your note from calm you</Text>
        <Text numberOfLines={2} style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#FFFFFF' }}>
          {note.text ? `“${note.text}”` : `${note.secs} seconds, in your own voice`}
        </Text>
      </View>
    </Pressable>
  );
}
