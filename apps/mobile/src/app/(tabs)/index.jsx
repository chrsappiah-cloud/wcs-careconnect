// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
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
  Plus,
  BarChart3,
  Shield,
  Clock,
  Stethoscope,
  AlertTriangle,
  Zap,
  Award,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

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

  const greeting = useMemo(() => getGreeting(), []);
  const stableCount = statusCounts.stable || 0;
  const warningCount = statusCounts.warning || 0;
  const criticalCount = statusCounts.critical || 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Premium Aurora Gradient Header */}
      <LinearGradient
        colors={['#0F172A', '#1E3A8A', '#4338CA', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        {/* Greeting + WCS Brand */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Shield size={18} color="#fff" strokeWidth={2.5} />
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                CareConnect
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.4)' }}>
                by World Class Scholars
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.full,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Clock size={12} color="rgba(255,255,255,0.7)" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)' }}>
                {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Title */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            marginTop: 8,
          }}
        >
          <View>
            <Text style={{ fontSize: 15, fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>
              {greeting}
            </Text>
            <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
              Residents
            </Text>
          </View>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: radius.xl,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Users size={15} color="rgba(255,255,255,0.9)" />
            <AnimatedNumber
              value={residents.length}
              style={{ fontSize: 18, fontWeight: '800', color: colors.textInverse }}
            />
          </View>
        </View>

        {/* Colorful Dashboard Stat Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <Heart size={14} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stableCount}</Text>
            <Text style={styles.statLabel}>Stable</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <AlertTriangle size={14} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{warningCount}</Text>
            <Text style={styles.statLabel}>Warning</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={{ ...styles.statIconWrap, position: 'relative' }}>
              {criticalCount > 0 ? (
                <PulseIndicator color="#FCA5A5" size={14} />
              ) : (
                <Zap size={14} color="#fff" strokeWidth={2.5} />
              )}
            </View>
            <Text style={styles.statValue}>{criticalCount}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statIconWrap}>
              <Activity size={14} color="#fff" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{residents.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </LinearGradient>
        </ScrollView>

        {/* Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { key: 'all', label: 'All', count: residents.length, gradient: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)'] },
            { key: 'stable', label: 'Stable', count: stableCount, gradient: ['#10B981', '#059669'] },
            { key: 'warning', label: 'Warning', count: warningCount, gradient: ['#F59E0B', '#D97706'] },
            { key: 'critical', label: 'Critical', count: criticalCount, gradient: ['#EF4444', '#DC2626'] },
          ].map((f) => (
            <AnimatedPressable
              key={f.key}
              onPress={() => setActiveFilter(activeFilter === f.key ? 'all' : f.key)}
              hapticType="selection"
            >
              <LinearGradient
                colors={activeFilter === f.key ? f.gradient : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: radius.full,
                  gap: 5,
                  borderWidth: 1,
                  borderColor: activeFilter === f.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}>
                  {f.count}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' }}>
                  {f.label}
                </Text>
              </LinearGradient>
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
          paddingBottom: 60,
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
        {/* Quick Actions Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/alerts')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={['#FEF2F2', '#FEE2E2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickAction}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FCA5A5' }]}>
                <AlertTriangle size={16} color="#DC2626" strokeWidth={2.5} />
              </View>
              <Text style={[styles.quickActionLabel, { color: '#991B1B' }]}>Alerts</Text>
            </LinearGradient>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/tasks')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickAction}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#93C5FD' }]}>
                <Stethoscope size={16} color="#1D4ED8" strokeWidth={2.5} />
              </View>
              <Text style={[styles.quickActionLabel, { color: '#1E3A8A' }]}>Tasks</Text>
            </LinearGradient>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/messages')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <LinearGradient
              colors={['#F5F3FF', '#EDE9FE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickAction}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#C4B5FD' }]}>
                <Zap size={16} color="#6D28D9" strokeWidth={2.5} />
              </View>
              <Text style={[styles.quickActionLabel, { color: '#4C1D95' }]}>Messages</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>

        {/* Section Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: '#7C3AED' }} />
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.3 }}>
              Patient Directory
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
            {filteredResidents.length} result{filteredResidents.length !== 1 ? 's' : ''}
          </Text>
        </View>

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

        {/* WCS Copyright Footer */}
        <View style={styles.copyrightFooter}>
          <LinearGradient
            colors={['#F8F9FE', '#EFF6FF', '#F5F3FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.copyrightGradient}
          >
            <View style={styles.copyrightDivider} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <LinearGradient
                colors={['#1E3A8A', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 22, height: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}
              >
                <Award size={12} color="#fff" strokeWidth={2.5} />
              </LinearGradient>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#4338CA', letterSpacing: 0.5 }}>
                World Class Scholars
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 }}>
              © 2026 World Class Scholars. All rights reserved.
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2, fontStyle: 'italic' }}>
              CareConnect™ — Premium Aged Care Platform
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Floating Add Resident Button */}
      <AnimatedPressable
        onPress={() => router.navigate('/(tabs)/add-resident')}
        hapticType="medium"
        style={{
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 110 : 88,
          right: 20,
          width: 58,
          height: 58,
          borderRadius: 29,
          overflow: 'hidden',
          ...shadows.lg,
          shadowColor: '#059669',
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    width: (SCREEN_WIDTH - 70) / 4,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...shadows.md,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  quickAction: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...shadows.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  copyrightFooter: {
    marginTop: 28,
    marginBottom: 10,
  },
  copyrightGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.1)',
  },
  copyrightDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C4B5FD',
    marginBottom: 12,
  },
});
