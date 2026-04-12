import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageCircle, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { colors, radius, shadows, typography, gradients, animation } from '../../theme';
import { mockMessages } from '../../mockData';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
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
          colors={gradients.headerVibrant}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 18,
          }}
        >
          <Text style={[typography.title2, { color: colors.textInverse }]}>
            Care Team
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Secure clinical messaging
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: 10,
              gap: 12,
            }}
          >
            {Object.entries(ROLE_COLORS).map(([role, config]) => (
              <View
                key={role}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: radius.full,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: config.text,
                  }}
                />
                <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' }}>
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
                        colors={['#1E40AF', '#2563EB', '#3B82F6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          borderRadius: 20,
                          borderTopRightRadius: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 11,
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
                          borderRadius: 20,
                          borderTopLeftRadius: 6,
                          paddingHorizontal: 16,
                          paddingVertical: 11,
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

        {/* Glass Input Bar */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 12,
            backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : colors.surface,
            borderTopWidth: 0.5,
            borderColor: 'rgba(0,0,0,0.06)',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            ...shadows.sm,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSecondary,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.borderLight,
              overflow: 'hidden',
            }}
          >
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              style={{
                paddingHorizontal: 18,
                paddingTop: 12,
                paddingBottom: 12,
                fontSize: 16,
                color: colors.text,
                maxHeight: 100,
                minHeight: 44,
              }}
            />
          </View>
          <AnimatedPressable
            onPress={handleSend}
            disabled={!content.trim()}
            hapticType="medium"
          >
            <LinearGradient
              colors={content.trim() ? gradients.primary : [colors.divider, colors.divider]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                alignItems: 'center',
                justifyContent: 'center',
                ...(content.trim() ? shadows.colored(colors.primary) : {}),
              }}
            >
              <Send size={20} color={colors.textInverse} />
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
