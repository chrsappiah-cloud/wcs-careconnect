import { apiUrl } from './apiClient';

const CURRENT_USER = { name: 'Nurse Sarah', role: 'Nurse' };

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

export async function fetchConversations(userName = CURRENT_USER.name) {
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
      created_by: CURRENT_USER.name,
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
      sender_name: CURRENT_USER.name,
      sender_role: CURRENT_USER.role,
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

export function getCurrentUser() {
  return CURRENT_USER;
}

export function getConversationDisplayName(conversation, currentUser = CURRENT_USER.name) {
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

export function getConversationAvatar(conversation, currentUser = CURRENT_USER.name) {
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
