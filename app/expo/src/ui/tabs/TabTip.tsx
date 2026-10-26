import { useIsFocused } from 'expo-router';
import { type ComponentRef, type RefObject, useEffect } from 'react';
import type { ScrollView } from 'react-native';

import { setState, useAppState } from '../../lib/store';
import { TAB_TIPS } from '../../lib/week';
import { Spotlight, type SpotRef } from '../Spotlight';
import { useTarget } from './spot';

export type ScrollRef = RefObject<ComponentRef<typeof ScrollView> | null>;

/**
 * First visit to Waiting or Me: once the screen has settled, the spotlight outlines the
 * segmented control or the rank card and one tag drops in with "Got it". Waits until the
 * first-time tour on Today is over.
 */
export function TabTip({
  k,
  targetRef,
  scrollRef,
  radius,
}: {
  k: 'waiting' | 'me';
  targetRef: SpotRef;
  scrollRef: ScrollRef;
  radius: number;
}) {
  const due = useAppState((s) => s.subscribed && !s.lapsed && !s.tabTips[k] && s.coachStep < 0);
  const focused = useIsFocused();
  const active = due && focused;

  useEffect(() => {
    if (active) scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [active, scrollRef]);

  const rect = useTarget(active ? { key: k, ref: targetRef } : null, radius, 600);
  const tip = TAB_TIPS[k];

  return (
    <Spotlight
      active={active}
      target={rect}
      tipKey={k}
      label="New here"
      title={tip.t}
      body={tip.d}
      next="Got it"
      onNext={() => setState((s) => ({ tabTips: { ...s.tabTips, [k]: true } }))}
    />
  );
}
