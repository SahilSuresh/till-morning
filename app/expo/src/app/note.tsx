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
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Linking, Pressable, ScrollView, Text, useAnimatedValue, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { getState, setState, useAppState } from '../lib/store';
import { Button, CircleButton, TextLink, toast, useReduceMotion } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { MicrophoneIcon, PauseIcon, PlayIcon } from '../ui/ph';
import { color, font, type } from '../ui/theme';

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
  const used = Math.min(1, rec.durationMillis / (MAX_SECONDS * 1000));
  const left = Math.max(0, MAX_SECONDS - Math.floor(rec.durationMillis / 1000));
  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 }}>
        <Text style={[type.body, { textAlign: 'center' }]}>
          Record a few words while you feel calm. Till Morning plays them in your pause, when the sale noise is loudest.
        </Text>

        {/* 1 · Record */}
        <View style={{ alignItems: 'center', marginTop: 26 }}>
          <RecordButton recording={recording} used={used} onPress={toggle} />
          <Text accessibilityLiveRegion="polite" style={[type.title, { marginTop: 14, textAlign: 'center' }]}>
            {recording ? `Recording… ${left} s left` : draftUri ? 'Recorded. Tap to record again.' : 'Tap to record'}
          </Text>
          <Text style={[type.small, { marginTop: 2, textAlign: 'center' }]}>{recording ? 'Tap again to stop' : `Up to ${MAX_SECONDS} seconds`}</Text>
        </View>

        {/* 2 · Your note: a voice note with a waveform that fills as it plays */}
        {draftUri && !recording && (
          <View
            style={{
              marginTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 20,
              backgroundColor: '#1E2256',
              borderWidth: 1,
              borderColor: '#3A3F86',
            }}
          >
            <Pressable
              onPress={() => (status.playing ? player.pause() : play())}
              accessibilityRole="button"
              accessibilityLabel={status.playing ? 'Pause your note' : 'Play your note'}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
            >
              <LinearGradient colors={['#7C4DFF', '#A066FF']} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}>
                {status.playing ? <PauseIcon size={22} weight="fill" color="#FFFFFF" /> : <PlayIcon size={22} weight="fill" color="#FFFFFF" />}
              </LinearGradient>
            </Pressable>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Waveform progress={progress} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text numberOfLines={1} style={[type.small, { flex: 1, color: color.text }]}>
                  {text ? `“${text}”` : 'Your note'}
                </Text>
                <Text style={{ fontFamily: font.display, fontSize: 13, color: MOON }}>0:{String(secs).padStart(2, '0')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3 · Ideas */}
        <Text style={[type.label, { marginTop: 24 }]}>Not sure what to say? Try one of these</Text>
        <View style={{ marginTop: 10, gap: 8 }} accessibilityRole="radiogroup">
          {ideas().map((idea) => {
            const on = text === idea;
            return (
              <Pressable
                key={idea}
                onPress={() => setText(on ? '' : idea)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 11,
                  paddingHorizontal: 14,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: on ? '#9B5CF6' : '#3A3F86',
                  backgroundColor: on ? '#6A3DE8' : pressed ? '#262B6A' : '#1E2256',
                })}
              >
                <Text style={{ fontFamily: font.display, fontSize: 22, lineHeight: 22, color: on ? MOON : '#8A8EC6' }}>“</Text>
                <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 14.5, lineHeight: 19, color: on ? '#FFFFFF' : color.text }}>{idea}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[type.small, { marginTop: 18, textAlign: 'center' }]}>Saved on this phone only.</Text>
        {saved && <TextLink label="Delete my note" style={{ color: color.text3 }} onPress={remove} />}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <Button variant="night" label="Save my note" disabled={!draftUri || recording} onPress={save} />
      </View>
    </View>
  );
}

const MOON = '#FFE7A3';
const RING = 2 * Math.PI * 64;

/** The big record button: purple with a mic; coral while recording, with a ring filling up to 20 s and a soft pulse. */
function RecordButton({ recording, used, onPress }: { recording: boolean; used: number; onPress: () => void }) {
  const rm = useReduceMotion();
  const pulse = useAnimatedValue(0);
  useEffect(() => {
    if (!recording || rm) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [recording, rm, pulse]);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Stop recording' : 'Record'}
      style={{ width: 140, height: 140, alignItems: 'center', justifyContent: 'center' }}
    >
      {({ pressed }) => (
        <>
          {recording && (
            <Animated.View
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#FF8F78',
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
              }}
            />
          )}
          {/* how much of the 20 seconds is used */}
          <Svg width={140} height={140} style={{ position: 'absolute' }}>
            <Circle cx={70} cy={70} r={64} stroke="rgba(167,139,250,0.22)" strokeWidth={5} fill="none" />
            {recording && (
              <Circle
                cx={70}
                cy={70}
                r={64}
                stroke={MOON}
                strokeWidth={5}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={RING * (1 - used)}
                transform="rotate(-90 70 70)"
              />
            )}
          </Svg>
          <View style={{ borderRadius: 56, backgroundColor: recording ? '#C2553F' : '#4B2BB0', paddingBottom: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 }}>
            <LinearGradient
              colors={recording ? ['#FF8F78', '#FF6F5B'] : ['#7C4DFF', '#A066FF']}
              style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' }}
            >
              {recording ? (
                <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FFFFFF' }} />
              ) : (
                <MicrophoneIcon size={48} weight="fill" color="#FFFFFF" />
              )}
            </LinearGradient>
          </View>
        </>
      )}
    </Pressable>
  );
}

const BARS = Array.from({ length: 32 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));

/** A voice-note waveform: the played part in moon yellow, the rest in faint lavender. */
function Waveform({ progress }: { progress: number }) {
  const played = Math.round(progress * BARS.length);
  return (
    <View style={{ height: 26, flexDirection: 'row', alignItems: 'center', gap: 2.5 }} accessibilityElementsHidden>
      {BARS.map((h, i) => (
        <View key={i} style={{ flex: 1, height: 4 + h * 22, borderRadius: 2, backgroundColor: i < played ? MOON : 'rgba(196,181,253,0.38)' }} />
      ))}
    </View>
  );
}
