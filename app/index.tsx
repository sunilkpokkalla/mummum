import React from 'react';
import { Redirect } from 'expo-router';
import { useBabyStore } from '@/store/useBabyStore';

/**
 * Root Traffic Controller
 * Determines whether to show the Onboarding flow or the Main Dashboard
 * based on the persistent 'isOnboarded' clinical state.
 */
export default function RootIndex() {
  const { isOnboarded } = useBabyStore();

  // If not onboarded (or after a Total Purge), force Onboarding entry
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  // If already a Mummum mother, show the Dashboard
  return <Redirect href="/(tabs)" />;
}
