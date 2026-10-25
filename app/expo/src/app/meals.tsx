import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setState, useAppState } from '../lib/store';
import { MEAL_IDEAS } from '../lib/week';
import { Button, Card, CircleButton, toast } from '../ui/components';
import { IconCheck, IconChevrons } from '../ui/icons';
import { color, font, type } from '../ui/theme';
import { Pressable } from '../ui/Pressable';

/** Backup dinner (V.meals, L1490): easy meals shown under the breathing ring on takeaway apps. */
export default function Meals() {
  const insets = useSafeAreaInsets();
  const saved = useAppState((s) => s.meals);
  const [picked, setPicked] = useState(saved);
  const [draft, setDraft] = useState('');
  const own = picked.filter((x) => !MEAL_IDEAS.some((i) => i[0] === x.n));
  const rows = [...MEAL_IDEAS.map(([n, e, m]) => ({ n, e, m })), ...own];
  const on = new Set(picked.map((x) => x.n));

  const toggle = (row: { n: string; e: string; m: number }) => {
    if (on.has(row.n)) setPicked(picked.filter((x) => x.n !== row.n));
    else if (picked.length >= 3) toast('Up to 3. Untick one first.');
    else setPicked([...picked, row]);
  };
  const add = () => {
    const n = draft.trim();
    if (n.length < 2) return;
    if (picked.length >= 3) return toast('Up to 3. Untick one first.');
    setPicked([...picked, { n, e: '🍽️', m: 0 }]);
    setDraft('');
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Backup dinner</Text>
      </View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={type.h1}>What’s easy at home?</Text>
          <Text style={[type.body, { marginTop: 8 }]}>We’ll show it when you open a takeaway app, right under the breathing ring. Pick up to 3.</Text>
          <Card style={{ marginTop: 18, paddingVertical: 4 }}>
            {rows.map((x, i) => (
              <Pressable
                key={x.n}
                onPress={() => toggle(x)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on.has(x.n) }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1.5 : 0, borderColor: color.divider }}
              >
                <Text style={{ fontSize: 22 }}>{x.e}</Text>
                <Text style={[type.title, { flex: 1 }]}>{x.n}</Text>
                {x.m ? <Text style={type.small}>{x.m} min</Text> : null}
                <View style={{ width: 26, height: 26, borderRadius: 9, borderWidth: 2, borderColor: on.has(x.n) ? '#5B76FF' : '#3A3F86', backgroundColor: on.has(x.n) ? '#5B76FF' : color.field, alignItems: 'center', justifyContent: 'center' }}>
                  {on.has(x.n) && <IconCheck size={15} />}
                </View>
              </Pressable>
            ))}
            <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12, borderTopWidth: 1.5, borderColor: color.divider }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                maxLength={30}
                placeholder="+ Write your own"
                placeholderTextColor={color.placeholder}
                onSubmitEditing={add}
                style={{ flex: 1, backgroundColor: color.field, borderColor: color.fieldBorder, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.bodySemi, fontSize: 16, color: color.text }}
              />
              <Pressable onPress={add} accessibilityRole="button" style={{ paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#1E2256', borderWidth: 1.5, borderColor: '#343A86', justifyContent: 'center' }}>
                <Text style={{ fontFamily: font.display, fontSize: 16, color: color.text }}>Add</Text>
              </Pressable>
            </View>
          </Card>
          <Text style={[type.small, { marginTop: 12 }]}>{picked.length} of 3 picked. No XP for this one: it’s just for you.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 20 }}>
        <Button
          label="Save"
          onPress={() => {
            setState({ meals: picked });
            toast(picked.length ? 'Backup dinner saved' : 'No backup dinner for now');
            back();
          }}
        />
      </View>
    </View>
  );
}
