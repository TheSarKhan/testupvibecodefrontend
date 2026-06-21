import axios from 'axios';
import toast from 'react-hot-toast';
import getErrorMessage from '../utils/getErrorMessage';
import { getAccessToken, getRefreshToken, updateTokens, clearTokens } from '../utils/tokenStorage';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Redirect to /login while preserving where the user was, so they return there
// after authenticating. Never captures the login page itself (avoids a loop)
// and only ever encodes the current internal path.
const redirectToLogin = () => {
    const path = window.location.pathname + window.location.search;
    window.location.href = path.startsWith('/login')
        ? '/login'
        : '/login?returnUrl=' + encodeURIComponent(path);
};

// ─── Request interceptor — attach access token ──────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
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

        // Callers that own their own error UI (e.g. background polling) can pass
        // { skipErrorToast: true } to suppress the global toast.
        const skipToast = originalRequest?.skipErrorToast === true;

        // Download endpoints use responseType:'blob', so an error body arrives
        // as a Blob and data.message would be undefined — the readable backend
        // message got replaced by the generic fallback. Decode it back to JSON.
        if (error.response?.data instanceof Blob
            && error.response.data.type?.includes('json')) {
            try {
                error.response.data = JSON.parse(await error.response.data.text());
            } catch {
                // not JSON after all — leave the blob as is
            }
        }

        // Extract backend message so callers can use error.message directly
        // (string only — never propagate objects into toasts)
        if (typeof error.response?.data?.message === 'string') {
            error.message = error.response.data.message;
        }

        // Canceled/aborted requests (React Query cancellation on unmount or
        // query-key change, AbortController) also arrive with no response, but
        // they are NOT failures — the user never sees a broken action. Surfacing
        // a "network error" toast here is a false positive (e.g. navigating
        // between collaborative-exam creation steps cancels in-flight queries).
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
            error._handled = true;
            return Promise.reject(error);
        }

        // Network error (no response at all)
        if (!error.response) {
            error._handled = true;
            if (!skipToast) toast.error('Şəbəkə bağlantısı xətası. Zəhmət olmasa yenidən cəhd edin.');
            return Promise.reject(error);
        }

        // 403 Forbidden — always show globally
        if (status === 403) {
            error._handled = true;
            if (!skipToast) toast.error(getErrorMessage(error, 'Bu əməliyyat üçün icazəniz yoxdur'));
            return Promise.reject(error);
        }

        // 5xx Server errors — show globally unless the caller opted out
        if (status >= 500) {
            error._handled = true;
            if (!skipToast) toast.error(getErrorMessage(error));
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

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
            // No refresh token → clear everything and redirect to login
            clearTokens();
            processQueue(new Error('No refresh token'), null);
            isRefreshing = false;
            redirectToLogin();
            return Promise.reject(error);
        }

        try {
            // Use plain axios (NOT api) to avoid interceptor loops
            const { data } = await axios.post('/api/auth/refresh', { refreshToken });

            updateTokens(data);

            api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

            processQueue(null, data.accessToken);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearTokens();
            redirectToLogin();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
