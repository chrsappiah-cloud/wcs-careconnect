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
} from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockTasks } from '../../mockData';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import GradientHeader from '../../components/GradientHeader';
import { haptic } from '../../utils/haptics';
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

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await fetch(apiUrl('/api/tasks'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
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
      {/* Gradient Header with progress */}
      <GradientHeader
        title="Tasks"
        subtitle={tasks.length > 0 ? `${completedTasks.length} of ${tasks.length} completed` : undefined}
      >
        {tasks.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <View
              style={{
                height: 6,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={['#60A5FA', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 6,
                  width: `${pct}%`,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.9)',
                textAlign: 'right',
                marginTop: 6,
              }}
            >
              {pct}%
            </Text>
          </View>
        )}
      </GradientHeader>

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
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '800',
                        color: colors.primary,
                      }}
                    >
                      {pendingTasks.length}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.headline,
                      { color: colors.textSecondary },
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
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: colors.successLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={14} color={colors.success} />
                  </View>
                  <Text
                    style={[typography.headline, { color: colors.textMuted }]}
                  >
                    Completed
                  </Text>
                </View>
                {completedTasks.map((task, idx) => (
                  <AnimatedTaskCard key={task.id} index={idx}>
                    <TaskItem
                      task={task}
                      onToggle={() => toggleTaskMutation.mutate(task)}
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

function TaskItem({ task, onToggle }) {
  const isCompleted = task.status === 'completed';
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const handleToggle = () => {
    if (isCompleted) {
      haptic.light();
    } else {
      haptic.success();
    }
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handleToggle}
      hapticType={isCompleted ? 'light' : 'medium'}
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
              }}
            >
              {!isCompleted && task.priority && (
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
              )}
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
