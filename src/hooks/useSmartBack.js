import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Returns a back-navigation function that:
 *  - Goes back in browser history when there is real prior history (so user lands
 *    on whichever page they actually came from — Müəllim İmtahanları, Birgə
 *    İmtahanlar, Öz İmtahanlarım, AdminUsers etc).
 *  - Falls back to `fallback` only when the current entry is the first one
 *    (direct URL access, bookmark, refresh after redirect).
 *
 * React Router v6 marks the initial history entry with location.key === 'default'.
 * window.history.state?.idx === 0 is checked as a secondary signal because
 * window.history.replaceState() (used elsewhere) can desync location.key.
 */
export function useSmartBack(fallback = '/') {
    const navigate = useNavigate();
    const location = useLocation();

    return useCallback(() => {
        const isFirstEntry =
            location.key === 'default' ||
            (typeof window !== 'undefined' && window.history.state?.idx === 0);

        if (isFirstEntry) {
            navigate(fallback, { replace: true });
        } else {
            navigate(-1);
        }
    }, [navigate, location.key, fallback]);
}

export default useSmartBack;
