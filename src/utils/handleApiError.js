import toast from 'react-hot-toast';
import getErrorMessage from './getErrorMessage';

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

    toast.error(getErrorMessage(error, fallback));
};

export default handleApiError;
