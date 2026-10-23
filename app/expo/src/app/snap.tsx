import { router } from 'expo-router';
import { Camera, CheckCircle, Hourglass, ShoppingBag } from '../ui/ph';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { AppLabel, hasTmNative } from '../../modules/tm-native';
import { myApps } from '../lib/apps';
import { BAND_LABEL, formatDuration, formatReady, parkWant, waitFor } from '../lib/core';
import { pickScreenshot, readScreenshot } from '../lib/ocr';
import { getState, type PriceBand } from '../lib/store';
import { award, xpToast } from '../lib/xp';
import { Button, Chip, CircleButton, Tag, TextLink, toast } from '../ui/components';
import { IconChevrons } from '../ui/icons';
import { color, font, type } from '../ui/theme';

const BANDS: PriceBand[] = ['unsure', 'under20', '20to50', '50to100', 'over100'];
type Read = { state: 'idle' } | { state: 'reading'; uri: string } | { state: 'done'; uri: string; total: number; items?: number } | { state: 'fail'; uri: string };

/** Dashed box that renders dashed on iOS (one-sided or plain dashed borders can draw solid). */
function DashedBox({ children, onPress, label }: { children: React.ReactNode; onPress: () => void; label: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 && (
        <Svg width={size.w} height={size.h} style={{ position: 'absolute' }} pointerEvents="none">
          <Rect x={1} y={1} width={size.w - 2} height={size.h - 2} rx={20} ry={20} fill="#161942" stroke="#3A4096" strokeWidth={1.5} strokeDasharray="6 5" />
        </Svg>
      )}
      {children}
    </Pressable>
  );
}

/**
 * Park something from a screenshot of a basket or checkout. The total and the number of items are
 * read on this phone (Apple's Vision); the picture never leaves it. The exact price sets the wait:
 * 1 hour for every £10, never ready at night.
 */
export default function Snap() {
  const insets = useSafeAreaInsets();
  const apps = useMemo(() => myApps().filter((a) => a.token || a.name), []);
  const [read, setRead] = useState<Read>({ state: 'idle' });
  const [what, setWhat] = useState('');
  const [appKey, setAppKey] = useState<string | null>(null);
  const [band, setBand] = useState<PriceBand>('unsure');
  const wage = getState().settings.wage || 12;

  const price = read.state === 'done' ? Math.round(read.total * 100) / 100 : 0;
  const items = read.state === 'done' ? read.items : undefined;
  const useBand: PriceBand = read.state === 'done' ? 'exact' : band;
  const now = Date.now();
  const { readyAt, chips } = waitFor(useBand, now, price);
  const picked = apps.find((a) => a.key === appKey) ?? null;
  const appName = picked?.name ?? (picked ? 'your shop app' : 'a shop');

  const back = () => (router.canGoBack() ? router.back() : router.replace('/waiting'));

  const choose = async () => {
    if (!hasTmNative) return toast('Reading screenshots needs the latest Till Morning install');
    const uri = await pickScreenshot().catch(() => null);
    if (!uri) return;
    setRead({ state: 'reading', uri });
    try {
      const r = await readScreenshot(uri);
      setRead(r.total ? { state: 'done', uri, total: r.total, items: r.items } : { state: 'fail', uri });
    } catch {
      setRead({ state: 'fail', uri });
    }
  };

  const park = () => {
    const name = what.trim() || (price ? `Basket${items ? `, ${items} items` : ''} from ${appName}` : '');
    const want = parkWant(picked?.name ?? 'a shop', name, useBand, picked?.token ? picked.key : null, {
      price: price || undefined,
      items,
      coolOff: false,
    });
    const r = award(5, `Parked ${name || 'a want'} in the waiting room`);
    router.replace('/waiting');
    setTimeout(() => toast(xpToast(r, `Parked till ${formatReady(want.readyAt)}`)), 400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.night }}>
      <View style={{ paddingTop: insets.top - 3, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton label="Back" onPress={back}>
          <View style={{ transform: [{ rotate: '180deg' }] }}>
            <IconChevrons size={16} />
          </View>
        </CircleButton>
        <Text style={type.h2}>Park it till morning</Text>
      </View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={type.body}>Screenshot a basket or a checkout, then pick it here. Till Morning reads the total and how long it should wait.</Text>

          {/* The screenshot */}
          <View style={{ marginTop: 18 }}>
            {read.state === 'idle' ? (
              <DashedBox onPress={choose} label="Choose a screenshot">
                <View style={{ padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#1E2256', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={22} weight="bold" color="#93A5FF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.title}>Choose a screenshot</Text>
                    <Text style={type.small}>Read on this phone. The picture never leaves it.</Text>
                  </View>
                </View>
              </DashedBox>
            ) : (
              <View style={{ backgroundColor: '#1C2057', borderColor: '#2E3374', borderWidth: 1.5, borderRadius: 20, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Image source={{ uri: read.uri }} style={{ width: 56, height: 96, borderRadius: 10, backgroundColor: '#12153A' }} resizeMode="cover" accessibilityLabel="Your screenshot" />
                <View style={{ flex: 1 }}>
                  {read.state === 'reading' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color="#93A5FF" />
                      <Text style={type.title}>Reading your screenshot…</Text>
                    </View>
                  ) : read.state === 'done' ? (
                    <>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={18} weight="fill" color="#6EF0BF" />
                        <Text style={type.title}>Basket read</Text>
                      </View>
                      <Text style={{ fontFamily: font.display, fontSize: 26, color: color.text, marginTop: 2 }}>
                        £{price.toFixed(2)}
                        {items ? <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.text2 }}>{`  ·  ${items} items`}</Text> : null}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={type.title}>Couldn’t find a total</Text>
                      <Text style={type.small}>Try a screenshot that shows the basket or order total, or pick a rough price below.</Text>
                    </>
                  )}
                  <TextLink label="Try another screenshot" onPress={choose} style={{ fontSize: 13.5, textDecorationLine: 'underline', textAlign: 'left' }} />
                </View>
              </View>
            )}
          </View>

          <Text style={[type.label, { marginTop: 20 }]}>What is it? (optional)</Text>
          <TextInput
            value={what}
            onChangeText={setWhat}
            maxLength={40}
            placeholder={`Something from ${appName}`}
            placeholderTextColor={color.placeholder}
            style={{ marginTop: 8, backgroundColor: color.field, borderColor: color.fieldBorder, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontFamily: font.bodySemi, fontSize: 17, color: color.text }}
          />

          {apps.length > 0 && (
            <>
              <Text style={[type.label, { marginTop: 18 }]}>Which app is it from? (optional)</Text>
              <View style={{ marginTop: 8, gap: 8 }}>
                {apps.map((a) => {
                  const on = appKey === a.key;
                  return (
                    <Pressable
                      key={a.key}
                      onPress={() => setAppKey(on ? null : a.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5, borderColor: on ? '#93A5FF' : '#2E3374', backgroundColor: on ? '#1C2160' : '#161942' }}
                    >
                      {a.token ? (
                        <AppLabel appKey={a.key} mode="both" size={15} color="#F3F2FF" fallback={a.name ?? 'App'} style={{ flex: 1, height: 28 }} />
                      ) : (
                        <Text style={[type.title, { flex: 1 }]}>{a.name}</Text>
                      )}
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? '#93A5FF' : '#5A5F9E', backgroundColor: on ? '#93A5FF' : 'transparent' }} />
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {read.state === 'fail' && (
            <>
              <Text style={[type.label, { marginTop: 18 }]}>Roughly how much?</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {BANDS.map((b) => (
                  <Tag key={b} label={BAND_LABEL[b]} selected={band === b} onPress={() => setBand(b)} />
                ))}
              </View>
            </>
          )}

          {read.state !== 'idle' && read.state !== 'reading' && (
            <View style={{ marginTop: 18, backgroundColor: '#1C2057', borderRadius: 22, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Text style={type.small}>It waits</Text>
                <Text style={{ fontFamily: font.display, fontSize: 26, color: color.blueLight }}>{formatDuration(readyAt - now)}</Text>
              </View>
              <Text style={[type.small, { textAlign: 'right' }]}>Ready {formatReady(readyAt, now)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {chips.map((c) => (
                  <Chip key={c} tone="lilac" label={c} />
                ))}
              </View>
              {price > 0 && <Text style={[type.small, { marginTop: 8 }]}>That’s about {formatDuration((price / wage) * 3600 * 1000)} of your work.</Text>}
            </View>
          )}
        </ScrollView>
        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 10, gap: 4 }}>
          {read.state === 'idle' ? (
            <Button label="Choose a screenshot" icon={<Camera size={20} weight="bold" color="#FFFFFF" />} onPress={choose} />
          ) : (
            <Button
              label="Park it"
              icon={<Hourglass size={18} weight="bold" color="#FFFFFF" />}
              disabled={read.state === 'reading'}
              onPress={park}
            />
          )}
          <Text style={[type.small, { textAlign: 'center', marginTop: 6 }]}>
            <ShoppingBag size={12} color={color.text3} /> Your basket stays in the shop. Morning-you gets the final say.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
