const API_BASE =
  process.env.EXPO_PUBLIC_CREATE_API_URL || 'https://api.createanything.com';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function apiFetch(path, options) {
  const response = await fetch(apiUrl(path), options);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json();
}
