const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const REFRESH_ENDPOINT = '/auth/refresh/';

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('role');
}

async function refreshToken() {
  const refresh = localStorage.getItem('refresh');
  if (!refresh) {
    logout();
    throw { detail: 'Session expired. Please log in again.' };
  }

  const response = await fetch(`${API_URL}${REFRESH_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    logout();
    throw data || { detail: 'Session expired. Please log in again.' };
  }

  if (data.access) {
    localStorage.setItem('token', data.access);
    return data.access;
  }

  logout();
  throw { detail: 'Session expired. Please log in again.' };
}

export async function apiRequest(path, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (fetchError) {
    throw { detail: fetchError.message || 'Network error', code: 'NETWORK_ERROR' }
  }

  if (
    response.status === 401 &&
    !options._retry &&
    path !== '/auth/login/' &&
    path !== REFRESH_ENDPOINT
  ) {
    try {
      const newToken = await refreshToken();
      return apiRequest(path, {
        ...options,
        _retry: true,
        headers: {
          ...headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    } catch (refreshError) {
      throw refreshError;
    }
  }

  let data = null;
  const text = await response.text().catch(() => null);
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }

    if (data) {
      if (typeof data === 'object') {
        throw data;
      }
      if (data.detail) {
        throw data;
      }
    }

    // If server returns plain text error
    if (text) {
      // try to interpret JSON returned as string
      try {
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') {
          throw parsed
        }
      } catch {
        // fallback to raw text string
      }
      throw { detail: text }
    }

    throw { detail: `Unknown API error (${response.status})` }
  }

  return data
}

export function getApiErrorMessage(err) {
  if (!err) {
    return 'Unknown error';
  }

  if (typeof err === 'string') {
    return err;
  }

  if (err.detail) {
    if (typeof err.detail === 'string') {
      // if detail is JSON string with field errors, parse it and flatten
      try {
        const parsed = JSON.parse(err.detail)
        if (parsed && typeof parsed === 'object') {
          return getApiErrorMessage(parsed)
        }
      } catch {
        // not JSON, use raw
      }
      return err.detail
    }
    if (typeof err.detail === 'object') {
      return getApiErrorMessage(err.detail)
    }
  }

  if (err.message) {
    return err.message
  }

  if (typeof err === 'object') {
    const messages = [];
    for (const value of Object.values(err)) {
      if (Array.isArray(value)) {
        messages.push(...value)
      } else if (typeof value === 'string') {
        messages.push(value)
      } else if (value && typeof value === 'object') {
        messages.push(getApiErrorMessage(value))
      }
    }
    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  return 'Unknown error'
}

