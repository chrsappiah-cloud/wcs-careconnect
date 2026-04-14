// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
import { apiUrl } from './apiClient';
import { useAuthStore } from '../utils/auth/store';

export function getCurrentUser() {
  const auth = useAuthStore.getState().auth;
  const user = auth?.user;
  return {
    name: user?.name || user?.email?.split('@')[0] || 'Care Staff',
    role: user?.role || 'Nurse',
  };
}

// ──────────────────────────────────────────────
// Contacts (Stakeholder Directory)
// ──────────────────────────────────────────────

export async function fetchContacts(type) {
  const url = type ? `/api/contacts?type=${type}` : '/api/contacts';
  const res = await fetch(apiUrl(url));
  if (!res.ok) throw new Error(`Contacts fetch failed: ${res.status}`);
  return res.json();
}

export async function createContact(contact) {
  const res = await fetch(apiUrl('/api/contacts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
  if (!res.ok) throw new Error(`Contact create failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────
// Conversations
// ──────────────────────────────────────────────

export async function fetchConversations(userName = getCurrentUser().name) {
  const res = await fetch(apiUrl(`/api/conversations?user=${encodeURIComponent(userName)}`));
  if (!res.ok) throw new Error(`Conversations fetch failed: ${res.status}`);
  return res.json();
}

export async function createConversation({ title, type, participants }) {
  const res = await fetch(apiUrl('/api/conversations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      type: type || 'direct',
      created_by: getCurrentUser().name,
      participants,
    }),
  });
  if (!res.ok) throw new Error(`Conversation create failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────
// Conversation Messages
// ──────────────────────────────────────────────

export async function fetchConversationMessages(conversationId, { limit, before } = {}) {
  let url = `/api/conversations/${conversationId}/messages`;
  const params = [];
  if (limit) params.push(`limit=${limit}`);
  if (before) params.push(`before=${encodeURIComponent(before)}`);
  if (params.length) url += '?' + params.join('&');

  const res = await fetch(apiUrl(url));
  if (!res.ok) throw new Error(`Messages fetch failed: ${res.status}`);
  return res.json();
}

export async function sendConversationMessage(conversationId, content, messageType = 'text') {
  const res = await fetch(apiUrl(`/api/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender_name: getCurrentUser().name,
      sender_role: getCurrentUser().role,
      content,
      message_type: messageType,
    }),
  });
  if (!res.ok) throw new Error(`Message send failed: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

export function getConversationDisplayName(conversation, currentUser = getCurrentUser().name) {
  if (conversation.title) return conversation.title;
  if (conversation.type === 'direct' && conversation.participants) {
    const other = conversation.participants.find(p => p.name !== currentUser);
    return other ? other.name : 'Direct Message';
  }
  if (conversation.participants) {
    return conversation.participants
      .filter(p => p.name !== currentUser)
      .map(p => p.name.split(' ')[0])
      .join(', ');
  }
  return 'Conversation';
}

export function getConversationAvatar(conversation, currentUser = getCurrentUser().name) {
  if (conversation.type === 'direct' && conversation.participants) {
    const other = conversation.participants.find(p => p.name !== currentUser);
    return other || null;
  }
  return null;
}

export function isExternalConversation(conversation) {
  return conversation.participants?.some(p => p.type === 'external');
}

const STAKEHOLDER_ICONS = {
  Doctor: '🩺', Nurse: '👩‍⚕️', CNA: '🤲', Pharmacist: '💊',
  GP: '🏥', Family: '👨‍👩‍👧', Specialist: '🔬', 'Allied Health': '🏋️',
  Supplier: '📦', Pharmacy: '🏪',
};

export function getStakeholderIcon(role) {
  return STAKEHOLDER_ICONS[role] || '👤';
}
