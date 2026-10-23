import { Redirect } from 'expo-router';
import { TabList, TabSlot, Tabs, TabTrigger, type TabsDescriptor, type TabsSlotRenderOptions } from 'expo-router/ui';
import { GearSixIcon, HourglassMediumIcon, HouseIcon, UserIcon } from 'phosphor-react-native';
import { StyleSheet } from 'react-native';
import { Screen } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../lib/store';
import { TAB_BAR_HEIGHT } from '../../ui/layout';
import { SwipeTabs, TabButton, TabScene, WaitingTabButton } from '../../ui/tabs/TabChrome';
import { color } from '../../ui/theme';

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
      <SwipeTabs>
        <TabSlot renderFn={renderTab} />
      </SwipeTabs>
      {/* .tabbar: sits below the content (not over it), margin 4px 20px 30px above the home indicator */}
      <TabList
        style={{
          marginTop: 4,
          marginHorizontal: 20,
          marginBottom: insets.bottom > 0 ? Math.max(12, insets.bottom - 4) : 16,
          height: TAB_BAR_HEIGHT,
          padding: 6,
          gap: 4,
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
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Today" Icon={HouseIcon} />
        </TabTrigger>
        <TabTrigger name="waiting" href="/waiting" asChild>
          <WaitingTabButton label="Waiting" Icon={HourglassMediumIcon} />
        </TabTrigger>
        <TabTrigger name="me" href="/me" asChild>
          <TabButton label="Me" Icon={UserIcon} />
        </TabTrigger>
        <TabTrigger name="settings" href="/settings" asChild>
          <TabButton label="Settings" Icon={GearSixIcon} />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, position: 'relative', height: '100%' },
  focused: { zIndex: 1, display: 'flex', flexShrink: 0, flexGrow: 1 },
  unfocused: { zIndex: -1, display: 'none', flexShrink: 1, flexGrow: 0 },
});
