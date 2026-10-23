import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parkWant, recentShieldedApp, startPass } from '../lib/core';
import { BreathRing } from '../ui/BreathRing';
import { PauseBackground } from '../ui/backgrounds';
import { Button, Chip, TextLink, toast } from '../ui/components';
import { IconMoon } from '../ui/icons';
import { color, font, type } from '../ui/theme';

const WAIT = 60;

/** Night lock's "It's urgent" door (V.urgent, L1477): a minute's wait and a reason, then 10 minutes. */
export default function Urgent() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ app?: string }>();
  const { app, key } = useMemo(() => {
    if (params.app) return { app: params.app, key: null as string | null };
    const recent = recentShieldedApp();
    return { app: recent?.name ?? 'your shop apps', key: recent?.key ?? null };
  }, [params.app]);

  const startedAt = useRef(Date.now()).current;
  const [left, setLeft] = useState(WAIT);
  const [why, setWhy] = useState('');
  const done = left <= 0;

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, WAIT - (Date.now() - startedAt) / 1000);
      setLeft(l);
      if (l <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [startedAt]);

  const open = async () => {
    await startPass({ app, reason: 'specific', need: why.trim(), limit: '', minutes: 10, urgent: true });
    router.replace('/');
    setTimeout(() => toast(`${app} is open for 10 minutes`), 400);
  };

  const park = () => {
    const w = parkWant(app, '', 'unsure', key);
    router.replace('/');
    setTimeout(() => toast(`Parked till ${new Date(w.readyAt).getHours() === 8 ? '08:00' : 'later'}`), 400);
  };

  return (
    <View style={{ flex: 1 }}>
      <PauseBackground />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 12, paddingHorizontal: 28, alignItems: 'center', paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
          <Chip tone="glass" size={13} icon={<IconMoon size={14} color="#FFFFFF" />} label={`Night lock · ${app}`} />
          <View style={{ marginTop: 16 }}>
            <BreathRing total={WAIT} left={left} done={done} size={200} />
          </View>
          <Text style={[type.h1, { color: '#FFFFFF', textAlign: 'center', marginTop: 16 }]}>Is it really urgent?</Text>
          <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 6 }]}>
            Wait one minute. If it still is, say why and {app} opens for 10 minutes.
          </Text>

          <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
            <Text style={{ fontFamily: font.bodyHeavy, fontSize: 13.5, color: 'rgba(255,255,255,0.82)' }}>What’s it for?</Text>
            <TextInput
              value={why}
              onChangeText={setWhy}
              maxLength={60}
              placeholder="e.g. medicine for the baby"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={{
                marginTop: 6,
                backgroundColor: 'rgba(13,15,46,0.35)',
                borderColor: 'rgba(255,255,255,0.3)',
                borderWidth: 1.5,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontFamily: font.bodySemi,
                fontSize: 16.5,
                color: '#FFFFFF',
              }}
            />
          </View>

          <View style={{ flex: 1, minHeight: 20 }} />
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            <Button variant="white" label={done ? `Open ${app}` : `Wait ${Math.ceil(left)}s`} disabled={!done || why.trim().length < 2} onPress={open} />
            <TextLink label="Never mind, park it till morning" style={{ color: '#FFFFFF' }} onPress={park} />
            <Text style={[type.small, { color: 'rgba(255,255,255,0.7)', textAlign: 'center' }]}>No XP either way, and no judgement.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
