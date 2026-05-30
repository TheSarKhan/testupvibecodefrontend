/**
 * Date formatting helpers — platform-wide standard is DD.MM.YYYY.
 *
 * Do NOT use toLocaleDateString('az-AZ', { month: 'short' }) — the Azerbaijani
 * locale renders "M04" instead of a 3-letter month name, which is unreadable.
 */

// Spring Boot serialises `LocalDateTime` as a naked ISO string
// (e.g. "2026-05-24T14:32:00") with no timezone marker. The browser's
// `new Date(...)` then interprets that as LOCAL time, so when the server
// runs in a different timezone than the user, notifications and timestamps
// shift by the offset (a user in Baku sees a UTC server's 14:32 as 14:32
// local instead of 18:32 local). We fix that by treating any naked ISO
// timestamp as UTC — appending `Z` before parsing. ISO strings that
// already include a zone (`Z`, `+04:00`, `-05`, etc.) are left untouched.
const ISO_DATETIME_NO_ZONE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

const normaliseTimestamp = (v) => {
    if (typeof v !== 'string') return v;
    return ISO_DATETIME_NO_ZONE.test(v) ? v.replace(' ', 'T') + 'Z' : v;
};

const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(normaliseTimestamp(v));
    return isNaN(d.getTime()) ? null : d;
};

const pad = (n) => String(n).padStart(2, '0');

/** "26.04.2026" */
export const fmtDate = (v) => {
    const d = toDate(v);
    if (!d) return '';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

/** "26.04" — compact, no year (use only when context implies the year) */
export const fmtDateShort = (v) => {
    const d = toDate(v);
    if (!d) return '';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
};

/** "26.04.2026 14:32" */
export const fmtDateTime = (v) => {
    const d = toDate(v);
    if (!d) return '';
    return `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "14:32" */
export const fmtTime = (v) => {
    const d = toDate(v);
    if (!d) return '';
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Exposed so callers that need a `Date` (e.g. relative-time diffs) parse the
// backend's naked LocalDateTime strings as UTC instead of local time.
export const parseBackendDate = toDate;

/**
 * Relative time in Azerbaijani: "İndicə" / "5 dəq əvvəl" / "3 saat əvvəl",
 * falling back to a compact "DD.MM" once the event is older than a day.
 *
 * Single source of truth — every page that shows a relative timestamp must use
 * this so parsing stays consistent. It goes through parseBackendDate(), which
 * normalises naked backend timestamps to UTC; calling `new Date(iso)` directly
 * (the old per-page pattern) mis-parsed them as local time and drifted by the
 * server offset (BUG-10).
 */
export const formatRelativeTime = (v) => {
    const d = toDate(v);
    if (!d) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    // Clamp tiny future skew (clock drift / sub-second rounding) to "İndicə".
    if (diff < 1) return 'İndicə';
    if (diff < 60) return `${diff} dəq əvvəl`;
    if (diff < 1440) return `${Math.floor(diff / 60)} saat əvvəl`;
    return fmtDateShort(d);
};
