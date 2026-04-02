import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8888/api', // Ubah jika pakai port beda
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Nempel Token
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired atau belum login
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;