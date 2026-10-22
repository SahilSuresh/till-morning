import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';

import { track } from './analytics';
import { config, ENTITLEMENT_ID } from './config';

let configured = false;

export function initPurchases() {
  if (configured || Platform.OS !== 'ios' || !config.revenueCatIosKey) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  // No appUserID: RevenueCat makes an anonymous ID, so there is no account or login.
  Purchases.configure({ apiKey: config.revenueCatIosKey });
  configured = true;
}

export function hasPro(info: CustomerInfo) {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function isSubscribed() {
  if (!configured) return false;
  return hasPro(await Purchases.getCustomerInfo());
}

export async function restorePurchases() {
  const info = await Purchases.restorePurchases();
  const active = hasPro(info);
  if (active) track('purchase_restored');
  return active;
}

// Gate check: sandbox offerings must come back with the yearly and monthly packages.
export async function getOfferings() {
  return Purchases.getOfferings();
}

export function onSubscriptionChange(listener: (active: boolean) => void) {
  const handler = (info: CustomerInfo) => listener(hasPro(info));
  Purchases.addCustomerInfoUpdateListener(handler);
  return () => Purchases.removeCustomerInfoUpdateListener(handler);
}

export function isPurchasesReady() {
  return configured;
}
