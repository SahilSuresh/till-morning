import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { MinusIcon, PlusIcon } from './ph';
import { color, font } from './theme';

/**
 * The prototype's timePick() (P:L862): equal tiles for the usual choices plus a Custom tile.
 * Custom opens a − [value] + stepper; typed values are clamped, so it can never go below `min`
 * (or above `max`). `format` turns a value into the tile text (e.g. 23 → "23:00").
 */
export function TimePick({
  options,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  unitLong,
  label,
  format,
  offOption,
}: {
  options: number[];
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit: string;
  unitLong: string;
  label: string;
  format?: (v: number) => string;
  /** An extra "Off" tile with this value (e.g. 0 for cool-off). */
  offOption?: number;
}) {
  const isPreset = options.includes(value) || (offOption !== undefined && value === offOption);
  const [custom, setCustom] = useState(!isPreset);
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v)));
  const show = (v: number) => (format ? format(v) : String(v));
  const pick = (v: number) => {
    Haptics.selectionAsync().catch(() => {});
    setCustom(false);
    onChange(v);
  };
  const bump = (d: number) => {
    Haptics.selectionAsync().catch(() => {});
    const base = custom ? value : clamp(value);
    onChange(clamp(base + d));
  };
  const commit = () => {
    const n = parseInt(draft.replace(/[^0-9]/g, ''), 10);
    const v = clamp(Number.isFinite(n) ? n : value);
    setDraft(String(v));
    onChange(v);
  };

  const tiles: { key: string; top: string; sub: string; on: boolean; press: () => void }[] = [
    ...(offOption !== undefined ? [{ key: 'off', top: 'Off', sub: '', on: !custom && value === offOption, press: () => pick(offOption) }] : []),
    ...options.map((o) => ({ key: String(o), top: show(o), sub: format ? '' : unit, on: !custom && value === o, press: () => pick(o) })),
    {
      key: 'custom',
      top: custom ? show(value) : '+',
      sub: custom ? (format ? 'Custom' : unit) : 'Custom',
      on: custom,
      press: () => {
        Haptics.selectionAsync().catch(() => {});
        setCustom(true);
        if (value < min || value > max || (offOption !== undefined && value === offOption)) onChange(clamp(Math.max(min, value)));
      },
    },
  ];

  return (
    <View>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: 8 }}>
        {tiles.map((t) => (
          <Pressable
            key={t.key}
            onPress={t.press}
            accessibilityRole="radio"
            accessibilityState={{ checked: t.on }}
            accessibilityLabel={t.key === 'custom' ? `Custom ${unitLong}` : `${t.top} ${t.sub}`}
            style={{ flex: 1 }}
          >
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: 16,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 56,
                  backgroundColor: t.on ? '#1C2160' : '#161942',
                  borderWidth: 1.5,
                  borderColor: t.on ? '#93A5FF' : '#2E3374',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                }}
              >
                <Text style={{ fontFamily: font.display, fontSize: t.top.length > 4 ? 16 : 20, color: t.on ? '#FFFFFF' : color.text }}>{t.top}</Text>
                {t.sub ? <Text style={{ fontFamily: font.bodyBold, fontSize: 11.5, color: t.on ? '#FFFFFF' : color.text3 }}>{t.sub}</Text> : null}
              </View>
            )}
          </Pressable>
        ))}
      </View>
      {custom && (
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Pressable
            onPress={() => bump(-step)}
            disabled={value <= min}
            accessibilityRole="button"
            accessibilityLabel={`${step} ${unitLong} less`}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', opacity: value <= min ? 0.4 : 1 }}
          >
            <MinusIcon size={20} weight="bold" color={color.text} />
          </Pressable>
          {format ? (
            <Text style={{ minWidth: 128, textAlign: 'center', fontFamily: font.display, fontSize: 28, color: color.text }}>{show(value)}</Text>
          ) : (
            <View style={{ width: 128, justifyContent: 'center' }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onEndEditing={commit}
                onBlur={commit}
                keyboardType="number-pad"
                maxLength={3}
                accessibilityLabel={`Custom length in ${unitLong}, at least ${min}`}
                style={{
                  backgroundColor: color.field,
                  borderColor: color.fieldBorder,
                  borderWidth: 1.5,
                  borderRadius: 16,
                  paddingVertical: 10,
                  paddingLeft: 16,
                  paddingRight: 44,
                  textAlign: 'center',
                  fontFamily: font.display,
                  fontSize: 28,
                  color: color.text,
                }}
              />
              <Text style={{ position: 'absolute', right: 14, fontFamily: font.bodyBold, fontSize: 13, color: color.text3 }}>{unit}</Text>
            </View>
          )}
          <Pressable
            onPress={() => bump(step)}
            disabled={value >= max}
            accessibilityRole="button"
            accessibilityLabel={`${step} ${unitLong} more`}
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', opacity: value >= max ? 0.4 : 1 }}
          >
            <PlusIcon size={20} weight="bold" color={color.text} />
          </Pressable>
        </View>
      )}
      {custom && (
        <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: font.bodySemi, fontSize: 12.5, color: color.text3 }}>
          {format ? `Between ${show(min)} and ${show(max)}` : `At least ${min} ${unit}, up to ${max} ${unit}`}
        </Text>
      )}
    </View>
  );
}
