import { Tabs } from "expo-router";
import {
  Users,
  Bell,
  CheckSquare,
  MessageSquare,
  Settings,
} from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: "#F9FAFB",
        },
        headerTitleStyle: {
          fontSize: 24,
          fontWeight: "bold",
          color: "#111827",
        },
        tabBarStyle: {
          paddingBottom: 30,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
        },
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Residents",
          tabBarIcon: ({ color }) => <Users size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color }) => <Bell size={28} color={color} />,
          tabBarBadge: 2, // Mock badge
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <CheckSquare size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <MessageSquare size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
