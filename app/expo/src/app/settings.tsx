import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { config, links } from '../lib/config';
import { applyShieldLook, liftAllShields, shieldChosenApps } from '../lib/core';
import { sendTestEvent } from '../lib/crashes';
import { getOfferings, isPurchasesReady, restorePurchases } from '../lib/purchases';
import { getScreenTimeStatus } from '../lib/screenTime';
import { resetState, setState, useAppState } from '../lib/store';
import { lose } from '../lib/xp';
import { Card, CircleButton, Tag, toast } from '../ui/components';
import { IconX } from '../ui/icons';
import { color, font, type } from '../ui/theme';

function Row({ label, onPress, right, danger }: { label: string; onPress?: () => void; right?: ReactNode; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      <Text style={[type.title, danger && { color: '#FF9F94' }]}>{label}</Text>
      {right}
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

export default function Settings() {
  const insets = useSafeAreaInsets();
  const s = useAppState((st) => st);

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

  const toggleShields = (on: boolean) => {
    if (on) {
      shieldChosenApps();
      toast('Shields are back on');
    } else {
      Alert.alert('Switch every shield off?', 'Your apps open without a pause until you switch them back on.', [
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

  const setSetting = (patch: Partial<typeof s.settings>) => {
    setState((st) => ({ settings: { ...st.settings, ...patch } }));
    applyShieldLook();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: insets.bottom + 32, gap: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <CircleButton label="Close" onPress={() => router.back()}>
            <IconX />
          </CircleButton>
          <Text style={type.h1}>Settings</Text>
        </View>

        <Section title="Shield">
          <Row
            label="Shields on"
            right={<Switch value={s.shieldsOn} onValueChange={toggleShields} trackColor={{ true: color.blue, false: '#2B2F69' }} />}
          />
          <Divider />
          <Row label="Choose apps" onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })} />
          <Divider />
          <View style={{ paddingVertical: 12, gap: 8 }}>
            <Text style={type.title}>Cool-off after you leave</Text>
            <Text style={type.small}>The app stays locked this long after you walk away.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[0, 5, 10, 30].map((m) => (
                <Tag key={m} label={m ? `${m} min` : 'Off'} selected={s.settings.coolOffMinutes === m} onPress={() => setSetting({ coolOffMinutes: m })} />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Pause">
          <View style={{ paddingVertical: 12, gap: 8 }}>
            <Text style={type.title}>Pause length</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[10, 15, 30, 60].map((sec) => (
                <Tag key={sec} label={sec < 60 ? `${sec} s` : '1 min'} selected={s.settings.pauseSeconds === sec} onPress={() => setSetting({ pauseSeconds: sec })} />
              ))}
            </View>
          </View>
        </Section>

        <Section title="Plan and privacy">
          <Row label="Restore purchases" onPress={onRestore} />
          <Divider />
          <Row label="Privacy policy" onPress={() => Linking.openURL(links.privacy)} />
          <Divider />
          <Row label="Terms of use" onPress={() => Linking.openURL(links.terms)} />
          <Divider />
          <Row label="Support" onPress={() => Linking.openURL(links.support)} />
        </Section>

        {config.appEnv !== 'production' && (
          <Section title={`Test tools (${config.appEnv})`}>
            <Row label="Try the pause" onPress={() => router.push({ pathname: '/pause', params: { app: 'Test app' } })} />
            <Divider />
            <Row label="Send test crash report" onPress={() => { sendTestEvent(); Alert.alert('Sent to Sentry'); }} />
            <Divider />
            <Row label="Check RevenueCat offerings" onPress={onCheckOfferings} />
            <Divider />
            <Row label={`Screen Time status: ${String(getScreenTimeStatus())}`} />
            <Divider />
            <Row
              label="Start setup again"
              danger
              onPress={() =>
                Alert.alert('Start again?', 'This lifts every shield and clears Till Morning’s data on this phone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Start again',
                    style: 'destructive',
                    onPress: async () => {
                      liftAllShields();
                      await resetState();
                      router.replace('/setup');
                    },
                  },
                ])
              }
            />
          </Section>
        )}

        <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.text3, textAlign: 'center' }}>
          Version {config.version} ({config.build})
        </Text>
      </ScrollView>
    </View>
  );
}
