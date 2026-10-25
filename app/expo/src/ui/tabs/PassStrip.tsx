import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AppLabel } from '../../../modules/tm-native';
import { knownApp } from '../../lib/core';
import { useAppState } from '../../lib/store';
import { CaretRightIcon, TicketIcon } from '../ph';
import { font } from '../theme';
import { Pressable } from '../Pressable';

const mmss = (ms: number) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * While a Shopping Pass runs, a slim strip docks above the tab bar on every tab (like Opal's
 * session strip): what it's for, the time left and a progress line. Tap it to see the pass on Today.
 */
export function PassStrip() {
  const pass = useAppState((s) => s.pass);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!pass) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pass]);
  if (!pass || pass.endsAt <= now) return null;

  const left = pass.endsAt - now;
  const frac = Math.max(0, Math.min(1, left / (pass.endsAt - pass.startedAt)));
  const named = !pass.wholeSelection && knownApp(pass.app);
  return (
    <Pressable
      onPress={() => router.navigate('/')}
      accessibilityRole="button"
      accessibilityLabel={`${pass.urgent ? 'Urgent pass' : 'Shopping pass'}, ${mmss(left)} left. Open Today`}
      style={{ marginHorizontal: 20, marginTop: 6 }}
    >
      <View style={{ borderRadius: 18, backgroundColor: '#4B2BB0', paddingBottom: 2 }}>
        <LinearGradient
          colors={['#7E3FF2', '#B455F0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.6 }}
          style={{ borderRadius: 18, overflow: 'hidden', paddingHorizontal: 14, height: 46, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <TicketIcon size={18} weight="bold" color="#FFFFFF" />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {!named && pass.key && !pass.wholeSelection ? (
              <AppLabel appKey={pass.key} mode="title" size={14} color="#FFFFFF" style={{ height: 20, flex: 1 }} />
            ) : (
              <Text numberOfLines={1} style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: '#FFFFFF', flexShrink: 1 }}>
                {pass.urgent ? 'Urgent pass' : named ? `${pass.app} pass` : 'Shopping pass'}
              </Text>
            )}
          </View>
          <Text style={{ fontFamily: font.display, fontSize: 18, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>{mmss(left)}</Text>
          <CaretRightIcon size={14} weight="bold" color="rgba(255,255,255,0.8)" />
          <View style={{ position: 'absolute', left: 0, bottom: 0, height: 3, width: `${frac * 100}%`, backgroundColor: 'rgba(255,255,255,0.75)' }} />
        </LinearGradient>
      </View>
    </Pressable>
  );
}
