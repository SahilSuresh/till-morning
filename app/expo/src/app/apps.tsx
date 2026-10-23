import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLabel, editApps, hasTmNative } from '../../modules/tm-native';
import { appName, budgetFor, HABIT_LABEL, HABITS, myApps } from '../lib/apps';
import { budgetSummary, money } from '../lib/budget';
import { applyShieldLook, PROTECTED_ID, syncShields } from '../lib/core';
import { breakDay } from '../lib/progress';
import { dayKey, getState, setState, useAppState } from '../lib/store';
import { lose } from '../lib/xp';
import { Card, CircleButton, Tag, toast } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { color, font, type } from '../ui/theme';

/** Your apps (appsTab, L2082): a switch, a habit and a budget for each protected app. */
export default function YourApps() {
  const insets = useSafeAreaInsets();
  const habits = useAppState((s) => s.habits);
  const off = useAppState((s) => s.offApps);
  useAppState((s) => s.budgetTotal + s.split); // re-render when the budget changes
  const [version, setVersion] = useState(0);
  const apps = useMemo(() => myApps(), [version, off]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  const toggle = (key: string, on: boolean) => {
    const name = appName(key);
    if (on) {
      editApps(PROTECTED_ID, [key], []);
      setState((s) => ({ offApps: s.offApps.filter((k) => k !== key) }));
    } else {
      editApps(PROTECTED_ID, [], [key]);
      setState((s) => ({ offApps: [...s.offApps, key] }));
      breakDay(`you unshielded ${name ?? 'an app'}`);
      // −5 XP, once per app per day, never below your rank's floor.
      const label = `Unshielded ${name ?? 'an app'}`;
      const today = dayKey();
      const already = getState().xp.log.some((e) => e.label === label && dayKey(e.at) === today);
      const before = getState().xp.total;
      if (!already) lose(5, label);
      const taken = before - getState().xp.total;
      const what = `${name ?? 'App'} unshielded`;
      toast(already ? what : taken > 0 ? `−${taken} XP · ${what}` : `${what} · no XP to lose yet`);
    }
    syncShields();
    setVersion((v) => v + 1);
  };

  const pickHabit = (key: string, h: (typeof HABITS)[number]) => {
    setState((s) => ({ habits: { ...s.habits, [key]: h } }));
    applyShieldLook();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back to Settings" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Your apps</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <Text style={type.body}>Shielded apps show the Till Morning shield when you open them.</Text>

        <Pressable onPress={() => router.push('/budget')} accessibilityRole="button">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={type.title}>Monthly budget</Text>
              <Text style={type.small}>{budgetSummary()}</Text>
            </View>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#93A5FF' }}>Edit</Text>
          </Card>
        </Pressable>

        {!hasTmNative && (
          <Card>
            <Text style={type.small}>Install the latest Till Morning build to see each app here with its own switch and habit.</Text>
          </Card>
        )}

        {apps.map((a) => {
          const on = !off.includes(a.key);
          const b = budgetFor(a.key);
          return (
            <Card key={a.key} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {a.token ? (
                  <AppLabel appKey={a.key} mode="both" size={17} color="#F3F2FF" fallback={a.name ?? 'App'} style={{ flex: 1, height: 36, opacity: on ? 1 : 0.55 }} />
                ) : (
                  <Text style={[type.title, { flex: 1 }]}>{a.name}</Text>
                )}
                {a.token && (
                  <Switch
                    value={on}
                    onValueChange={(v) => toggle(a.key, v)}
                    trackColor={{ true: color.blue, false: '#2B2F69' }}
                    ios_backgroundColor="#2B2F69"
                    accessibilityLabel={`Shield ${a.name ?? 'this app'}`}
                  />
                )}
              </View>
              <View accessibilityRole="radiogroup" accessibilityLabel={`Habit for ${a.name ?? 'this app'}`} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {HABITS.map((h) => (
                  <Tag key={h} label={HABIT_LABEL[h]} selected={habits[a.key] === h} onPress={() => pickHabit(a.key, h)} />
                ))}
              </View>
              {b ? <Text style={type.small}>Budget: {money(b)} a month</Text> : null}
            </Card>
          );
        })}

        <Pressable
          onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })}
          accessibilityRole="button"
          style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: '#3A3F86', borderRadius: 20, paddingVertical: 16, alignItems: 'center' }}
        >
          <Text style={{ fontFamily: font.bodyHeavy, fontSize: 16, color: '#93A5FF' }}>Add or remove apps</Text>
        </Pressable>
        <Text style={[type.small, { textAlign: 'center' }]}>Unshielding an app costs 5 XP, once a day per app. Your rank never drops.</Text>
      </ScrollView>
    </View>
  );
}
