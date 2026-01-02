/**
 * API Service Layer for QuickStore Backend Integration
 *
 * Handles all HTTP requests to the FastAPI backend with:
 * - JWT authentication
 * - Error handling
 * - Request/response interceptors
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * API Error class for consistent error handling
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get authentication token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Set authentication token in localStorage
 */
const setToken = (token) => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove authentication token from localStorage
 */
const removeToken = () => {
  localStorage.removeItem('auth_token');
};

/**
 * Get current store ID from localStorage
 */
const getCurrentStoreId = () => {
  return localStorage.getItem('current_store_id');
};

/**
 * Set current store ID in localStorage
 */
const setCurrentStoreId = (storeId) => {
  if (storeId) {
    localStorage.setItem('current_store_id', storeId);
  } else {
    localStorage.removeItem('current_store_id');
  }
};

/**
 * Remove current store ID from localStorage
 */
const removeCurrentStoreId = () => {
  localStorage.removeItem('current_store_id');
};

/**
 * Get current company ID from localStorage (for admin users)
 */
const getCurrentCompanyId = () => {
  return localStorage.getItem('current_company_id');
};

/**
 * Set current company ID in localStorage (for admin users)
 */
const setCurrentCompanyId = (companyId) => {
  if (companyId) {
    localStorage.setItem('current_company_id', companyId);
  } else {
    localStorage.removeItem('current_company_id');
  }
};

/**
 * Remove current company ID from localStorage
 */
const removeCurrentCompanyId = () => {
  localStorage.removeItem('current_company_id');
};

/**
 * Make HTTP request with authentication
 */
const request = async (endpoint, options = {}) => {
  const token = getToken();
  const storeId = getCurrentStoreId();
  const companyId = getCurrentCompanyId();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (companyId) {
    headers['X-Company-ID'] = companyId;
  }

  if (storeId) {
    headers['X-Store-ID'] = storeId;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 204 No Content responses (e.g., DELETE operations)
    if (response.status === 204) {
      return null;
    }

    // Handle non-JSON responses (e.g., CSV downloads)
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new APIError(
        data.detail || data.message || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network errors
    throw new APIError(
      error.message || 'Network error occurred',
      0,
      null
    );
  }
};

/**
 * API Methods
 */
const api = {
  // ============ Authentication ============

  /**
   * Login with username and password
   */
  login: async (username, password) => {
    const response = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (response.access_token) {
      setToken(response.access_token);
    }

    return response;
  },

  /**
   * Logout (clear local token)
   */
  logout: () => {
    removeToken();
  },

  /**
   * Get current user information
   */
  getCurrentUser: async () => {
    return await request('/api/auth/me');
  },

  /**
   * Change current user's password
   */
  changePassword: async (currentPassword, newPassword) => {
    return await request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  // ============ Admin - Companies ============

  /**
   * Create a new company (admin only)
   */
  createCompany: async (data) => {
    return await request('/api/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all companies (admin only)
   */
  listCompanies: async () => {
    return await request('/api/admin/companies');
  },

  /**
   * Update company (admin only)
   */
  updateCompany: async (companyId, data) => {
    return await request(`/api/admin/companies/${companyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // ============ Admin - Stores ============

  /**
   * List all stores across all companies (admin only)
   */
  listAllStores: async () => {
    return await request('/api/admin/stores');
  },

  // ============ Admin - Users ============

  /**
   * Create a new user (admin only)
   */
  createUser: async (data) => {
    return await request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all users (admin only)
   */
  listUsers: async () => {
    return await request('/api/admin/users');
  },

  /**
   * Update user (admin only)
   */
  updateUser: async (userId, data) => {
    return await request(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Change user password (admin only)
   */
  changeUserPassword: async (userId, newPassword) => {
    return await request(`/api/admin/users/${userId}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    });
  },

  // ============ Stores ============

  /**
   * Create a new store
   */
  createStore: async (data) => {
    return await request('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user's store
   */
  getCurrentStore: async () => {
    return await request('/api/stores/current');
  },

  /**
   * List all stores for current user's company
   */
  listStores: async () => {
    return await request('/api/stores');
  },

  /**
   * Update store
   */
  updateStore: async (storeId, data) => {
    return await request(`/api/stores/${storeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete store
   */
  deleteStore: async (storeId) => {
    return await request(`/api/stores/${storeId}`, {
      method: 'DELETE',
    });
  },

  // ============ Products ============

  /**
   * Create a new product
   */
  createProduct: async (data) => {
    return await request('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all products
   */
  listProducts: async (category = null) => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    return await request(`/api/products${params}`);
  },

  /**
   * Get a specific product
   */
  getProduct: async (productId) => {
    return await request(`/api/products/${productId}`);
  },

  /**
   * Update product
   */
  updateProduct: async (productId, data) => {
    return await request(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete product
   */
  deleteProduct: async (productId) => {
    return await request(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  },

  // ============ Combos ============

  /**
   * Create a new combo
   */
  createCombo: async (data) => {
    return await request('/api/combos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all combos
   */
  listCombos: async () => {
    return await request('/api/combos');
  },

  /**
   * Get a specific combo
   */
  getCombo: async (comboId) => {
    return await request(`/api/combos/${comboId}`);
  },

  /**
   * Update combo
   */
  updateCombo: async (comboId, data) => {
    return await request(`/api/combos/${comboId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete combo
   */
  deleteCombo: async (comboId) => {
    return await request(`/api/combos/${comboId}`, {
      method: 'DELETE',
    });
  },

  // ============ Orders ============

  /**
   * Create a new order
   */
  createOrder: async (data) => {
    return await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * List all orders with optional date filter
   */
  listOrders: async (dateFilter = null) => {
    const params = dateFilter ? `?date_filter=${dateFilter}` : '';
    return await request(`/api/orders${params}`);
  },

  /**
   * List today's orders
   */
  listTodayOrders: async () => {
    return await request('/api/orders/today');
  },

  /**
   * Get a specific order
   */
  getOrder: async (orderId) => {
    return await request(`/api/orders/${orderId}`);
  },

  /**
   * Update order
   */
  updateOrder: async (orderId, data) => {
    return await request(`/api/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete order
   */
  deleteOrder: async (orderId) => {
    return await request(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Bulk update payment status for multiple orders
   */
  bulkUpdateOrderPayment: async (orderIds, isPaid) => {
    return await request('/api/orders/bulk/update-payment', {
      method: 'POST',
      body: JSON.stringify({
        order_ids: orderIds,
        is_paid: isPaid,
      }),
    });
  },

  // ============ Sessions ============

  /**
   * Get today's session
   */
  getTodaySession: async () => {
    return await request('/api/sessions/today');
  },

  /**
   * Get session by date
   */
  getSessionByDate: async (date) => {
    return await request(`/api/sessions/${date}`);
  },

  /**
   * Mark session as exported
   */
  markSessionExported: async (sessionId) => {
    return await request(`/api/sessions/${sessionId}/export`, {
      method: 'POST',
    });
  },

  // ============ Customers ============

  /**
   * Get customer names for autocomplete
   */
  getCustomerNames: async () => {
    return await request('/api/customers/names');
  },
};

export default api;
export { APIError, getToken, setToken, removeToken, getCurrentStoreId, setCurrentStoreId, removeCurrentStoreId, getCurrentCompanyId, setCurrentCompanyId, removeCurrentCompanyId };
