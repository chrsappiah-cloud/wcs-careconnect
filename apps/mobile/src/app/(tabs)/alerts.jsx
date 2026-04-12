import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts?status=open");
      return response.json();
    },
  });

  const ackMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "acknowledged",
          acknowledged_by: "Nurse Sarah",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["residents"] });
    },
  });

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
            marginBottom: 8,
          }}
        >
          Active Alerts
        </Text>
        <Text style={{ fontSize: 18, color: "#6B7280" }}>
          {alerts.length} critical issues require attention
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={{ fontSize: 20, textAlign: "center", color: "#6B7280" }}>
            Loading alerts...
          </Text>
        ) : alerts.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 100 }}>
            <CheckCircle size={80} color="#10B981" />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#111827",
                marginTop: 20,
              }}
            >
              All residents stable
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <View
              key={alert.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 24,
                marginBottom: 20,
                borderLeftWidth: 8,
                borderLeftColor:
                  alert.severity === "critical" ? "#EF4444" : "#F59E0B",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor:
                      alert.severity === "critical" ? "#FEF2F2" : "#FFFBEB",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <AlertTriangle
                    size={32}
                    color={
                      alert.severity === "critical" ? "#EF4444" : "#F59E0B"
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {alert.resident_name}
                  </Text>
                  <Text
                    style={{ fontSize: 18, color: "#4B5563", marginTop: 4 }}
                  >
                    {alert.resident_room}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Clock size={16} color="#9CA3AF" />
                    <Text
                      style={{ fontSize: 14, color: "#9CA3AF", marginLeft: 4 }}
                    >
                      {format(new Date(alert.created_at), "h:mm a")}
                    </Text>
                  </View>
                </View>
              </View>

              <Text
                style={{
                  fontSize: 20,
                  color: "#374151",
                  marginVertical: 16,
                  lineHeight: 28,
                }}
              >
                {alert.message}
              </Text>

              <TouchableOpacity
                onPress={() => ackMutation.mutate(alert.id)}
                style={{
                  backgroundColor: "#111827",
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}
                >
                  Acknowledge Alert
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
