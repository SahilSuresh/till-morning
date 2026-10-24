import { router } from 'expo-router';
import { useEffect } from 'react';
import { Animated, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLabel } from '../../modules/tm-native';
import { chooseApp, HABIT_LABEL, type MyApp } from '../lib/apps';
import { useAppState } from '../lib/store';
import { TextLink, toast } from './components';
import { IconCaret } from './icons';
import { color, type } from './theme';
import { useDragToClose } from './useDragToClose';

const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** "Which app do you need?" (SHEETS.passApp, L2213): pick the app, then the usual pause. */
export function WhichAppSheet({ visible, apps, onClose }: { visible: boolean; apps: MyApp[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const habits = useAppState((s) => s.habits);
  const coolOffs = useAppState((s) => s.coolOffs);
  const now = Date.now();
  const { drag, handlers, reset } = useDragToClose(onClose);
  useEffect(() => {
    if (visible) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pick = (a: MyApp) => {
    const until = a.name ? coolOffs[a.name] ?? 0 : 0;
    if (until > now) return toast(`${a.name} is taking a break until ${hhmm(until)}`);
    onClose();
    if (chooseApp(a.key)) router.push('/pause');
    else router.push({ pathname: '/pause', params: { app: a.name ?? 'your shop apps' } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(6,6,28,0.5)' }} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View
        accessibilityLabel="Choose an app for your Shopping Pass"
        style={{
          transform: [{ translateY: drag }],
          backgroundColor: color.sheet,
          borderTopWidth: 1.5,
          borderColor: '#2E3374',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          paddingHorizontal: 24,
          paddingTop: 10,
          paddingBottom: insets.bottom + 12,
          maxHeight: '80%',
        }}
      >
        {/* Grab here (the handle and the title) and drag down to close */}
        <View {...handlers} accessibilityHint="Drag down to close">
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#3A3F86', marginBottom: 16 }} />
          <Text style={[type.h1, { fontSize: 24, lineHeight: 28 }]}>Which app do you need?</Text>
          <Text style={[type.body, { marginTop: 6 }]}>You’ll get the usual pause first. Then say what you need, set a limit and tear your ticket.</Text>
        </View>
        <ScrollView style={{ marginTop: 12 }}>
          {apps.length ? (
            apps.map((a, i) => {
              const until = a.name ? coolOffs[a.name] ?? 0 : 0;
              const cooling = until > now;
              const h = habits[a.key];
              return (
                <Pressable
                  key={a.key}
                  onPress={() => pick(a)}
                  accessibilityRole="button"
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1.5 : 0, borderColor: color.divider, opacity: cooling ? 0.6 : 1 }}
                >
                  <View style={{ flex: 1 }}>
                    <AppLabel appKey={a.key} mode="both" size={17} color="#F3F2FF" fallback={a.name ?? 'App'} style={{ height: 34 }} />
                    <Text style={type.small}>{cooling ? `On a break until ${hhmm(until)}` : h ? HABIT_LABEL[h] : 'Shielded'}</Text>
                  </View>
                  <IconCaret />
                </Pressable>
              );
            })
          ) : (
            <Text style={[type.body, { paddingVertical: 12 }]}>None of your apps are shielded right now, so you can open them without a pass.</Text>
          )}
        </ScrollView>
        <TextLink label="Not now" style={{ color: color.text3 }} onPress={onClose} />
      </Animated.View>
    </Modal>
  );
}
