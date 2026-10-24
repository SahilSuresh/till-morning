import { Redirect } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import { GearSixIcon, HourglassMediumIcon, HouseIcon, UserIcon } from '../../ui/ph';
import { StyleSheet } from 'react-native';
import { Screen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../lib/store';
import { TAB_BAR_HEIGHT } from '../../ui/layout';
import { PassStrip } from '../../ui/tabs/PassStrip';
import { TabBar, type TabDef } from '../../ui/tabs/TabBar';
import { TabScene } from '../../ui/tabs/TabChrome';
import { color } from '../../ui/theme';

const TABS: TabDef[] = [
  { name: 'index', label: 'Today', Icon: HouseIcon },
  { name: 'waiting', label: 'Waiting', Icon: HourglassMediumIcon },
  { name: 'me', label: 'Me', Icon: UserIcon },
  { name: 'settings', label: 'Settings', Icon: GearSixIcon },
];

/** The default tab slot render (expo-router/ui), with each tab's content wrapped for its enter animation. */
function renderTab(descriptor: TabsDescriptor, { isFocused, loaded, detachInactiveScreens }: TabsSlotRenderOptions) {
  if (!loaded && !isFocused) return null;
  return (
    <Screen
      key={descriptor.route.key}
      enabled={detachInactiveScreens}
      activityState={isFocused ? 2 : 0}
      freezeOnBlur={false}
      style={[styles.screen, isFocused ? styles.focused : styles.unfocused]}
    >
      <TabScene focused={isFocused}>{descriptor.render()}</TabScene>
    </Screen>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const onboarded = useAppState((s) => s.onboarded);

  if (!onboarded) return <Redirect href="/setup" />;

  return (
    <Tabs style={{ flex: 1, backgroundColor: color.night }}>
      <TabSlot renderFn={renderTab} />
      {/* Route declarations only (headless tabs read them from a direct TabList child). */}
      <TabList style={{ display: 'none' }}>
        <TabTrigger name="index" href="/" />
        <TabTrigger name="waiting" href="/waiting" />
        <TabTrigger name="me" href="/me" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>
      <PassStrip />
      {/* .tabbar: sits below the content (not over it), margin 4px 20px 30px above the home indicator */}
      <TabBar
        tabs={TABS}
        style={{
          marginTop: 4,
          marginHorizontal: 20,
          marginBottom: insets.bottom > 0 ? Math.max(12, insets.bottom - 4) : 16,
          height: TAB_BAR_HEIGHT,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: 'rgb(26,30,83)',
          borderWidth: 1,
          borderColor: '#2E3374',
          shadowColor: '#040518',
          shadowOpacity: 0.55,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 12 },
          justifyContent: 'flex-start',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', height: '100%' },
  focused: { zIndex: 1, display: 'flex', flexShrink: 0, flexGrow: 1 },
  unfocused: { zIndex: -1, display: 'none', flexShrink: 1, flexGrow: 0 },
});
