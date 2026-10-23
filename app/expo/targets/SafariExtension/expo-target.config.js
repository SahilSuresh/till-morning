/** Till Morning for Safari: spots checkout pages on shop sites and offers to park the basket. */
/** @type {import('@kingstinct/expo-apple-targets/build/config-plugin').ConfigFunction} */
module.exports = () => ({
  type: 'safari',
  name: 'SafariExtension',
  bundleIdentifier: '.SafariExtension',
  deploymentTarget: '18.0',
  frameworks: ['SafariServices', 'Vision', 'UserNotifications'],
  entitlements: {
    'com.apple.security.application-groups': ['group.com.andrej.tillmorning'],
  },
});
