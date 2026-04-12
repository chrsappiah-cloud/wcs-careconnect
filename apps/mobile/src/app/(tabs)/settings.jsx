import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 24,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20 }}>
          {/* Profile Section */}
          <TouchableOpacity
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 24,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 32,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#EFF6FF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={40} color="#2563EB" />
            </View>
            <View style={{ marginLeft: 20, flex: 1 }}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}
              >
                Nurse Sarah
              </Text>
              <Text style={{ fontSize: 18, color: "#6B7280" }}>
                Ward A • Head Nurse
              </Text>
            </View>
            <ChevronRight size={24} color="#D1D5DB" />
          </TouchableOpacity>

          {/* Settings Groups */}
          <SettingsGroup title="Notifications">
            <SettingsItem
              icon={<Bell size={24} color="#6B7280" />}
              label="Push Alerts"
              type="switch"
              value={true}
            />
            <SettingsItem
              icon={<Bell size={24} color="#6B7280" />}
              label="High Priority Only"
              type="switch"
              value={false}
            />
          </SettingsGroup>

          <SettingsGroup title="Security">
            <SettingsItem
              icon={<Shield size={24} color="#6B7280" />}
              label="Biometric Unlock"
              type="switch"
              value={true}
            />
            <SettingsItem
              icon={<Shield size={24} color="#6B7280" />}
              label="Session Timeout"
              value="20 mins"
            />
          </SettingsGroup>

          <SettingsGroup title="Support">
            <SettingsItem
              icon={<HelpCircle size={24} color="#6B7280" />}
              label="Help Center"
            />
            <SettingsItem
              icon={<HelpCircle size={24} color="#6B7280" />}
              label="Device Support"
            />
          </SettingsGroup>

          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            <LogOut size={24} color="#EF4444" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "#EF4444",
                marginLeft: 8,
              }}
            >
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#9CA3AF",
          textTransform: "uppercase",
          marginBottom: 12,
          marginLeft: 8,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsItem({ icon, label, type, value, style }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ width: 40 }}>{icon}</View>
      <Text style={{ fontSize: 20, color: "#374151", flex: 1 }}>{label}</Text>
      {type === "switch" ? (
        <Switch
          value={value}
          trackColor={{ true: "#2563EB", false: "#D1D5DB" }}
        />
      ) : value ? (
        <Text style={{ fontSize: 18, color: "#9CA3AF" }}>{value}</Text>
      ) : (
        <ChevronRight size={20} color="#D1D5DB" />
      )}
    </TouchableOpacity>
  );
}
