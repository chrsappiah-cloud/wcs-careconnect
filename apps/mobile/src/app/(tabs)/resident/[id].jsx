import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  Heart,
  Droplet,
  Wind,
  Bluetooth,
  Plus,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, typography, shadows } from '../../../theme';
import { mockResidents, mockReadings, mockTasks } from '../../../mockData';
import Avatar from '../../../components/Avatar';
import StatusBadge from '../../../components/StatusBadge';
import Card from '../../../components/Card';
import SectionHeader from '../../../components/SectionHeader';
import EmptyState from '../../../components/EmptyState';
import { apiUrl } from '../../../services/apiClient';

const VITAL_CONFIG = {
  glucose: {
    label: 'Glucose',
    unit: 'mg/dL',
    icon: Droplet,
    iconColor: '#EF4444',
    bg: '#FEF2F2',
    getStatus: (v) => (v > 180 ? 'high' : v < 70 ? 'low' : 'normal'),
  },
  hr: {
    label: 'Heart Rate',
    unit: 'bpm',
    icon: Heart,
    iconColor: '#DC2626',
    bg: '#FFF1F2',
    getStatus: (v) => (v > 100 ? 'high' : v < 60 ? 'low' : 'normal'),
  },
  spo2: {
    label: 'SpO2',
    unit: '%',
    icon: Wind,
    iconColor: colors.primary,
    bg: colors.primaryLight,
    getStatus: (v) => (v < 95 ? 'low' : 'normal'),
  },
  bp_systolic: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: Activity,
    iconColor: '#7C3AED',
    bg: '#F5F3FF',
    getStatus: (v) => (v > 140 ? 'high' : v < 90 ? 'low' : 'normal'),
  },
};

const STATUS_COLORS = {
  high: colors.statusCritical,
  low: colors.statusWarning,
  normal: colors.statusStable,
};

export default function ResidentDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: residents = mockResidents } = useQuery({
    queryKey: ['residents'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/residents'));
      if (!response.ok)
        throw new Error(`Residents fetch failed: ${response.status}`);
      return response.json();
    },
    placeholderData: mockResidents,
  });

  const resident = residents.find((r) => r.id.toString() === id);

  const { data: readings = [] } = useQuery({
    queryKey: ['readings', id],
    queryFn: async () => {
      const response = await fetch(apiUrl(`/api/readings?residentId=${id}`));
      if (!response.ok)
        throw new Error(`Readings fetch failed: ${response.status}`);
      return response.json();
    },
    enabled: !!id,
    placeholderData: mockReadings.filter(
      (r) => r.resident_id?.toString() === id,
    ),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const response = await fetch(
        apiUrl(`/api/tasks?residentId=${id}&status=all`),
      );
      if (!response.ok)
        throw new Error(`Tasks fetch failed: ${response.status}`);
      return response.json();
    },
    enabled: !!id,
    placeholderData: mockTasks.filter(
      (t) => t.resident_id?.toString() === id && t.status === 'pending',
    ),
  });

  const addReadingMutation = useMutation({
    mutationFn: async (reading) => {
      const response = await fetch(apiUrl('/api/readings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...reading, resident_id: id }),
      });
      if (!response.ok)
        throw new Error(`Reading add failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readings', id] });
      queryClient.invalidateQueries({ queryKey: ['residents'] });
      Alert.alert(
        'Reading Recorded',
        'Data synced successfully via BLE simulation.',
      );
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const response = await fetch(apiUrl('/api/tasks'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      if (!response.ok)
        throw new Error(`Task toggle failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      Alert.alert('Error', 'Failed to update task. Please try again.');
    },
  });

  const simulateBLEReading = useCallback(() => {
    const metrics = ['glucose', 'hr', 'spo2', 'bp_systolic'];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    const valueMap = {
      glucose: Math.floor(Math.random() * (250 - 60) + 60),
      hr: Math.floor(Math.random() * (120 - 50) + 50),
      spo2: Math.floor(Math.random() * (100 - 85) + 85),
      bp_systolic: Math.floor(Math.random() * (160 - 100) + 100),
    };
    const units = {
      glucose: 'mg/dL',
      hr: 'bpm',
      spo2: '%',
      bp_systolic: 'mmHg',
    };

    addReadingMutation.mutate({
      metric: randomMetric,
      value: valueMap[randomMetric],
      unit: units[randomMetric],
      device_id: 'BLE-SIM-123',
      source: 'ble',
    });
  }, [addReadingMutation]);

  if (!resident) return null;

  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: colors.surface,
          ...shadows.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.headline, { color: colors.text }]}>
          Resident Detail
        </Text>
        <TouchableOpacity
          onPress={simulateBLEReading}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bluetooth size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={resident.name} size={64} />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={[typography.title3, { color: colors.text }]}>
                {resident.name}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <MapPin size={13} color={colors.textTertiary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  Room {resident.room}
                </Text>
              </View>
              <StatusBadge status={resident.status} style={{ marginTop: 6 }} />
            </View>
          </View>

          {/* Quick info row */}
          {(resident.age || resident.conditions) && (
            <View
              style={{
                flexDirection: 'row',
                marginTop: 14,
                paddingTop: 14,
                borderTopWidth: 1,
                borderColor: colors.borderLight,
                gap: 16,
              }}
            >
              {resident.age && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                >
                  <Calendar size={13} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Age {resident.age}
                  </Text>
                </View>
              )}
              {resident.conditions && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    flex: 1,
                  }}
                >
                  <FileText size={13} color={colors.textMuted} />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      flex: 1,
                    }}
                  >
                    {Array.isArray(resident.conditions)
                      ? resident.conditions.join(', ')
                      : resident.conditions}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Vitals */}
        <SectionHeader title="Latest Vitals" style={{ marginBottom: 12 }} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {Object.entries(VITAL_CONFIG).map(([metric, config]) => {
            const reading = readings.find((r) => r.metric === metric);
            const val = reading?.value;
            const IconComp = config.icon;
            const status = val != null ? config.getStatus(val) : null;

            return (
              <View
                key={metric}
                style={{
                  width: 140,
                  backgroundColor: colors.surface,
                  borderRadius: radius.xl,
                  padding: 14,
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: colors.surfaceBorder,
                  ...shadows.sm,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: config.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <IconComp size={22} color={config.iconColor} />
                </View>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '700',
                    color: status ? STATUS_COLORS[status] : colors.text,
                  }}
                >
                  {val ?? '--'}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textMuted,
                    fontWeight: '500',
                  }}
                >
                  {config.unit}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.textSecondary,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  {config.label}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Tasks */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader
            title="Pending Tasks"
            subtitle={`${pendingTasks.length} remaining`}
            right={
              <TouchableOpacity
                hitSlop={8}
                onPress={() =>
                  Alert.alert(
                    'Add Task',
                    'Create a new task for this resident?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Add',
                        onPress: () =>
                          Alert.alert(
                            'Coming Soon',
                            'Task creation will be available in a future update.',
                          ),
                      },
                    ],
                  )
                }
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={16} color={colors.primary} />
              </TouchableOpacity>
            }
            style={{ marginBottom: 12 }}
          />

          {pendingTasks.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={32} color={colors.statusStable} />}
              title="All caught up!"
              subtitle="No pending tasks for this resident"
            />
          ) : (
            pendingTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                activeOpacity={0.7}
                onPress={() => {
                  Alert.alert(
                    'Complete Task',
                    `Mark "${task.title}" as completed?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Complete',
                        onPress: () => toggleTaskMutation.mutate(task),
                      },
                    ],
                  );
                }}
              >
                <Card style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        backgroundColor: colors.surfaceSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Clock size={18} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: colors.text,
                        }}
                      >
                        {task.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textTertiary,
                          marginTop: 1,
                        }}
                      >
                        Due Today
                      </Text>
                    </View>
                    <CheckCircle2 size={22} color={colors.divider} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
