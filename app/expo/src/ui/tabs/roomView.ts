// Today's wait card opens the waiting room on the right segment (prototype openRoom(arg)).

export type RoomView = 'waiting' | 'ready' | 'letgo';

let pending: RoomView | null = null;

export function openRoomOn(view: RoomView) {
  pending = view;
}

/** The segment Today asked for, once. */
export function takeRoomView() {
  const v = pending;
  pending = null;
  return v;
}

// The tab that a swipe is heading to: +1 = next (content slides in from the right), −1 = previous.
// Read once by the tab scene that comes into focus; a tap leaves it at 0 (fade only).
export const tabMotion = { dir: 0 as -1 | 0 | 1 };
export function setTabMotion(dir: -1 | 0 | 1) {
  tabMotion.dir = dir;
}
