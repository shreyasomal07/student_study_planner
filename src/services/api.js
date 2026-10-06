const API_BASE = '/api';
const TOKEN_KEY = 'study_planner_auth_token_v1';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data?.detail || data?.message || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.warn(`[API] Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Check health status
  async checkHealth() {
    try {
      return await request('/health');
    } catch {
      return { status: 'offline' };
    }
  },

  // Auth & Profile
  async register(accountData) {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
    if (res.access_token) {
      setToken(res.access_token);
    }
    return res;
  },

  async login(username, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.access_token) {
      setToken(res.access_token);
    }
    return res;
  },

  async resetPassword(username, newPassword) {
    const res = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ username, new_password: newPassword }),
    });
    if (res.access_token) {
      setToken(res.access_token);
    }
    return res;
  },

  async getMe() {
    return await request('/auth/me');
  },

  async getAllUsers() {
    return await request('/auth/users');
  },

  async updateProfile(profileData) {
    return await request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async deleteAccount(username = null) {
    if (username) {
      return await request(`/user/account/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
    }
    const res = await request('/user/account', {
      method: 'DELETE',
    });
    setToken(null);
    return res;
  },

  // Planner Data
  async getPlannerData() {
    return await request('/planner');
  },

  async savePlannerData(plannerData) {
    return await request('/planner', {
      method: 'PUT',
      body: JSON.stringify(plannerData),
    });
  },

  // AI Timetable Generation
  async generateTimetable(payload) {
    return await request('/ai/generate-timetable', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Legacy local storage synchronization
  async syncLegacyAccounts(accountsMap) {
    return await request('/auth/sync-legacy-accounts', {
      method: 'POST',
      body: JSON.stringify(accountsMap),
    });
  },

  logout() {
    setToken(null);
  }
};
