const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('voicebox_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Signals an expired or revoked session so useAuth can return to the login screen.
function handleUnauthorized(res) {
  if (res.status === 401 && getToken()) {
    logout();
    window.dispatchEvent(new Event('voicebox:unauthorized'));
  }
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
    handleUnauthorized(res);
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
    handleUnauthorized(res);
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

/**
 * Fetch a note's audio with the Authorization header and return an object URL.
 * The token stays out of the URL, so it never lands in server logs or history.
 * Callers should URL.revokeObjectURL() the result when done.
 */
export async function fetchAudioUrl(noteId) {
  const res = await fetch(`${API_BASE}/notes/${noteId}/audio`, { headers: authHeaders() });
  if (!res.ok) {
    handleUnauthorized(res);
    throw new Error('Could not load audio');
  }
  return URL.createObjectURL(await res.blob());
}

export async function deleteNote(noteId) {
  return request(`/notes/${noteId}`, { method: 'DELETE' });
}

export async function healthCheck() {
  return request('/health');
}
