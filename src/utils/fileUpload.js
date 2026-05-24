import toast from 'react-hot-toast';

// Conservative caps that fit comfortably under the backend body-size
// limit even after base64 expansion (~33%). Audio passages need more
// headroom than question/option illustrations.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;   // 4 MB raw  → ~5.3 MB base64
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024;  // 15 MB raw → ~20 MB base64

const fmtMb = (b) => Math.round((b / 1024 / 1024) * 10) / 10;

/**
 * Validate + read a user-selected file as a base64 data URL.
 *
 * Returns a Promise that resolves with the data URL, or rejects with null
 * (after toasting a user-facing error) so the caller can `.then(url =>
 * setState(url)).catch(() => {})` without leaking exceptions.
 *
 * Why pre-validate instead of letting the backend reject?
 *   1. A 100 MB MP3 going through FileReader.readAsDataURL freezes the
 *      tab for several seconds before any upload would start.
 *   2. Round-tripping a huge payload to discover it's too big wastes the
 *      teacher's time on a slow connection.
 */
export const readFileAsDataUrl = (file, { maxBytes, kind = 'fayl' } = {}) =>
    new Promise((resolve, reject) => {
        if (!file) return reject(null);
        if (maxBytes && file.size > maxBytes) {
            toast.error(`${kind} çox böyükdür (${fmtMb(file.size)} MB) — maksimum ${fmtMb(maxBytes)} MB`);
            return reject(null);
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => {
            toast.error(`${kind} oxunmadı`);
            reject(null);
        };
        reader.readAsDataURL(file);
    });
