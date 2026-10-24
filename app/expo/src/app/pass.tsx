import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircleIcon, LightningIcon, ShoppingBagIcon, WarningCircleIcon } from '../ui/ph';
import { useState } from 'react';
import { Animated, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLabel } from '../../modules/tm-native';
import { knownApp, passesToday, recentShieldedApp, startPass } from '../lib/core';
import { getState, type PassReason } from '../lib/store';
import { Chip, CircleButton, OptionCard, toast } from '../ui/components';
import { Enter, useEntered, useFootPad } from '../ui/flow/kit';
import { IconLock, IconMinus, IconPlus, IconX } from '../ui/icons';
import { TearTicket } from '../ui/TearTicket';
import { color, font, type } from '../ui/theme';
import { useDragToClose } from '../ui/useDragToClose';

const REASONS: { id: PassReason; label: string }[] = [
  { id: 'specific', label: 'I need something specific' },
  { id: 'browsing', label: 'Just browsing' },
  { id: 'unsure', label: 'Not sure yet' },
];

// .field px-4 py-3 text-[17px] font-semibold
const fieldStyle = {
  backgroundColor: color.field,
  borderColor: color.fieldBorder,
  borderWidth: 1.5,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontFamily: font.bodySemi,
  fontSize: 17,
  color: color.text,
};

/** Start a Shopping Pass (V.pass, P:L1525): why, what and a limit, how long, then tear the ticket. */
export default function Pass() {
  const footPad = useFootPad();
  const entered = useEntered();
  const params = useLocalSearchParams<{ app?: string; fromRoom?: string; need?: string; limit?: string }>();
  const app = params.app ?? 'your shop apps';
  // Kept after the wait: on purpose, so no pause and no third-pass wait (prototype fromRoom).
  const fromRoom = params.fromRoom === '1';
  // Apple's own label for the app, when iOS hasn't told us its name.
  const appKey = useState(() => recentShieldedApp()?.key ?? null)[0];
  const { passPresets, defaultPassMinutes } = getState().settings;
  const named = knownApp(app);

  const [reason, setReason] = useState<PassReason>('specific');
  const [need, setNeed] = useState(fromRoom ? (params.need ?? '') : '');
  const [limit, setLimit] = useState(fromRoom ? (params.limit ?? '') : '');
  const [minutes, setMinutes] = useState(defaultPassMinutes);
  const [custom, setCustom] = useState(!passPresets.includes(defaultPassMinutes));
  // A third pass in a day isn't blocked, it just asks for 10 more seconds.
  const [waitSeconds] = useState(!fromRoom && passesToday() >= 2 ? 10 : 0);
  const passNumber = passesToday() + 1;

  const setCustomMinutes = (m: number) => setMinutes(Math.min(120, Math.max(1, m)));

  /** Back to where you came from (Today, or the waiting room), closing the sheet. */
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fromRoom ? '/waiting' : '/');
  };

  const onTear = async () => {
    await startPass({
      app,
      reason,
      need: reason === 'specific' ? need : '',
      limit: reason === 'specific' ? limit : '',
      minutes,
      fromRoom: fromRoom || undefined,
    });
    close();
    setTimeout(() => toast(named ? `${app} unlocked for ${minutes} min` : `Unlocked for ${minutes} min`), 400);
  };

  // A sheet you can drag down from anywhere: it follows your finger and closes past ~110 pt.
  const insets = useSafeAreaInsets();
  const { drag, handlers, onScroll } = useDragToClose(close);
  const dim = drag.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(4,5,22,0.62)', opacity: dim }}>
        <Pressable style={{ flex: 1 }} onPress={close} accessibilityRole="button" accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View
        {...handlers}
        style={{
          flex: 1,
          marginTop: insets.top + 10,
          backgroundColor: color.night,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1.5,
          borderColor: '#2E3374',
          overflow: 'hidden',
          transform: [{ translateY: drag }],
        }}
      >
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {/* Drag down anywhere to close (same as Cancel) */}
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#3A3F86', marginTop: 8 }} />
          <View
            style={{ paddingTop: 10, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <CircleButton label="Cancel" onPress={close}>
              <IconX />
            </CircleButton>
            <Chip tone="sun" size={13} icon={<LightningIcon size={15} color={color.sunText} weight="bold" />} label="XP when you check in" />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            onScroll={onScroll}
            scrollEventThrottle={32}
          >
            <Enter style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                {appKey ? (
                  <AppLabel appKey={appKey} mode="icon" size={24} align="center" style={{ width: 36, height: 36 }} />
                ) : named ? (
                  <Text style={{ fontFamily: font.display, fontSize: 20, color: color.inkOnBright }}>{app.charAt(0).toUpperCase()}</Text>
                ) : (
                  <ShoppingBagIcon size={24} color={color.blue} weight="bold" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {named || !appKey ? (
                  <Text style={type.title}>{named ? app : 'Your shop apps'}</Text>
                ) : (
                  <AppLabel appKey={appKey} mode="title" size={16.5} color="#F3F2FF" style={{ height: 22 }} />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <IconLock size={14} />
                  <Text style={type.small}>Locked by Till Morning</Text>
                </View>
              </View>
            </Enter>

            {fromRoom && (
              <Enter
                style={{
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 6,
                  backgroundColor: '#173A3A',
                  borderColor: '#2F7A66',
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <View style={{ marginTop: 2 }}>
                  <CheckCircleIcon size={16} color={color.mint} weight="fill" />
                </View>
                <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 15, lineHeight: 21, color: color.mint }}>
                  You waited, so this one’s on purpose. No pause this time.
                </Text>
              </Enter>
            )}

            <Enter d={70}>
              <Text accessibilityRole="header" style={[type.h1, { marginTop: 20 }]}>
                Why are you shopping?
              </Text>
            </Enter>
            <View style={{ gap: 10, marginTop: 16 }} accessibilityRole="radiogroup" accessibilityLabel="Why are you shopping?">
              {REASONS.map((r, i) => (
                <Enter key={r.id} d={130 + i * 60}>
                  <OptionCard tone="violet" radio="left" paddingVertical={14} label={r.label} selected={reason === r.id} onPress={() => setReason(r.id)} />
                </Enter>
              ))}
            </View>

            {reason === 'specific' ? (
              <Enter d={320} after={entered} style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.label, { marginBottom: 6 }]}>What do you need?</Text>
                  <TextInput
                    value={need}
                    onChangeText={setNeed}
                    maxLength={40}
                    autoCorrect={false}
                    accessibilityLabel="What do you need?"
                    placeholder="e.g. phone charger"
                    placeholderTextColor={color.placeholder}
                    style={fieldStyle}
                  />
                </View>
                <View style={{ width: 96 }}>
                  <Text style={[type.label, { marginBottom: 6 }]}>Limit (£)</Text>
                  <TextInput
                    value={limit}
                    onChangeText={(t) => setLimit(t.replace(/[^0-9.]/g, ''))}
                    maxLength={6}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Limit in pounds"
                    placeholder="15"
                    placeholderTextColor={color.placeholder}
                    style={fieldStyle}
                  />
                </View>
              </Enter>
            ) : (
              <Enter
                d={320}
                after={entered}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'flex-start',
                  marginTop: 16,
                  backgroundColor: 'rgba(255,143,120,0.12)',
                  borderColor: 'rgba(255,143,120,0.32)',
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <WarningCircleIcon size={24} color="#FF9F8A" weight="bold" />
                <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20.6, color: '#FFE4DC' }}>
                  Browsing is where most impulse buys start. Still want in?
                </Text>
              </Enter>
            )}

            <Enter d={380}>
              <Text style={[type.label, { marginTop: 20, marginBottom: 8 }]}>How long?</Text>
            </Enter>
            <View style={{ flexDirection: 'row', gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel="How long?">
              {passPresets.map((m, i) => (
                <Enter key={i} pop d={420 + i * 60} style={{ flex: 1 }}>
                  <TimeTile
                    label={`${m} minutes`}
                    selected={!custom && minutes === m}
                    onPress={() => {
                      setCustom(false);
                      setMinutes(m);
                    }}
                  >
                    {(on) => (
                      <>
                        <Text style={[type.num, { fontSize: 22, lineHeight: 22, color: '#FFFFFF' }]}>{m}</Text>
                        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, lineHeight: 18, color: on ? '#FFFFFF' : color.text }}>min</Text>
                      </>
                    )}
                  </TimeTile>
                </Enter>
              ))}
              <Enter pop d={420 + passPresets.length * 60} style={{ flex: 1 }}>
                <TimeTile label="Custom length" selected={custom} onPress={() => setCustom(true)}>
                  {(on) =>
                    custom ? (
                      <>
                        <Text style={[type.num, { fontSize: 22, lineHeight: 22, color: '#FFFFFF' }]}>{minutes}</Text>
                        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, lineHeight: 18, color: on ? '#FFFFFF' : color.text }}>min</Text>
                      </>
                    ) : (
                      <>
                        <View style={{ height: 22, justifyContent: 'center' }}>
                          <IconPlus size={21} />
                        </View>
                        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, lineHeight: 18, color: color.text }}>Custom</Text>
                      </>
                    )
                  }
                </TimeTile>
              </Enter>
            </View>

            {custom && (
              <Enter pop now style={{ alignItems: 'center', marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <CircleButton size={48} label="5 minutes less" onPress={() => setCustomMinutes(minutes - 5)}>
                    <IconMinus size={20} />
                  </CircleButton>
                  <View style={{ width: 128, justifyContent: 'center' }}>
                    <TextInput
                      value={String(minutes)}
                      onChangeText={(t) => setCustomMinutes(parseInt(t.replace(/\D/g, '') || '1', 10))}
                      keyboardType="number-pad"
                      maxLength={3}
                      accessibilityLabel="Custom length in minutes"
                      style={{
                        backgroundColor: color.field,
                        borderColor: color.fieldBorder,
                        borderWidth: 1.5,
                        borderRadius: 16,
                        paddingVertical: 10,
                        paddingLeft: 16,
                        paddingRight: 48,
                        textAlign: 'center',
                        fontFamily: font.display,
                        fontSize: 28,
                        color: color.text,
                        fontVariant: ['tabular-nums'],
                      }}
                    />
                    <Text pointerEvents="none" style={[type.small, { position: 'absolute', right: 16 }]}>
                      min
                    </Text>
                  </View>
                  <CircleButton size={48} label="5 minutes more" onPress={() => setCustomMinutes(minutes + 5)}>
                    <IconPlus size={20} />
                  </CircleButton>
                </View>
                <Text style={[type.small, { marginTop: 8, textAlign: 'center' }]}>Any length from 1 to 120 minutes</Text>
              </Enter>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: footPad }}>
            <TearTicket minutes={minutes} app={app} appKey={appKey} waitSeconds={waitSeconds} onTear={onTear} />
            {waitSeconds > 0 ? (
              <Text style={{ fontFamily: font.bodyBold, fontSize: 14, lineHeight: 19.6, color: color.coralText, textAlign: 'center', marginTop: 12 }}>
                This is pass {passNumber} today, so today won’t get a stamp. Take 10 more seconds to be sure.
              </Text>
            ) : (
              <Text style={[type.small, { textAlign: 'center', marginTop: 12 }]}>
                Check in afterwards: +10 XP for an honest answer. {named ? app : 'The app'} locks again when time’s up.
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

/** .opt.time (P:L169): a preset length; violet with a white "min" when chosen. */
function TimeTile({
  selected,
  onPress,
  label,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  children: (on: boolean) => React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected }}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: 20,
            backgroundColor: selected ? color.violetDeep : color.cardEdge,
            paddingBottom: pressed ? 1 : 3,
            marginTop: pressed ? 2 : 0,
          }}
        >
          <View
            style={{
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: selected ? color.violet : color.cardEdge,
              backgroundColor: selected ? color.violet : color.card,
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            {children(selected)}
          </View>
        </View>
      )}
    </Pressable>
  );
}
