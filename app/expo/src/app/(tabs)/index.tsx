import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { endPass, formatReady, protectedCount, readyWants, shieldChosenApps } from '../../lib/core';
import { hasTmNative } from '../../../modules/tm-native';
import { type MyApp, myApps } from '../../lib/apps';
import { lockDays, TIERS, tierFor } from '../../lib/budget';
import { hh, nightOn, pauseSeconds, risky } from '../../lib/rules';
import { setState, useAppState } from '../../lib/store';
import { COACH_TIPS, nextUnlock, recapDue } from '../../lib/week';
import { TipSheet } from '../../ui/TipSheet';
import { TopGlow } from '../../ui/backgrounds';
import { xpToast } from '../../lib/xp';
import { Button, Card, Chip, Rise, toast } from '../../ui/components';
import { IconCaret, IconHourglass, IconMoon, IconShield, IconTicket } from '../../ui/icons';
import { useTabBarSpace } from '../../ui/layout';
import { RankCard } from '../../ui/RankCard';
import { Seal } from '../../ui/Seal';
import { WhichAppSheet } from '../../ui/WhichAppSheet';
import { color, font, gradient, type } from '../../ui/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Bank limit seal on Today: tier, days and progress to the next seal. */
function BankSealCard({ at }: { at: number }) {
  const d = lockDays(at);
  const ti = tierFor(d);
  const t = TIERS[ti];
  const nx = TIERS[ti + 1];
  const pct = nx ? Math.round(((d - t.from) / (nx.from - t.from)) * 100) : 100;
  return (
    <Pressable onPress={() => router.push('/bank')} accessibilityRole="button" accessibilityLabel={`${t.name} seal, day ${d}`}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Seal size={52} tier={ti} />
        <View style={{ flex: 1 }}>
          <Text style={type.title}>{t.name} seal</Text>
          <Text style={type.small}>Bank limit, self-reported</Text>
          <View style={{ marginTop: 6, height: 6, borderRadius: 3, backgroundColor: '#23275E', overflow: 'hidden' }}>
            <LinearGradient colors={[t.c[1], t.c[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 6, width: `${pct}%` }} />
          </View>
          <Text style={[type.small, { marginTop: 4 }]}>{nx ? `${nx.from - d} day${nx.from - d === 1 ? '' : 's'} to ${nx.name}` : 'Top seal reached'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: font.display, fontSize: 26, color: t.c[1] }}>{d}</Text>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.text2 }}>day{d === 1 ? '' : 's'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Today() {
  const insets = useSafeAreaInsets();
  const s = useAppState((st) => st);
  const now = useNow();
  const tabSpace = useTabBarSpace();

  const counts = protectedCount();
  const shielded = counts.apps + counts.categories;
  const ready = readyWants(now);
  const waiting = s.parked.filter((w) => !w.decided && w.readyAt > now);
  const unlock = nextUnlock();
  const coach = s.coachStep >= 0 && s.coachStep < COACH_TIPS.length ? COACH_TIPS[s.coachStep] : null;
  const [whichApps, setWhichApps] = useState<MyApp[] | null>(null);
  const setup: ['/budget' | '/passintro' | '/bank', string, string, boolean][] = [
    ['/budget', 'Set a monthly budget', 'One total, split across your apps', s.budgetTotal > 0 || s.budgetSkipped],
    ['/passintro', 'Meet the Shopping Pass', 'How to shop on purpose, and your usual pass length', s.passSet],
    ['/bank', 'Add a bank limit (optional)', 'An extra barrier your bank enforces', !!s.bankLock],
  ];
  const setupLeft = s.subscribed ? setup.filter((x) => !x[3]).length : 0;

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 24, paddingBottom: tabSpace + 76, gap: 14 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={type.h1}>{greeting()}</Text>
          {s.shieldsOn ? (
            <Chip tone="mint" label="Shields on" icon={<IconShield size={13} />} />
          ) : (
            <Chip tone="paper" label="Shields off" />
          )}
        </View>

        {/* Check-in nudge */}
        {s.pendingCheckIn && (
          <Rise>
            <Pressable onPress={() => router.push('/checkin')} accessibilityRole="button">
              <View style={{ borderRadius: 22, backgroundColor: color.sunEdge, paddingBottom: 3 }}>
                <View style={{ borderRadius: 22, backgroundColor: color.sun, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(20,22,58,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <IconTicket size={22} color={color.inkOnBright} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.title, { color: color.inkOnBright }]}>{s.pendingCheckIn.wholeSelection ? 'Your Shopping Pass ended' : `Your ${s.pendingCheckIn.app} pass ended`}</Text>
                    <Text style={{ fontFamily: font.bodySemi, fontSize: 14, color: color.inkOnBright }}>How did it go?</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Rise>
        )}

        {/* Live pass */}
        {s.pass && (
          <Rise>
            <View style={{ borderRadius: 22, backgroundColor: '#5427B8', paddingBottom: 3 }}>
              <LinearGradient
                colors={gradient.ticket}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.6 }}
                style={{ borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[type.title, { color: '#FFFFFF' }]}>{s.pass.wholeSelection ? 'Shopping pass' : `${s.pass.app} pass`}</Text>
                  <Text numberOfLines={2} style={{ fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                    {(s.pass.need || { specific: 'Something specific', browsing: 'Just browsing', unsure: 'Not sure yet' }[s.pass.reason]) +
                      (s.pass.limit ? `, up to £${s.pass.limit}` : '')}
                  </Text>
                  <Pressable onPress={() => endPass(true)} accessibilityRole="button" hitSlop={8} style={{ marginTop: 8 }}>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, color: '#FFFFFF', textDecorationLine: 'underline' }}>End it now</Text>
                  </Pressable>
                </View>
                <View style={{ width: 0, alignSelf: 'stretch', borderLeftWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.36)' }} />
                <View style={{ alignItems: 'center', minWidth: 64 }}>
                  <Text style={{ fontFamily: font.display, fontSize: 24, color: '#FFFFFF', fontVariant: ['tabular-nums'] }}>
                    {mmss(s.pass.endsAt - now)}
                  </Text>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>left</Text>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    height: 5,
                    backgroundColor: 'rgba(255,255,255,0.32)',
                    width: `${Math.max(0, Math.min(100, ((s.pass.endsAt - now) / (s.pass.endsAt - s.pass.startedAt)) * 100))}%`,
                  }}
                />
              </LinearGradient>
            </View>
          </Rise>
        )}

        {/* Status */}
        <Rise delay={40}>
          <Card style={{ alignItems: 'center', paddingVertical: 22 }}>
            <Image source={require('../../../assets/mascots/shieldm.webp')} style={{ width: 84, height: 84 }} resizeMode="contain" />
            {s.lapsed ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>Protection is paused</Text>
                <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>Your plan has ended, so every shield is lifted.</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button label="Turn protection back on" onPress={() => router.push('/paywall')} />
                </View>
              </>
            ) : s.shieldsOn && s.offUntil > now ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>Shields are off till tomorrow</Text>
                <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>They come back on by themselves at 07:00 tomorrow.</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button
                    label="Turn them back on now"
                    onPress={() => {
                      const r = shieldChosenApps();
                      toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
                    }}
                  />
                </View>
              </>
            ) : !s.shieldsOn ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>Shields are off</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button
                    label="Turn shields back on"
                    onPress={() => {
                      const r = shieldChosenApps();
                      toast(r ? xpToast(r, 'Shields are back on') : 'Shields are back on');
                    }}
                  />
                </View>
              </>
            ) : shielded === 0 ? (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>No apps shielded</Text>
                <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
                  <Button label="Choose apps" onPress={() => router.push({ pathname: '/setup', params: { step: 'picker' } })} />
                </View>
              </>
            ) : (
              <>
                <Text style={[type.h2, { marginTop: 10, textAlign: 'center' }]}>
                  {counts.categories > 0
                    ? `${counts.categories === 1 ? 'A whole category' : `${counts.categories} categories`}${counts.apps ? ` and ${counts.apps} more` : ''} shielded`
                    : counts.apps === 1
                      ? '1 app is shielded'
                      : `${counts.apps} apps are shielded`}
                </Text>
                <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>
                  {nightOn(now)
                    ? `Night lock is on till ${hh(s.settings.nlTo)}: park it or close it.`
                    : risky(now)
                      ? `It’s your risky hour, so pauses are ${pauseSeconds(now)} seconds.`
                      : `Pauses get longer from 22:00.${s.settings.nlOn ? ` Night lock from ${hh(s.settings.nlFrom)}.` : ''}`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.mint }} />
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.mintText }}>Shields working</Text>
                </View>
              </>
            )}
          </Card>
        </Rise>

        {/* Sale week */}
        {s.settings.sale && (
          <Rise delay={60}>
            <View style={{ borderRadius: 22, backgroundColor: 'rgba(255,143,120,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,143,120,0.32)', padding: 16 }}>
              <Text style={[type.title, { color: '#FFE4DC' }]}>It’s Black Friday week</Text>
              <Text style={[type.small, { color: '#FFE4DC' }]}>Waits are doubled until Monday.</Text>
            </View>
          </Rise>
        )}

        {/* Waiting room */}
        <Rise delay={80}>
          <Pressable onPress={() => router.push('/waiting')} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ready.length ? 'rgba(94,233,181,0.14)' : 'rgba(167,139,250,0.19)',
                }}
              >
                {ready.length ? <IconHourglass size={22} color="#6EF0BF" /> : <IconMoon size={22} color="#CBBBFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.label, { color: ready.length ? color.mintText : color.text3 }]}>
                  {ready.length ? 'Ready now' : waiting.length ? `Ready ${formatReady(Math.min(...waiting.map((w) => w.readyAt)), now)}` : 'Waiting room'}
                </Text>
                <Text style={type.title}>
                  {ready.length
                    ? `${ready.length} ready to decide`
                    : waiting.length
                      ? `${waiting.length} parked ${waiting.length === 1 ? 'want' : 'wants'}`
                      : 'Nothing parked'}
                </Text>
                <Text style={type.small}>
                  {ready.length
                    ? 'You slept on it. Now you get the final say.'
                    : waiting.length
                      ? 'Decide with a clear head.'
                      : 'When a want hits, park it till morning.'}
                </Text>
              </View>
            </Card>
          </Pressable>
        </Rise>

        {/* Next steps: week-one feature card, Sunday recap */}
        {unlock && (
          <Rise delay={90}>
            <Pressable onPress={() => router.push({ pathname: '/unlock', params: { k: unlock.k } })} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderColor: 'rgba(255,201,77,0.45)' }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,201,77,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>✨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Chip tone="sun" size={11} label={`New · day ${unlock.day}`} />
                  <Text style={[type.title, { marginTop: 4 }]}>{unlock.t}</Text>
                  <Text style={type.small}>{unlock.kick}</Text>
                </View>
                <IconCaret />
              </Card>
            </Pressable>
          </Rise>
        )}
        {recapDue(now) && (
          <Rise delay={95}>
            <Pressable onPress={() => router.push('/recap')} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.19)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>Your week with Till Morning</Text>
                  <Text style={type.small}>Sunday recap: pauses, waits and passes</Text>
                </View>
                <IconCaret />
              </Card>
            </Pressable>
          </Rise>
        )}

        {/* Next step: a parcel to open */}
        {s.queue.length > 0 && (
          <Rise delay={100}>
            <Pressable onPress={() => router.push('/parcel')} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,201,77,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 24 }}>🎁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>{s.queue.length > 1 ? `${s.queue.length} parcels to open` : 'A parcel to open'}</Text>
                  <Text style={type.small}>You finished a sticker goal</Text>
                </View>
                <IconCaret />
              </Card>
            </Pressable>
          </Rise>
        )}

        {/* Rank */}
        <Rise delay={120}>
          <RankCard />
        </Rise>

        {/* Bank limit seal, or the offer to add one once setup is done */}
        {s.bankLock ? (
          <Rise delay={140}>
            <BankSealCard at={s.bankLock.at} />
          </Rise>
        ) : s.subscribed && (setupLeft === 0 || s.setupHidden) ? (
          <Rise delay={140}>
            <Pressable onPress={() => router.push('/bank')} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Seal size={48} tier={-1} />
                <View style={{ flex: 1 }}>
                  <Text style={type.title}>Add a bank limit</Text>
                  <Text style={type.small}>An optional extra barrier your bank enforces</Text>
                </View>
                <IconCaret />
              </Card>
            </Pressable>
          </Rise>
        ) : null}

        {/* Things moved out of setup, discovered here one at a time */}
        {!s.setupHidden && setupLeft > 0 && (
          <Rise delay={150}>
            <Card style={{ paddingVertical: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h2}>Finish setting up</Text>
                  <Text style={type.small}>
                    {setup.length - setupLeft} of {setup.length} done, at your own pace
                  </Text>
                </View>
                <Pressable onPress={() => setState({ setupHidden: true })} accessibilityRole="button" hitSlop={8}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: color.text3, textDecorationLine: 'underline' }}>Hide</Text>
                </Pressable>
              </View>
              {setup.map(([path, t, d, ok], i) => (
                <Pressable
                  key={path}
                  onPress={() => router.push(path)}
                  accessibilityRole="button"
                  accessibilityState={{ checked: ok }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1.5, borderColor: color.divider }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ok ? color.mint : '#23275E' }}>
                    {ok ? <Text style={{ fontFamily: font.display, color: color.inkOnBright }}>✓</Text> : <Text style={{ fontFamily: font.display, fontSize: 15, color: color.text2 }}>{i + 1}</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.title, ok && { color: color.text2, textDecorationLine: 'line-through' }]}>{t}</Text>
                    <Text style={type.small}>{d}</Text>
                  </View>
                  <IconCaret />
                </Pressable>
              ))}
            </Card>
          </Rise>
        )}
      </ScrollView>

      {/* Fixed footer above the tab bar: Need to shop? */}
      {!s.pass && (
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: tabSpace - 4 }}>
          {nightOn(now) ? (
            <Pressable
              onPress={() => toast(`Shopping Passes sleep till ${hh(s.settings.nlTo)}. Park it till morning instead.`)}
              accessibilityRole="button"
              style={{ height: 56, borderRadius: 999, backgroundColor: '#1E2256', borderWidth: 1.5, borderColor: '#343A86', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <IconMoon size={20} color={color.text2} />
              <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, color: color.text2 }}>Passes sleep till {hh(s.settings.nlTo)}</Text>
            </Pressable>
          ) : (
          <Pressable
            onPress={() => {
              // With app names from iOS, pick the app first; older installs pause for every app.
              const apps = myApps().filter((a) => a.token && !s.offApps.includes(a.key));
              if (hasTmNative && apps.length) {
                setWhichApps(apps);
                return;
              }
              router.push({ pathname: '/pause', params: { app: 'your shop apps' } });
            }}
            accessibilityRole="button"
            accessibilityHint="You get the usual pause first"
          >
            {({ pressed }) => (
              <View style={{ borderRadius: 999, backgroundColor: '#4B2BB0', paddingBottom: pressed ? 1 : 4, marginTop: pressed ? 3 : 0 }}>
                <LinearGradient
                  colors={gradient.passPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 56, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <IconTicket size={20} />
                  <Text style={{ fontFamily: font.bodyHeavy, fontSize: 17, color: '#FFFFFF' }}>Need to shop? Get a pass</Text>
                </LinearGradient>
              </View>
            )}
          </Pressable>
          )}
        </View>
      )}

      <WhichAppSheet visible={!!whichApps} apps={whichApps ?? []} onClose={() => setWhichApps(null)} />

      {/* First-time coach tour, right after the paywall */}
      {coach && (
        <TipSheet
          visible
          title={coach.t}
          body={coach.d}
          step={s.coachStep}
          steps={COACH_TIPS.length}
          next={s.coachStep === COACH_TIPS.length - 1 ? 'Got it' : 'Next'}
          onNext={() => setState({ coachStep: s.coachStep + 1 >= COACH_TIPS.length ? -1 : s.coachStep + 1 })}
          onSkip={() => setState({ coachStep: -1 })}
        />
      )}
    </View>
  );
}
