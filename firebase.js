const auth = require('@react-native-firebase/auth').default;
const app = require('@react-native-firebase/app').default;

/**
 * Mummum Firebase Native Integration
 * 
 * We use the Native SDK (@react-native-firebase) instead of the Web SDK
 * for better performance, native social auth support, and App Store compliance.
 */

module.exports = app;
module.exports.auth = auth;