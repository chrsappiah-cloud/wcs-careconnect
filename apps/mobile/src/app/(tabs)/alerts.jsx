import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import { format, formatDistanceToNow } from 'date-fns';
import { colors, radius, shadows, typography } from '../../theme';
import { mockAlerts } from '../../mockData';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { SkeletonList } from '../../components/Skeleton';
import { apiUrl } from '../../services/apiClient';

const SEVERITY_CONFIG = {
  critical: {
    color: colors.danger,
    bg: colors.dangerLight,
    darkText: colors.dangerDark,
    icon: ShieldAlert,
    label: 'CRITICAL',
  },
  warning: {
    color: colors.warning,
    bg: colors.warningLight,
    darkText: colors.warningDark,
    icon: AlertTriangle,
    label: 'WARNING',
  },
  info: {
    color: colors.severity.info,
    bg: '#EFF6FF',
    darkText: '#1E40AF',
    icon: Info,
    label: 'INFO',
  },
};

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
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={[typography.largeTitle, { color: colors.text }]}>
            Alerts
          </Text>
          {alerts.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {criticalCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.dangerLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    gap: 4,
                  }}
                >
                  <Zap size={14} color={colors.danger} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.danger,
                    }}
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
                    backgroundColor: colors.warningLight,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radius.full,
                    gap: 4,
                  }}
                >
                  <AlertTriangle size={14} color={colors.warning} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: colors.warningDark,
                    }}
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
            { color: colors.textTertiary, marginTop: 4, marginBottom: 8 },
          ]}
        >
          {alerts.length > 0
            ? `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''} requiring attention`
            : 'No active alerts'}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
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
            .map((alert) => {
              const sev =
                SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const SevIcon = sev.icon;

              return (
                <View key={alert.id} style={{ marginBottom: 12 }}>
                  <Card variant="elevated" noPadding>
                    {/* Severity accent bar */}
                    <View
                      style={{
                        height: 4,
                        backgroundColor: sev.color,
                        borderTopLeftRadius: radius['2xl'],
                        borderTopRightRadius: radius['2xl'],
                      }}
                    />
                    <View style={{ padding: 18 }}>
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
                            borderRadius: radius.sm,
                            gap: 6,
                          }}
                        >
                          <SevIcon size={14} color={sev.color} />
                          <Text
                            style={{
                              fontSize: 12,
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
                          <Clock size={13} color={colors.textMuted} />
                          <Text
                            style={{ fontSize: 13, color: colors.textMuted }}
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
                          fontWeight: '700',
                          color: colors.text,
                          marginBottom: 2,
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
                          marginBottom: 14,
                        }}
                      >
                        {alert.message}
                      </Text>

                      {/* Action button */}
                      <TouchableOpacity
                        onPress={() => ackMutation.mutate(alert.id)}
                        disabled={ackMutation.isPending}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: colors.text,
                          borderRadius: radius.md,
                          paddingVertical: 13,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 8,
                          opacity: ackMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle size={18} color={colors.textInverse} />
                        <Text
                          style={{
                            color: colors.textInverse,
                            fontSize: 15,
                            fontWeight: '700',
                          }}
                        >
                          Acknowledge
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </View>
              );
            })
        )}
      </ScrollView>
    </View>
  );
}
