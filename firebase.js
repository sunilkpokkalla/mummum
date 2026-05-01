import auth from '@react-native-firebase/auth';
import firebase from '@react-native-firebase/app';

/**
 * Mummum Firebase Native Integration
 * 
 * We use the Native SDK (@react-native-firebase) instead of the Web SDK
 * for better performance, native social auth support, and App Store compliance.
 */

export { auth, firebase };
export default firebase;