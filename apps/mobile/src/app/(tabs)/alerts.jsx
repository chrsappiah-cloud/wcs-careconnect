import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  Bell,
  Clock,
  Info,
  ShieldAlert,
  Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import { mockAlerts } from '../../mockData';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import { SkeletonList } from '../../components/Skeleton';
import { apiUrl } from '../../services/apiClient';
import { haptic } from '../../utils/haptics';

const SEVERITY_CONFIG = {
  critical: {
    color: colors.danger,
    bg: colors.dangerLight,
    darkText: colors.dangerDark,
    icon: ShieldAlert,
    label: 'CRITICAL',
    gradient: ['#DC2626', '#EF4444'],
  },
  warning: {
    color: colors.warning,
    bg: colors.warningLight,
    darkText: colors.warningDark,
    icon: AlertTriangle,
    label: 'WARNING',
    gradient: ['#D97706', '#F59E0B'],
  },
  info: {
    color: colors.severity.info,
    bg: '#EFF6FF',
    darkText: '#1E40AF',
    icon: Info,
    label: 'INFO',
    gradient: ['#2563EB', '#3B82F6'],
  },
};

function AnimatedAlertCard({ children, index }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const delay = Math.min(index * 80, 400);
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
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
        marginBottom: 14,
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const {
    data: alerts = mockAlerts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/alerts?status=open'));
      if (!response.ok)
        throw new Error(`Alerts fetch failed: ${response.status}`);
      return response.json();
    },
    placeholderData: mockAlerts,
  });

  const ackMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(apiUrl('/api/alerts'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'acknowledged',
          acknowledged_by: 'Nurse Sarah',
        }),
      });
      if (!response.ok)
        throw new Error(`Alert update failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      haptic.success();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={criticalCount > 0 ? ['#991B1B', '#DC2626'] : gradients.header}
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
          }}
        >
          <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
            Alerts
          </Text>
          {alerts.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {criticalCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    gap: 5,
                  }}
                >
                  <Zap size={13} color="#FCA5A5" />
                  <Text
                    style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}
                  >
                    {criticalCount}
                  </Text>
                </View>
              )}
              {warningCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    gap: 5,
                  }}
                >
                  <AlertTriangle size={13} color="#FCD34D" />
                  <Text
                    style={{ fontSize: 13, fontWeight: '700', color: colors.textInverse }}
                  >
                    {warningCount}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Text
          style={[
            typography.callout,
            { color: 'rgba(255,255,255,0.8)', marginTop: 4 },
          ]}
        >
          {alerts.length > 0
            ? `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} requiring attention`
            : 'No active alerts'}
        </Text>
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
        {isLoading && !alerts.length ? (
          <SkeletonList count={3} />
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={40} color={colors.success} />}
            title="All clear!"
            subtitle="No active alerts — all residents are stable"
          />
        ) : (
          alerts
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, info: 2 };
              return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
            })
            .map((alert, idx) => {
              const sev =
                SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const SevIcon = sev.icon;

              return (
                <AnimatedAlertCard key={alert.id} index={idx}>
                  <Card variant="elevated" noPadding>
                    {/* Severity accent bar with gradient */}
                    <LinearGradient
                      colors={sev.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: 4,
                        borderTopLeftRadius: radius.xl,
                        borderTopRightRadius: radius.xl,
                      }}
                    />
                    <View style={{ padding: 16 }}>
                      {/* Top row: severity badge + time */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: sev.bg,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: radius.full,
                            gap: 5,
                          }}
                        >
                          <SevIcon size={13} color={sev.color} />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: sev.darkText,
                              letterSpacing: 0.8,
                            }}
                          >
                            {sev.label}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Clock size={12} color={colors.textMuted} />
                          <Text
                            style={{ fontSize: 12, color: colors.textMuted }}
                          >
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                      </View>

                      {/* Resident info */}
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: 2,
                          letterSpacing: -0.4,
                        }}
                      >
                        {alert.resident_name}
                      </Text>

                      {/* Alert message */}
                      <Text
                        style={{
                          fontSize: 15,
                          color: colors.textSecondary,
                          lineHeight: 22,
                          marginTop: 6,
                          marginBottom: 16,
                        }}
                      >
                        {alert.message}
                      </Text>

                      {/* Action button */}
                      <AnimatedPressable
                        onPress={() => ackMutation.mutate(alert.id)}
                        disabled={ackMutation.isPending}
                        hapticType="medium"
                        style={{
                          backgroundColor: sev.color,
                          borderRadius: radius.md,
                          paddingVertical: 13,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 8,
                          ...shadows.colored(sev.color),
                        }}
                      >
                        <CheckCircle size={17} color={colors.textInverse} />
                        <Text
                          style={{
                            color: colors.textInverse,
                            fontSize: 15,
                            fontWeight: '600',
                            letterSpacing: -0.3,
                          }}
                        >
                          Acknowledge
                        </Text>
                      </AnimatedPressable>
                    </View>
                  </Card>
                </AnimatedAlertCard>
              );
            })
        )}
      </ScrollView>
    </View>
  );
}
