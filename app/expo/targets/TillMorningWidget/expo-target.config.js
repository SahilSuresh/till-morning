/** Till Morning widgets: Home Screen + Lock Screen "waiting room" widgets and the Shopping Pass Live Activity. */
/** @type {import('@kingstinct/expo-apple-targets/build/config-plugin').ConfigFunction} */
module.exports = () => ({
  type: 'widget',
  name: 'TillMorningWidget',
  bundleIdentifier: '.TillMorningWidget',
  deploymentTarget: '18.0',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.andrej.tillmorning'],
  },
});
