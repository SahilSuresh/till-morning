import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLabel } from '../../modules/tm-native';
import { knownApp, passesToday, recentShieldedApp, startPass } from '../lib/core';
import { getState, type PassReason } from '../lib/store';
import { Chip, CircleButton, OptionCard, toast } from '../ui/components';
import { IconCheck, IconLock, IconMinus, IconPlus, IconWarn, IconX } from '../ui/icons';
import { TearTicket } from '../ui/TearTicket';
import { color, font, type } from '../ui/theme';

const REASONS: { id: PassReason; label: string }[] = [
  { id: 'specific', label: 'I need something specific' },
  { id: 'browsing', label: 'Just browsing' },
  { id: 'unsure', label: 'Not sure yet' },
];

const fieldStyle = {
  backgroundColor: color.field,
  borderColor: color.fieldBorder,
  borderWidth: 1.5,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontFamily: font.bodySemi,
  fontSize: 16.5,
  color: color.text,
};

export default function Pass() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ app?: string; fromRoom?: string; need?: string; limit?: string }>();
  const app = params.app ?? 'your shop apps';
  // Kept after the wait: on purpose, so no pause and no third-pass wait (prototype fromRoom).
  const fromRoom = params.fromRoom === '1';
  // Apple's own label for the app, when iOS hasn't told us its name.
  const appKey = useState(() => recentShieldedApp()?.key ?? null)[0];
  const { passPresets, defaultPassMinutes } = getState().settings;

  const [reason, setReason] = useState<PassReason>('specific');
  const [need, setNeed] = useState(fromRoom ? (params.need ?? '') : '');
  const [limit, setLimit] = useState(fromRoom ? (params.limit ?? '') : '');
  const [minutes, setMinutes] = useState(defaultPassMinutes);
  const [custom, setCustom] = useState(!passPresets.includes(defaultPassMinutes));
  // A third pass in a day isn't blocked, it just asks for 10 more seconds.
  const [waitSeconds] = useState(!fromRoom && passesToday() >= 2 ? 10 : 0);
  const passNumber = passesToday() + 1;

  const setCustomMinutes = (m: number) => setMinutes(Math.min(120, Math.max(1, m)));

  const onTear = async () => {
    await startPass({ app, reason, need: reason === 'specific' ? need : '', limit: reason === 'specific' ? limit : '', minutes, fromRoom: fromRoom || undefined });
    router.replace('/');
    setTimeout(() => toast(knownApp(app) ? `${app} unlocked for ${minutes} min` : `Unlocked for ${minutes} min`), 400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CircleButton label="Cancel" onPress={() => router.replace(fromRoom ? '/waiting' : '/')}>
              <IconX />
            </CircleButton>
            <Chip tone="sun" label="XP when you check in" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: font.display, fontSize: 20, color: color.inkOnBright }}>{app.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              {knownApp(app) || !appKey ? (
                <Text style={type.title}>{knownApp(app) ? app : 'Your shop apps'}</Text>
              ) : (
                <AppLabel appKey={appKey} mode="title" size={17} color="#F3F2FF" style={{ height: 24, width: 220 }} />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <IconLock size={13} />
                <Text style={type.small}>Locked by Till Morning</Text>
              </View>
            </View>
          </View>

          {fromRoom && (
            <View
              style={{
                marginTop: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: 'rgba(94,233,181,0.12)',
                borderColor: 'rgba(94,233,181,0.35)',
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <IconCheck size={18} color="#6EF0BF" />
              <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: '#D6FFF0' }}>
                You waited, so this one’s on purpose. No pause this time.
              </Text>
            </View>
          )}

          <Text style={[type.h1, { marginTop: 24 }]}>Why are you shopping?</Text>
          <View style={{ gap: 10, marginTop: 14 }}>
            {REASONS.map((r) => (
              <OptionCard key={r.id} tone="violet" label={r.label} selected={reason === r.id} onPress={() => setReason(r.id)} />
            ))}
          </View>

          {reason === 'specific' ? (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={type.label}>What do you need?</Text>
                <TextInput
                  value={need}
                  onChangeText={setNeed}
                  maxLength={40}
                  placeholder="e.g. phone charger"
                  placeholderTextColor={color.placeholder}
                  style={[fieldStyle, { marginTop: 6 }]}
                />
              </View>
              <View style={{ width: 96 }}>
                <Text style={type.label}>Limit (£)</Text>
                <TextInput
                  value={limit}
                  onChangeText={(t) => setLimit(t.replace(/[^0-9.]/g, ''))}
                  maxLength={6}
                  keyboardType="decimal-pad"
                  placeholder="15"
                  placeholderTextColor={color.placeholder}
                  style={[fieldStyle, { marginTop: 6 }]}
                />
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                marginTop: 16,
                backgroundColor: 'rgba(255,143,120,0.12)',
                borderColor: 'rgba(255,143,120,0.32)',
                borderWidth: 1.5,
                borderRadius: 16,
                padding: 14,
              }}
            >
              <IconWarn />
              <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: '#FFE4DC' }}>
                Browsing is where most impulse buys start. Still want in?
              </Text>
            </View>
          )}

          <Text style={[type.label, { marginTop: 22 }]}>How long?</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {passPresets.map((m) => (
              <TimeTile
                key={m}
                selected={!custom && minutes === m}
                onPress={() => {
                  setCustom(false);
                  setMinutes(m);
                }}
              >
                <Text style={{ fontFamily: font.display, fontSize: 22, color: '#FFFFFF' }}>{m}</Text>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.text2 }}>min</Text>
              </TimeTile>
            ))}
            <TimeTile selected={custom} onPress={() => setCustom(true)}>
              {custom ? (
                <Text style={{ fontFamily: font.display, fontSize: 22, color: '#FFFFFF' }}>{minutes}</Text>
              ) : (
                <IconPlus size={20} />
              )}
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.text2 }}>{custom ? 'min' : 'Custom'}</Text>
            </TimeTile>
          </View>

          {custom && (
            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Stepper label="5 minutes less" onPress={() => setCustomMinutes(minutes - 5)}>
                  <IconMinus />
                </Stepper>
                <View style={[fieldStyle, { width: 128, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 4 }]}>
                  <TextInput
                    value={String(minutes)}
                    onChangeText={(t) => setCustomMinutes(parseInt(t.replace(/\D/g, '') || '1', 10))}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{ fontFamily: font.display, fontSize: 28, color: color.text, padding: 0, minWidth: 40, textAlign: 'right' }}
                  />
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.text2 }}>min</Text>
                </View>
                <Stepper label="5 minutes more" onPress={() => setCustomMinutes(minutes + 5)}>
                  <IconPlus />
                </Stepper>
              </View>
              <Text style={[type.small, { marginTop: 8 }]}>Any length from 1 to 120 minutes</Text>
            </View>
          )}
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 20 }}>
          <TearTicket minutes={minutes} app={app} waitSeconds={waitSeconds} onTear={onTear} />
          {waitSeconds > 0 ? (
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.coralText, textAlign: 'center', marginTop: 12 }}>
              This is pass {passNumber} today, so today won’t get a stamp. Take 10 more seconds to be sure.
            </Text>
          ) : (
            <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>
              Check in afterwards: +10 XP for an honest answer. {app} locks again when time’s up.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function TimeTile({ selected, onPress, children }: { selected: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={{ flex: 1 }}>
      <View style={{ borderRadius: 18, backgroundColor: selected ? color.violetDeep : color.cardEdge, paddingBottom: 3 }}>
        <View
          style={{
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: selected ? color.violet : color.cardEdge,
            backgroundColor: selected ? color.violet : color.card,
            alignItems: 'center',
            paddingVertical: 12,
            minHeight: 70,
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      </View>
    </Pressable>
  );
}

function Stepper({ onPress, children, label }: { onPress: () => void; children: React.ReactNode; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E2256', borderWidth: 1.5, borderColor: '#343A86', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}
