import React from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import Typography from '@/components/Typography';

export default function TestAuthScreen() {

  const handleLogin = async () => {
    try {
      console.log('[Test Auth]: Attempting Anonymous Login...');
      const result = await auth().signInAnonymously();
      console.log('[Test Auth]: Success! User ID:', result.user.uid);
      Alert.alert("Success!", `Firebase is working.\nUser ID: ${result.user.uid}`);
    } catch (e: any) {
      console.log('[Test Auth]: Login error:', e);
      Alert.alert("Firebase Connection Error", `Code: ${e.code}\nMessage: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="display" style={{ marginBottom: 20 }}>Firebase Tester</Typography>
      <Typography style={{ marginBottom: 40, textAlign: 'center' }}>
        Click below to test if the native Firebase bridge is communicating with your project.
      </Typography>
      <Button title="Test Anonymous Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  }
});
