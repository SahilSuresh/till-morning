import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { knownApps, lockDays, money, tierFor } from '../lib/budget';
import { setState, useAppState } from '../lib/store';
import { Button, Card, CircleButton, toast } from '../ui/components';
import { IconCheck, IconChevrons, IconLock } from '../ui/icons';
import { Seal } from '../ui/Seal';
import { color, font, gradient, type } from '../ui/theme';
import { Pressable } from '../ui/Pressable';

/** Add a bank limit (V.bankGuide, L1314): five self-reported steps, then the seal. */
export default function BankGuide() {
  const insets = useSafeAreaInsets();
  const done = useAppState((s) => s.bankSteps);
  const lock = useAppState((s) => s.bankLock);
  const total = useAppState((s) => s.budgetTotal);
  const apps = knownApps();
  const appList = apps.length > 2 ? `${apps.slice(0, 2).join(', ')} and ${apps.length - 2} more` : apps.join(' and ') || 'your shopping apps';
  const cap = total ? money(total) : 'your budget';

  const steps: [string, string][] = [
    ['Open your bank app', 'Monzo and Starling can block spending types, Barclays lets you switch off some spending, and Revolut has card limits. If yours can’t, a free extra account works.'],
    ['Add a virtual card', 'A second card number on the same account. No plastic, and usually free.'],
    [`Set a monthly limit of ${cap}`, 'The same as your monthly budget. Your bank will decline anything over it.'],
    ['Save it in your shopping apps', `Add it as the payment card in ${appList}.`],
    ['Remove your other cards from those apps', 'So the capped card is the only way to pay.'],
  ];
  const n = steps.filter((_, i) => done.includes(i)).length;
  const all = n === steps.length;

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const toggle = (i: number) => setState((s) => ({ bankSteps: s.bankSteps.includes(i) ? s.bankSteps.filter((x) => x !== i) : [...s.bankSteps, i] }));
  const finish = () => {
    if (!all) return;
    setState({ bankLock: { at: Date.now(), amount: total } });
    router.replace('/bankseal');
  };
  const removeLimit = () =>
    Alert.alert('Removed your card limit?', 'Your seal comes off. You can set it up again any time.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'I removed it',
        style: 'destructive',
        onPress: () => {
          setState({ bankLock: null, bankSteps: [] });
          back();
          setTimeout(() => toast('Badge removed. Set it up again any time.'), 300);
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>{lock ? 'Your bank limit' : 'Add a bank limit'}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Seal size={68} tier={lock ? tierFor(lockDays()) : -1} />
          <Text style={[type.body, { flex: 1 }]}>
            Till Morning nudges you. A card limit adds an extra barrier that your bank enforces, not Till Morning. It takes about 2 minutes, and it’s optional.
          </Text>
        </View>

        <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#23275E', overflow: 'hidden' }}>
            <LinearGradient colors={gradient.progress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 8, width: `${(n / steps.length) * 100}%` }} />
          </View>
          <Text style={[type.small, { fontVariant: ['tabular-nums'] }]}>
            {n} of {steps.length}
          </Text>
        </View>

        <Card style={{ marginTop: 14, paddingVertical: 4 }}>
          {steps.map(([t, d], k) => {
            const on = done.includes(k);
            return (
              <Pressable
                key={k}
                onPress={() => toggle(k)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderTopWidth: k ? 1.5 : 0, borderColor: color.divider }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? color.mint : '#23275E',
                    borderWidth: 2,
                    borderColor: on ? color.mint : '#3A3F86',
                  }}
                >
                  {on ? <IconCheck size={16} color={color.inkOnBright} /> : <Text style={{ fontFamily: font.display, fontSize: 15, color: color.text2 }}>{k + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[type.title, on && { color: color.text2, textDecorationLine: 'line-through' }]}>{t}</Text>
                  <Text style={[type.small, { marginTop: 2 }]}>{d}</Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
        <Text style={[type.small, { marginTop: 14, textAlign: 'center' }]}>
          Tap each step when you’ve done it. Till Morning can’t see your card or your bank, so this is on your word.
        </Text>
        {lock && (
          <Pressable onPress={removeLimit} accessibilityRole="button" style={{ marginTop: 14, alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: color.text3, textDecorationLine: 'underline' }}>I removed my card limit</Text>
          </Pressable>
        )}
      </ScrollView>
      <View style={{ paddingHorizontal: 28, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        {lock ? (
          <Button label="See my seal" onPress={() => router.push('/bankseal')} />
        ) : (
          <Button label={all ? 'I’ve set my limit' : `Finish the steps (${n} of ${steps.length})`} icon={all ? <IconLock size={18} color="#FFFFFF" /> : undefined} disabled={!all} onPress={finish} />
        )}
      </View>
    </View>
  );
}
