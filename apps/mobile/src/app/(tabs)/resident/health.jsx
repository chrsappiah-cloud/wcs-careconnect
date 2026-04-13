import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Heart,
  Activity,
  Droplet,
  Wind,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Shield,
  Pill,
  FileText,
  Stethoscope,
  Cloud,
  Database,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, shadows, gradients } from '../../../theme';
import Card from '../../../components/Card';
import StatusBadge from '../../../components/StatusBadge';
import AnimatedPressable from '../../../components/AnimatedPressable';
import { apiUrl } from '../../../services/apiClient';

const VITAL_ICONS = {
  glucose: { icon: Droplet, color: '#EF4444', bg: '#FEF2F2', label: 'Glucose' },
  hr: { icon: Heart, color: '#DC2626', bg: '#FFF1F2', label: 'Heart Rate' },
  spo2: { icon: Wind, color: '#0EA5E9', bg: '#F0F9FF', label: 'SpO2' },
  bp_systolic: { icon: Activity, color: '#7C3AED', bg: '#F5F3FF', label: 'Blood Pressure' },
  heart_rate: { icon: Heart, color: '#DC2626', bg: '#FFF1F2', label: 'Heart Rate' },
  temperature: { icon: Thermometer, color: '#F59E0B', bg: '#FFFBEB', label: 'Temperature' },
  blood_pressure: { icon: Activity, color: '#7C3AED', bg: '#F5F3FF', label: 'Blood Pressure' },
};

const RISK_COLORS = {
  critical: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', badge: '#EF4444' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', badge: '#F59E0B' },
  stable: { bg: '#F0FDF4', border: '#BBF7D0', text: '#065F46', badge: '#10B981' },
};

export default function HealthAnalysisScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: healthSummary,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ['health-summary', id],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/residents/${id}/health-summary`));
      if (!response.ok) throw new Error(`Health summary fetch failed: ${response.status}`);
      return response.json();
    },
    enabled: !!id,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading health analysis...</Text>
      </View>
    );
  }

  const hs = healthSummary;
  const riskStyle = RISK_COLORS[hs?.riskAnalysis?.overallRisk] || RISK_COLORS.stable;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={hs?.riskAnalysis?.overallRisk === 'critical' ? ['#DC2626', '#EF4444', '#F87171'] :
                hs?.riskAnalysis?.overallRisk === 'warning' ? ['#D97706', '#F59E0B', '#FBBF24'] :
                ['#059669', '#10B981', '#34D399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <AnimatedPressable
            onPress={() => router.back()}
            hapticType="light"
            hitSlop={12}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </AnimatedPressable>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[typography.title3, { color: '#fff', fontWeight: '800' }]}>
              Health Analysis
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
              {hs?.resident?.name || 'Loading...'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Database size={16} color="rgba(255,255,255,0.9)" />
            <Cloud size={16} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        {/* Overall Risk Card */}
        {hs && (
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.xl,
            padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Overall Risk Level
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginTop: 4, textTransform: 'capitalize' }}>
                  {hs.riskAnalysis.overallRisk}
                </Text>
              </View>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {hs.riskAnalysis.overallRisk === 'critical' ? <AlertTriangle size={28} color="#FFF" /> :
                 hs.riskAnalysis.overallRisk === 'warning' ? <Activity size={28} color="#FFF" /> :
                 <CheckCircle2 size={28} color="#FFF" />}
              </View>
            </View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>
              {hs.riskAnalysis.risks.length} risk factors identified • Assessed {new Date(hs.riskAnalysis.assessedAt).toLocaleTimeString()}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        {error ? (
          <Card style={{ alignItems: 'center', padding: 40 }}>
            <AlertTriangle size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>Unable to Load</Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 4 }}>{error.message}</Text>
          </Card>
        ) : hs && (
          <>
            {/* Resident Info */}
            <Card variant="elevated" style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={[typography.headline, { color: colors.text }]}>{hs.resident.name}</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                    Room {hs.resident.room} • Age {hs.resident.age || '—'} • {hs.resident.care_level || 'Standard'} Care
                  </Text>
                </View>
                <StatusBadge status={hs.resident.status} />
              </View>
            </Card>

            {/* Vitals Grid */}
            <Text style={[typography.headline, { color: colors.text, marginBottom: 12 }]}>Current Vitals</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              {Object.entries(hs.vitals).map(([metric, data]) => {
                const config = VITAL_ICONS[metric] || { icon: Activity, color: '#6B7280', bg: '#F3F4F6', label: metric };
                const IconComp = config.icon;
                return (
                  <View key={metric} style={{
                    width: '47%', backgroundColor: colors.surface, borderRadius: radius.xl,
                    padding: 16, borderWidth: 1, borderColor: colors.surfaceBorder, ...shadows.sm,
                  }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: 10, backgroundColor: config.bg,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                    }}>
                      <IconComp size={18} color={config.color} />
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>{data.value}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '500' }}>{data.unit}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 }}>{config.label}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                      {new Date(data.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                );
              })}
              {Object.keys(hs.vitals).length === 0 && (
                <Card style={{ width: '100%', alignItems: 'center', padding: 24 }}>
                  <Activity size={24} color={colors.textMuted} />
                  <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8 }}>No vitals recorded yet</Text>
                </Card>
              )}
            </View>

            {/* Risk Factors */}
            {hs.riskAnalysis.risks.length > 0 && (
              <>
                <Text style={[typography.headline, { color: colors.text, marginBottom: 12 }]}>Risk Factors</Text>
                {hs.riskAnalysis.risks.map((risk, i) => {
                  const rs = RISK_COLORS[risk.level];
                  return (
                    <Card key={i} style={{
                      marginBottom: 10, backgroundColor: rs.bg,
                      borderWidth: 1, borderColor: rs.border,
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: rs.badge, alignItems: 'center', justifyContent: 'center',
                        }}>
                          {risk.direction === 'high' ? <TrendingUp size={18} color="#FFF" /> : <TrendingDown size={18} color="#FFF" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: rs.text, textTransform: 'capitalize' }}>
                            {risk.metric.replace('_', ' ')} — {risk.level.toUpperCase()}
                          </Text>
                          <Text style={{ fontSize: 13, color: rs.text, marginTop: 2 }}>
                            Value: {risk.value} • Threshold: {risk.threshold}
                          </Text>
                          <Text style={{ fontSize: 12, color: rs.text, marginTop: 2, fontStyle: 'italic' }}>
                            {risk.guideline}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
                <View style={{ height: 16 }} />
              </>
            )}

            {/* Conditions */}
            {hs.conditions && hs.conditions.length > 0 && (
              <Card variant="elevated" style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Stethoscope size={18} color="#E11D48" />
                  <Text style={[typography.headline, { color: colors.text }]}>Conditions</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {hs.conditions.map((c, i) => (
                    <View key={i} style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                      backgroundColor: '#FFF1F2', borderWidth: 1, borderColor: '#FECDD3',
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#9F1239' }}>{c}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Medications */}
            {hs.medications && hs.medications.length > 0 && (
              <Card variant="elevated" style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Pill size={18} color="#7C3AED" />
                  <Text style={[typography.headline, { color: colors.text }]}>Medications</Text>
                </View>
                {hs.medications.map((m, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingVertical: 8, borderBottomWidth: i < hs.medications.length - 1 ? 1 : 0,
                    borderColor: colors.borderLight,
                  }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7C3AED' }} />
                    <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{m}</Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Allergies */}
            {hs.allergies && hs.allergies.length > 0 && (
              <Card variant="elevated" style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <AlertTriangle size={18} color="#EA580C" />
                  <Text style={[typography.headline, { color: colors.text }]}>Allergies</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {hs.allergies.map((a, i) => (
                    <View key={i} style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                      backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FED7AA',
                    }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#9A3412' }}>{a}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Alerts Summary */}
            <Card variant="elevated" style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={18} color={colors.danger} />
                <Text style={[typography.headline, { color: colors.text }]}>Alert Summary</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#FEF2F2', borderRadius: radius.lg, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#DC2626' }}>{hs.alerts.critical}</Text>
                  <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '600' }}>Critical</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#F0F9FF', borderRadius: radius.lg, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#0284C7' }}>{hs.alerts.total}</Text>
                  <Text style={{ fontSize: 12, color: '#075985', fontWeight: '600' }}>Total</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FFFBEB', borderRadius: radius.lg, padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: '#D97706' }}>{hs.tasks.pending}</Text>
                  <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '600' }}>Pending Tasks</Text>
                </View>
              </View>
            </Card>

            {/* Data Source */}
            <Card style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Database size={16} color="#059669" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#065F46' }}>
                  Data from Supabase PostgreSQL • Backed up to Apple iCloud
                </Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
