/** "Park it till morning" from any app's Share button: a screenshot, a shop link or text. */
/** @type {import('@kingstinct/expo-apple-targets/build/config-plugin').ConfigFunction} */
module.exports = () => ({
  type: 'share',
  name: 'ShareExtension',
  bundleIdentifier: '.ShareExtension',
  deploymentTarget: '18.0',
  frameworks: ['SwiftUI', 'Vision', 'UserNotifications', 'UniformTypeIdentifiers'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.andrej.tillmorning'],
  },
});
