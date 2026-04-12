import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Clock,
  ClipboardList,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks?status=all");
      return response.json();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: status === "completed" ? "pending" : "completed",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          My Tasks
        </Text>
        <Text style={{ fontSize: 18, color: "#6B7280" }}>
          {pendingTasks.length} tasks remaining for today
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={{ fontSize: 20, textAlign: "center", color: "#6B7280" }}>
            Loading tasks...
          </Text>
        ) : (
          <>
            {pendingTasks.length > 0 && (
              <View style={{ marginBottom: 32 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#374151",
                    marginBottom: 16,
                  }}
                >
                  Pending
                </Text>
                {pendingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskMutation.mutate(task)}
                  />
                ))}
              </View>
            )}

            {completedTasks.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: "#9CA3AF",
                    marginBottom: 16,
                  }}
                >
                  Completed
                </Text>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskMutation.mutate(task)}
                  />
                ))}
              </View>
            )}

            {tasks.length === 0 && (
              <View style={{ alignItems: "center", marginTop: 100 }}>
                <ClipboardList size={80} color="#D1D5DB" />
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#111827",
                    marginTop: 20,
                  }}
                >
                  No tasks assigned
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TaskItem({ task, onToggle }) {
  const isCompleted = task.status === "completed";

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: isCompleted ? "#E5E7EB" : "#DBEAFE",
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: isCompleted ? "#F3F4F6" : "#EFF6FF",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 20,
        }}
      >
        {isCompleted ? (
          <CheckCircle2 size={28} color="#10B981" />
        ) : (
          <Circle size={28} color="#2563EB" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: isCompleted ? "#6B7280" : "#111827",
            textDecorationLine: isCompleted ? "line-through" : "none",
          }}
        >
          {task.title}
        </Text>
        <Text style={{ fontSize: 18, color: "#6B7280", marginTop: 4 }}>
          {task.resident_name} • Room 101
        </Text>
      </View>
    </TouchableOpacity>
  );
}
