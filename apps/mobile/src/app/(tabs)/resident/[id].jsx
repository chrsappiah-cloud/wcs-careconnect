import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Activity,
  Heart,
  Droplet,
  Wind,
  Bluetooth,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";

export default function ResidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const response = await fetch("/api/residents");
      return response.json();
    },
  });

  const resident = residents.find((r) => r.id.toString() === id);

  const { data: readings = [] } = useQuery({
    queryKey: ["readings", id],
    queryFn: async () => {
      const response = await fetch(`/api/readings?residentId=${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?residentId=${id}&status=all`);
      return response.json();
    },
    enabled: !!id,
  });

  const addReadingMutation = useMutation({
    mutationFn: async (reading) => {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reading, resident_id: id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["readings", id] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      Alert.alert(
        "Reading Recorded",
        "Data synced successfully via BLE simulation.",
      );
    },
  });

  const simulateBLEReading = useCallback(() => {
    // BLE Simulation logic
    const metrics = ["glucose", "hr", "spo2", "bp_systolic"];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    const valueMap = {
      glucose: Math.floor(Math.random() * (250 - 60) + 60),
      hr: Math.floor(Math.random() * (120 - 50) + 50),
      spo2: Math.floor(Math.random() * (100 - 85) + 85),
      bp_systolic: Math.floor(Math.random() * (160 - 100) + 100),
    };
    const units = {
      glucose: "mg/dL",
      hr: "bpm",
      spo2: "%",
      bp_systolic: "mmHg",
    };

    addReadingMutation.mutate({
      metric: randomMetric,
      value: valueMap[randomMetric],
      unit: units[randomMetric],
      device_id: "BLE-SIM-123",
      source: "ble",
    });
  }, [addReadingMutation]);

  if (!resident) return null;

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      {/* Custom Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={32} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
          Resident Detail
        </Text>
        <TouchableOpacity
          onPress={simulateBLEReading}
          style={{
            backgroundColor: "#EFF6FF",
            padding: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#BFDBFE",
          }}
        >
          <Bluetooth size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            margin: 20,
            borderRadius: 32,
            padding: 24,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Image
            source={{
              uri:
                resident.photo_url ||
                "https://images.unsplash.com/photo-1551076805-e1869033e561?w=200&h=200&fit=crop",
            }}
            style={{ width: 100, height: 100, borderRadius: 50 }}
            contentFit="cover"
          />
          <View style={{ marginLeft: 20 }}>
            <Text
              style={{ fontSize: 28, fontWeight: "bold", color: "#111827" }}
            >
              {resident.name}
            </Text>
            <Text style={{ fontSize: 20, color: "#6B7280" }}>
              Room {resident.room}
            </Text>
            <View
              style={{
                marginTop: 8,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor:
                  resident.status === "stable" ? "#DCFCE7" : "#FEE2E2",
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: resident.status === "stable" ? "#166534" : "#991B1B",
                }}
              >
                {resident.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Vitals Grid */}
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: "#111827",
            marginHorizontal: 20,
            marginBottom: 12,
          }}
        >
          Latest Vitals
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
        >
          <View style={{ flexDirection: "row", paddingLeft: 20 }}>
            <VitalCard
              label="Glucose"
              value={
                readings.find((r) => r.metric === "glucose")?.value || "--"
              }
              unit="mg/dL"
              icon={<Droplet size={32} color="#EF4444" />}
              color="#FEF2F2"
            />
            <VitalCard
              label="Heart Rate"
              value={readings.find((r) => r.metric === "hr")?.value || "--"}
              unit="bpm"
              icon={<Heart size={32} color="#DC2626" />}
              color="#FFF1F2"
            />
            <VitalCard
              label="SpO2"
              value={readings.find((r) => r.metric === "spo2")?.value || "--"}
              unit="%"
              icon={<Wind size={32} color="#2563EB" />}
              color="#EFF6FF"
            />
            <VitalCard
              label="Blood Pressure"
              value={
                readings.find((r) => r.metric === "bp_systolic")?.value || "--"
              }
              unit="mmHg"
              icon={<Activity size={32} color="#7C3AED" />}
              color="#F5F3FF"
              style={{ marginRight: 20 }}
            />
          </View>
        </ScrollView>

        {/* Tasks Section */}
        <View style={{ marginTop: 32, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}
            >
              Pending Tasks
            </Text>
            <TouchableOpacity style={{ padding: 8 }}>
              <Plus size={28} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {tasks
            .filter((t) => t.status === "pending")
            .map((task) => (
              <TouchableOpacity
                key={task.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Clock size={24} color="#6B7280" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {task.title}
                  </Text>
                  <Text style={{ fontSize: 16, color: "#6B7280" }}>
                    Due Today
                  </Text>
                </View>
                <CheckCircle2 size={28} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}

function VitalCard({ label, value, unit, icon, color, style }) {
  return (
    <View
      style={[
        {
          width: 160,
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 20,
          marginRight: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 1,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#111827" }}>
        {value}
      </Text>
      <Text style={{ fontSize: 16, color: "#6B7280", fontWeight: "500" }}>
        {unit}
      </Text>
      <Text
        style={{
          fontSize: 18,
          color: "#374151",
          fontWeight: "600",
          marginTop: 4,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
