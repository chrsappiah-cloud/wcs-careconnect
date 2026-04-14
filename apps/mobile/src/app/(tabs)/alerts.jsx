// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
  Modal,
  Linking,
  Alert as RNAlert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle,
  Bell,
  Clock,
  Info,
  ShieldAlert,
  Zap,
  Shield,
  User,
  ChevronRight,
  Phone,
  Activity,
  FileText,
  ExternalLink,
  X,
  Stethoscope,
  Building2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import { mockAlerts } from '../../mockData';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import PulseIndicator from '../../components/PulseIndicator';
import AnimatedNumber from '../../components/AnimatedNumber';
import { SkeletonList } from '../../components/Skeleton';
import { apiUrl } from '../../services/apiClient';
import { haptic } from '../../utils/haptics';
import { getAUClinicalContext } from '../../services/auHealthAlertService';
import { playAcknowledgeSound, playEscalationSound, playAlertBySeverity } from '../../services/soundService';

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

/* ────────────── AU Clinical Context Badge ────────────── */
function AUClinicalBadge({ snomedCode, snomedDisplay }) {
  if (!snomedCode) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.md,
        gap: 4,
        borderWidth: 1,
        borderColor: '#BBF7D0',
      }}
    >
      <Stethoscope size={11} color="#16A34A" />
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A', letterSpacing: 0.3 }}>
        SNOMED {snomedCode}
      </Text>
      <Text style={{ fontSize: 10, color: '#15803D' }} numberOfLines={1}>
        {snomedDisplay}
      </Text>
    </View>
  );
}

/* ────────────── AU Escalation Modal ────────────── */
function EscalationModal({ visible, onClose, alert, auContext, onEscalate, isPending }) {
  if (!auContext) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            maxHeight: '85%',
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', letterSpacing: -0.4 }}>
                    AU Health Escalation
                  </Text>
                  <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>
                    NSQHS Standard 8 Protocol
                  </Text>
                </View>
              </View>
              <AnimatedPressable onPress={onClose} hapticType="light">
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} color="#6B7280" />
                </View>
              </AnimatedPressable>
            </View>

            {/* Escalation Level */}
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#991B1B', letterSpacing: 0.5, marginBottom: 6 }}>
                ESCALATION LEVEL
              </Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#DC2626' }}>
                {auContext.escalationLabel}
              </Text>
              <Text style={{ fontSize: 13, color: '#7F1D1D', marginTop: 4, lineHeight: 19 }}>
                {auContext.escalationAction}
              </Text>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' }}>
                {auContext.nsqhsStandard}
              </Text>
            </View>

            {/* SNOMED Clinical Code */}
            {auContext.snomedCode && (
              <View style={{ backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#166534', letterSpacing: 0.5, marginBottom: 6 }}>
                  SNOMED CT-AU CLINICAL CODE
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Stethoscope size={16} color="#16A34A" />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#15803D' }}>
                      {auContext.snomedDisplay}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      SNOMED: {auContext.snomedCode} • {auContext.guideline || 'ACSQHC Standard'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ISBAR Handover */}
            {auContext.isbar && (
              <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E40AF', letterSpacing: 0.5, marginBottom: 10 }}>
                  ISBAR CLINICAL HANDOVER
                </Text>
                {[
                  { label: 'I — Identify', value: `${auContext.isbar.identify.facility} • ${auContext.isbar.identify.patient}` },
                  { label: 'S — Situation', value: auContext.isbar.situation.description },
                  { label: 'B — Background', value: `Resident ID: ${auContext.isbar.background.residentId}` },
                  { label: 'A — Assessment', value: auContext.isbar.assessment.clinicalImpression },
                  { label: 'R — Recommendation', value: auContext.isbar.recommendation.action },
                ].map((item) => (
                  <View key={item.label} style={{ marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>{item.label}</Text>
                    <Text style={{ fontSize: 13, color: '#374151', marginTop: 1, lineHeight: 18 }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Emergency Contacts */}
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, marginBottom: 10 }}>
              AU HEALTH CONTACTS
            </Text>
            {(auContext.escalationContacts || []).map((contact, i) => (
              <AnimatedPressable
                key={i}
                onPress={() => {
                  if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
                }}
                hapticType="light"
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    gap: 12,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: contact.type === 'emergency' ? '#FEE2E2' : '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={16} color={contact.type === 'emergency' ? '#DC2626' : '#2563EB'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>{contact.name}</Text>
                    {contact.phone && (
                      <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 1 }}>{contact.phone}</Text>
                    )}
                  </View>
                  <ExternalLink size={14} color="#9CA3AF" />
                </View>
              </AnimatedPressable>
            ))}

            {/* Escalate Button */}
            <AnimatedPressable
              onPress={() => onEscalate(alert.id)}
              disabled={isPending}
              hapticType="heavy"
              style={{ marginTop: 8, marginBottom: 16 }}
            >
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Building2 size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}>
                  {isPending ? 'Escalating…' : 'Confirm Escalation to Health Centre'}
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [escalationModal, setEscalationModal] = useState({ visible: false, alert: null, auContext: null });

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
      const response = await fetch(apiUrl(`/api/alerts/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      playAcknowledgeSound();
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(apiUrl(`/api/alerts/${id}/escalate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok)
        throw new Error(`Escalation failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      haptic.success();
      playEscalationSound();
      setEscalationModal({ visible: false, alert: null, auContext: null });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      RNAlert.alert(
        '✅ Escalated',
        'Alert has been escalated to the Australian health centre via NSQHS Standard 8 protocol.',
      );
    },
    onError: (err) => {
      RNAlert.alert('Escalation Failed', err.message);
    },
  });

  const openEscalation = (alert) => {
    const auContext = getAUClinicalContext(alert);
    setEscalationModal({ visible: true, alert, auContext });
  };

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Dynamic Gradient Header */}
      <LinearGradient
        colors={criticalCount > 0 ? ['#7F1D1D', '#991B1B', '#DC2626'] : gradients.headerVibrant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 22,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
              Alerts
            </Text>
            <Text
              style={[
                typography.callout,
                { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
              ]}
            >
              {alerts.length > 0
                ? `${alerts.length} active alert${alerts.length !== 1 ? 's' : ''}`
                : 'No active alerts'}
            </Text>
          </View>
          {alerts.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {criticalCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <PulseIndicator color="#FCA5A5" size={6} />
                  <AnimatedNumber
                    value={criticalCount}
                    style={{ fontSize: 14, fontWeight: '800', color: colors.textInverse }}
                  />
                </View>
              )}
              {warningCount > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.full,
                    gap: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <AlertTriangle size={13} color="#FCD34D" />
                  <AnimatedNumber
                    value={warningCount}
                    style={{ fontSize: 14, fontWeight: '800', color: colors.textInverse }}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Severity filter tabs */}
        {alerts.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'critical', label: 'Critical' },
              { key: 'warning', label: 'Warning' },
              { key: 'info', label: 'Info' },
            ].map((f) => (
              <AnimatedPressable
                key={f.key}
                onPress={() => {
                  setSeverityFilter(f.key);
                  if (f.key === 'critical' || f.key === 'warning') playAlertBySeverity(f.key);
                }}
                hapticType="selection"
              >
                <View
                  style={{
                    backgroundColor: severityFilter === f.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: severityFilter === f.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textInverse }}>
                    {f.label}
                  </Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        )}
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
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.successLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                ...shadows.colored(colors.success),
              }}
            >
              <Shield size={36} color={colors.success} />
            </View>
            <Text style={[typography.title3, { color: colors.text, marginBottom: 6 }]}>
              All Clear
            </Text>
            <Text style={{ fontSize: 15, color: colors.textTertiary, textAlign: 'center' }}>
              No active alerts — all residents are stable
            </Text>
          </View>
        ) : (
          alerts
            .filter((a) => severityFilter === 'all' || a.severity === severityFilter)
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
                            gap: 8,
                          }}
                        >
                          <LinearGradient
                            colors={sev.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 10,
                              paddingVertical: 5,
                              borderRadius: radius.full,
                              gap: 5,
                            }}
                          >
                            <SevIcon size={12} color="#FFFFFF" />
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '800',
                                color: '#FFFFFF',
                                letterSpacing: 0.8,
                              }}
                            >
                              {sev.label}
                            </Text>
                          </LinearGradient>
                          {alert.severity === 'critical' && (
                            <PulseIndicator color={colors.danger} size={7} />
                          )}
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

                      {/* Resident info — tappable to navigate */}
                      <AnimatedPressable
                        onPress={() => router.navigate(`/(tabs)/resident/${alert.resident_id}`)}
                        hapticType="light"
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text
                            style={{
                              fontSize: 17,
                              fontWeight: '600',
                              color: colors.primary,
                              marginBottom: 2,
                              letterSpacing: -0.4,
                            }}
                          >
                            {alert.resident_name}
                          </Text>
                          <ChevronRight size={15} color={colors.primary} />
                        </View>
                      </AnimatedPressable>

                      {/* Alert message */}
                      <Text
                        style={{
                          fontSize: 15,
                          color: colors.textSecondary,
                          lineHeight: 22,
                          marginTop: 6,
                          marginBottom: 10,
                        }}
                      >
                        {alert.message}
                      </Text>

                      {/* AU Clinical Context — SNOMED badge + guideline */}
                      {(() => {
                        const auCtx = getAUClinicalContext(alert);
                        return (
                          <View style={{ marginBottom: 14 }}>
                            <AUClinicalBadge
                              snomedCode={auCtx.snomedCode}
                              snomedDisplay={auCtx.snomedDisplay}
                            />
                            {auCtx.guideline && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                <FileText size={10} color="#9CA3AF" />
                                <Text style={{ fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>
                                  {auCtx.guideline}
                                </Text>
                              </View>
                            )}
                            {alert.escalation_level && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.md }}>
                                <Building2 size={10} color="#92400E" />
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#92400E' }}>
                                  Escalated to {alert.escalated_to}
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })()}

                      {/* Action buttons */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {/* Acknowledge */}
                        <AnimatedPressable
                          onPress={() => ackMutation.mutate(alert.id)}
                          disabled={ackMutation.isPending}
                          hapticType="medium"
                          style={{ flex: 1 }}
                        >
                          <LinearGradient
                            colors={sev.gradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              borderRadius: radius.lg,
                              paddingVertical: 14,
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
                                fontWeight: '700',
                                letterSpacing: -0.3,
                              }}
                            >
                              Acknowledge
                            </Text>
                          </LinearGradient>
                        </AnimatedPressable>

                        {/* Escalate to AU Health Centre */}
                        {(alert.severity === 'critical' || alert.severity === 'warning') && !alert.escalation_level && (
                          <AnimatedPressable
                            onPress={() => openEscalation(alert)}
                            hapticType="medium"
                            style={{ flex: 1 }}
                          >
                            <View
                              style={{
                                borderRadius: radius.lg,
                                paddingVertical: 14,
                                alignItems: 'center',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                gap: 6,
                                borderWidth: 1.5,
                                borderColor: sev.color,
                                backgroundColor: sev.bg,
                              }}
                            >
                              <Building2 size={15} color={sev.darkText} />
                              <Text
                                style={{
                                  color: sev.darkText,
                                  fontSize: 13,
                                  fontWeight: '700',
                                  letterSpacing: -0.2,
                                }}
                              >
                                Escalate AU
                              </Text>
                            </View>
                          </AnimatedPressable>
                        )}
                      </View>
                    </View>
                  </Card>
                </AnimatedAlertCard>
              );
            })
        )}
      </ScrollView>

      {/* AU Escalation Modal */}
      <EscalationModal
        visible={escalationModal.visible}
        onClose={() => setEscalationModal({ visible: false, alert: null, auContext: null })}
        alert={escalationModal.alert}
        auContext={escalationModal.auContext}
        onEscalate={(id) => escalateMutation.mutate(id)}
        isPending={escalateMutation.isPending}
      />
    </View>
  );
}
