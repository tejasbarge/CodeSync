import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: BACKEND_URL,
});

// Add Interceptor for JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const googleAuth = async (token) => {
    const response = await api.post('/api/auth/google', { token });
    return response.data;
};

export default api;
export { BACKEND_URL };
