// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  ArrowLeft,
  Users,
  Hash,
  Globe,
  CheckCheck,
  Check,
  Wifi,
  WifiOff,
  Info,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import KeyboardAvoidingAnimatedView from '@/components/KeyboardAvoidingAnimatedView';
import { colors, radius, shadows, typography, gradients } from '../../theme';
import Avatar from '../Avatar';
import AnimatedPressable from '../AnimatedPressable';
import {
  fetchConversationMessages,
  sendConversationMessage,
  getCurrentUser,
  getConversationDisplayName,
  getConversationAvatar,
  isExternalConversation,
} from '../../services/messagingService';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';

const ROLE_COLORS = {
  Doctor: { bg: '#EDE9FE', text: '#5B21B6' },
  Nurse: { bg: '#EFF6FF', text: '#2563EB' },
  CNA: { bg: '#FEF3C7', text: '#92400E' },
  Pharmacist: { bg: '#D1FAE5', text: '#065F46' },
  GP: { bg: '#E0F2FE', text: '#0369A1' },
  Family: { bg: '#FCE7F3', text: '#9D174D' },
  Specialist: { bg: '#EDE9FE', text: '#5B21B6' },
  'Allied Health': { bg: '#CCFBF1', text: '#115E59' },
  Supplier: { bg: '#F1F5F9', text: '#475569' },
  Pharmacy: { bg: '#D1FAE5', text: '#065F46' },
};

export default function ChatThread({ conversation, onBack }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [content, setContent] = useState('');
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  const displayName = getConversationDisplayName(conversation, currentUser.name);
  const avatar = getConversationAvatar(conversation, currentUser.name);
  const isExternal = isExternalConversation(conversation);
  const participantCount = conversation.participants?.length || 0;

  const { connected, onlineUsers, typingUsers, sendTyping, sendReadReceipt, subscribeConversation } =
    useRealtimeMessages({
      userName: currentUser.name,
      userRole: currentUser.role,
      conversationId: conversation.id,
    });

  // Pulse animation for typing
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Fetch messages for this conversation
  const {
    data: messages = [],
    isLoading,
  } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => fetchConversationMessages(conversation.id),
    refetchInterval: 10000,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: ({ content: msgContent }) =>
      sendConversationMessage(conversation.id, msgContent),
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['messages', conversation.id], (old) => {
        if (!old) return [newMsg];
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      // Keep content in input so user can retry
    },
  });

  const handleSend = () => {
    if (content.trim()) {
      sendTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendMutation.mutate({ content: content.trim() });
    }
  };

  const handleTextChange = useCallback(
    (text) => {
      setContent(text);
      if (text.trim()) {
        sendTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => sendTyping(false), 3000);
      } else {
        sendTyping(false);
      }
    },
    [sendTyping]
  );

  // Auto-scroll and read receipts
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.sender_name !== currentUser.name) {
        sendReadReceipt(lastMsg.id);
      }
    }
  }, [messages.length, sendReadReceipt, currentUser.name]);

  const isOwnMessage = (msg) => msg.sender_name === currentUser.name;

  // Date separator helper
  const shouldShowDateSeparator = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    return !isSameDay(new Date(msg.created_at), new Date(prev.created_at));
  };

  const formatDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  // Determine who is online in this conversation
  const onlineParticipants = conversation.participants?.filter((p) =>
    onlineUsers.some((u) => u.name === p.name)
  ) || [];

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior="padding"
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <LinearGradient
          colors={isExternal ? ['#7C3AED', '#6D28D9', '#5B21B6'] : gradients.headerVibrant}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: insets.top + 4,
            paddingHorizontal: 16,
            paddingBottom: 14,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <AnimatedPressable onPress={onBack} hapticType="light">
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowLeft size={20} color={colors.textInverse} strokeWidth={2.5} />
              </View>
            </AnimatedPressable>

            {/* Avatar */}
            {conversation.type === 'channel' ? (
              <View style={{
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Hash size={20} color={colors.textInverse} />
              </View>
            ) : conversation.type === 'group' ? (
              <View style={{
                width: 40, height: 40, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isExternal ? <Globe size={20} color={colors.textInverse} /> : <Users size={20} color={colors.textInverse} />}
              </View>
            ) : (
              <Avatar name={displayName} size={40} />
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textInverse }} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                {conversation.type === 'direct'
                  ? (avatar?.role || '')
                  : `${participantCount} members${onlineParticipants.length > 0 ? ` · ${onlineParticipants.length} online` : ''}`}
              </Text>
            </View>

            {/* Connection status */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: connected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
            }}>
              {connected ? <Wifi size={11} color="#4ADE80" /> : <WifiOff size={11} color="#FCA5A5" />}
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textInverse }}>
                {connected ? 'Live' : 'Offline'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Messages list */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
                Loading messages...
              </Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💬</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>
                No messages yet
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                Send the first message to start the conversation
              </Text>
            </View>
          ) : (
            messages.map((msg, idx) => {
              const own = isOwnMessage(msg);
              const roleConfig = ROLE_COLORS[msg.sender_role] || ROLE_COLORS.Nurse;
              const showAvatar =
                !own &&
                (idx === 0 || messages[idx - 1].sender_name !== msg.sender_name);
              const showDate = shouldShowDateSeparator(msg, idx);

              return (
                <View key={msg.id}>
                  {/* Date separator */}
                  {showDate && (
                    <View style={{
                      alignItems: 'center', marginVertical: 16,
                    }}>
                      <View style={{
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.full,
                      }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
                          {formatDateSeparator(msg.created_at)}
                        </Text>
                      </View>
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      alignSelf: own ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    {/* Avatar for others */}
                    {!own && (
                      <View style={{ width: 32, alignItems: 'center', justifyContent: 'flex-end' }}>
                        {showAvatar ? <Avatar name={msg.sender_name} size={32} /> : null}
                      </View>
                    )}

                    <View style={{ flex: 1 }}>
                      {/* Sender name */}
                      {showAvatar && !own && (
                        <View style={{
                          flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6,
                        }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textTertiary }}>
                            {msg.sender_name}
                          </Text>
                          <View style={{
                            backgroundColor: roleConfig.bg,
                            paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
                          }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: roleConfig.text }}>
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
                          <Text style={{ fontSize: 15, color: colors.textInverse, lineHeight: 22 }}>
                            {msg.content}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={{
                          backgroundColor: colors.surface,
                          borderRadius: 20, borderTopLeftRadius: 6,
                          paddingHorizontal: 16, paddingVertical: 11,
                          borderWidth: 1, borderColor: colors.surfaceBorder,
                          ...shadows.sm,
                        }}>
                          <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                            {msg.content}
                          </Text>
                        </View>
                      )}

                      {/* Timestamp + delivery */}
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        marginTop: 3, alignSelf: own ? 'flex-end' : 'flex-start',
                      }}>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </Text>
                        {own &&
                          (msg.read_by?.length > 0
                            ? <CheckCheck size={13} color={colors.primary} />
                            : <Check size={13} color={colors.textMuted} />)}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View style={{
            paddingHorizontal: 20, paddingVertical: 8,
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.background,
          }}>
            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: colors.primary, opacity: pulseAnim,
                    transform: [{
                      translateY: pulseAnim.interpolate({
                        inputRange: [0.4, 1],
                        outputRange: [0, i === 1 ? -4 : -2],
                      }),
                    }],
                  }}
                />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: 'italic' }}>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.slice(0, 2).join(', ')} ${typingUsers.length > 2 ? `+${typingUsers.length - 2}` : ''} typing...`}
            </Text>
          </View>
        )}

        {/* Input bar */}
        <View style={{
          paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : colors.surface,
          borderTopWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
          flexDirection: 'row', alignItems: 'flex-end', gap: 10,
          ...shadows.sm,
        }}>
          <View style={{
            flex: 1, backgroundColor: colors.surfaceSecondary,
            borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight,
            overflow: 'hidden',
          }}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={handleTextChange}
              multiline
              style={{
                paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12,
                fontSize: 16, color: colors.text, maxHeight: 100, minHeight: 44,
              }}
            />
          </View>
          <AnimatedPressable
            onPress={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
            hapticType="medium"
          >
            <LinearGradient
              colors={content.trim() ? gradients.primary : [colors.divider, colors.divider]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 46, height: 46, borderRadius: 23,
                alignItems: 'center', justifyContent: 'center',
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
