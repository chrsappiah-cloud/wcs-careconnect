import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockMessages } from '../../mockData';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import { haptic } from '../../utils/haptics';
import { apiUrl } from '../../services/apiClient';

const ROLE_COLORS = {
  Doctor: { bg: '#EDE9FE', text: '#5B21B6' },
  Nurse: { bg: colors.primaryLight, text: colors.primary },
  CNA: { bg: '#FEF3C7', text: '#92400E' },
  Pharmacist: { bg: '#D1FAE5', text: '#065F46' },
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const scrollRef = useRef(null);

  const { data: messages = mockMessages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch(apiUrl('/api/messages'));
      if (!response.ok)
        throw new Error(`Messages fetch failed: ${response.status}`);
      return response.json();
    },
    placeholderData: mockMessages,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg) => {
      const response = await fetch(apiUrl('/api/messages'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...msg,
          sender_name: 'Nurse Sarah',
          sender_role: 'Nurse',
        }),
      });
      if (!response.ok)
        throw new Error(`Message send failed: ${response.status}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setContent('');
    },
  });

  const handleSend = () => {
    if (content.trim()) {
      haptic.medium();
      sendMessageMutation.mutate({ content: content.trim() });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const isOwnMessage = (msg) => msg.sender_role === 'Nurse';

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior="padding"
    >
      <View style={{ flex: 1 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={gradients.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 16,
          }}
        >
          <Text style={[typography.title2, { color: colors.textInverse }]}>
            Care Team
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 8,
              gap: 12,
            }}
          >
            {Object.entries(ROLE_COLORS).map(([role, config]) => (
              <View
                key={role}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: config.text,
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                />
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                  {role}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && !messages.length ? (
            <EmptyState
              icon={<MessageCircle size={40} color={colors.textMuted} />}
              title="Loading messages..."
            />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={40} color={colors.textMuted} />}
              title="No messages yet"
              subtitle="Start the conversation with your care team"
            />
          ) : (
            messages.map((msg, idx) => {
              const own = isOwnMessage(msg);
              const roleConfig =
                ROLE_COLORS[msg.sender_role] || ROLE_COLORS.CNA;
              const showAvatar =
                !own &&
                (idx === 0 ||
                  messages[idx - 1].sender_name !== msg.sender_name);

              return (
                <View
                  key={msg.id}
                  style={{
                    flexDirection: 'row',
                    alignSelf: own ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    marginBottom: 12,
                    gap: 8,
                  }}
                >
                  {/* Avatar for others */}
                  {!own && (
                    <View
                      style={{
                        width: 32,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {showAvatar ? (
                        <Avatar name={msg.sender_name} size={32} />
                      ) : null}
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    {/* Sender name for others */}
                    {showAvatar && !own && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 4,
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: colors.textTertiary,
                          }}
                        >
                          {msg.sender_name}
                        </Text>
                        <View
                          style={{
                            backgroundColor: roleConfig.bg,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: roleConfig.text,
                            }}
                          >
                            {msg.sender_role}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Message bubble */}
                    {own ? (
                      <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: 18,
                          borderTopRightRadius: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          ...shadows.colored(colors.primary),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            color: colors.textInverse,
                            lineHeight: 22,
                          }}
                        >
                          {msg.content}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={{
                          backgroundColor: colors.surface,
                          borderRadius: 18,
                          borderTopLeftRadius: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                          borderWidth: 1,
                          borderColor: colors.surfaceBorder,
                          ...shadows.sm,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            color: colors.text,
                            lineHeight: 22,
                          }}
                        >
                          {msg.content}
                        </Text>
                      </View>
                    )}

                    {/* Timestamp */}
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                        marginTop: 3,
                        alignSelf: own ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderColor: colors.borderLight,
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
          }}
        >
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 22,
              paddingHorizontal: 18,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
              color: colors.text,
              maxHeight: 100,
              minHeight: 44,
            }}
          />
          <AnimatedPressable
            onPress={handleSend}
            disabled={!content.trim()}
            hapticType="medium"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: content.trim() ? colors.primary : colors.divider,
              alignItems: 'center',
              justifyContent: 'center',
              ...(content.trim() ? shadows.colored(colors.primary) : shadows.sm),
            }}
          >
            <Send size={20} color={colors.textInverse} />
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
