import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AppLabel } from '../../modules/tm-native';
import { knownApp, parkWant, recentShieldedApp, startPass } from '../lib/core';
import { Button, Chip, CircleButton, toast } from '../ui/components';
import { CountRing } from '../ui/flow/CountRing';
import { Enter, NlSky, useFootPad, useHeadPad } from '../ui/flow/kit';
import { IconMoon, IconX } from '../ui/icons';
import { color, font, type } from '../ui/theme';

// Urgent means urgent: a short beat to be sure, not a full minute.
const WAIT = 15;

/** Night lock's "It's urgent" door (V.urgent, P:L1477): a minute's wait and a reason, then 10 minutes. */
export default function Urgent() {
  const headPad = useHeadPad();
  const footPad = useFootPad();
  const params = useLocalSearchParams<{ app?: string }>();
  const { app, key } = useMemo(() => {
    if (params.app) return { app: params.app, key: null as string | null };
    const recent = recentShieldedApp();
    return { app: recent?.name ?? 'your shop apps', key: recent?.key ?? null };
  }, [params.app]);
  const named = knownApp(app);

  const [startedAt] = useState(Date.now);
  // Only the ring counts down; the screen re-renders when the wait is up and as you type.
  const [done, setDone] = useState(false);
  const onDone = useCallback(() => setDone(true), []);
  const [why, setWhy] = useState('');
  const ok = done && why.trim().length > 1;

  const open = async () => {
    await startPass({ app, reason: 'specific', need: why.trim(), limit: '', minutes: 10, urgent: true });
    router.replace('/');
    setTimeout(() => toast(named ? `${app} is open for 10 minutes` : 'Open for 10 minutes'), 400);
  };

  const park = () => {
    const w = parkWant(app, '', 'unsure', key);
    router.replace('/');
    setTimeout(() => toast(`Parked till ${new Date(w.readyAt).getHours() === 8 ? '08:00' : 'later'}`), 400);
  };

  return (
    <View style={{ flex: 1 }}>
      <NlSky />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={{ paddingTop: headPad, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleButton onDark label="Close and park it till morning" onPress={park}>
            <IconX color="#FFFFFF" />
          </CircleButton>
          <Chip tone="glass" size={13} icon={<IconMoon size={15} color="#FFFFFF" />} label={named ? `Night lock · ${app}` : 'Night lock'} />
          <View style={{ flex: 1 }} />
          {/* The app this opens, in Apple's own icon, so you know what you're unlocking. */}
          {key ? (
            <View
              accessibilityLabel="The app you're opening"
              style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            >
              <AppLabel appKey={key} mode="icon" size={28} iconScale={1.4} align="center" style={{ width: 44, height: 44 }} />
            </View>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 12, alignItems: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ marginTop: 16 }}>
            <CountRing total={WAIT} startedAt={startedAt} onDone={onDone} />
          </View>
          <Enter d={60}>
            <Text accessibilityRole="header" style={[type.h1, { textAlign: 'center', marginTop: 20 }]}>
              Is it really urgent?
            </Text>
          </Enter>
          <Enter d={120}>
            <Text style={[type.body, { color: color.white82, textAlign: 'center', marginTop: 8 }]}>
              Take 15 seconds. If it still is, say why and {named ? app : 'the app'} opens for 10 minutes.
            </Text>
          </Enter>
          <Enter d={180} style={{ alignSelf: 'stretch', marginTop: 20 }}>
            <Text style={[type.label, { marginBottom: 6 }]}>What’s it for?</Text>
            <TextInput
              value={why}
              onChangeText={setWhy}
              maxLength={60}
              autoComplete="off"
              accessibilityLabel="What’s it for?"
              placeholder="e.g. dinner for the kids"
              placeholderTextColor={color.placeholder}
              style={{
                backgroundColor: color.field,
                borderColor: color.fieldBorder,
                borderWidth: 1.5,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: font.bodySemi,
                fontSize: 17,
                color: color.text,
              }}
            />
          </Enter>
        </ScrollView>

        <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad, gap: 8 }}>
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(243,242,255,0.75)', textAlign: 'center' }}>
            {!done ? 'Take 15 seconds. Then say why.' : ok ? 'Fine. It opens for 10 minutes, then locks again.' : 'Now say why, in a few words.'}
          </Text>
          <Button variant="white" label={named ? `Open ${app}` : 'Open the app'} disabled={!ok} onPress={open} />
          <Pressable onPress={park} accessibilityRole="button" style={({ pressed }) => ({ paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: 'rgba(243,242,255,0.8)', textAlign: 'center' }}>Never mind, park it till morning</Text>
          </Pressable>
          <Text style={[type.small, { color: color.white82, textAlign: 'center' }]}>No XP either way, and no judgement.</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
