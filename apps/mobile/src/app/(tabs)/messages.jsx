// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Hash,
  Globe,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format, isToday, isYesterday } from 'date-fns';
import { colors, radius, typography, gradients } from '../../theme';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import AnimatedPressable from '../../components/AnimatedPressable';
import {
  fetchConversations,
  fetchContacts,
  getCurrentUser,
  getConversationDisplayName,
  getConversationAvatar,
  isExternalConversation,
} from '../../services/messagingService';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import ChatThread from '../../components/messaging/ChatThread';
import ComposeMessage from '../../components/messaging/ComposeMessage';

const ROLE_COLORS = {
  Doctor: { bg: '#EDE9FE', text: '#5B21B6' },
  Nurse: { bg: colors.primaryLight, text: colors.primary },
  CNA: { bg: '#FEF3C7', text: '#92400E' },
  Pharmacist: { bg: '#D1FAE5', text: '#065F46' },
  GP: { bg: '#E0F2FE', text: '#0369A1' },
  Family: { bg: '#FCE7F3', text: '#9D174D' },
  Specialist: { bg: '#EDE9FE', text: '#5B21B6' },
  'Allied Health': { bg: '#CCFBF1', text: '#115E59' },
  Supplier: { bg: '#F1F5F9', text: '#475569' },
  Pharmacy: { bg: '#D1FAE5', text: '#065F46' },
};

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConversation, setActiveConversation] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const { connected, onlineUsers } = useRealtimeMessages({
    userName: currentUser.name,
    userRole: currentUser.role,
  });

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => fetchConversations(currentUser.name),
    refetchInterval: 15000,
  });

  // Fetch contacts for compose
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => fetchContacts(),
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const filteredConversations = conversations.filter((conv) => {
    const name = getConversationDisplayName(conv, currentUser.name).toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'direct') return matchesSearch && conv.type === 'direct';
    if (activeFilter === 'groups') return matchesSearch && (conv.type === 'group' || conv.type === 'channel');
    if (activeFilter === 'external') return matchesSearch && isExternalConversation(conv);
    if (activeFilter === 'unread') return matchesSearch && conv.unread_count > 0;
    return matchesSearch;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const handleNewConversation = (conv) => {
    setShowCompose(false);
    setActiveConversation(conv);
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  // If viewing a conversation thread
  if (activeConversation) {
    return (
      <ChatThread
        conversation={activeConversation}
        onBack={() => {
          setActiveConversation(null);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }}
      />
    );
  }

  // If composing new message
  if (showCompose) {
    return (
      <ComposeMessage
        contacts={contacts}
        onBack={() => setShowCompose(false)}
        onConversationCreated={handleNewConversation}
      />
    );
  }

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread', count: totalUnread },
    { key: 'direct', label: 'Direct' },
    { key: 'groups', label: 'Groups' },
    { key: 'external', label: 'External' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={gradients.headerVibrant}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.title2, { color: colors.textInverse }]}>Messages</Text>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Connection indicator */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: connected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
              borderWidth: 1,
              borderColor: connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
            }}>
              {connected
                ? <Wifi size={12} color="#4ADE80" />
                : <WifiOff size={12} color="#FCA5A5" />}
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textInverse }}>
                {connected ? 'Live' : 'Offline'}
              </Text>
            </View>

            {/* New message button */}
            <AnimatedPressable onPress={() => setShowCompose(true)} hapticType="medium">
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={20} color={colors.textInverse} strokeWidth={2.5} />
              </View>
            </AnimatedPressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: radius.xl, paddingHorizontal: 14,
          height: 40, marginTop: 14, gap: 8,
        }}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontSize: 15, color: colors.textInverse }}
          />
        </View>

        {/* Online users */}
        {onlineUsers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {onlineUsers.map((u, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 3 }}>
                  <View style={{ position: 'relative' }}>
                    <Avatar name={u.name} size={36} />
                    <View style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: 5,
                      backgroundColor: '#4ADE80', borderWidth: 2,
                      borderColor: '#1E3A8A',
                    }} />
                  </View>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500' }}>
                    {u.name.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {FILTERS.map((f) => (
              <AnimatedPressable key={f.key} onPress={() => setActiveFilter(f.key)} hapticType="light">
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: radius.full,
                  backgroundColor: activeFilter === f.key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  borderWidth: 1,
                  borderColor: activeFilter === f.key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                }}>
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: activeFilter === f.key ? colors.textInverse : 'rgba(255,255,255,0.6)',
                  }}>
                    {f.label}
                  </Text>
                  {f.count > 0 && (
                    <View style={{
                      backgroundColor: colors.danger, borderRadius: 8,
                      minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>{f.count}</Text>
                    </View>
                  )}
                </View>
              </AnimatedPressable>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      {/* Conversation List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {filteredConversations.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={40} color={colors.textMuted} />}
            title={searchQuery ? 'No conversations found' : 'No messages yet'}
            subtitle={searchQuery ? 'Try a different search' : 'Start a conversation with your care team'}
          />
        ) : (
          filteredConversations.map((conv) => {
            const displayName = getConversationDisplayName(conv, currentUser.name);
            const avatar = getConversationAvatar(conv, currentUser.name);
            const isExternal = isExternalConversation(conv);
            const hasUnread = (conv.unread_count || 0) > 0;
            const otherRole = avatar?.role || conv.participants?.[0]?.role || 'Nurse';
            const roleConfig = ROLE_COLORS[otherRole] || ROLE_COLORS.Nurse;
            const participantCount = conv.participants?.length || 0;
            const onlineParticipants = conv.participants?.filter(p =>
              onlineUsers.some(u => u.name === p.name)
            ).length || 0;

            return (
              <AnimatedPressable
                key={conv.id}
                onPress={() => setActiveConversation(conv)}
                hapticType="light"
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 20, paddingVertical: 14,
                  backgroundColor: hasUnread ? 'rgba(37,99,235,0.03)' : 'transparent',
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.borderLight,
                  gap: 14,
                }}>
                  {/* Avatar */}
                  <View style={{ position: 'relative' }}>
                    {conv.type === 'channel' ? (
                      <View style={{
                        width: 50, height: 50, borderRadius: 16,
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: colors.primaryBorder,
                      }}>
                        <Hash size={24} color={colors.primary} />
                      </View>
                    ) : conv.type === 'group' ? (
                      <View style={{
                        width: 50, height: 50, borderRadius: 16,
                        backgroundColor: isExternal ? '#FCE7F3' : '#EDE9FE',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1, borderColor: isExternal ? '#FBCFE8' : '#DDD6FE',
                      }}>
                        {isExternal
                          ? <Globe size={24} color="#9D174D" />
                          : <Users size={24} color="#5B21B6" />}
                      </View>
                    ) : (
                      <View>
                        <Avatar name={displayName} size={50} />
                        {onlineUsers.some(u => u.name === displayName) && (
                          <View style={{
                            position: 'absolute', bottom: 1, right: 1,
                            width: 12, height: 12, borderRadius: 6,
                            backgroundColor: '#4ADE80',
                            borderWidth: 2, borderColor: colors.surface,
                          }} />
                        )}
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Text
                        style={{
                          fontSize: 16, fontWeight: hasUnread ? '700' : '600',
                          color: colors.text, flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {displayName}
                      </Text>
                      <Text style={{
                        fontSize: 12, color: hasUnread ? colors.primary : colors.textMuted,
                        fontWeight: hasUnread ? '600' : '400',
                      }}>
                        {formatTime(conv.last_message_at)}
                      </Text>
                    </View>

                    {/* Role badge + participant info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {conv.type === 'direct' && avatar && (
                        <View style={{
                          backgroundColor: roleConfig.bg,
                          paddingHorizontal: 6, paddingVertical: 1,
                          borderRadius: 4,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: roleConfig.text }}>
                            {avatar.role}
                          </Text>
                        </View>
                      )}
                      {isExternal && (
                        <View style={{
                          backgroundColor: '#FCE7F3',
                          paddingHorizontal: 6, paddingVertical: 1,
                          borderRadius: 4,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9D174D' }}>External</Text>
                        </View>
                      )}
                      {(conv.type === 'group' || conv.type === 'channel') && (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {participantCount} members
                          {onlineParticipants > 0 ? ` · ${onlineParticipants} online` : ''}
                        </Text>
                      )}
                    </View>

                    {/* Last message preview */}
                    <Text
                      style={{
                        fontSize: 14, color: hasUnread ? colors.textSecondary : colors.textMuted,
                        fontWeight: hasUnread ? '500' : '400',
                      }}
                      numberOfLines={1}
                    >
                      {conv.last_message_preview || 'No messages yet'}
                    </Text>
                  </View>

                  {/* Unread badge */}
                  {hasUnread && (
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 12, minWidth: 24, height: 24,
                      alignItems: 'center', justifyContent: 'center',
                      paddingHorizontal: 6,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>
                        {conv.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
              </AnimatedPressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
