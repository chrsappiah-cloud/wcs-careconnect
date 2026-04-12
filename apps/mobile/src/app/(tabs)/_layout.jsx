import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import {
  Users,
  Bell,
  CheckSquare,
  MessageSquare,
  Settings,
  Pill,
  ArrowRightLeft,
  Microscope,
} from 'lucide-react-native';
import { colors } from '../../theme';
import { mockAlerts } from '../../mockData';
import { apiUrl } from '../../services/apiClient';

export default function TabLayout() {
  const { data: alerts = mockAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/alerts?status=open'));
      if (!response.ok)
        throw new Error(`Alerts fetch failed: ${response.status}`);
      return response.json();
    },
    placeholderData: mockAlerts,
  });

  const openCount = alerts.filter((a) => a.status === 'open').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint="systemChromeMaterial"
              intensity={100}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colors.surface,
                ...Platform.select({
                  android: { elevation: 8 },
                }),
              }}
            />
          ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.1,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Residents',
          tabBarIcon: ({ color, focused }) => (
            <Users
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <Bell
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarBadge: openCount > 0 ? openCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            fontSize: 11,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
            borderRadius: 9,
          },
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <CheckSquare
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color, focused }) => (
            <Pill
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="interactions"
        options={{
          title: 'Interact.',
          tabBarIcon: ({ color, focused }) => (
            <ArrowRightLeft
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="medsearch"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Microscope
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              size={focused ? 26 : 24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="resident/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
