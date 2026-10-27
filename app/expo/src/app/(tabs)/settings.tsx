import { router, useFocusEffect } from 'expo-router';
import * as StoreReview from 'expo-store-review';
import { ArrowCounterClockwiseIcon, BellRingingIcon, CalendarCheckIcon, CrownSimpleIcon, EyeIcon, FileTextIcon, HeartIcon, type Icon, LifebuoyIcon, LockIcon, LockKeyIcon, MoonStarsIcon, PiggyBankIcon, ScrollIcon, ShieldCheckIcon, ShieldIcon, SquaresFourIcon, StarIcon, ToggleRightIcon } from '../../ui/ph';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, ScrollView, Switch, Text, TextInput, type TextInputProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { budgetSummary, lockDays } from '../../lib/budget';
import { config, links } from '../../lib/config';
import { applyShieldLook, liftAllShields, protectedCount, shieldChosenApps, syncShields, turnOffTillTomorrow } from '../../lib/core';
import { restorePurchases } from '../../lib/purchases';
import { hh } from '../../lib/rules';
import { type AppState, resetState, setState, useAppState } from '../../lib/store';
import { lose, xpToast } from '../../lib/xp';
import { LinearGradient } from 'expo-linear-gradient';
import { Tag, toast } from '../../ui/components';
import { SkyCorner } from '../../ui/SkyCorner';
import { NightShopCard } from '../../ui/tabs/SettingsNight';
import { Enter, Tile, type TileTone } from '../../ui/flow/kit';
import { IconCaret } from '../../ui/icons';
import { TimePick } from '../../ui/TimePick';
import { useTabBarSpace } from '../../ui/layout';
import { color, font, type } from '../../ui/theme';
import { play } from '../../lib/sound';
import { Pressable } from '../../ui/Pressable';

// settingsTab() in the prototype (P:L2155): cards of rows, each with a tinted icon tile.

const rowLine = { borderTopWidth: 1.5, borderTopColor: color.divider } as const;

/** A plain row (`row()` in the prototype): px-4 py-3.5 with a full-width line above it. */
function Cell({ children, first }: { children: ReactNode; first?: boolean }) {
  return <View style={[{ paddingHorizontal: 16, paddingVertical: 14 }, !first && rowLine]}>{children}</View>;
}

/** A row with an icon tile (`link()` in the prototype). Shows a caret, a link word, or a switch on the right. */
function Row({
  Icon: I,
  tone,
  label,
  sub,
  onPress,
  right,
  link,
  first,
  danger,
}: {
  Icon: Icon;
  tone: TileTone;
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: ReactNode;
  link?: string;
  first?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent' },
        !first && rowLine,
      ]}
    >
      <Tile tone={tone} Icon={I} weight={I === StarIcon ? 'fill' : 'bold'} />
      <View style={{ flex: 1 }}>
        <Text style={[type.title, danger && { color: '#FF9F94' }]}>{label}</Text>
        {sub ? <Text style={type.small}>{sub}</Text> : null}
      </View>
      {right ??
        (link ? (
          <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.blueLight, textDecorationLine: 'underline' }}>{link}</Text>
        ) : onPress ? (
          <IconCaret size={20} />
        ) : null)}
    </Pressable>
  );
}

/** A section heading in moon-yellow small caps, with a little star. */
function Head({ title, d }: { title: string; d: number }) {
  return (
    <Enter d={d}>
      <View style={{ marginTop: 26, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <Text style={{ fontSize: 11, color: '#FFE7A3' }}>✦</Text>
        <Text accessibilityRole="header" style={{ fontFamily: font.bodyHeavy, fontSize: 12.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#FFE7A3' }}>
          {title}
        </Text>
      </View>
    </Enter>
  );
}

/** A card whose rows run edge to edge, with lines between them. */
function Group({ children, d, style }: { children: ReactNode; d: number; style?: object }) {
  return (
    <Enter d={d} style={style}>
      <View style={{ borderRadius: 22, backgroundColor: '#15184A', paddingBottom: 3 }}>
        <LinearGradient colors={['#1E2256', '#23286A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, borderWidth: 1, borderColor: '#3A3F86', overflow: 'hidden' }}>
          {children}
        </LinearGradient>
      </View>
    </Enter>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch
      value={value}
      onValueChange={(v) => {
        play(v ? 'toggleOn' : 'toggleOff');
        onChange(v);
      }}
      accessibilityLabel={label}
      trackColor={{ true: '#7C4DFF', false: '#2B2F69' }}
      ios_backgroundColor="#2B2F69"
    />
  );
}

/** Equal-width choices, one column per option (`seg()` in the prototype). */
function Seg<T extends string | number>({ options, value, onPick, label }: { options: [T, string][]; value: T; onPick: (v: T) => void; label: string }) {
  return (
    <View accessibilityLabel={label} style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      {options.map(([v, l]) => (
        <Tag key={String(v)} fill label={l} selected={value === v} onPress={() => onPick(v)} />
      ))}
    </View>
  );
}

const fieldStyle = {
  marginTop: 12,
  backgroundColor: color.field,
  borderColor: color.fieldBorder,
  borderWidth: 1.5,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontFamily: font.bodySemi,
  fontSize: 16,
  color: color.text,
};

/**
 * A text field that keeps what you type to itself and saves once, when you finish
 * (Done, leaving the field, or leaving the screen), so typing never touches the shield.
 */
function CommitInput({ value, onCommit, ...props }: { value: string; onCommit: (v: string) => void } & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const [text, setText] = useState(value);
  const editing = useRef(false);
  const latest = useRef(value);
  const saved = useRef(value);
  useEffect(() => {
    if (editing.current) return;
    setText(value);
    latest.current = value;
    saved.current = value;
  }, [value]);
  const commit = useRef(() => {
    editing.current = false;
    if (latest.current === saved.current) return;
    saved.current = latest.current;
    onCommitRef.current(latest.current);
  }).current;
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;
  useEffect(() => commit, [commit]);
  return (
    <TextInput
      {...props}
      value={text}
      onChangeText={(t) => {
        editing.current = true;
        latest.current = t;
        setText(t);
      }}
      onEndEditing={commit}
      onSubmitEditing={commit}
      returnKeyType="done"
    />
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  // Only what this screen shows, so unrelated changes (XP, the pause log…) don't re-render it.
  const shieldsOn = useAppState((s) => s.shieldsOn);
  const offUntil = useAppState((s) => s.offUntil);
  const st = useAppState((s) => s.settings);
  const meals = useAppState((s) => s.meals);
  const goal = useAppState((s) => s.goal);
  const bankLock = useAppState((s) => s.bankLock);
  const budgetTotal = useAppState((s) => s.budgetTotal);
  const split = useAppState((s) => s.split);
  const lapsed = useAppState((s) => s.lapsed);
  const trialAt = useAppState((s) => s.trialAt);
  const [more, setMore] = useState(false);
  const offTill = offUntil > Date.now();

  // The protected-app count comes from Screen Time: read it when Settings comes into view, not on every render.
  const [count, setCount] = useState(protectedCount);
  useFocusEffect(useCallback(() => setCount(protectedCount()), []));
  const budget = useMemo(() => budgetSummary(), [budgetTotal, split]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<AppState['settings']>, resync = false) => {
    setState((x) => ({ settings: { ...x.settings, ...patch } }));
    if (resync) syncShields();
    else applyShieldLook();
  };

  const toggleShields = (on: boolean) => {
    if (on) {
      const r = shieldChosenApps();
      toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
    } else {
      Alert.alert('Switch every shield off?', 'Your apps open straight away until you switch them back on. Today won’t get a stamp.', [
        { text: 'Keep them on', style: 'cancel' },
        {
          text: 'Switch off',
          style: 'destructive',
          onPress: () => {
            liftAllShields();
            lose(10, 'Switched every shield off');
            toast('−10 XP · Shields are off');
          },
        },
      ]);
    }
  };

  // Easy to mix up with night lock, so the pop-up says what it does and offers night lock on its own.
  const askOffTill = () =>
    Alert.alert(
      'Turn every shield off?',
      `All your apps open with no pause until 07:00. You keep your XP and your waiting room, but today won’t get a stamp.${
        st.nlOn ? '\n\nOnly want passes back at night? Turn off night lock instead and your shields stay on.' : ''
      }`,
      [
        { text: 'Keep shields on', style: 'cancel' },
        ...(st.nlOn
          ? [
              {
                text: 'Only turn off night lock',
                onPress: () => {
                  set({ nlOn: false });
                  toast('Night lock off. Your shields stay on.');
                },
              },
            ]
          : []),
        {
          text: 'Turn every shield off',
          style: 'destructive' as const,
          onPress: () => {
            turnOffTillTomorrow();
            toast('Every shield is off till 07:00');
          },
        },
      ],
    );

  const askDelete = () =>
    Alert.alert('Delete all data?', 'Your apps, habits, XP and history are removed from this phone. You’ll start setup again.', [
      { text: 'Keep my data', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          liftAllShields();
          await resetState();
          router.replace('/setup');
          setTimeout(() => toast('All data deleted'), 500);
        },
      },
    ]);

  const rate = async () => {
    // Apple's own rating sheet first (it works in review too); the App Store page only as a fallback.
    if (await StoreReview.hasAction()) return StoreReview.requestReview();
    const url = StoreReview.storeUrl();
    if (url) Linking.openURL(`${url}?action=write-review`);
    else toast('Reviews open once Till Morning is on the App Store');
  };

  const onRestore = async () => {
    try {
      const active = await restorePurchases();
      Alert.alert(active ? 'Purchases restored' : 'No active subscription found');
    } catch (e) {
      Alert.alert('Could not restore purchases', String(e));
    }
  };

  const days = bankLock ? lockDays() : 0;

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingHorizontal: 24, paddingBottom: tabSpace }} keyboardShouldPersistTaps="handled">
        <Enter style={{ height: 44, justifyContent: 'center' }}>
          <Text accessibilityRole="header" style={type.h1}>
            Settings
          </Text>
          <SkyCorner style={{ top: 2 }} />
        </Enter>

        <Enter d={30} style={{ marginTop: 18 }}>
          <NightShopCard
            on={shieldsOn && count.apps + count.categories > 0}
            apps={count.categories ? `${count.apps} apps and ${count.categories} categor${count.categories === 1 ? 'y' : 'ies'}` : `${count.apps} app${count.apps === 1 ? '' : 's'}`}
            nightLock={st.nlOn ? `${hh(st.nlFrom)}–${hh(st.nlTo)}` : null}
            pauseSeconds={st.pauseSeconds}
          />
        </Enter>

        <Group d={40} style={{ marginTop: 12 }}>
          <Row
            first
            Icon={ShieldCheckIcon}
            tone="mint"
            label="Shield my apps"
            sub={shieldsOn ? 'On. Your apps open with a pause.' : 'Off. Your apps open straight away.'}
            right={<Toggle label="Shield my apps" value={shieldsOn} onChange={toggleShields} />}
          />
          {shieldsOn &&
            (offTill ? (
              <Row
                Icon={ShieldIcon}
                tone="peach"
                label="Every shield is off till 07:00"
                sub="Tap to turn them back on now"
                onPress={() => {
                  const r = shieldChosenApps();
                  toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
                }}
              />
            ) : (
              <Row Icon={ShieldIcon} tone="peach" label="Turn every shield off till 07:00" sub="All apps open with no pause until morning" onPress={askOffTill} />
            ))}
          <Row
            Icon={SquaresFourIcon}
            tone="lav"
            label="Your apps"
            sub={
              count.apps + count.categories
                ? `${count.apps} app${count.apps === 1 ? '' : 's'}${count.categories ? ` and ${count.categories} categor${count.categories === 1 ? 'y' : 'ies'}` : ''} protected`
                : 'None chosen yet'
            }
            onPress={() => router.push('/apps')}
          />
          <Row Icon={CalendarCheckIcon} tone="sun" label="Your rules" sub="Challenge, treat nights, when to shield" onPress={() => router.push('/rules')} />
        </Group>

        <Head title="Night lock" d={50} />
        <Group d={55}>
          <Row
            first
            Icon={MoonStarsIcon}
            tone="hush"
            label="Night lock"
            sub={st.nlOn ? `${hh(st.nlFrom)} to ${hh(st.nlTo)}: only Park it or Close. Passes sleep.` : 'Off. Nights get the longer pause instead.'}
            right={
              <Toggle
                label="Night lock"
                value={st.nlOn}
                onChange={(v) => {
                  set({ nlOn: v });
                  toast(v ? `Night lock on, ${hh(st.nlFrom)} to ${hh(st.nlTo)}` : 'Night lock off');
                }}
              />
            }
          />
          {st.nlOn && (
            <>
              <Cell>
                <Text style={type.title}>Starts</Text>
                {/* Hours after midnight count as 24+ so the stepper runs 20:00 → 02:00 without wrapping. */}
                <TimePick
                  label="Night lock starts"
                  options={[22, 23, 24]}
                  value={st.nlFrom < 12 ? st.nlFrom + 24 : st.nlFrom}
                  onChange={(v) => set({ nlFrom: v % 24 })}
                  min={20}
                  max={26}
                  unit="h"
                  unitLong="hours"
                  format={(v) => hh(v % 24)}
                />
                <Text style={[type.title, { marginTop: 16 }]}>Ends</Text>
                <TimePick
                  label="Night lock ends"
                  options={[6, 7, 8]}
                  value={st.nlTo}
                  onChange={(v) => set({ nlTo: v })}
                  min={4}
                  max={10}
                  unit="h"
                  unitLong="hours"
                  format={(v) => hh(v)}
                />
              </Cell>
              <Row
                Icon={EyeIcon}
                tone="hush"
                label="See how night lock looks"
                sub="A preview of the night-lock screen"
                onPress={() => router.push({ pathname: '/pause', params: { app: 'Your shop app', preview: 'night' } })}
              />
            </>
          )}
        </Group>

        <Head title="Pause" d={60} />
        <Group d={80}>
          <Row
            first
            Icon={HeartIcon}
            tone="sun"
            label="Backup dinner"
            sub={meals.length ? meals.map((m) => m.n).join(', ') : 'Easy meals to show on takeaway pauses'}
            onPress={() => router.push('/meals')}
          />
          <Cell>
            <Text style={type.title}>How long the pause lasts</Text>
            <TimePick
              label="Pause length"
              options={[10, 15, 30, 60]}
              value={st.pauseSeconds}
              onChange={(v) => set({ pauseSeconds: v })}
              min={10}
              max={300}
              step={5}
              unit="s"
              unitLong="seconds"
            />
          </Cell>
        </Group>

        <Group d={100} style={{ marginTop: 24 }}>
          <Pressable
            onPress={() => setMore((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: more }}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
            })}
          >
            <Tile tone="hush" Icon={ToggleRightIcon} />
            <View style={{ flex: 1 }}>
              <Text style={type.title}>More options</Text>
              <Text style={type.small}>Budget, shield message, cool-off and more</Text>
            </View>
            <View style={{ transform: [{ rotate: more ? '-90deg' : '90deg' }] }}>
              <IconCaret size={20} />
            </View>
          </Pressable>
          {more && (
            <>
              <Row Icon={PiggyBankIcon} tone="sun" label="Monthly budget" sub={budget} link="Edit" onPress={() => router.push('/budget')} />
              <Cell>
                <Text style={type.title}>Your shield message</Text>
                <Text style={type.small}>Shown first on every shield, in your own words.</Text>
                <CommitInput
                  value={st.shieldMsg}
                  onCommit={(t) => set({ shieldMsg: t })}
                  maxLength={60}
                  accessibilityLabel="Your shield message"
                  placeholder="e.g. Is this worth an hour of work?"
                  placeholderTextColor={color.placeholder}
                  style={fieldStyle}
                />
              </Cell>
              <Cell>
                <Text style={type.title}>What you’re saving for</Text>
                <CommitInput
                  value={goal}
                  onCommit={(t) => {
                    setState({ goal: t });
                    applyShieldLook();
                  }}
                  maxLength={40}
                  accessibilityLabel="What you’re saving for"
                  placeholder="e.g. a Japan trip"
                  placeholderTextColor={color.placeholder}
                  style={fieldStyle}
                />
              </Cell>
              <Cell>
                <Text style={type.title}>Cool-off after you leave</Text>
                <Text style={type.small}>The app stays locked this long after you walk away.</Text>
                <TimePick
                  label="Cool-off length"
                  offOption={0}
                  options={[5, 10, 30]}
                  value={st.coolOffMinutes}
                  onChange={(v) => set({ coolOffMinutes: v })}
                  min={1}
                  max={120}
                  step={5}
                  unit="min"
                  unitLong="minutes"
                />
              </Cell>
              <Cell>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>Ask “What’s this one about?”</Text>
                    <Text style={type.small}>A question in the pause, with a short coach reply</Text>
                  </View>
                  <Toggle label="Ask a question during the pause" value={st.askQuestion} onChange={(v) => set({ askQuestion: v })} />
                </View>
              </Cell>
              <Cell>
                <Text style={type.title}>Shopping Pass lengths</Text>
                <Text style={type.small}>In minutes</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  {st.passPresets.map((m, i) => (
                    <View key={`${i}-${m}`} style={{ flex: 1, justifyContent: 'center' }}>
                      <TextInput
                        defaultValue={String(m)}
                        keyboardType="number-pad"
                        maxLength={3}
                        returnKeyType="done"
                        accessibilityLabel={`Pass length ${i + 1} in minutes`}
                        onEndEditing={(e) => {
                          const v = Math.min(120, Math.max(1, parseInt(e.nativeEvent.text || '0', 10) || m));
                          const next = [...st.passPresets] as [number, number, number];
                          next[i] = v;
                          set({ passPresets: next, defaultPassMinutes: next[1] });
                        }}
                        style={[fieldStyle, { marginTop: 0, paddingLeft: 16, paddingRight: 48, fontSize: 17 }]}
                      />
                      <Text pointerEvents="none" style={[type.small, { position: 'absolute', right: 14 }]}>
                        min
                      </Text>
                    </View>
                  ))}
                </View>
              </Cell>
              <Row
                Icon={LockKeyIcon}
                tone="lav"
                label="Bank limit"
                sub={bankLock ? `Set ${days} day${days === 1 ? '' : 's'} ago, self-reported` : 'Optional: a card limit your bank enforces'}
                link={bankLock ? 'Steps' : 'Set up'}
                onPress={() => router.push('/bank')}
              />
            </>
          )}
        </Group>

        <Head title="Till Morning" d={115} />
        <Group d={118}>
          <Row
            first
            Icon={BellRingingIcon}
            tone="lav"
            label="Sounds"
            sub={st.sounds !== false ? 'Little taps, chimes and the boom. Quiet when your phone is on silent.' : 'Off. Till Morning stays silent.'}
            right={<Toggle label="Sounds" value={st.sounds !== false} onChange={(v) => set({ sounds: v })} />}
          />
          <Row
            Icon={SquaresFourIcon}
            tone="lav"
            label="Safari and the Share button"
            sub="Catch a basket at checkout, or share a screenshot or link to park it"
            onPress={() => router.push('/safari')}
          />
        </Group>

        <Head title="Subscription and privacy" d={120} />
        <Group d={140}>
          <Row
            first
            Icon={CrownSimpleIcon}
            tone="lav"
            label={lapsed ? 'Protection is paused' : 'Till Morning Pro'}
            sub={
              lapsed
                ? 'Your plan has ended. Tap to turn protection back on.'
                : trialAt && Date.now() - trialAt < 7 * 86400000
                  ? `Free week, day ${Math.floor((Date.now() - trialAt) / 86400000) + 1} of 7. Cancel any time in your Apple account.`
                  : 'Manage or cancel in your Apple account'
            }
            onPress={() => (lapsed ? router.push('/paywall') : Linking.openURL('https://apps.apple.com/account/subscriptions'))}
          />
          <Row Icon={ArrowCounterClockwiseIcon} tone="hush" label="Restore purchases" onPress={onRestore} />
          <Row Icon={FileTextIcon} tone="hush" label="Privacy policy" onPress={() => Linking.openURL(links.privacy)} />
          <Row Icon={ScrollIcon} tone="hush" label="Terms of use" onPress={() => Linking.openURL(links.terms)} />
          <Row Icon={LifebuoyIcon} tone="hush" label="Support" onPress={() => Linking.openURL(links.support)} />
          <Cell>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Tile tone="mint" Icon={LockIcon} />
              <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 14.5, lineHeight: 20, color: color.text }}>
                Your wants, apps and notes stay on this phone. No bank links, no account.
              </Text>
            </View>
          </Cell>
        </Group>

        <Group d={150} style={{ marginTop: 16 }}>
          <Row first Icon={StarIcon} tone="sun" label="Rate Till Morning" sub="Write a review on the App Store" onPress={rate} />
        </Group>

        <Enter d={160} style={{ marginTop: 24 }}>
          <Pressable onPress={askDelete} accessibilityRole="button" style={({ pressed }) => ({ paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: '#FF9F8A', textAlign: 'center' }}>Delete all data</Text>
          </Pressable>
        </Enter>

        <Text style={{ marginTop: 24, fontFamily: font.bodySemi, fontSize: 13, color: color.text3, textAlign: 'center' }}>
          Version {config.version} ({config.build})
        </Text>
      </ScrollView>
    </View>
  );
}
