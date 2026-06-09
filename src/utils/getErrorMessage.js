/**
 * Extracts a human-readable message from any API/JS error.
 * Guarantees a non-empty string — never undefined, null or
 * "[object Object]" — so it is always safe to pass to toast.error().
 *
 * Priority: backend `message` (string only) → status-based default → fallback.
 */
const STATUS_DEFAULTS = {
    400: 'Məlumatlar yanlışdır',
    401: 'Giriş tələb olunur',
    403: 'Bu əməliyyat üçün icazəniz yoxdur',
    404: 'Belə bir məlumat tapılmadı',
    409: 'Bu məlumat artıq mövcuddur',
    429: 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.',
};

const getErrorMessage = (error, fallback = 'Əməliyyat uğursuz oldu') => {
    if (!error) return fallback;

    const backendMsg = error.response?.data?.message;
    if (typeof backendMsg === 'string' && backendMsg.trim()) return backendMsg;

    const status = error.response?.status;
    if (status >= 500) return 'Server xətası baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin.';
    // A caller-supplied fallback ("İmtahan yüklənmədi") is more specific than
    // the generic 400/404 defaults, so it wins for those statuses.
    if (fallback !== 'Əməliyyat uğursuz oldu' && (status === 400 || status === 404)) return fallback;
    if (STATUS_DEFAULTS[status]) return STATUS_DEFAULTS[status];

    // Request never reached the server
    if (error.request && !error.response) return 'Şəbəkə bağlantısı xətası. Zəhmət olmasa yenidən cəhd edin.';

    // Axios sets error.message to the backend message in the interceptor;
    // plain JS errors carry their own. Filter out axios technical strings.
    if (typeof error.message === 'string' && error.message.trim()
        && !/^(Request failed|Network Error|timeout|canceled)/i.test(error.message)) {
        return error.message;
    }

    return fallback;
};

export default getErrorMessage;
