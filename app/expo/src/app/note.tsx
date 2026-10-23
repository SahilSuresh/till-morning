import {
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getState, setState, useAppState } from '../lib/store';
import { Button, Card, CircleButton, Tag, TextLink, toast } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { color, type } from '../ui/theme';

const MAX_SECONDS = 20;

/** Ideas to say (noteIdeas(), L1112). */
function ideas() {
  const goal = getState().goal.trim();
  return [
    `Remember ${goal || 'what you’re saving for'}. Is this it?`,
    'You said you’d sleep on it. So sleep on it.',
    'Future you is the one who pays for this.',
  ];
}

/** A note from calm you (V.note, L1673): your own voice, played in every pause. */
export default function Note() {
  const insets = useSafeAreaInsets();
  const saved = useAppState((s) => s.note);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder, 250);
  const [draftUri, setDraftUri] = useState<string | null>(saved?.uri ?? null);
  const [secs, setSecs] = useState(saved?.secs ?? 0);
  const [text, setText] = useState(saved?.text ?? '');
  const player = useAudioPlayer(draftUri ? { uri: draftUri } : null);
  const status = useAudioPlayerStatus(player);
  const stopping = useRef(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const stop = async () => {
    if (stopping.current) return;
    stopping.current = true;
    try {
      await recorder.stop();
      if (recorder.uri) {
        setDraftUri(recorder.uri);
        setSecs(Math.max(1, Math.round(rec.durationMillis / 1000)));
      }
    } finally {
      stopping.current = false;
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    }
  };

  // Notes stay short: recording stops by itself after 20 seconds.
  useEffect(() => {
    if (rec.isRecording && rec.durationMillis >= MAX_SECONDS * 1000) stop();
  }, [rec.isRecording, rec.durationMillis]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async () => {
    if (rec.isRecording) return stop();
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone is off', 'To record your note, allow the microphone for Till Morning in Settings.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    player.pause();
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const play = async () => {
    if (!draftUri) return;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    await player.seekTo(0);
    player.play();
  };

  const save = () => {
    if (!draftUri) return;
    let uri = draftUri;
    if (draftUri !== saved?.uri) {
      // Keep it in Documents so iOS doesn't clear it, and remove the old one.
      try {
        const dest = new File(Paths.document, `calm-note-${Date.now()}.m4a`);
        new File(draftUri).moveSync(dest);
        uri = dest.uri;
        if (saved?.uri) {
          const old = new File(saved.uri);
          if (old.exists) old.delete();
        }
      } catch {
        // The recording still plays from where it is.
      }
    }
    setState({ note: { uri, text, secs } });
    back();
    setTimeout(() => toast('Your note will play in every pause'), 300);
  };

  const remove = () =>
    Alert.alert('Delete your note?', 'It won’t play in your pause any more.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          try {
            if (saved?.uri) {
              const f = new File(saved.uri);
              if (f.exists) f.delete();
            }
          } catch {
            // Already gone.
          }
          setState({ note: null });
          back();
        },
      },
    ]);

  const recording = rec.isRecording;
  const left = Math.max(0, MAX_SECONDS - Math.floor(rec.durationMillis / 1000));

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton
          label="Back"
          onPress={() => {
            if (recording) recorder.stop().catch(() => {});
            back();
          }}
        >
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>A note from calm you</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16, alignItems: 'center' }}>
        <Text style={[type.body, { textAlign: 'center' }]}>
          Record a few words while you feel calm. Till Morning plays them in your pause, when the sale noise is loudest.
        </Text>

        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityLabel={recording ? 'Stop recording' : 'Record'}
          style={{
            marginTop: 28,
            width: 116,
            height: 116,
            borderRadius: 58,
            backgroundColor: recording ? '#FF8F78' : color.blue,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 6,
            borderColor: recording ? 'rgba(255,143,120,0.35)' : 'rgba(91,118,255,0.35)',
          }}
        >
          {recording ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 12, height: 40, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
              <View style={{ width: 12, height: 40, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
            </View>
          ) : (
            <Text style={{ fontSize: 44 }}>🎙️</Text>
          )}
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={[type.title, { marginTop: 14 }]}>
          {recording ? `Recording… tap to stop (${left} s)` : draftUri ? 'Recorded. Tap to record again.' : 'Tap to record'}
        </Text>

        <Text style={[type.label, { marginTop: 26, alignSelf: 'flex-start' }]}>Not sure what to say? Try one of these</Text>
        <View style={{ marginTop: 10, gap: 8, alignSelf: 'stretch' }}>
          {ideas().map((idea) => (
            <Tag key={idea} label={idea} selected={text === idea} onPress={() => setText(idea)} />
          ))}
        </View>

        {draftUri && (
          <Card style={{ marginTop: 20, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              onPress={play}
              accessibilityRole="button"
              accessibilityLabel="Play your note"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(94,233,181,0.16)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 20, color: '#6EF0BF' }}>{status.playing ? '❚❚' : '▶'}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={type.label}>Your note · {secs} s</Text>
              <Text style={[type.title, { marginTop: 2 }]}>{text ? `“${text}”` : 'In your own words'}</Text>
            </View>
          </Card>
        )}
        <Text style={[type.small, { marginTop: 14, textAlign: 'center' }]}>Saved on this phone only.</Text>
        {saved && <TextLink label="Delete my note" style={{ color: color.text3 }} onPress={remove} />}
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <Button label="Save my note" disabled={!draftUri || recording} onPress={save} />
      </View>
    </View>
  );
}

