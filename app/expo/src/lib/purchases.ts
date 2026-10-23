import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

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
  if (!configured) return () => {};
  const handler = (info: CustomerInfo) => listener(hasPro(info));
  Purchases.addCustomerInfoUpdateListener(handler);
  return () => Purchases.removeCustomerInfoUpdateListener(handler);
}

export function isPurchasesReady() {
  return configured;
}

export type Plans = { yearly?: PurchasesPackage; monthly?: PurchasesPackage };

/** The yearly and monthly packages from the default offering. */
export async function getPlans(): Promise<Plans> {
  if (!configured) return {};
  const o = await Purchases.getOfferings();
  const pkgs = o.current?.availablePackages ?? [];
  return {
    yearly: o.current?.annual ?? pkgs.find((p) => p.product.identifier.includes('yearly')),
    monthly: o.current?.monthly ?? pkgs.find((p) => p.product.identifier.includes('monthly')),
  };
}

/** Starts the free trial. Returns 'active' or 'cancelled', or throws on a real error. */
export async function buy(pkg: PurchasesPackage) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    if (hasPro(customerInfo)) {
      track('trial_started', { plan: pkg.packageType });
      return 'active' as const;
    }
    return 'cancelled' as const;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return 'cancelled' as const;
    throw e;
  }
}
