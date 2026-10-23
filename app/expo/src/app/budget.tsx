import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { budgetSummary, evenShare, fillSplit, knownApps, lockDays, money, splitLeft, splitStatus, tierFor, writeBudgetLines } from '../lib/budget';
import { applyShieldLook, protectedCount } from '../lib/core';
import { type AppState, setState, useAppState } from '../lib/store';
import { Button, Card, CircleButton, OptionCard, Tag, toast } from '../ui/components';
import { IconCaret, IconChevrons, IconMinus, IconPlus } from '../ui/icons';
import { Seal } from '../ui/Seal';
import { color, font, type } from '../ui/theme';

type Split = AppState['split'];

/** Monthly budget (V.budget, L1289): one total, split across your apps. */
export default function Budget() {
  const insets = useSafeAreaInsets();
  const saved = useAppState((s) => s);
  const apps = useMemo(() => knownApps(), []);
  const count = protectedCount().apps;
  const [raw, setRaw] = useState(saved.budgetTotal ? String(saved.budgetTotal) : '');
  const [split, setSplit] = useState<Split>(saved.split);
  const [budgets, setBudgets] = useState<Record<string, number>>(saved.budgets);
  const total = Math.max(0, parseFloat(raw) || 0);
  const left = splitLeft(total, budgets, apps);
  const n = count || apps.length;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/settings'));
  const setTotal = (t: string) => {
    const v = t.replace(/[^0-9.]/g, '').slice(0, 6);
    setRaw(v);
    if (split === 'custom') setBudgets(fillSplit(Math.max(0, parseFloat(v) || 0), apps));
  };
  const pickSplit = (k: Split) => {
    setSplit(k);
    if (k === 'custom') setBudgets(fillSplit(total, apps));
  };
  const step = (app: string, d: number) => setBudgets((b) => ({ ...b, [app]: Math.max(0, (b[app] || 0) + d) }));

  const commit = () => {
    setState({ budgetTotal: total, split, budgets: split === 'custom' ? budgets : {}, budgetSkipped: !total });
    writeBudgetLines(n);
    applyShieldLook();
  };
  const save = () => {
    if (split === 'custom' && total && apps.length && left !== 0) {
      toast(left > 0 ? `Share out the last ${money(left)} first` : `That’s ${money(-left)} over your total`);
      return;
    }
    commit();
    back();
    if (total) setTimeout(() => toast(`Budget saved: ${budgetSummary()}`), 300);
  };
  const remove = () => {
    setState({ budgetTotal: 0, budgets: {}, budgetSkipped: true });
    writeBudgetLines(n);
    applyShieldLook();
    back();
    setTimeout(() => toast('Budget removed'), 300);
  };
  const openGuide = () => {
    commit();
    router.push('/bank');
  };

  const option = (k: Split, title: string, sub: string) => (
    <OptionCard key={k} label={title} sub={sub} selected={split === k} onPress={() => pickSplit(k)} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Monthly budget</Text>
      </View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={type.body}>On shopping and takeaways, all your apps together. Any amount you like.</Text>
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: color.field, borderColor: color.fieldBorder, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 18 }}>
            <Text style={{ fontFamily: font.display, fontSize: 34, color: color.text2 }}>£</Text>
            <TextInput
              value={raw}
              onChangeText={setTotal}
              keyboardType="decimal-pad"
              maxLength={6}
              placeholder="0"
              placeholderTextColor={color.placeholder}
              accessibilityLabel="Monthly total in pounds"
              style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontFamily: font.display, fontSize: 36, color: color.text }}
            />
            <Text style={type.small}>a month</Text>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            {[50, 100, 150, 200].map((v) => (
              <View key={v} style={{ flex: 1 }}>
                <Tag label={`£${v}`} selected={total === v} onPress={() => setTotal(String(v))} />
              </View>
            ))}
          </View>

          <Text style={[type.h2, { marginTop: 26 }]}>How should we split it?</Text>
          <View style={{ marginTop: 12, gap: 10 }} accessibilityRole="radiogroup">
            {option('shared', 'One pot for all apps', 'Spend it in any app. The simplest.')}
            {option('even', 'Split evenly', total && n ? `${money(evenShare(total, n))} for each of your ${n} apps` : n ? `The same for each of your ${n} apps` : 'The same for each app')}
            {option('custom', 'I’ll choose', 'Move money between apps with + and −')}
          </View>

          {split === 'custom' && (
            <Card style={{ marginTop: 14, paddingVertical: 4 }}>
              {apps.length ? (
                <>
                  {apps.map((a, i) => (
                    <View key={a} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: i ? 1.5 : 0, borderColor: color.divider }}>
                      <Text style={[type.title, { flex: 1 }]} numberOfLines={1}>{a}</Text>
                      <CircleButton label={`£5 less for ${a}`} onPress={() => step(a, -5)}>
                        <IconMinus size={16} />
                      </CircleButton>
                      <Text style={{ width: 64, textAlign: 'center', fontFamily: font.display, fontSize: 19, color: color.text }}>{money(budgets[a] || 0) || '£0'}</Text>
                      <CircleButton label={`£5 more for ${a}`} onPress={() => step(a, 5)}>
                        <IconPlus size={16} />
                      </CircleButton>
                    </View>
                  ))}
                  <Text
                    accessibilityLiveRegion="polite"
                    style={{ paddingVertical: 12, borderTopWidth: 1.5, borderColor: color.divider, fontFamily: font.bodyBold, fontSize: 14, color: left === 0 ? color.mintText : left < 0 ? '#FF9C92' : color.text2 }}
                  >
                    {total ? splitStatus(total, left) : 'Type your monthly total first'}
                  </Text>
                </>
              ) : (
                <Text style={[type.small, { paddingVertical: 12 }]}>
                  Your apps show up here by name once you’ve opened each one at its shield. Until then, one pot or an even split works best.
                </Text>
              )}
            </Card>
          )}
          {split === 'even' && total > 0 && n > 0 && (
            <Card style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[type.title, { flex: 1 }]}>Each of your {n} apps</Text>
              <Text style={{ fontFamily: font.display, fontSize: 19, color: color.text }}>{money(evenShare(total, n))}</Text>
            </Card>
          )}

          {total > 0 && (
            <Pressable onPress={openGuide} accessibilityRole="button" style={{ marginTop: 14 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Seal size={48} tier={saved.bankLock ? tierFor(lockDays()) : -1} />
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>{saved.bankLock ? 'Bank limit set' : 'Add a bank limit'}</Text>
                  <Text style={type.small}>
                    {saved.bankLock ? `Day ${lockDays()}, self-reported` : `An optional extra barrier: set ${money(total)} as a card limit at your bank.`}
                  </Text>
                </View>
                <IconCaret />
              </Card>
            </Pressable>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
          <Button label="Save" onPress={save} />
          <Pressable onPress={remove} accessibilityRole="button" style={{ paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#93A5FF' }}>Remove my budget</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
