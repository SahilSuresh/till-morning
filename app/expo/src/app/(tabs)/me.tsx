import { CalendarCheckIcon, CaretRightIcon, CheckIcon } from '../../ui/ph';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../lib/store';
import { TopGlow } from '../../ui/backgrounds';
import { Card, Rise } from '../../ui/components';
import { useTabBarSpace } from '../../ui/layout';
import { MorningCard } from '../../ui/MorningCard';
import { RankCard } from '../../ui/RankCard';
import type { SpotRef } from '../../ui/Spotlight';
import { SkyCorner } from '../../ui/SkyCorner';
import { BankSealCard, NoteCard } from '../../ui/tabs/MeParts';
import { DecisionsReceipt, ParcelButton, StickerShelf } from '../../ui/tabs/MeNight';
import { type ScrollRef, TabTip } from '../../ui/tabs/TabTip';
import { XpRules } from '../../ui/tabs/XpRules';
import { color, type } from '../../ui/theme';
import { Pressable } from '../../ui/Pressable';

/** progressTab() from the prototype (P:L2090–2116): rank, Morning card, stickers, your note, XP rules, recent decisions. */
export default function Me() {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const helped = useAppState((s) => s.pauseHelped);
  const bankLock = useAppState((s) => s.bankLock);
  const log = useAppState((s) => s.xp.log);
  const [openXp, setOpenXp] = useState(false);
  const scrollRef: ScrollRef = useRef(null);
  const rankRef: SpotRef = useRef(null);
  const recent = [...log].reverse().slice(0, 8);

  return (
    <View style={{ flex: 1 }}>
      <TopGlow />
      <ScrollView ref={scrollRef} contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 24, paddingBottom: tabSpace }}>
        {/* Me, with tonight's sky on the right like Today */}
        <Rise style={{ height: 44, justifyContent: 'center' }}>
          <Text accessibilityRole="header" style={type.h1}>
            Me
          </Text>
          <SkyCorner style={{ top: 2 }} />
        </Rise>

        <Rise delay={40} style={{ marginTop: 16 }}>
          <RankCard targetRef={rankRef} />
        </Rise>

        <Rise delay={30} style={{ marginTop: 20 }}>
          <MorningCard />
        </Rise>

        {bankLock && (
          <Rise delay={60} style={{ marginTop: 16 }}>
            <BankSealCard at={bankLock.at} />
          </Rise>
        )}

        {/* the sticker book: stickers on a shelf, tap to open the whole book */}
        <Rise delay={80} style={{ marginTop: 20, gap: 12 }}>
          <StickerShelf />
          <ParcelButton />
        </Rise>

        {helped.asked > 0 && (
          <Rise delay={100} style={{ marginTop: 16 }}>
            <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(94,233,181,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={22} weight="bold" color="#6EF0BF" />
              </View>
              <Text style={[type.title, { flex: 1 }]}>
                The pause helped {helped.yes}/{helped.asked} times
              </Text>
            </Card>
          </Rise>
        )}

        <Rise delay={120} style={{ marginTop: 16 }}>
          <NoteCard />
        </Rise>

        {/* Your week: pauses, waits and passes (also on Today every Sunday) */}
        <Rise delay={130} style={{ marginTop: 16 }}>
          <Pressable onPress={() => router.push('/recap')} accessibilityRole="button">
            <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(167,139,250,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarCheckIcon size={22} weight="bold" color="#C4B5FD" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.title}>Your week</Text>
                <Text style={type.small}>Pauses, waits and passes</Text>
              </View>
              <CaretRightIcon size={18} weight="bold" color={color.text3} />
            </Card>
          </Pressable>
        </Rise>

        {/* How XP works (a <details> card in the prototype) */}
        <Rise delay={140} style={{ marginTop: 16 }}>
          <Card style={{ padding: 8 }}>
            <Pressable
              onPress={() => setOpenXp((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: openXp }}
              style={{ paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={[type.title, { flex: 1 }]}>How XP works</Text>
              <View style={{ transform: [{ rotate: openXp ? '90deg' : '0deg' }] }}>
                <CaretRightIcon size={18} weight="bold" color={color.text3} />
              </View>
            </Pressable>
            {openXp && <XpRules />}
          </Card>
        </Rise>

        {/* Recent decisions, printed as a Till Morning receipt */}
        <Rise delay={160} style={{ marginTop: 24 }}>
          <DecisionsReceipt entries={recent} />
        </Rise>
      </ScrollView>

      <TabTip k="me" targetRef={rankRef} scrollRef={scrollRef} radius={24} />
    </View>
  );
}
