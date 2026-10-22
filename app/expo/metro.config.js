// Sentry's wrapper adds debug IDs so crash stack traces map back to source.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
