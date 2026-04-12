import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  AlertCircle,
  ChevronRight,
  Users,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const STATUS_COLORS = {
  stable: {
    bg: "#F0FDF4",
    text: "#166534",
    border: "#BBF7D0",
    icon: "#22C55E",
  },
  warning: {
    bg: "#FFFBEB",
    text: "#92400E",
    border: "#FEF3C7",
    icon: "#F59E0B",
  },
  critical: {
    bg: "#FEF2F2",
    text: "#991B1B",
    border: "#FEE2E2",
    icon: "#EF4444",
  },
};

export default function ResidentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const response = await fetch("/api/residents");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase()),
  );

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
            marginBottom: 16,
          }}
        >
          Residents
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 60,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginBottom: 20,
          }}
        >
          <Search size={24} color="#6B7280" />
          <TextInput
            placeholder="Search by name or room..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, marginLeft: 12, fontSize: 20, color: "#111827" }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={{ fontSize: 20, textAlign: "center", color: "#6B7280" }}>
            Loading residents...
          </Text>
        ) : filteredResidents.length === 0 ? (
          <Text style={{ fontSize: 20, textAlign: "center", color: "#6B7280" }}>
            No residents found.
          </Text>
        ) : (
          filteredResidents.map((resident) => {
            const statusStyle =
              STATUS_COLORS[resident.status] || STATUS_COLORS.stable;
            const latestGlucose = resident.latest_readings?.find(
              (r) => r.metric === "glucose",
            );

            return (
              <TouchableOpacity
                key={resident.id}
                onPress={() =>
                  router.navigate(`/(tabs)/resident/${resident.id}`)
                }
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  padding: 24,
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: statusStyle.border,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View style={{ position: "relative" }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {resident.photo_url ? (
                      <Image
                        source={{ uri: resident.photo_url }}
                        style={{ width: 80, height: 80 }}
                      />
                    ) : (
                      <Users size={40} color="#9CA3AF" />
                    )}
                  </View>
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: statusStyle.icon,
                      borderWidth: 3,
                      borderColor: "#FFFFFF",
                    }}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 20 }}>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {resident.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <MapPin size={18} color="#6B7280" />
                    <Text
                      style={{ fontSize: 18, color: "#6B7280", marginLeft: 4 }}
                    >
                      {resident.room}
                    </Text>
                  </View>

                  {latestGlucose && (
                    <View
                      style={{
                        marginTop: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: statusStyle.bg,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: statusStyle.text,
                        }}
                      >
                        Glucose: {latestGlucose.value} mg/dL
                      </Text>
                    </View>
                  )}
                </View>

                <ChevronRight size={28} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
