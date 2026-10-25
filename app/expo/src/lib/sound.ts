import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { useEffect } from 'react';

import { getState } from './store';

// Till Morning's little sounds and the calm music for waiting screens (made by
// scripts/make-sounds.py). They respect the silent switch, mix with whatever else is playing,
// and can be switched off in Settings → Sounds.

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

// Several players per short sound: each tap takes a free one, so even very fast taps all sound.
const POOL = 4;
const players: Partial<Record<Sound, AudioPlayer[]>> = {};
const turn: Partial<Record<Sound, number>> = {};
// Bumped by stop(), so a sound that was about to start after a rewind doesn't start after all.
const gen: Partial<Record<Sound, number>> = {};
let count = 0;

function pool(name: Sound) {
  let list = players[name];
  if (!list) {
    const n = name === 'hold' || name === 'boom' ? 1 : POOL;
    list = Array.from({ length: n }, () => {
      const p = createAudioPlayer(SRC[name]);
      p.volume = name === 'hold' ? 0.8 : 1;
      return p;
    });
    players[name] = list;
  }
  return list;
}

/** Once at launch: quiet in silent mode, mixed with music, and the common sounds loaded ahead. */
export function initSounds() {
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', allowsRecording: false }).catch(() => {});
  try {
    (['tap', 'next', 'back', 'select', 'tab'] as Sound[]).forEach(pool);
  } catch {
    // Sounds are a nicety; the app works without them.
  }
}

export function soundsOn() {
  return getState().settings.sounds !== false;
}

/** How many sounds have been asked for so far (lets a button skip its tap when it already played one). */
export function playCount() {
  return count;
}

/**
 * Plays a sound from the start. The rewind finishes before play starts: playing straight after
 * a rewind used to race it, which is why sounds only worked every other tap.
 */
export function play(name: Sound) {
  count += 1;
  if (!soundsOn()) return;
  try {
    const list = pool(name);
    // A player that isn't busy, else the next one in turn.
    let p = list.find((x) => !x.playing);
    if (!p) {
      const i = (turn[name] ?? 0) % list.length;
      turn[name] = i + 1;
      p = list[i];
      p.pause();
    }
    const player = p;
    const g = gen[name] ?? 0;
    const go = () => {
      if ((gen[name] ?? 0) === g) player.play();
    };
    if (player.currentTime > 0.005) {
      player.seekTo(0).then(go).catch(go);
    } else {
      player.play();
    }
  } catch {
    // Never let a sound get in the way.
  }
}

/** Stops a sound that's playing (e.g. the hold hum when you let go early). */
export function stop(name: Sound) {
  gen[name] = (gen[name] ?? 0) + 1;
  try {
    for (const p of players[name] ?? []) {
      p.pause();
      p.seekTo(0).catch(() => {});
    }
  } catch {
    // Already stopped.
  }
}

// ---- Calm music for waiting screens ------------------------------------------------------------

const CALM = require('../../assets/sounds/calm.wav');
const CALM_VOLUME = 0.42;
let calm: AudioPlayer | null = null;
let users = 0;
let fader: ReturnType<typeof setInterval> | undefined;

function fadeTo(target: number, ms: number, then?: () => void) {
  if (!calm) return;
  if (fader) clearInterval(fader);
  const p = calm;
  const from = p.volume;
  const steps = Math.max(1, Math.round(ms / 50));
  let i = 0;
  fader = setInterval(() => {
    i += 1;
    p.volume = from + (target - from) * (i / steps);
    if (i >= steps) {
      clearInterval(fader);
      fader = undefined;
      then?.();
    }
  }, 50);
}

/**
 * Soft looping music while `on` (the pause, the urgent wait, the pause demo). It fades in over a
 * second and out when the wait ends or the screen closes. Off when Sounds are off.
 */
export function useCalmMusic(on: boolean) {
  useEffect(() => {
    if (!on || !soundsOn()) return;
    users += 1;
    try {
      if (!calm) {
        calm = createAudioPlayer(CALM);
        calm.loop = true;
      }
      calm.volume = users > 1 ? calm.volume : 0;
      calm.play();
      fadeTo(CALM_VOLUME, 1200);
    } catch {
      return;
    }
    return () => {
      users = Math.max(0, users - 1);
      if (users > 0) return;
      fadeTo(0, 700, () => {
        if (users === 0) calm?.pause();
      });
    };
  }, [on]);
}
