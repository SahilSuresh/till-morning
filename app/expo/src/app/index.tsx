import { Link } from 'expo-router';
import { Text, View } from 'react-native';

// Placeholder only. The real Today screen comes from the design spec.
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>Till Morning (foundation build)</Text>
      <Link href="/settings">Settings</Link>
    </View>
  );
}
