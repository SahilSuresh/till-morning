import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { type ComponentRef, forwardRef, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { readyWants } from '../../lib/core';
import { useAppState } from '../../lib/store';
import { IconGear, IconHourglass, IconSun, IconUser } from '../../ui/icons';
import { TAB_BAR_HEIGHT } from '../../ui/layout';
import { color, font, gradient } from '../../ui/theme';

type TabButtonProps = TabTriggerSlotProps & { label: string; icon: (active: boolean) => ReactNode; badge?: number };

/** One tab: the active tab grows and turns blue (linear-gradient #5873FF → #4361FF). */
const TabButton = forwardRef<ComponentRef<typeof Pressable>, TabButtonProps>(function TabButton({ isFocused, label, icon, badge, onPress, ...rest }, ref) {
  return (
    <Pressable
      ref={ref}
      {...rest}
      onPress={(e) => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={badge ? `${label}, ${badge} ready` : label}
      style={{ flex: isFocused ? 1.6 : 1, height: 50, borderRadius: 999, overflow: 'hidden' }}
    >
      {isFocused && <LinearGradient colors={gradient.tabActive} style={{ position: 'absolute', inset: 0, borderRadius: 999 }} />}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <View>
          {icon(!!isFocused)}
          {!!badge && (
            <View
              style={{
                position: 'absolute',
                top: -6,
                right: -10,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                paddingHorizontal: 4,
                backgroundColor: color.coral,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: 'rgb(27,31,85)',
              }}
            >
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 10.5, color: color.inkOnBright }}>{badge}</Text>
            </View>
          )}
        </View>
        {isFocused && <Text style={{ fontFamily: font.bodyHeavy, fontSize: 14, color: '#FFFFFF' }}>{label}</Text>}
      </View>
    </Pressable>
  );
});

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const onboarded = useAppState((s) => s.onboarded);
  useAppState((s) => s.parked); // keep the Waiting badge fresh
  const ready = readyWants().length;

  if (!onboarded) return <Redirect href="/setup" />;

  const tint = (active: boolean) => (active ? '#FFFFFF' : color.text3);

  return (
    <Tabs style={{ flex: 1, backgroundColor: color.night }}>
      <TabSlot />
      <TabList
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 8,
          height: TAB_BAR_HEIGHT,
          borderRadius: 999,
          paddingHorizontal: 7,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          overflow: 'hidden',
          backgroundColor: 'rgba(27,31,85,0.94)',
          borderWidth: 1.5,
          borderColor: '#2E3374',
          shadowColor: '#020312',
          shadowOpacity: 0.5,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <BlurView intensity={30} tint="dark" style={{ position: 'absolute', inset: 0 }} />
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Today" icon={(a) => <IconSun size={22} color={tint(a)} />} />
        </TabTrigger>
        <TabTrigger name="waiting" href="/waiting" asChild>
          <TabButton label="Waiting" badge={ready} icon={(a) => <IconHourglass size={21} color={tint(a)} />} />
        </TabTrigger>
        <TabTrigger name="me" href="/me" asChild>
          <TabButton label="Me" icon={(a) => <IconUser size={22} color={tint(a)} />} />
        </TabTrigger>
        <TabTrigger name="settings" href="/settings" asChild>
          <TabButton label="Settings" icon={(a) => <IconGear size={22} color={tint(a)} />} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
