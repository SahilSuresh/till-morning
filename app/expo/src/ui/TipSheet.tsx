import { Image, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, font } from './theme';

/** Paper tip card from the prototype's coach tour and first-visit tab tips. */
export function TipSheet({
  visible,
  title,
  body,
  step,
  steps,
  next,
  onNext,
  onSkip,
}: {
  visible: boolean;
  title: string;
  body: string;
  step?: number;
  steps?: number;
  next: string;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSkip ?? onNext}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(4,5,22,0.76)', justifyContent: 'flex-end' }} onPress={onSkip ? undefined : onNext}>
        <View style={{ marginHorizontal: 16, marginBottom: insets.bottom + 100, backgroundColor: '#F4F3FF', borderRadius: 22, padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Image source={require('../../assets/mascots/welcome.webp')} style={{ width: 48, height: 48 }} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.display, fontSize: 19, color: color.inkOnBright }}>{title}</Text>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 20, color: '#3B3F6B', marginTop: 4 }}>{body}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            {steps ? (
              <View style={{ flexDirection: 'row', gap: 5 }}>
                {Array.from({ length: steps }).map((_, i) => (
                  <View key={i} style={{ width: i === step ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? color.blue : '#C9C8E6' }} />
                ))}
              </View>
            ) : (
              <View />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {onSkip && (
                <Pressable onPress={onSkip} accessibilityRole="button" hitSlop={8}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#5D6192' }}>Skip</Text>
                </Pressable>
              )}
              <Pressable
                onPress={onNext}
                accessibilityRole="button"
                style={{ backgroundColor: color.blue, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 9, shadowColor: color.blueEdge, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 }}
              >
                <Text style={{ fontFamily: font.bodyHeavy, fontSize: 15, color: '#FFFFFF' }}>{next}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
