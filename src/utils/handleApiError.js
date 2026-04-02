import toast from 'react-hot-toast';

/**
 * Shows a toast for API errors from catch blocks.
 * 403 and 5xx are already shown globally by axios interceptor,
 * so this handles 4xx errors that need component-level messaging.
 *
 * Usage:
 *   } catch (error) {
 *       handleApiError(error);
 *   }
 *
 * Or with a fallback message:
 *   handleApiError(error, 'İmtahan yüklənmədi');
 */
const handleApiError = (error, fallback = 'Əməliyyat uğursuz oldu') => {
    // Already handled (toasted) by axios interceptor — skip to avoid duplicates
    if (error._handled) return;

    const status = error.response?.status;

    // 403 and 5xx are already toasted by the axios interceptor — skip
    if (status === 403 || status >= 500 || !error.response) return;

    // Prefer backend message, then status-based default, then fallback
    const backendMsg = error.response?.data?.message;
    let message;
    if (backendMsg) {
        message = backendMsg;
    } else if (status === 404) {
        message = fallback !== 'Əməliyyat uğursuz oldu' ? fallback : 'Belə bir məlumat tapılmadı';
    } else if (status === 400) {
        message = fallback !== 'Əməliyyat uğursuz oldu' ? fallback : 'Məlumatlar yanlışdır';
    } else if (status === 401) {
        message = 'Giriş tələb olunur';
    } else {
        message = fallback;
    }
    toast.error(message);
};

export default handleApiError;
