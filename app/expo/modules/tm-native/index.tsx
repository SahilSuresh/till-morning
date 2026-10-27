import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ComponentType } from 'react';
import { Text, View, type ViewProps } from 'react-native';

type TmNativeModule = {
  appKeys(selectionId: string): string[];
  saveAppsSelection(keys: string[], id: string): boolean;
  editApps(selectionId: string, add: string[], remove: string[]): number;
  recognizeText(uri: string): Promise<string[]>;
  startPassActivity?(title: string, need: string, startedAt: number, endsAt: number): boolean;
  endPassActivities?(): void;
  reloadWidgets?(): void;
};

const native = requireOptionalNativeModule<TmNativeModule>('TmNative');

/** False on an install from before this module existed: callers fall back gracefully. */
export const hasTmNative = !!native;

export function appKeys(selectionId: string): string[] {
  try {
    return native?.appKeys(selectionId) ?? [];
  } catch {
    return [];
  }
}

export function saveAppsSelection(keys: string[], id: string) {
  try {
    return native?.saveAppsSelection(keys, id) ?? false;
  } catch {
    return false;
  }
}

export function editApps(selectionId: string, add: string[], remove: string[]) {
  try {
    return native?.editApps(selectionId, add, remove) ?? -1;
  } catch {
    return -1;
  }
}

/** Shopping Pass countdown on the Lock Screen and Dynamic Island. No-op on older installs. */
export function startPassActivity(title: string, need: string, startedAt: number, endsAt: number) {
  try {
    return native?.startPassActivity?.(title, need, startedAt, endsAt) ?? false;
  } catch {
    return false;
  }
}

export function endPassActivities() {
  try {
    native?.endPassActivities?.();
  } catch {
    // Older install without Live Activities.
  }
}
export function reloadWidgets() {
  try {
    native?.reloadWidgets?.();
  } catch {
    // Older install without widgets.
  }
}

export async function recognizeText(uri: string): Promise<string[]> {
  if (!native) throw new Error('Text recognition needs the latest Till Morning install');
  return native.recognizeText(uri);
}

type LabelProps = ViewProps & {
  appKey: string;
  mode?: 'title' | 'icon' | 'both';
  size?: number;
  iconScale?: number;
  color?: string;
  align?: 'leading' | 'center' | 'trailing';
};

const NativeLabel: ComponentType<LabelProps> | null = native ? requireNativeView<LabelProps>('TmNative') : null;

/**
 * Apple's own name and icon for an app. iOS draws it; Till Morning never learns the name.
 * Give it a fixed height (and width for icons). `fallback` shows on installs without the module.
 */
export function AppLabel({ fallback, ...props }: LabelProps & { fallback?: string }) {
  if (NativeLabel) return <NativeLabel {...props} />;
  return (
    <View style={props.style}>
      {props.mode !== 'icon' && fallback ? (
        <Text numberOfLines={1} style={{ color: props.color ?? '#FFFFFF', fontSize: props.size ?? 17, fontWeight: '700' }}>
          {fallback}
        </Text>
      ) : null}
    </View>
  );
}
