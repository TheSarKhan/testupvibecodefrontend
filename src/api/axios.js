import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request interceptor — attach access token ──────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Refresh state shared across all queued requests ───────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// ─── Response interceptor — handle 401 and refresh token rotation ──────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // Extract backend message so callers can use error.message directly
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }

        // Network error (no response at all)
        if (!error.response) {
            error._handled = true;
            toast.error('Şəbəkə bağlantısı xətası. Zəhmət olmasa yenidən cəhd edin.');
            return Promise.reject(error);
        }

        // 403 Forbidden — always show globally
        if (status === 403) {
            error._handled = true;
            toast.error(error.response?.data?.message || 'Bu əməliyyat üçün icazəniz yoxdur');
            return Promise.reject(error);
        }

        // 5xx Server errors — always show globally
        if (status >= 500) {
            error._handled = true;
            toast.error(error.response?.data?.message || 'Server xətası baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.');
            return Promise.reject(error);
        }

        // Only retry once, only for 401 errors, and never for auth endpoints
        if (
            status !== 401 ||
            originalRequest._retry ||
            originalRequest.url?.includes('/auth/')
        ) {
            return Promise.reject(error);
        }

        // If already refreshing, queue this request until refresh completes
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            // No refresh token → clear everything and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            processQueue(new Error('No refresh token'), null);
            isRefreshing = false;
            window.location.href = '/login';
            return Promise.reject(error);
        }

        try {
            // Use plain axios (NOT api) to avoid interceptor loops
            const { data } = await axios.post('/api/auth/refresh', { refreshToken });

            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            processQueue(null, data.accessToken);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
