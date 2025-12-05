// API client for backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://162.43.33.101/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: any }> {
  try {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Request failed' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('API request error:', error);
    return { data: null, error: 'Network error' };
  }
}

// Auth API
export const authApi = {
  signUp: async (email: string, password: string, userData: { full_name: string; company_name?: string; phone?: string }) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
  },

  signIn: async (email: string, password: string) => {
    return apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return apiRequest('/auth/me', {
      method: 'GET',
    });
  },
};

// Materials API
export const materialsApi = {
  getAll: async (activeOnly: boolean = false) => {
    const query = activeOnly ? '?active_only=true' : '';
    return apiRequest(`/materials${query}`, { method: 'GET' });
  },

  getById: async (id: string) => {
    return apiRequest(`/materials/${id}`, { method: 'GET' });
  },

  getThicknesses: async (materialId: string, availableOnly: boolean = false) => {
    const query = availableOnly ? '?available_only=true' : '';
    return apiRequest(`/materials/${materialId}/thicknesses${query}`, { method: 'GET' });
  },

  create: async (materialData: any) => {
    return apiRequest('/materials', {
      method: 'POST',
      body: JSON.stringify(materialData),
    });
  },

  update: async (id: string, materialData: any) => {
    return apiRequest(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(materialData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/materials/${id}`, { method: 'DELETE' });
  },

  createThickness: async (materialId: string, thicknessData: any) => {
    return apiRequest(`/materials/${materialId}/thicknesses`, {
      method: 'POST',
      body: JSON.stringify(thicknessData),
    });
  },

  updateThickness: async (thicknessId: string, thicknessData: any) => {
    return apiRequest(`/materials/thicknesses/${thicknessId}`, {
      method: 'PUT',
      body: JSON.stringify(thicknessData),
    });
  },

  deleteThickness: async (thicknessId: string) => {
    return apiRequest(`/materials/thicknesses/${thicknessId}`, { method: 'DELETE' });
  },
};

// Options API
export const optionsApi = {
  getAll: async (activeOnly: boolean = false) => {
    const query = activeOnly ? '?active_only=true' : '';
    return apiRequest(`/options${query}`, { method: 'GET' });
  },

  getById: async (id: string) => {
    return apiRequest(`/options/${id}`, { method: 'GET' });
  },

  create: async (optionData: any) => {
    return apiRequest('/options', {
      method: 'POST',
      body: JSON.stringify(optionData),
    });
  },

  update: async (id: string, optionData: any) => {
    return apiRequest(`/options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(optionData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/options/${id}`, { method: 'DELETE' });
  },
};

// Orders API
export const ordersApi = {
  getMyOrders: async () => {
    return apiRequest('/orders/my-orders', { method: 'GET' });
  },

  getAll: async (status?: string) => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return apiRequest(`/orders${query}`, { method: 'GET' });
  },

  getById: async (id: string) => {
    return apiRequest(`/orders/${id}`, { method: 'GET' });
  },

  create: async (orderData: any) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateStatus: async (id: string, status: string, shipping_eta?: string) => {
    return apiRequest(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, shipping_eta }),
    });
  },
};

// Profiles API
export const profilesApi = {
  getMe: async () => {
    return apiRequest('/profiles/me', { method: 'GET' });
  },

  updateMe: async (profileData: any) => {
    return apiRequest('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Users API (Admin)
export const usersApi = {
  getAll: async (role?: string) => {
    const query = role && role !== 'all' ? `?role=${role}` : '';
    return apiRequest(`/users${query}`, { method: 'GET' });
  },

  getById: async (id: string) => {
    return apiRequest(`/users/${id}`, { method: 'GET' });
  },

  update: async (id: string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest(`/users/${id}`, { method: 'DELETE' });
  },
};

// Inventory API (Admin)
export const inventoryApi = {
  getAll: async () => {
    return apiRequest('/inventory', { method: 'GET' });
  },

  create: async (inventoryData: any) => {
    return apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(inventoryData),
    });
  },

  updateStock: async (id: string, stockData: any) => {
    return apiRequest(`/inventory/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  },

  updateMinStock: async (id: string, min_stock_level: number) => {
    return apiRequest(`/inventory/${id}/min-stock`, {
      method: 'PUT',
      body: JSON.stringify({ min_stock_level }),
    });
  },

  getHistory: async (id: string) => {
    return apiRequest(`/inventory/${id}/history`, { method: 'GET' });
  },
};

