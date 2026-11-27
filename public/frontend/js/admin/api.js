// Admin API configuration
const API_BASE_URL = '/api/admin';
const token = sessionStorage.getItem('adminToken');

// Axios instance for admin requests
const api = window.axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  },
});

export { api };