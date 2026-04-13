import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
  Bell,
  ClipboardList,
  MessageSquare,
  Pill,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, shadows, gradients } from '../../../theme';
import { mockResidents, mockReadings, mockTasks } from '../../../mockData';
import Avatar from '../../../components/Avatar';
import StatusBadge from '../../../components/StatusBadge';
import Card from '../../../components/Card';
import SectionHeader from '../../../components/SectionHeader';
import EmptyState from '../../../components/EmptyState';
import AnimatedPressable from '../../../components/AnimatedPressable';
import { haptic } from '../../../utils/haptics';
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
      const response = await fetch(apiUrl(`/api/tasks/${task.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const addTaskMutation = useMutation({
    mutationFn: async (task) => {
      const response = await fetch(apiUrl('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...task, resident_id: id, status: 'pending' }),
      });
      if (!response.ok)
        throw new Error(`Task creation failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      Alert.alert('Task Created', 'New task added successfully.');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    },
  });

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Validation', 'Please enter a task title.');
      return;
    }
    addTaskMutation.mutate({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim(),
      due_date: new Date().toISOString(),
    });
    setShowAddTask(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
  }, [newTaskTitle, newTaskDescription, addTaskMutation]);

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
      }}
    >
      {/* Header */}
      <LinearGradient
        colors={gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          paddingTop: insets.top + 10,
        }}
      >
        <AnimatedPressable
          onPress={() => router.back()}
          hapticType="light"
          hitSlop={12}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={20} color="#fff" />
        </AnimatedPressable>
        <Text style={[typography.headline, { color: '#fff' }]}>
          Resident Detail
        </Text>
        <AnimatedPressable
          onPress={() => simulateBLEReading()}
          hapticType="medium"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bluetooth size={18} color="#fff" />
        </AnimatedPressable>
      </LinearGradient>

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

        {/* Quick Navigation Actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/alerts')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.dangerLight, alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={18} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Alerts</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>View all alerts</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </Card>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/tasks')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Tasks</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>View all tasks</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </Card>
          </AnimatedPressable>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/messages')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Messages</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Team chat</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </Card>
          </AnimatedPressable>
          <AnimatedPressable
            onPress={() => router.navigate('/(tabs)/medications')}
            hapticType="light"
            style={{ flex: 1 }}
          >
            <Card style={{ padding: 14, alignItems: 'center', flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={18} color="#065F46" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>Meds</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>Medications</Text>
              </View>
              <ChevronRight size={14} color={colors.textMuted} />
            </Card>
          </AnimatedPressable>
        </View>

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
              <AnimatedPressable
                hitSlop={8}
                onPress={() => setShowAddTask(true)}
                hapticType="light"
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
              </AnimatedPressable>
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
              <AnimatedPressable
                key={task.id}
                onPress={() => {
                  Alert.alert(
                    'Complete Task',
                    `Mark "${task.title}" as completed?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Complete',
                        onPress: () => { haptic.success(); toggleTaskMutation.mutate(task); },
                      },
                    ],
                  );
                }}
                hapticType="medium"
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
              </AnimatedPressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTask}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddTask(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <AnimatedPressable
            onPress={() => setShowAddTask(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <Text
              style={[
                typography.title2,
                { color: colors.text, marginBottom: 20 },
              ]}
            >
              New Task for {resident.name}
            </Text>

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textTertiary,
                marginBottom: 6,
              }}
            >
              TITLE
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.lg,
                padding: 14,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                marginBottom: 16,
              }}
              placeholder="e.g. Administer morning medication"
              placeholderTextColor={colors.textMuted}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />

            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textTertiary,
                marginBottom: 6,
              }}
            >
              DESCRIPTION (optional)
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                borderRadius: radius.lg,
                padding: 14,
                fontSize: 16,
                color: colors.text,
                backgroundColor: colors.background,
                marginBottom: 24,
                minHeight: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Additional details..."
              placeholderTextColor={colors.textMuted}
              value={newTaskDescription}
              onChangeText={setNewTaskDescription}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnimatedPressable
                onPress={() => {
                  setShowAddTask(false);
                  setNewTaskTitle('');
                  setNewTaskDescription('');
                }}
                hapticType="light"
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surfaceSecondary,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textSecondary,
                  }}
                >
                  Cancel
                </Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => handleCreateTask()}
                hapticType="success"
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: radius.lg,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  opacity: addTaskMutation.isPending ? 0.6 : 1,
                  ...shadows.colored?.(colors.primary) || {},
                }}
                disabled={addTaskMutation.isPending}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.textInverse,
                  }}
                >
                  {addTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
