// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
  AlertCircle,
  Sparkles,
  User,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockTasks, mockResidents } from '../../mockData';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import ProgressRing from '../../components/ProgressRing';
import AnimatedNumber from '../../components/AnimatedNumber';
import { SkeletonList } from '../../components/Skeleton';
import { apiUrl } from '../../services/apiClient';

const PRIORITY_CONFIG = {
  high: { color: colors.danger, bg: colors.dangerLight, label: 'High', gradient: ['#EF4444', '#F87171'] },
  medium: { color: colors.warning, bg: colors.warningLight, label: 'Med', gradient: ['#F59E0B', '#FBBF24'] },
  low: { color: colors.primary, bg: colors.primaryLight, label: 'Low', gradient: ['#2563EB', '#60A5FA'] },
};

function AnimatedTaskCard({ children, index, style }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const delay = index * 60;
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animation.duration.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        ...animation.spring,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    data: tasks = mockTasks,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/tasks?status=all'));
      if (!response.ok)
        throw new Error(`Tasks fetch failed: ${response.status}`);
      return response.json();
    },
    placeholderData: mockTasks,
  });

  const { data: residents = mockResidents } = useQuery({
    queryKey: ['residents'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/residents'));
      if (!response.ok) throw new Error('Failed to fetch residents');
      return response.json();
    },
    placeholderData: mockResidents,
  });

  const residentMap = residents.reduce((map, r) => {
    map[r.id] = r;
    return map;
  }, {});

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'completed' ? 'pending' : 'completed',
        }),
      });
      if (!response.ok)
        throw new Error(`Task update failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header with ProgressRing */}
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
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[typography.largeTitle, { color: colors.textInverse }]}>
              Tasks
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              {tasks.length > 0 ? `${completedTasks.length} of ${tasks.length} completed` : 'No tasks assigned'}
            </Text>
          </View>
          {tasks.length > 0 && (
            <ProgressRing
              progress={pct}
              size={64}
              strokeWidth={5}
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.2)"
              textStyle={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800' }}
            />
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
        {isLoading && !tasks.length ? (
          <SkeletonList count={4} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<ClipboardList size={40} color={colors.textMuted} />}
            title="No tasks assigned"
            subtitle="You're all caught up for today"
          />
        ) : (
          <>
            {/* Pending section */}
            {pendingTasks.length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: '#FFFFFF',
                      }}
                    >
                      {pendingTasks.length}
                    </Text>
                  </LinearGradient>
                  <Text
                    style={[
                      typography.headline,
                      { color: colors.text },
                    ]}
                  >
                    Pending
                  </Text>
                </View>
                {pendingTasks.map((task, idx) => (
                  <AnimatedTaskCard key={task.id} index={idx}>
                    <TaskItem
                      task={task}
                      onToggle={() => toggleTaskMutation.mutate(task)}
                      resident={residentMap[task.resident_id]}
                      onResidentPress={(residentId) => router.navigate(`/(tabs)/resident/${residentId}`)}
                    />
                  </AnimatedTaskCard>
                ))}
              </View>
            )}

            {/* Completed section */}
            {completedTasks.length > 0 && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <LinearGradient
                    colors={['#22C55E', '#4ADE80']}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={15} color="#FFFFFF" />
                  </LinearGradient>
                  <Text
                    style={[typography.headline, { color: colors.textMuted }]}
                  >
                    Completed
                  </Text>
                  <Sparkles size={14} color={colors.success} style={{ marginLeft: 2 }} />
                </View>
                {completedTasks.map((task, idx) => (
                  <AnimatedTaskCard key={task.id} index={idx}>
                    <TaskItem
                      task={task}
                      onToggle={() => toggleTaskMutation.mutate(task)}
                      resident={residentMap[task.resident_id]}
                      onResidentPress={(residentId) => router.navigate(`/(tabs)/resident/${residentId}`)}
                    />
                  </AnimatedTaskCard>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TaskItem({ task, onToggle, resident, onResidentPress }) {
  const isCompleted = task.status === 'completed';
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleToggle = () => {
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handleToggle}
      hapticType={isCompleted ? 'light' : 'success'}
      style={{ marginBottom: 10 }}
    >
      <Card
        variant="elevated"
        style={{
          padding: 16,
          opacity: isCompleted ? 0.55 : 1,
          overflow: 'hidden',
        }}
      >
        {/* Priority accent bar */}
        {!isCompleted && (
          <LinearGradient
            colors={priority.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              borderTopLeftRadius: radius.xl,
              borderBottomLeftRadius: radius.xl,
            }}
          />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {/* Check icon */}
          <View style={{ marginRight: 14, marginTop: 2 }}>
            {isCompleted ? (
              <CheckCircle2 size={24} color={colors.success} />
            ) : (
              <Circle size={24} color={colors.primary} />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: isCompleted ? colors.textMuted : colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                lineHeight: 22,
                letterSpacing: -0.32,
              }}
            >
              {task.title}
            </Text>
            {task.description && !isCompleted && (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textTertiary,
                  marginTop: 4,
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {task.description}
              </Text>
            )}

            {/* Meta row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {/* Resident link */}
              {resident && !isCompleted && (
                <AnimatedPressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onResidentPress?.(task.resident_id);
                  }}
                  hapticType="light"
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.primaryLight,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: radius.full,
                      gap: 4,
                    }}
                  >
                    <User size={11} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: colors.primary,
                      }}
                      numberOfLines={1}
                    >
                      {resident.name}
                    </Text>
                    <ChevronRight size={10} color={colors.primary} />
                  </View>
                </AnimatedPressable>
              )}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: priority.bg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: radius.full,
                    gap: 4,
                  }}
                >
                  {task.priority === 'high' && (
                    <AlertCircle size={12} color={priority.color} />
                  )}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: priority.color,
                      letterSpacing: 0.07,
                    }}
                  >
                    {priority.label}
                  </Text>
                </View>
              {task.due_at && !isCompleted && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Clock size={12} color={colors.textMuted} />
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    Due{' '}
                    {formatDistanceToNow(new Date(task.due_at), {
                      addSuffix: true,
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  );
}
