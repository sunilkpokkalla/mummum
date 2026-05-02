import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, BarChart2, Award, List, Plus } from 'lucide-react-native';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.surfaceVariant,
          elevation: 0,
          height: 84,
          paddingBottom: 24,
          paddingTop: 12,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
        },
        headerStyle: {
          backgroundColor: themeColors.background,
        },
        headerTitleStyle: {
          color: themeColors.text,
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Charts',
          headerShown: false,
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarButton: (props) => (
            <CustomTabBarButton {...props} />
          ),
        }}
      />
      <Tabs.Screen
        name="milestones"
        options={{
          title: 'Milestones',
          headerShown: false,
          tabBarIcon: ({ color }) => <Award size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

function CustomTabBarButton({ children }: any) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        onPress={() => router.push('/log/feed')}
        activeOpacity={0.7}
        style={[styles.fab, { backgroundColor: themeColors.primary }]}
      >
        <Plus size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    width: 70,
    height: 70,
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#C69C82', // Match the Save button color
  }
});
