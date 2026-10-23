import { Platform } from 'react-native';
import * as DeviceActivity from 'react-native-device-activity';

// Thin wrapper over Apple's Screen Time APIs. The shield, pause and Shopping Pass logic
// is built on top of this during the real-iPhone spike, not here.

export function isScreenTimeAvailable() {
  return Platform.OS === 'ios';
}

export async function requestScreenTimeAccess() {
  await DeviceActivity.requestAuthorization('individual');
  // The status can read "not determined" for a moment after the person answers, so poll briefly.
  for (let i = 0; i < 10; i++) {
    const status = DeviceActivity.getAuthorizationStatus();
    if (status !== 0) return status;
    await new Promise((r) => setTimeout(r, 200));
  }
  return DeviceActivity.getAuthorizationStatus();
}

export function getScreenTimeStatus() {
  return DeviceActivity.getAuthorizationStatus();
}

// Brief rule: when the trial or subscription ends, remove every shield straight away.
export function removeAllShields() {
  DeviceActivity.resetBlocks();
  DeviceActivity.stopMonitoring();
}

export { DeviceActivity };
