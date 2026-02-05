import * as Notifications from 'expo-notifications';
import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

// Konfigurer notifications EN gang når appen starter
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#f5f5f7',
          borderTopColor: '#e5e5ea',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#f5f5f7',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
          color: '#1d1d1f',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hjem',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
          headerTitle: 'Fredagsliga',
        }}
      />
      <Tabs.Screen
        name="spill"
        options={{
          title: 'Spill',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>⚽</Text>
          ),
          headerTitle: 'Spill Kamp',
        }}
      />
      <Tabs.Screen
        name="statistikk"
        options={{
          title: 'Statistikk',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>📊</Text>
          ),
          headerTitle: 'Statistikk',
        }}
      />
      <Tabs.Screen
        name="om"
        options={{
          title: 'Om',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>ℹ️</Text>
          ),
          headerTitle: 'Om Appen',
        }}
      />
    </Tabs>
  );
}