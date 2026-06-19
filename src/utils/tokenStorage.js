// Centralised access/refresh token storage that honours the "Məni xatırla" choice.
//
//   remember = true  → localStorage   (survives a full browser restart)
//   remember = false → sessionStorage (wiped when the browser/tab closes)
//
// All token reads, writes and clears across the app go through here so the
// "remember me" decision is enforced in exactly one place.

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

// Read from whichever store currently holds the token. sessionStorage takes
// precedence so a fresh "don't remember me" login always wins over any stale
// token that might still be sitting in localStorage.
export const getAccessToken = () =>
    sessionStorage.getItem(ACCESS) || localStorage.getItem(ACCESS);

export const getRefreshToken = () =>
    sessionStorage.getItem(REFRESH) || localStorage.getItem(REFRESH);

// Persist both tokens to the chosen store and clear the other one, so a single
// login can never leave tokens lingering in both places.
export const setTokens = ({ accessToken, refreshToken }, remember) => {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    target.setItem(ACCESS, accessToken);
    target.setItem(REFRESH, refreshToken);
    other.removeItem(ACCESS);
    other.removeItem(REFRESH);
};

// Update tokens during a silent refresh without changing which store they live
// in — this preserves the user's original "remember me" choice across refreshes.
export const updateTokens = ({ accessToken, refreshToken }) => {
    const store = sessionStorage.getItem(REFRESH) !== null ? sessionStorage : localStorage;
    store.setItem(ACCESS, accessToken);
    store.setItem(REFRESH, refreshToken);
};

// Clear tokens from both stores (logout / failed refresh).
export const clearTokens = () => {
    sessionStorage.removeItem(ACCESS);
    sessionStorage.removeItem(REFRESH);
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
};
