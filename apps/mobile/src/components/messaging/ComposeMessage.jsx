import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  UserPlus,
  Users,
  MessageCircle,
  Building2,
  Globe,
  Check,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, typography, gradients, spacing } from '../../theme';
import Avatar from '../Avatar';
import AnimatedPressable from '../AnimatedPressable';
import {
  fetchContacts,
  createConversation,
  getCurrentUser,
} from '../../services/messagingService';

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

export default function ComposeMessage({ contacts: initialContacts, onBack, onConversationCreated }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: contacts = initialContacts || [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => fetchContacts(),
    initialData: initialContacts,
  });

  const createMutation = useMutation({
    mutationFn: (params) => createConversation(params),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onConversationCreated(conv);
    },
    onError: (err) => {
      Alert.alert('Error', 'Could not create conversation. Try again.');
    },
  });

  const filteredContacts = useMemo(() => {
    let list = contacts.filter((c) => c.name !== currentUser.name);

    if (activeTab === 'internal') {
      list = list.filter((c) => c.stakeholder_type === 'internal');
    } else if (activeTab === 'external') {
      list = list.filter((c) => c.stakeholder_type === 'external');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.organization?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [contacts, searchQuery, activeTab, currentUser.name]);

  const toggleContact = (contact) => {
    setSelectedContacts((prev) => {
      const exists = prev.some((c) => c.name === contact.name);
      if (exists) return prev.filter((c) => c.name !== contact.name);
      return [...prev, contact];
    });
  };

  const isSelected = (contact) => selectedContacts.some((c) => c.name === contact.name);

  const handleCreate = () => {
    if (selectedContacts.length === 0) return;

    const participants = [
      { name: currentUser.name, role: currentUser.role, stakeholder_type: 'internal' },
      ...selectedContacts.map((c) => ({
        name: c.name,
        role: c.role,
        stakeholder_type: c.stakeholder_type || 'internal',
      })),
    ];

    const isDirect = selectedContacts.length === 1;
    const type = isDirect ? 'direct' : 'group';
    const title = isDirect ? null : groupTitle.trim() || null;

    createMutation.mutate({ title, type, participants });
  };

  const TABS = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'internal', label: 'Internal', icon: Building2 },
    { key: 'external', label: 'External', icon: Globe },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <LinearGradient
        colors={gradients.headerVibrant}
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

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textInverse }}>
              New Message
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
              Select contacts to message
            </Text>
          </View>

          {selectedContacts.length > 0 && (
            <AnimatedPressable onPress={handleCreate} hapticType="medium" disabled={createMutation.isPending}>
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                <MessageCircle size={16} color={colors.textInverse} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textInverse }}>
                  {createMutation.isPending ? 'Creating...' : 'Start'}
                </Text>
              </LinearGradient>
            </AnimatedPressable>
          )}
        </View>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: radius.xl, paddingHorizontal: 14,
          height: 40, marginTop: 12, gap: 8,
        }}>
          <Search size={16} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Search contacts..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, fontSize: 15, color: colors.textInverse }}
            autoFocus
          />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <AnimatedPressable key={key} onPress={() => setActiveTab(key)} hapticType="light">
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 5,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                backgroundColor: activeTab === key ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: activeTab === key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              }}>
                <Icon size={14} color={activeTab === key ? colors.textInverse : 'rgba(255,255,255,0.6)'} />
                <Text style={{
                  fontSize: 12, fontWeight: '600',
                  color: activeTab === key ? colors.textInverse : 'rgba(255,255,255,0.6)',
                }}>
                  {label}
                </Text>
              </View>
            </AnimatedPressable>
          ))}
        </View>
      </LinearGradient>

      {/* Selected contacts chips */}
      {selectedContacts.length > 0 && (
        <View style={{
          paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: colors.surface,
          borderBottomWidth: 0.5, borderBottomColor: colors.borderLight,
        }}>
          {selectedContacts.length > 1 && (
            <TextInput
              placeholder="Group name (optional)"
              placeholderTextColor={colors.textMuted}
              value={groupTitle}
              onChangeText={setGroupTitle}
              style={{
                fontSize: 15, color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 9,
                borderWidth: 1, borderColor: colors.borderLight, marginBottom: 10,
              }}
            />
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {selectedContacts.map((c) => {
                const roleConfig = ROLE_COLORS[c.role] || ROLE_COLORS.Nurse;
                return (
                  <AnimatedPressable
                    key={c.name}
                    onPress={() => toggleContact(c)}
                    hapticType="light"
                  >
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      backgroundColor: roleConfig.bg, paddingHorizontal: 10,
                      paddingVertical: 6, borderRadius: radius.full,
                      borderWidth: 1, borderColor: roleConfig.text + '30',
                    }}>
                      <Avatar name={c.name} size={22} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: roleConfig.text }}>
                        {c.name.split(' ')[0]}
                      </Text>
                      <X size={14} color={roleConfig.text} />
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          </ScrollView>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>
            {selectedContacts.length === 1
              ? 'Direct message'
              : `Group conversation · ${selectedContacts.length} contacts`}
          </Text>
        </View>
      )}

      {/* Contact list */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {filteredContacts.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <UserPlus size={40} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 12 }}>
              No contacts found
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {searchQuery ? 'Try a different search' : 'No contacts available'}
            </Text>
          </View>
        ) : (
          filteredContacts.map((contact) => {
            const selected = isSelected(contact);
            const roleConfig = ROLE_COLORS[contact.role] || ROLE_COLORS.Nurse;
            const isContactExternal = contact.stakeholder_type === 'external';

            return (
              <AnimatedPressable
                key={contact.id || contact.name}
                onPress={() => toggleContact(contact)}
                hapticType="light"
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: 20, paddingVertical: 14,
                  backgroundColor: selected ? `${roleConfig.text}08` : 'transparent',
                  borderBottomWidth: 0.5, borderBottomColor: colors.borderLight,
                  gap: 14,
                }}>
                  {/* Avatar with selection indicator */}
                  <View style={{ position: 'relative' }}>
                    <Avatar name={contact.name} size={48} />
                    {selected && (
                      <View style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: colors.primary, borderWidth: 2,
                        borderColor: colors.surface,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={12} color="#FFF" strokeWidth={3} />
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                      {contact.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <View style={{
                        backgroundColor: roleConfig.bg,
                        paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: roleConfig.text }}>
                          {contact.role}
                        </Text>
                      </View>
                      {isContactExternal && (
                        <View style={{
                          backgroundColor: '#FCE7F3',
                          paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
                        }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9D174D' }}>External</Text>
                        </View>
                      )}
                      {contact.organization && (
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>
                          {contact.organization}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Type indicator */}
                  <View style={{
                    backgroundColor: isContactExternal ? '#FCE7F3' : colors.primaryLight,
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
                  }}>
                    {isContactExternal
                      ? <Globe size={14} color="#9D174D" />
                      : <Building2 size={14} color={colors.primary} />}
                  </View>
                </View>
              </AnimatedPressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
