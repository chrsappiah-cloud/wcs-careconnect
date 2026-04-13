import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  Animated,
  StyleSheet,
  Platform,
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
  Heart,
  TrendingUp,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockResidents } from '../../mockData';
import Avatar from '../../components/Avatar';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import AnimatedNumber from '../../components/AnimatedNumber';
import PulseIndicator from '../../components/PulseIndicator';
import { apiUrl } from '../../services/apiClient';
import { SkeletonList } from '../../components/Skeleton';

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
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filteredResidents = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.room.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = activeFilter === 'all' || r.status === activeFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = residents.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Gradient Header */}
      <LinearGradient
        colors={gradients.headerVibrant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <View>
            <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
              Residents
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Real-time patient overview
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: radius.full,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Users size={15} color="rgba(255,255,255,0.9)" />
            <AnimatedNumber
              value={residents.length}
              style={{ fontSize: 16, fontWeight: '800', color: colors.textInverse }}
            />
          </View>
        </View>

        {/* Status filter tabs with animated counts */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
          <AnimatedPressable
            onPress={() => setActiveFilter('all')}
            hapticType="selection"
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: activeFilter === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: radius.full,
                gap: 6,
                borderWidth: 1,
                borderColor: activeFilter === 'all' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <Users size={13} color="rgba(255,255,255,0.9)" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}>
                {residents.length}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' }}>
                All
              </Text>
            </View>
          </AnimatedPressable>
          {[
            { key: 'stable', label: 'Stable', color: '#4ADE80', icon: Heart },
            { key: 'warning', label: 'Warning', color: '#FCD34D', icon: Activity },
            { key: 'critical', label: 'Critical', color: '#FCA5A5', icon: TrendingUp },
          ].map((s) => (
            <AnimatedPressable
              key={s.key}
              onPress={() => setActiveFilter(activeFilter === s.key ? 'all' : s.key)}
              hapticType="selection"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: activeFilter === s.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: radius.full,
                  gap: 6,
                  borderWidth: 1,
                  borderColor: activeFilter === s.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
                }}
              >
                {s.key === 'critical' && (statusCounts[s.key] || 0) > 0 ? (
                  <PulseIndicator color={s.color} size={7} />
                ) : (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: s.color,
                    }}
                  />
                )}
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}>
                  {statusCounts[s.key] || 0}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' }}>
                  {s.label}
                </Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        {/* Glass Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.95)',
            borderRadius: radius.xl,
            paddingHorizontal: 16,
            height: 50,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
            ...shadows.lg,
          }}
        >
          <Search
            size={19}
            color={searchFocused ? colors.primary : colors.textMuted}
            strokeWidth={2}
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
              marginLeft: 12,
              fontSize: 16,
              color: colors.text,
              fontWeight: '400',
            }}
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch('')} hapticType="selection">
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
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
            const isCritical = resident.status === 'critical';

            return (
              <AnimatedCard
                key={resident.id}
                index={idx}
                style={{ marginBottom: 14 }}
                onPress={() =>
                  router.navigate(`/(tabs)/resident/${resident.id}`)
                }
              >
                <Card variant="elevated" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Status accent bar */}
                  <LinearGradient
                    colors={
                      isCritical
                        ? ['#EF4444', '#F87171']
                        : resident.status === 'warning'
                          ? ['#F59E0B', '#FBBF24']
                          : ['#22C55E', '#4ADE80']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: 3 }}
                  />
                  <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Avatar with status ring */}
                      <View style={{ position: 'relative' }}>
                        <View
                          style={{
                            padding: 2,
                            borderRadius: 32,
                            borderWidth: 2,
                            borderColor:
                              colors.status[resident.status]?.color || colors.success,
                          }}
                        >
                          <Avatar
                            name={resident.name}
                            uri={resident.photo_url}
                            size={52}
                          />
                        </View>
                        {isCritical && (
                          <View style={{ position: 'absolute', top: -2, right: -2 }}>
                            <PulseIndicator color={colors.danger} size={8} />
                          </View>
                        )}
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
                              fontWeight: '700',
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
                          <MapPin size={13} color={colors.textTertiary} strokeWidth={2} />
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

                        {/* Glucose reading with gradient background */}
                        {glucoseValue && (
                          <LinearGradient
                            colors={
                              isHighGlucose
                                ? ['#FEF2F2', '#FEE2E2']
                                : isLowGlucose
                                  ? ['#FEF3C7', '#FDE68A']
                                  : ['#DCFCE7', '#BBF7D0']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: 10,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
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
                              strokeWidth={2.5}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: '800',
                                color: isHighGlucose
                                  ? colors.dangerDark
                                  : isLowGlucose
                                    ? colors.warningDark
                                    : colors.successDark,
                                letterSpacing: -0.2,
                              }}
                            >
                              {glucoseValue} mg/dL
                            </Text>
                          </LinearGradient>
                        )}
                      </View>

                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: colors.surfaceSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: 8,
                        }}
                      >
                        <ChevronRight size={16} color={colors.textMuted} />
                      </View>
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
