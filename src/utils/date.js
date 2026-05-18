/**
 * Date formatting helpers — platform-wide standard is DD.MM.YYYY.
 *
 * Do NOT use toLocaleDateString('az-AZ', { month: 'short' }) — the Azerbaijani
 * locale renders "M04" instead of a 3-letter month name, which is unreadable.
 */

const toDate = (v) => {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    const d = new Date(v);
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
