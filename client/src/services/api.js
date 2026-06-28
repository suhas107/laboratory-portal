import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Authentication ──
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  loginVerify: (data) => api.post('/auth/login/verify', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (data) => api.post('/auth/2fa/enable', data),
  register: (userData) => api.post('/auth/register', userData),
  signup: (data) => api.post('/auth/signup', data),
  getUsers: () => api.get('/auth/users'),
  approveUser: (id) => api.put(`/auth/users/${id}/approve`),
  rejectUser: (id) => api.put(`/auth/users/${id}/reject`),
};

// ── People ──
export const peopleAPI = {
  getAll: (params) => api.get('/people', { params }),
  getById: (id) => api.get(`/people/${id}`),
  create: (data) => api.post('/people', data),
  update: (id, data) => api.put(`/people/${id}`, data),
  delete: (id) => api.delete(`/people/${id}`),
};

// ── Projects ──
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// ── Publications ──
export const publicationsAPI = {
  getAll: (params) => api.get('/publications', { params }),
  getById: (id) => api.get(`/publications/${id}`),
  create: (data) => api.post('/publications', data),
  update: (id, data) => api.put(`/publications/${id}`, data),
  delete: (id) => api.delete(`/publications/${id}`),
};

// ── Inventory ──
export const inventoryAPI = {
  getAll: (params) => api.get('/inventory', { params }),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
};

// ── Dashboard ──
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// ── Reports ──
export const reportsAPI = {
  generate: (resource, params) => api.get(`/reports/${resource}`, { params }),
  exportExcel: (resource, params) =>
    api.get(`/reports/${resource}/export`, {
      params,
      responseType: 'blob',
    }),
  exportWord: (resource, params) =>
    api.get(`/reports/${resource}/export-word`, {
      params,
      responseType: 'blob',
    }),
  triggerTestAlert: () => api.get('/reports/trigger-test-alert'),
};

export default api;
