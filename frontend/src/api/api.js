import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Automatically extract 'data' from the standardized { success, data } wrapper
api.interceptors.response.use(
  (response) => {
    // If the response follows the { success, data, message } format
    if (response.data && response.data.success !== undefined) {
      if (!response.data.success) {
        return Promise.reject(new Error(response.data.error || 'API Error'));
      }
      return response.data; // This will simplify usage: const { orders } = await api.get(...)
    }
    return response;
  },
  (error) => {
    // Handle standardized error responses from the backend
    const message = error.response?.data?.error || error.message;
    return Promise.reject(new Error(message));
  }
);

export default api;
