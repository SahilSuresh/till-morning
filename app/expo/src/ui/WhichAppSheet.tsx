import { router } from 'expo-router';
import { useEffect } from 'react';
import { Animated, Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLabel } from '../../modules/tm-native';
import { chooseApp, HABIT_LABEL, type MyApp } from '../lib/apps';
import { useAppState } from '../lib/store';
import { TextLink, toast } from './components';
import { IconCaret } from './icons';
import { color, font, type } from './theme';
import { useDragToClose } from './useDragToClose';
import { Pressable } from './Pressable';

const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** "Which app do you need?" (SHEETS.passApp, L2213): pick the app, then the usual pause. */
export function WhichAppSheet({ visible, apps, onClose }: { visible: boolean; apps: MyApp[]; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const habits = useAppState((s) => s.habits);
  const coolOffs = useAppState((s) => s.coolOffs);
  const now = Date.now();
  const { drag, handlers, reset, onScroll } = useDragToClose(onClose);
  useEffect(() => {
    if (visible) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pick = (a: MyApp) => {
    const until = a.name ? (coolOffs[a.name] ?? 0) : 0;
    if (until > now) return toast(`${a.name} is taking a break until ${hhmm(until)}`);
    onClose();
    // chooseApp records this app (and its name, when iOS has told us) for the pause, pass and Lock Screen timer.
    if (chooseApp(a.key)) router.push('/pause');
    else router.push({ pathname: '/pause', params: { app: a.name ?? 'your shop apps' } });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable sound="back" style={{ flex: 1, backgroundColor: 'rgba(6,6,28,0.5)' }} onPress={onClose} accessibilityLabel="Close" />
      <Animated.View
        {...handlers}
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
        {/* Drag down anywhere on the sheet to close it */}
        <View accessibilityHint="Drag down to close">
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#3A3F86', marginBottom: 16 }} />
          <Text style={[type.h1, { fontSize: 24, lineHeight: 28 }]}>Which app do you need?</Text>
          <Text style={[type.body, { marginTop: 6 }]}>You’ll get the usual pause first. Then say what you need, set a limit and tear your ticket.</Text>
        </View>
        <ScrollView style={{ marginTop: 12 }} onScroll={onScroll} scrollEventThrottle={32}>
          {apps.length ? (
            apps.map((a, i) => {
              const until = a.name ? (coolOffs[a.name] ?? 0) : 0;
              const cooling = until > now;
              const h = habits[a.key];
              return (
                <Pressable
                  key={a.key}
                  onPress={() => pick(a)}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.name ?? 'This app'}. ${cooling ? `On a break until ${hhmm(until)}` : h ? HABIT_LABEL[h] : 'Shielded'}`}
                  style={({ pressed }) => ({
                    marginTop: i ? 8 : 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#3A3F86',
                    backgroundColor: pressed ? '#262B6A' : '#1E2256',
                    opacity: cooling ? 0.6 : 1,
                  })}
                >
                  {/* the app's own icon on a soft tile */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    <AppLabel appKey={a.key} mode="icon" size={30} align="center" style={{ width: 44, height: 44 }} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    {/* the name we know, otherwise Apple's own label */}
                    {a.name ? (
                      <Text numberOfLines={1} style={{ fontFamily: font.bodyBold, fontSize: 16, color: color.text }}>
                        {a.name}
                      </Text>
                    ) : (
                      <AppLabel appKey={a.key} mode="title" size={16} color="#F3F2FF" style={{ height: 21 }} />
                    )}
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        borderRadius: 99,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        backgroundColor: cooling ? 'rgba(255,143,120,0.16)' : 'rgba(167,139,250,0.16)',
                      }}
                    >
                      <Text style={{ fontFamily: font.bodyHeavy, fontSize: 11.5, color: cooling ? color.coralText : '#C4B5FD' }}>
                        {cooling ? `On a break until ${hhmm(until)}` : h ? HABIT_LABEL[h] : 'Shielded'}
                      </Text>
                    </View>
                  </View>
                  <IconCaret />
                </Pressable>
              );
            })
          ) : (
            <Text style={[type.body, { paddingVertical: 12 }]}>None of your apps are shielded right now, so you can open them without a pass.</Text>
          )}
        </ScrollView>
        <TextLink label="Not now" style={{ color: color.text3 }} containerStyle={{ marginTop: 10 }} onPress={onClose} />
      </Animated.View>
    </Modal>
  );
}
