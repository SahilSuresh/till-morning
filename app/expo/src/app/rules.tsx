import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BAND_LABEL, formatDuration, formatReady, syncShields, TAKEAWAYS_ID, waitFor } from '../lib/core';
import { CHALLENGES, challengeDay, DAY_NAMES, dow, risky, SCHEDULE_LABEL } from '../lib/rules';
import { type AppState, type ChallengeKey, type PriceBand, setState, useAppState } from '../lib/store';
import { Button, Card, Chip, CircleButton, OptionCard, Rise, Tag, toast } from '../ui/components';
import { IconCaret, IconChevrons, IconMinus, IconPlus } from '../ui/icons';
import { color, font, gradient, type } from '../ui/theme';
import { Pressable } from '../ui/Pressable';

const Divider = () => <View style={{ height: 1.5, backgroundColor: color.divider, marginVertical: 4 }} />;
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BANDS: PriceBand[] = ['unsure', 'under20', '20to50', '50to100', 'over100'];

/** planTab() from the prototype: "Your rules / Set them while you're calm." */
const field = {
  backgroundColor: color.field,
  borderColor: color.fieldBorder,
  borderWidth: 1.5,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontFamily: font.bodySemi,
  fontSize: 16,
  color: color.text,
};

export default function Rules() {
  const buddy = useAppState((x) => x.buddy);
  const insets = useSafeAreaInsets();
  const s = useAppState((x) => x);
  const st = s.settings;
  const [picking, setPicking] = useState(false);
  const [pickTakeaways, setPickTakeaways] = useState(false);
  const [more, setMore] = useState(false);
  const [tryBand, setTryBand] = useState<PriceBand>('50to100');
  const ch = CHALLENGES[st.challenge];
  const day = Math.min(challengeDay(), ch.len);

  const set = (patch: Partial<AppState['settings']>, resync = false) => {
    setState((x) => ({ settings: { ...x.settings, ...patch } }));
    if (resync) syncShields();
  };

  const pickChallenge = (k: ChallengeKey) => {
    set({ challenge: k, challengeAt: Date.now() }, true);
    setPicking(false);
    toast(k === 'none' ? 'No challenge. The waiting room still works.' : `${CHALLENGES[k].name} starts today`);
  };

  const toggleTreat = (d: number) => {
    const on = st.treats.includes(d);
    set({ treats: on ? st.treats.filter((x) => x !== d) : [...st.treats, d].sort() }, true);
    toast(on ? `${DAY_NAMES[d]} is a normal night again` : `${DAY_NAMES[d]} is a treat night`);
  };

  const tried = waitFor(tryBand);

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: insets.bottom + 32, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleButton label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevrons size={16} />
            </View>
          </CircleButton>
          <View>
            <Text style={type.h1}>Your rules</Text>
            <Text style={type.small}>Set them while you’re calm.</Text>
          </View>
        </View>

        {/* Your challenge */}
        <Rise>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={type.label}>Your challenge</Text>
              <Pressable onPress={() => setPicking((v) => !v)} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.blueLight }}>{picking ? 'Done' : 'Change'}</Text>
              </Pressable>
            </View>
            <Text style={[type.h2, { marginTop: 6 }]}>{ch.name}</Text>
            <Text style={type.small}>{ch.sub}</Text>
            {ch.len > 0 && (
              <>
                <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 12, overflow: 'hidden' }}>
                  <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: `${(day / ch.len) * 100}%` }} />
                </View>
                <Text style={[type.small, { marginTop: 6 }]}>
                  Day {day} of {ch.len}
                </Text>
              </>
            )}
            {picking && (
              <View style={{ gap: 10, marginTop: 14 }}>
                {(Object.keys(CHALLENGES) as ChallengeKey[]).map((k) => (
                  <OptionCard key={k} label={CHALLENGES[k].name} sub={CHALLENGES[k].sub} selected={st.challenge === k} onPress={() => pickChallenge(k)} />
                ))}
              </View>
            )}
          </Card>
        </Rise>

        {/* Treat nights */}
        <Rise delay={40}>
          <Card>
            <Text style={type.h2}>Treat nights</Text>
            <Text style={[type.small, { marginTop: 2 }]}>Takeaway apps open with a hello, not a pause.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
              {DAY_LETTERS.map((l, d) => {
                const on = st.treats.includes(d);
                const today = d === dow();
                return (
                  <Pressable
                    key={d}
                    onPress={() => toggleTreat(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`${DAY_NAMES[d]}${on ? ', treat night' : ''}`}
                    accessibilityState={{ selected: on }}
                    style={{ alignItems: 'center', gap: 4 }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: on ? color.violet : 'rgba(255,255,255,0.06)',
                        borderWidth: today ? 2 : 0,
                        borderColor: color.blueLight,
                      }}
                    >
                      <Text style={{ fontFamily: font.display, fontSize: 15, color: '#FFFFFF' }}>{l}</Text>
                    </View>
                    <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, color: on ? '#CDBDFF' : 'transparent' }}>Treat</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ marginTop: 12 }}>
              {s.takeawaysChosen ? (
                <Pressable onPress={() => setPickTakeaways(true)} accessibilityRole="button">
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 14.5, color: color.blueLight }}>Change your takeaway apps</Text>
                </Pressable>
              ) : (
                <>
                  <Text style={[type.small, { marginBottom: 10 }]}>Pick which apps count as takeaways, so only they open on treat nights.</Text>
                  <Button variant="secondary" label="Choose takeaway apps" onPress={() => setPickTakeaways(true)} />
                </>
              )}
            </View>
          </Card>
        </Rise>

        {/* How long wants wait */}
        <Rise delay={80}>
          <Card>
            <Text style={type.h2}>How long wants wait</Text>
            <Text style={[type.small, { marginTop: 2 }]}>
              The more it costs, the longer it waits, and it’s never ready at night. No price? It waits till 08:00.
            </Text>
            <Text style={[type.label, { marginTop: 14 }]}>Try a price</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {BANDS.map((b) => (
                <Tag key={b} label={BAND_LABEL[b]} selected={tryBand === b} onPress={() => setTryBand(b)} />
              ))}
            </View>
            <View style={{ marginTop: 12, backgroundColor: '#1C2057', borderRadius: 18, padding: 14 }}>
              <Text style={{ fontFamily: font.display, fontSize: 22, color: color.blueLight }}>It waits {formatDuration(tried.readyAt - Date.now())}</Text>
              <Text style={type.small}>Ready {formatReady(tried.readyAt)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {tried.chips.map((c) => (
                  <Chip key={c} tone="lilac" label={c} />
                ))}
              </View>
            </View>
          </Card>
        </Rise>

        {/* When to shield */}
        <Rise delay={120}>
          <Card>
            <Text style={type.h2}>When to shield</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {(Object.keys(SCHEDULE_LABEL) as AppState['settings']['schedule'][]).map((k) => (
                <Tag
                  key={k}
                  large
                  label={SCHEDULE_LABEL[k]}
                  selected={st.schedule === k}
                  onPress={() => {
                    set({ schedule: k }, true);
                    toast(k === 'all' ? 'Shields up all day' : k === 'evenings' ? 'Shields up from 6 pm to 6 am' : 'Shields up at weekends');
                  }}
                />
              ))}
            </View>
          </Card>
        </Rise>

        {/* More rules */}
        <Rise delay={160}>
          <Card style={{ paddingVertical: 4 }}>
            <Pressable onPress={() => setMore((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: more }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={type.title}>More rules</Text>
                <Text style={type.small}>Late nights, sales and hours of work</Text>
              </View>
              <View style={{ transform: [{ rotate: more ? '90deg' : '0deg' }] }}>
                <IconCaret />
              </View>
            </Pressable>
            {more && (
              <>
                <Divider />
                <View style={{ paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>Late nights</Text>
                    <Text style={type.small}>Pauses get longer from 22:00, at least 45 seconds.</Text>
                  </View>
                  {risky() && <Chip tone="peach" label="Now" />}
                </View>
                <Divider />
                <View style={{ paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>Sale seasons</Text>
                    <Text style={type.small}>Waits double in Black Friday week and other big sales.</Text>
                  </View>
                  <Switch
                    value={st.sale}
                    onValueChange={(v) => {
                      set({ sale: v });
                      toast(v ? 'Sale week: waits doubled, pauses longer' : 'Sale week is over');
                    }}
                    trackColor={{ true: color.blue, false: '#2B2F69' }}
                    ios_backgroundColor="#2B2F69"
                  />
                </View>
                <Divider />
                <View style={{ paddingVertical: 12 }}>
                  <Text style={type.title}>Prices as hours of work</Text>
                  <Text style={type.small}>Your take-home pay per hour</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 }}>
                    <Stepper label="£1 less" onPress={() => set({ wage: Math.max(5, st.wage - 1) })}>
                      <IconMinus />
                    </Stepper>
                    <Text style={{ fontFamily: font.display, fontSize: 24, color: color.text, minWidth: 64, textAlign: 'center' }}>£{st.wage}</Text>
                    <Stepper label="£1 more" onPress={() => set({ wage: Math.min(60, st.wage + 1) })}>
                      <IconPlus />
                    </Stepper>
                  </View>
                </View>
                <Divider />
                <View style={{ paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>Ask a friend</Text>
                    <Text style={type.small}>Text a friend to let something over £50 skip the wait. Sends one message, from you.</Text>
                  </View>
                  <Switch
                    value={buddy.on}
                    accessibilityLabel="Ask a friend"
                    onValueChange={(v) => {
                      setState((x) => ({ buddy: { ...x.buddy, on: v } }));
                      toast(v ? `${buddy.name.trim() || 'Your friend'} is your spending buddy` : 'Spending buddy off');
                    }}
                    trackColor={{ true: color.blue, false: '#2B2F69' }}
                    ios_backgroundColor="#2B2F69"
                  />
                </View>
                {buddy.on && (
                  <View style={{ gap: 8, paddingBottom: 12 }}>
                    <TextInput
                      value={buddy.name}
                      onChangeText={(t) => setState((x) => ({ buddy: { ...x.buddy, name: t } }))}
                      maxLength={20}
                      placeholder="Their first name, e.g. Sam"
                      placeholderTextColor={color.placeholder}
                      accessibilityLabel="Your friend's first name"
                      style={field}
                    />
                    <TextInput
                      value={buddy.phone}
                      onChangeText={(t) => setState((x) => ({ buddy: { ...x.buddy, phone: t.replace(/[^0-9+ ]/g, '') } }))}
                      maxLength={20}
                      keyboardType="phone-pad"
                      placeholder="Their number (optional)"
                      placeholderTextColor={color.placeholder}
                      accessibilityLabel="Your friend's phone number, optional"
                      style={field}
                    />
                    <Text style={type.small}>Stays on this phone. Messages opens with the text ready; you press send.</Text>
                  </View>
                )}
              </>
            )}
          </Card>
        </Rise>
      </ScrollView>

      {pickTakeaways && (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={TAKEAWAYS_ID}
          includeEntireCategory
          headerText="Your takeaway apps"
          footerText="On treat nights these open with no pause."
          style={{ width: 1, height: 1, position: 'absolute' }}
          onDismissRequest={() => {
            // Wait for the picker to save before closing it (it saves just after "Done").
            setTimeout(() => {
              setPickTakeaways(false);
              setState({ takeawaysChosen: true });
              syncShields();
            }, 450);
          }}
        />
      )}
    </View>
  );
}

function Stepper({ onPress, children, label }: { onPress: () => void; children: React.ReactNode; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E2256', borderWidth: 1.5, borderColor: '#343A86', alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </Pressable>
  );
}
