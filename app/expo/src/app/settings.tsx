import { Alert, Linking, Pressable, ScrollView, Text } from 'react-native';

import { config, links } from '../lib/config';
import { sendTestEvent } from '../lib/crashes';
import { getOfferings, isPurchasesReady, restorePurchases } from '../lib/purchases';
import { getScreenTimeStatus, requestScreenTimeAccess } from '../lib/screenTime';

// Unstyled skeleton: the rows Apple expects plus the device-gate checks.
// Layout, copy and styling come from the design spec.

function Row({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 14 }} accessibilityRole="button">
      <Text>{label}</Text>
    </Pressable>
  );
}

export default function Settings() {
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

  const onScreenTime = async () => {
    try {
      const status = await requestScreenTimeAccess();
      Alert.alert('Screen Time status', String(status));
    } catch (e) {
      Alert.alert('Screen Time request failed', String(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Row label="Restore purchases" onPress={onRestore} />
      <Row label="Privacy policy" onPress={() => Linking.openURL(links.privacy)} />
      <Row label="Terms of use" onPress={() => Linking.openURL(links.terms)} />
      <Row label="Support" onPress={() => Linking.openURL(links.support)} />
      <Text style={{ paddingVertical: 14 }}>
        Version {config.version} ({config.build})
      </Text>

      {config.appEnv !== 'production' && (
        <>
          <Text style={{ paddingTop: 24 }}>Foundation checks ({config.appEnv})</Text>
          <Row label="Send test crash report" onPress={() => { sendTestEvent(); Alert.alert('Sent to Sentry'); }} />
          <Row label="Check RevenueCat offerings" onPress={onCheckOfferings} />
          <Row label={`Ask for Screen Time access (now: ${String(getScreenTimeStatus())})`} onPress={onScreenTime} />
        </>
      )}
    </ScrollView>
  );
}
