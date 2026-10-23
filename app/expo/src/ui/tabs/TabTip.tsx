import { useIsFocused } from 'expo-router';
import { type ComponentRef, type RefObject, useEffect } from 'react';
import type { ScrollView } from 'react-native';

import { setState, useAppState } from '../../lib/store';
import { TAB_TIPS } from '../../lib/week';
import { Spotlight, type SpotRef } from '../Spotlight';
import { useTarget } from './spot';

export type ScrollRef = RefObject<ComponentRef<typeof ScrollView> | null>;

/**
 * First visit to Waiting or Me (maybeTabTip, P:L1851–1855; SHEETS.tabtip, P:L2244–2250):
 * after 450 ms the spotlight outlines the segmented control or the rank card with one tip and
 * "Got it". Waits until the first-time tour on Today is over.
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

  const rect = useTarget(targetRef, active, radius, 450);
  const tip = TAB_TIPS[k];

  return (
    <Spotlight
      visible={active && !!rect}
      target={rect}
      title={tip.t}
      body={tip.d}
      next="Got it"
      onNext={() => setState((s) => ({ tabTips: { ...s.tabTips, [k]: true } }))}
    />
  );
}
