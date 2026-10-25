import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { getState } from './store';

// Till Morning's little sounds (made by scripts/make-sounds.py). They respect the silent switch,
// mix with whatever else is playing, and can be switched off in Settings → Sounds.

const SRC = {
  tap: require('../../assets/sounds/tap.wav'),
  next: require('../../assets/sounds/next.wav'),
  back: require('../../assets/sounds/back.wav'),
  select: require('../../assets/sounds/select.wav'),
  tab: require('../../assets/sounds/tab.wav'),
  toggleOn: require('../../assets/sounds/toggle_on.wav'),
  toggleOff: require('../../assets/sounds/toggle_off.wav'),
  hold: require('../../assets/sounds/hold.wav'),
  boom: require('../../assets/sounds/boom.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  tear: require('../../assets/sounds/tear.wav'),
  pop: require('../../assets/sounds/pop.wav'),
} as const;

export type Sound = keyof typeof SRC;

const players: Partial<Record<Sound, AudioPlayer>> = {};

function player(name: Sound) {
  let p = players[name];
  if (!p) {
    p = createAudioPlayer(SRC[name]);
    p.volume = name === 'hold' ? 0.8 : 1;
    players[name] = p;
  }
  return p;
}

/** Once at launch: quiet in silent mode, mixed with music, and the common sounds loaded ahead. */
export function initSounds() {
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', allowsRecording: false }).catch(() => {});
  try {
    (['tap', 'next', 'back', 'select', 'tab'] as Sound[]).forEach(player);
  } catch {
    // Sounds are a nicety; the app works without them.
  }
}

export function soundsOn() {
  return getState().settings.sounds !== false;
}

/** Plays a sound from the start (unless Sounds are off). */
export function play(name: Sound) {
  if (!soundsOn()) return;
  try {
    const p = player(name);
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // Never let a sound get in the way.
  }
}

/** Stops a sound that's playing (e.g. the hold hum when you let go early). */
export function stop(name: Sound) {
  try {
    const p = players[name];
    if (!p) return;
    p.pause();
    p.seekTo(0).catch(() => {});
  } catch {
    // Already stopped.
  }
}
