import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  ChevronRight,
  Droplet,
  Activity,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, radius, shadows, typography } from "../../theme";
import { mockResidents } from "../../mockData";
import Avatar from "../../components/Avatar";
import StatusBadge from "../../components/StatusBadge";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import { SkeletonList } from "../../components/Skeleton";

export default function ResidentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    data: residents = mockResidents,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const response = await fetch("/api/residents");
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
    placeholderData: mockResidents,
  });

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase()),
  );

  const statusCounts = residents.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>
            Residents
          </Text>
          <View
            style={{
              backgroundColor: colors.primaryLight,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: radius.full,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
              {residents.length} total
            </Text>
          </View>
        </View>

        {/* Status summary pills */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, marginTop: 8 }}>
          {[
            { key: "stable", label: "Stable", color: colors.success, bg: colors.successLight },
            { key: "warning", label: "Warning", color: colors.warningDark, bg: colors.warningLight },
            { key: "critical", label: "Critical", color: colors.danger, bg: colors.dangerLight },
          ].map((s) => (
            <View
              key={s.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: s.bg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.full,
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: s.color,
                }}
              />
              <Text style={{ fontSize: 13, fontWeight: "600", color: s.color }}>
                {statusCounts[s.key] || 0} {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            paddingHorizontal: 16,
            height: 52,
            borderWidth: 1.5,
            borderColor: searchFocused ? colors.primary : colors.surfaceBorder,
            marginBottom: 8,
            ...shadows.sm,
          }}
        >
          <Search size={20} color={searchFocused ? colors.primary : colors.textMuted} />
          <TextInput
            placeholder="Search by name or room..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, marginLeft: 12, fontSize: 17, color: colors.text }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading && !residents.length ? (
          <SkeletonList count={4} />
        ) : filteredResidents.length === 0 ? (
          <EmptyState
            icon={<Search size={36} color={colors.textMuted} />}
            title="No residents found"
            subtitle={search ? `No results for "${search}"` : "No residents available"}
          />
        ) : (
          filteredResidents.map((resident) => {
            const glucoseValue = resident.latest_glucose?.value;
            const isHighGlucose = glucoseValue && glucoseValue > 180;
            const isLowGlucose = glucoseValue && glucoseValue < 70;

            return (
              <TouchableOpacity
                key={resident.id}
                activeOpacity={0.7}
                onPress={() =>
                  router.navigate(`/(tabs)/resident/${resident.id}`)
                }
                style={{ marginBottom: 12 }}
              >
                <Card variant="elevated" style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Avatar with status dot */}
                    <View style={{ position: "relative" }}>
                      <Avatar
                        name={resident.name}
                        uri={resident.photo_url}
                        size={60}
                      />
                      <View
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: colors.status[resident.status]?.color || colors.success,
                          borderWidth: 2.5,
                          borderColor: colors.surface,
                        }}
                      />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: colors.text,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {resident.name}
                        </Text>
                        <StatusBadge status={resident.status} size="sm" />
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 4,
                          gap: 4,
                        }}
                      >
                        <MapPin size={14} color={colors.textTertiary} />
                        <Text
                          style={{ fontSize: 14, color: colors.textTertiary }}
                        >
                          Room {resident.room}
                        </Text>
                        {resident.age && (
                          <>
                            <Text style={{ color: colors.textMuted }}> · </Text>
                            <Text style={{ fontSize: 14, color: colors.textTertiary }}>
                              Age {resident.age}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Glucose reading row */}
                      {glucoseValue && (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginTop: 10,
                            backgroundColor: isHighGlucose
                              ? colors.dangerLight
                              : isLowGlucose
                              ? colors.warningLight
                              : colors.successLight,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: radius.sm,
                            alignSelf: "flex-start",
                            gap: 6,
                          }}
                        >
                          <Droplet
                            size={14}
                            color={
                              isHighGlucose
                                ? colors.danger
                                : isLowGlucose
                                ? colors.warningDark
                                : colors.successDark
                            }
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "700",
                              color: isHighGlucose
                                ? colors.dangerDark
                                : isLowGlucose
                                ? colors.warningDark
                                : colors.successDark,
                            }}
                          >
                            {glucoseValue} mg/dL
                          </Text>
                        </View>
                      )}
                    </View>

                    <ChevronRight size={22} color={colors.divider} style={{ marginLeft: 4 }} />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
