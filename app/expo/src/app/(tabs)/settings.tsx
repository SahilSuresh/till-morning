import { router } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { type ReactNode, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { config, links } from '../../lib/config';
import { applyShieldLook, liftAllShields, protectedCount, shieldChosenApps, syncShields, turnOffTillTomorrow } from '../../lib/core';
import { sendTestEvent } from '../../lib/crashes';
import { getOfferings, isPurchasesReady, restorePurchases } from '../../lib/purchases';
import { hh } from '../../lib/rules';
import { getScreenTimeStatus } from '../../lib/screenTime';
import { type AppState, resetState, setState, useAppState } from '../../lib/store';
import { lose, xpToast } from '../../lib/xp';
import { Card, Tag, toast } from '../../ui/components';
import { IconCaret } from '../../ui/icons';
import { useTabBarSpace } from '../../ui/layout';
import { color, font, type } from '../../ui/theme';

function Row({ label, sub, onPress, right, danger }: { label: string; sub?: string; onPress?: () => void; right?: ReactNode; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.title, danger && { color: '#FF9F94' }]}>{label}</Text>
        {sub ? <Text style={[type.small, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <IconCaret /> : null)}
    </Pressable>
  );
}

const Divider = () => <View style={{ height: 1.5, backgroundColor: color.divider }} />;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.label}>{title}</Text>
      <Card style={{ paddingVertical: 4 }}>{children}</Card>
    </View>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return <Switch value={value} onValueChange={onChange} trackColor={{ true: color.blue, false: '#2B2F69' }} ios_backgroundColor="#2B2F69" />;
}

function Choice<T extends string | number>({ title, sub, options, value, onPick }: { title: string; sub?: string; options: [T, string][]; value: T; onPick: (v: T) => void }) {
  return (
    <View style={{ paddingVertical: 12, gap: 8 }}>
      <Text style={type.title}>{title}</Text>
      {sub ? <Text style={type.small}>{sub}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(([v, label]) => (
          <Tag key={String(v)} label={label} selected={value === v} onPress={() => onPick(v)} />
        ))}
      </View>
    </View>
  );
}

const fieldStyle = {
  marginTop: 8,
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

export default function Settings() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const s = useAppState((st) => st);
  const st = s.settings;
  const [more, setMore] = useState(false);
  const offTill = s.offUntil > Date.now();
  const count = protectedCount();

  const set = (patch: Partial<AppState['settings']>, resync = false) => {
    setState((x) => ({ settings: { ...x.settings, ...patch } }));
    if (resync) syncShields();
    else applyShieldLook();
  };

  const toggleShields = (on: boolean) => {
    if (on) {
      const r = shieldChosenApps();
      toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
    } else {
      Alert.alert('Switch every shield off?', 'Your apps open straight away until you switch them back on. Today won’t get a stamp.', [
        { text: 'Keep them on', style: 'cancel' },
        {
          text: 'Switch off',
          style: 'destructive',
          onPress: () => {
            liftAllShields();
            lose(10, 'Switched every shield off');
            toast('−10 XP · Shields are off');
          },
        },
      ]);
    }
  };

  const askOffTill = () =>
    Alert.alert(
      'Turn off till tomorrow?',
      'Every shield comes off now and turns back on by itself at 07:00 tomorrow. You keep your XP and your waiting room. Today just won’t get a stamp.',
      [
        { text: 'Keep shields on', style: 'cancel' },
        {
          text: 'Turn off till 07:00',
          onPress: () => {
            turnOffTillTomorrow();
            toast('Shields are off till 07:00 tomorrow');
          },
        },
      ],
    );

  const askDelete = () =>
    Alert.alert('Delete all data?', 'Your apps, habits, XP and history are removed from this phone. You’ll start setup again.', [
      { text: 'Keep my data', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          liftAllShields();
          await resetState();
          router.replace('/setup');
          setTimeout(() => toast('All data deleted'), 500);
        },
      },
    ]);

  const rate = async () => {
    const url = StoreReview.storeUrl();
    if (url) Linking.openURL(`${url}?action=write-review`);
    else if (await StoreReview.hasAction()) StoreReview.requestReview();
    else toast('Reviews open once Till Morning is on the App Store');
  };

  const onRestore = async () => {
    try {
      const active = await restorePurchases();
      Alert.alert(active ? 'Purchases restored' : 'No active subscription found');
    } catch (e) {
      Alert.alert('Could not restore purchases', String(e));
    }
  };

  const onCheckOfferings = async () => {
    if (!isPurchasesReady()) return Alert.alert('RevenueCat key missing');
    try {
      const offerings = await getOfferings();
      const ids = offerings.current?.availablePackages.map((p) => p.product.identifier) ?? [];
      Alert.alert('Offerings', ids.length ? ids.join('\n') : 'No current offering');
    } catch (e) {
      Alert.alert('Offerings failed', String(e));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: tabSpace, gap: 20 }} keyboardShouldPersistTaps="handled">
        <Text style={type.h1}>Settings</Text>

        <Card style={{ paddingVertical: 4 }}>
          <Row
            label="Shield my apps"
            sub={s.shieldsOn ? 'On. Your apps open with a pause.' : 'Off. Your apps open straight away.'}
            right={<Toggle value={s.shieldsOn} onChange={toggleShields} />}
          />
          {s.shieldsOn && (
            <>
              <Divider />
              {offTill ? (
                <Row
                  label="Off till tomorrow"
                  sub="Back on by itself at 07:00"
                  onPress={() => {
                    const r = shieldChosenApps();
                    toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
                  }}
                />
              ) : (
                <Row label="Turn off till tomorrow" sub="Every shield comes back on at 07:00" onPress={askOffTill} />
              )}
            </>
          )}
          <Divider />
          <Row
            label="Your apps"
            sub={count.apps + count.categories ? `${count.apps} app${count.apps === 1 ? '' : 's'}${count.categories ? ` and ${count.categories} categor${count.categories === 1 ? 'y' : 'ies'}` : ''} protected` : 'None chosen yet'}
            onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })}
          />
          <Divider />
          <Row label="Your rules" sub="Challenge, treat nights, when to shield" onPress={() => router.push('/rules')} />
        </Card>

        <Section title="Night lock">
          <Row
            label="Night lock"
            sub={st.nlOn ? `${hh(st.nlFrom)} to ${hh(st.nlTo)}: only Park it or Close. Passes sleep.` : 'Off. Nights get the longer pause instead.'}
            right={
              <Toggle
                value={st.nlOn}
                onChange={(v) => {
                  set({ nlOn: v });
                  toast(v ? `Night lock on, ${hh(st.nlFrom)} to ${hh(st.nlTo)}` : 'Night lock off');
                }}
              />
            }
          />
          {st.nlOn && (
            <>
              <Divider />
              <Choice title="Starts" options={[[22, '22:00'], [23, '23:00'], [0, '00:00']]} value={st.nlFrom} onPick={(v) => set({ nlFrom: v })} />
              <Divider />
              <Choice title="Ends" options={[[6, '06:00'], [7, '07:00'], [8, '08:00']]} value={st.nlTo} onPick={(v) => set({ nlTo: v })} />
            </>
          )}
        </Section>

        <Section title="Pause">
          <Choice
            title="How long the pause lasts"
            options={[[10, '10 s'], [15, '15 s'], [30, '30 s'], [60, '1 min']]}
            value={st.pauseSeconds}
            onPick={(v) => set({ pauseSeconds: v })}
          />
        </Section>

        <Card style={{ paddingVertical: 4 }}>
          <Pressable onPress={() => setMore((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: more }} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={type.title}>More options</Text>
              <Text style={type.small}>Shield message, cool-off and more</Text>
            </View>
            <View style={{ transform: [{ rotate: more ? '90deg' : '0deg' }] }}>
              <IconCaret />
            </View>
          </Pressable>
          {more && (
            <>
              <Divider />
              <View style={{ paddingVertical: 12 }}>
                <Text style={type.title}>Your shield message</Text>
                <Text style={type.small}>Shown first on every shield, in your own words.</Text>
                <TextInput
                  value={st.shieldMsg}
                  onChangeText={(t) => set({ shieldMsg: t })}
                  maxLength={60}
                  placeholder="e.g. Is this worth an hour of work?"
                  placeholderTextColor={color.placeholder}
                  style={fieldStyle}
                />
              </View>
              <Divider />
              <View style={{ paddingVertical: 12 }}>
                <Text style={type.title}>What you’re saving for</Text>
                <TextInput
                  value={s.goal}
                  onChangeText={(t) => {
                    setState({ goal: t });
                    applyShieldLook();
                  }}
                  maxLength={40}
                  placeholder="e.g. a Japan trip"
                  placeholderTextColor={color.placeholder}
                  style={fieldStyle}
                />
              </View>
              <Divider />
              <Choice
                title="Cool-off after you leave"
                sub="The app stays locked this long after you walk away."
                options={[[0, 'Off'], [5, '5 min'], [10, '10 min'], [30, '30 min']]}
                value={st.coolOffMinutes}
                onPick={(v) => set({ coolOffMinutes: v })}
              />
              <Divider />
              <Row
                label="Ask “What’s this one about?”"
                sub="A question in the pause, with a short coach reply"
                right={<Toggle value={st.askQuestion} onChange={(v) => set({ askQuestion: v })} />}
              />
              <Divider />
              <View style={{ paddingVertical: 12 }}>
                <Text style={type.title}>Shopping Pass lengths</Text>
                <Text style={type.small}>Minutes, from 1 to 120</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {st.passPresets.map((m, i) => (
                    <TextInput
                      key={i}
                      defaultValue={String(m)}
                      keyboardType="number-pad"
                      maxLength={3}
                      accessibilityLabel={`Pass length ${i + 1}`}
                      onEndEditing={(e) => {
                        const v = Math.min(120, Math.max(1, parseInt(e.nativeEvent.text || '0', 10) || m));
                        const next = [...st.passPresets] as [number, number, number];
                        next[i] = v;
                        set({ passPresets: next, defaultPassMinutes: next[1] });
                      }}
                      style={[fieldStyle, { flex: 1, textAlign: 'center', fontFamily: font.display, fontSize: 20 }]}
                    />
                  ))}
                </View>
              </View>
            </>
          )}
        </Card>

        <Section title="Subscription and privacy">
          <Row label="Restore purchases" onPress={onRestore} />
          <Divider />
          <Row label="Privacy policy" onPress={() => Linking.openURL(links.privacy)} />
          <Divider />
          <Row label="Terms of use" onPress={() => Linking.openURL(links.terms)} />
          <Divider />
          <Row label="Support" onPress={() => Linking.openURL(links.support)} />
          <Divider />
          <Text style={[type.small, { paddingVertical: 12 }]}>Everything stays on this phone. No bank links, no account.</Text>
        </Section>

        <Card style={{ paddingVertical: 4 }}>
          <Row label="Rate Till Morning" sub="Write a review on the App Store" onPress={rate} />
          <Divider />
          <Row label="Delete all data" danger onPress={askDelete} />
        </Card>

        {config.appEnv !== 'production' && (
          <Section title={`Test tools (${config.appEnv})`}>
            <Row label="Try the pause" onPress={() => router.push({ pathname: '/pause', params: { app: 'Test app' } })} />
            <Divider />
            <Row label="Try the urgent door" onPress={() => router.push({ pathname: '/urgent', params: { app: 'Test app' } })} />
            <Divider />
            <Row label="Send test crash report" onPress={() => { sendTestEvent(); Alert.alert('Sent to Sentry'); }} />
            <Divider />
            <Row label="Check RevenueCat offerings" onPress={onCheckOfferings} />
            <Divider />
            <Row label={`Screen Time status: ${String(getScreenTimeStatus())}`} />
          </Section>
        )}

        <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.text3, textAlign: 'center' }}>
          Version {config.version} ({config.build})
        </Text>
      </ScrollView>
    </View>
  );
}
