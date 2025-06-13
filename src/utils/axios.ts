import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if it exists
    const token = localStorage.getItem('_SMART_BUILDING_TOKEN_');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error.response || error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('_SMART_BUILDING_TOKEN_');
      window.location.href = '/login';
    } else if (error.response?.status === 404) {
      console.error('Resource not found:', error.config.url);
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Add request/response logging in development
// if (process.env.NODE_ENV === 'development') {
//   axiosInstance.interceptors.request.use(request => {
//     console.log('Starting Request:', request);
//     return request;
//   });

//   axiosInstance.interceptors.response.use(response => {
//     return response;
//   });
// }

export default axiosInstance; 