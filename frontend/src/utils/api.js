const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('voicebox_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export async function login(pin) {
  const data = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  localStorage.setItem('voicebox_token', data.token);
  localStorage.setItem('voicebox_user', JSON.stringify(data.user));
  return data;
}

export function logout() {
  localStorage.removeItem('voicebox_token');
  localStorage.removeItem('voicebox_user');
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('voicebox_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function createFamily(data) {
  return request('/family', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function getFamily(familyId) {
  return request(`/family/${familyId}`);
}

export async function uploadVoiceNote(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Upload failed');
  }

  return res.json();
}

export async function getNotes(status) {
  const params = status ? `?status=${status}` : '';
  return request(`/notes${params}`);
}

export async function getNote(noteId) {
  return request(`/notes/${noteId}`);
}

export function getAudioUrl(noteId) {
  const token = getToken();
  return `${API_BASE}/notes/${noteId}/audio?token=${encodeURIComponent(token || '')}`;
}

export async function deleteNote(noteId) {
  return request(`/notes/${noteId}`, { method: 'DELETE' });
}

export async function healthCheck() {
  return request('/health');
}
