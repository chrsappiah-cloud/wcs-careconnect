import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
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
import { colors, shadows } from '../../theme';
import { mockAlerts } from '../../mockData';
import { apiUrl } from '../../services/apiClient';

function FloatingTabBackground() {
  if (Platform.OS === 'ios') {
    return (
      <View style={floatingStyles.bgWrap}>
        <BlurView
          tint="systemThickMaterial"
          intensity={95}
          style={StyleSheet.absoluteFill}
        />
        <View style={floatingStyles.borderOverlay} />
      </View>
    );
  }
  return (
    <View
      style={[
        floatingStyles.bgWrap,
        {
          backgroundColor: colors.surface,
          ...shadows.lg,
        },
      ]}
    />
  );
}

const floatingStyles = StyleSheet.create({
  bgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});

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
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
        },
        tabBarBackground: FloatingTabBackground,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.2,
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
            <View style={{ alignItems: 'center' }}>
              <Users size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Bell size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
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
            <View style={{ alignItems: 'center' }}>
              <CheckSquare size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MessageSquare size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Pill size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="interactions"
        options={{
          title: 'Interact.',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <ArrowRightLeft size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="medsearch"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Microscope size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Settings size={focused ? 25 : 23} color={color} strokeWidth={focused ? 2.5 : 1.8} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 3 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="resident/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add-resident"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="resident/health"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
