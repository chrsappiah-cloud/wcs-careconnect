import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  Animated,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  ChevronRight,
  Droplet,
  Activity,
  Users,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockResidents } from '../../mockData';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import { apiUrl } from '../../services/apiClient';
import { SkeletonList } from '../../components/Skeleton';
import { haptic } from '../../utils/haptics';

function AnimatedCard({ children, index, style, onPress }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 400);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 18,
          stiffness: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, slideAnim, index]);

  return (
    <Animated.View
      style={[
        style,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <AnimatedPressable onPress={onPress} hapticType="light">
        {children}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function ResidentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const {
    data: residents = mockResidents,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['residents'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/residents'));
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    placeholderData: mockResidents,
  });

  const filteredResidents = residents.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase()),
  );

  const statusCounts = residents.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
            Residents
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: radius.full,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Users size={14} color="rgba(255,255,255,0.9)" />
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: colors.textInverse }}
            >
              {residents.length}
            </Text>
          </View>
        </View>

        {/* Status summary pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'stable', label: 'Stable', color: '#4ADE80' },
            { key: 'warning', label: 'Warning', color: '#FCD34D' },
            { key: 'critical', label: 'Critical', color: '#FCA5A5' },
          ].map((s) => (
            <View
              key={s.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.15)',
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
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textInverse }}>
                {statusCounts[s.key] || 0} {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: radius.lg,
            paddingHorizontal: 14,
            height: 48,
            ...shadows.md,
          }}
        >
          <Search
            size={18}
            color={searchFocused ? colors.primary : colors.textMuted}
          />
          <TextInput
            placeholder="Search by name or room..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: colors.text,
            }}
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => { setSearch(''); haptic.selection(); }} hapticType={null}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} color={colors.textTertiary} />
              </View>
            </AnimatedPressable>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
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
            subtitle={
              search ? `No results for "${search}"` : 'No residents available'
            }
          />
        ) : (
          filteredResidents.map((resident, idx) => {
            const glucoseValue = resident.latest_glucose?.value;
            const isHighGlucose = glucoseValue && glucoseValue > 180;
            const isLowGlucose = glucoseValue && glucoseValue < 70;

            return (
              <AnimatedCard
                key={resident.id}
                index={idx}
                style={{ marginBottom: 12 }}
                onPress={() =>
                  router.navigate(`/(tabs)/resident/${resident.id}`)
                }
              >
                <Card variant="elevated" style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Avatar with status dot */}
                    <View style={{ position: 'relative' }}>
                      <Avatar
                        name={resident.name}
                        uri={resident.photo_url}
                        size={56}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor:
                            colors.status[resident.status]?.color ||
                            colors.success,
                          borderWidth: 2.5,
                          borderColor: colors.surface,
                        }}
                      />
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 17,
                            fontWeight: '600',
                            color: colors.text,
                            flex: 1,
                            letterSpacing: -0.4,
                          }}
                          numberOfLines={1}
                        >
                          {resident.name}
                        </Text>
                        <StatusBadge status={resident.status} size="sm" />
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 4,
                          gap: 4,
                        }}
                      >
                        <MapPin size={13} color={colors.textTertiary} />
                        <Text
                          style={{ fontSize: 14, color: colors.textTertiary }}
                        >
                          Room {resident.room}
                        </Text>
                        {resident.age && (
                          <>
                            <Text style={{ color: colors.textMuted }}> · </Text>
                            <Text
                              style={{
                                fontSize: 14,
                                color: colors.textTertiary,
                              }}
                            >
                              Age {resident.age}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Glucose reading row */}
                      {glucoseValue && (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 10,
                            backgroundColor: isHighGlucose
                              ? colors.dangerLight
                              : isLowGlucose
                                ? colors.warningLight
                                : colors.successLight,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: radius.full,
                            alignSelf: 'flex-start',
                            gap: 6,
                          }}
                        >
                          <Droplet
                            size={13}
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
                              fontWeight: '700',
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

                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: colors.surfaceSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                      }}
                    >
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                  </View>
                </Card>
              </AnimatedCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
