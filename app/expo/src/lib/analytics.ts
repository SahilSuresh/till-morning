import { Observe } from 'expo-observe';

import { config } from './config';

// The only events the app sends. Each one is a count with small, non-identifying attributes.
// Never attach app names, budgets, goals, answers or anything the person typed.
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'screen_time_authorized'
  | 'apps_selected'
  | 'paywall_shown'
  | 'trial_started'
  | 'purchase_restored'
  | 'pause_completed'
  | 'shopping_pass_started'
  | 'check_in_completed'
  | 'shields_removed_subscription_ended';

type Attributes = Record<string, string | number | boolean>;

export function initAnalytics() {
  Observe.configure({ environment: config.appEnv });
}

export function track(event: AnalyticsEvent, attributes?: Attributes) {
  try {
    Observe.logEvent(event, attributes ? { attributes } : undefined);
  } catch {
    // Analytics must never break the app.
  }
}
