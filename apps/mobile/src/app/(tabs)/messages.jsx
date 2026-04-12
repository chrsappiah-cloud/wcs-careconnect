import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, User, MessageCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format } from "date-fns";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const response = await fetch("/api/messages");
      return response.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...msg,
          sender_name: "Nurse Sarah",
          sender_role: "Nurse",
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setContent("");
    },
  });

  const handleSend = () => {
    if (content.trim()) {
      sendMessageMutation.mutate({ content: content.trim() });
    }
  };

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      behavior="padding"
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View
          style={{
            padding: 20,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#111827" }}>
            Care Messages
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ref={(ref) => ref?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <Text
              style={{
                fontSize: 20,
                textAlign: "center",
                color: "#6B7280",
                marginTop: 40,
              }}
            >
              Loading messages...
            </Text>
          ) : messages.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <MessageCircle size={80} color="#D1D5DB" />
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#111827",
                  marginTop: 20,
                }}
              >
                No messages yet
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <View
                key={msg.id}
                style={{
                  alignSelf:
                    msg.sender_role === "Nurse" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      msg.sender_role === "Nurse" ? "#2563EB" : "#FFFFFF",
                    borderRadius: 24,
                    padding: 16,
                    borderWidth: msg.sender_role === "Nurse" ? 0 : 1,
                    borderColor: "#E5E7EB",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 20,
                      color:
                        msg.sender_role === "Nurse" ? "#FFFFFF" : "#111827",
                    }}
                  >
                    {msg.content}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    alignSelf:
                      msg.sender_role === "Nurse" ? "flex-end" : "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
                    {msg.sender_name} •{" "}
                    {format(new Date(msg.created_at), "h:mm a")}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            paddingBottom: 30, // Extra padding for bottom tabs area
          }}
        >
          <TextInput
            placeholder="Type a message..."
            value={content}
            onChangeText={setContent}
            multiline
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              borderRadius: 24,
              paddingHorizontal: 20,
              paddingVertical: 12,
              fontSize: 18,
              maxHeight: 120,
            }}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!content.trim()}
            style={{
              marginLeft: 12,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: content.trim() ? "#2563EB" : "#D1D5DB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
