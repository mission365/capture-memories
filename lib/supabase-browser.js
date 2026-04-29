const SESSION_STORAGE_KEY = 'chitrostyle.supabase.session';

export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',
    storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'site-assets',
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

function createLocalApiHeaders({ accessToken, json = true } = {}) {
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function createHeaders({ accessToken, json = true, prefer } = {}) {
  const { anonKey } = getSupabaseConfig();
  const headers = {
    apikey: anonKey,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (anonKey) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message =
      (typeof payload === 'string' && payload) ||
      payload?.msg ||
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      'Supabase request failed.';

    throw new Error(message);
  }

  return payload;
}

async function supabaseRequest(path, options = {}) {
  const { url } = getSupabaseConfig();

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }

  const response = await fetch(`${url}${path}`, {
    ...options,
    cache: 'no-store',
  });

  return readResponse(response);
}

async function localApiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(path, {
      ...options,
      cache: 'no-store',
      signal: controller.signal,
    });

    return await readResponse(response);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function storeSupabaseSession(session) {
  if (typeof window === 'undefined' || !session) return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function loadStoredSupabaseSession() {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function clearStoredSupabaseSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signInWithPassword({ email, password }) {
  return supabaseRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshSupabaseSession(refreshToken) {
  return supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: createHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getSupabaseUser(accessToken) {
  return supabaseRequest('/auth/v1/user', {
    headers: createHeaders({ accessToken, json: false }),
  });
}

export async function restoreSupabaseSession() {
  const session = loadStoredSupabaseSession();
  if (!session?.access_token) return null;

  try {
    const user = await getSupabaseUser(session.access_token);
    return { ...session, user };
  } catch (_error) {
    if (!session.refresh_token) {
      clearStoredSupabaseSession();
      return null;
    }

    const refreshed = await refreshSupabaseSession(session.refresh_token);
    storeSupabaseSession(refreshed);
    return refreshed;
  }
}

export async function signOutSupabase(accessToken) {
  return supabaseRequest('/auth/v1/logout', {
    method: 'POST',
    headers: createHeaders({ accessToken, json: false }),
  });
}

export async function listHeroSlides({ includeInactive = false, accessToken } = {}) {
  const params = new URLSearchParams();

  if (includeInactive) {
    params.set('includeInactive', 'true');
  }

  return localApiRequest(`/api/admin/hero-slides?${params.toString()}`, {
    headers: createLocalApiHeaders({ accessToken, json: false }),
  });
}

export async function listSiteSections({ accessToken } = {}) {
  return localApiRequest('/api/admin/site-sections', {
    headers: createLocalApiHeaders({ accessToken, json: false }),
  });
}

export async function upsertSiteSection(sectionKey, content, accessToken) {
  return localApiRequest('/api/admin/site-sections', {
    method: 'POST',
    headers: createLocalApiHeaders({ accessToken }),
    body: JSON.stringify({ sectionKey, content }),
  });
}

export async function createHeroSlide(payload, accessToken) {
  return localApiRequest('/api/admin/hero-slides', {
    method: 'POST',
    headers: createLocalApiHeaders({ accessToken }),
    body: JSON.stringify(payload),
  });
}

export async function updateHeroSlide(id, payload, accessToken) {
  return localApiRequest('/api/admin/hero-slides', {
    method: 'PATCH',
    headers: createLocalApiHeaders({ accessToken }),
    body: JSON.stringify({ id, payload }),
  });
}

export async function deleteHeroSlide(id, accessToken) {
  return localApiRequest('/api/admin/hero-slides', {
    method: 'DELETE',
    headers: createLocalApiHeaders({ accessToken }),
    body: JSON.stringify({ id }),
  });
}

function sanitizeFileName(name) {
  return name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function uploadStorageImage(file, accessToken, folder = 'hero-slides', options = {}) {
  if (!file) {
    throw new Error('Please select an image file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', sanitizeFileName(folder) || 'hero-slides');

  const headers = createLocalApiHeaders({ accessToken, json: false });

  if (typeof window !== 'undefined' && typeof XMLHttpRequest !== 'undefined' && typeof options.onProgress === 'function') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('POST', '/api/admin/upload');

      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const percent = Math.min(95, Math.max(1, Math.round((event.loaded / event.total) * 95)));
        options.onProgress(percent);
      };

      xhr.onerror = () => {
        reject(new Error('Image upload failed.'));
      };

      xhr.onload = () => {
        const contentType = xhr.getResponseHeader('content-type') || '';
        const payload = contentType.includes('application/json')
          ? JSON.parse(xhr.responseText || 'null')
          : xhr.responseText;

        if (xhr.status < 200 || xhr.status >= 300) {
          const message =
            (typeof payload === 'string' && payload) ||
            payload?.msg ||
            payload?.message ||
            payload?.error_description ||
            payload?.error ||
            'Image upload failed.';

          reject(new Error(message));
          return;
        }

        options.onProgress(100);
        resolve(payload);
      };

      xhr.send(formData);
    });
  }

  return localApiRequest('/api/admin/upload', {
    method: 'POST',
    headers,
    body: formData,
  });
}

export async function uploadHeroSlideImage(file, accessToken) {
  return uploadStorageImage(file, accessToken, 'hero-slides');
}
