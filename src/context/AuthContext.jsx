import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { getAccessToken, getRefreshToken, setTokens, updateTokens, clearTokens } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [profilePicture, setProfilePicture] = useState('');
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();

            if (accessToken) {
                try {
                    const decoded = jwtDecode(accessToken);
                    if (decoded.exp * 1000 > Date.now()) {
                        // Access token is still valid — use it directly
                        setUser({
                            id: decoded.sub,
                            email: decoded.email,
                            role: decoded.role,
                            fullName: decoded.fullName,
                        });
                    } else if (refreshToken) {
                        // Access token expired — try to silently refresh
                        try {
                            // Use plain axios to avoid interceptor loops
                            const { default: axios } = await import('axios');
                            const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                            updateTokens(data);
                            const newDecoded = jwtDecode(data.accessToken);
                            setUser({
                                id: newDecoded.sub,
                                email: newDecoded.email,
                                role: newDecoded.role,
                                fullName: newDecoded.fullName,
                            });
                        } catch {
                            // Refresh also failed — clear storage
                            clearTokens();
                        }
                    } else {
                        clearTokens();
                    }
                } catch {
                    clearTokens();
                }
            } else if (refreshToken) {
                // No access token but refresh token exists — attempt refresh
                try {
                    const { default: axios } = await import('axios');
                    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                    updateTokens(data);
                    const decoded = jwtDecode(data.accessToken);
                    setUser({
                        id: decoded.sub,
                        email: decoded.email,
                        role: decoded.role,
                        fullName: decoded.fullName,
                    });
                } catch {
                    clearTokens();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const isStudent = user?.role === 'STUDENT';

    const refreshSubscription = async () => {
        if (!user?.id || (!isTeacher && !isAdmin)) return;
        try {
            const res = await api.get(`/user-subscriptions/user/${user.id}/active`);
            setSubscription(res.data);
        } catch {
            // silent — subscription endpoint may 404 for users without a plan
        }
    };

    // Fetch profile picture and subscription once user is loaded
    useEffect(() => {
        if (user) {
            api.get('/users/me').then(res => {
                setProfilePicture(res.data?.profilePicture || '');
            }).catch(() => {});

            refreshSubscription();
        } else {
            setProfilePicture('');
            setSubscription(null);
        }
    }, [user?.id, user?.role]);

    // Cross-tab sync: when PaymentSuccess sets 'paymentCompleted' in another tab,
    // refresh subscription in this tab automatically.
    // Use a ref so the listener always calls the latest refreshSubscription closure.
    const refreshSubscriptionRef = useRef(refreshSubscription);
    refreshSubscriptionRef.current = refreshSubscription;
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === 'paymentCompleted') {
                refreshSubscriptionRef.current();
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const login = async (email, password, remember = true) => {
        const { data } = await api.post('/auth/login', { email, password });
        setTokens(data, remember);
        const decoded = jwtDecode(data.accessToken);
        setUser({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            fullName: decoded.fullName,
        });
        return data;
    };

    // Called after Google OAuth login or complete-registration succeeds
    const loginWithTokens = (data, remember = true) => {
        setTokens(data, remember);
        const decoded = jwtDecode(data.accessToken);
        setUser({
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role,
            fullName: decoded.fullName,
        });
        return data;
    };

    const register = async (userData) => {
        const { data } = await api.post('/auth/register', userData);
        return data;
    };

    const logout = () => {
        clearTokens();
        setUser(null);
        setSubscription(null);
    };

    // Helper to check feature permission based on active plan
    const hasPermission = (featureKey) => {
        // If not a teacher, this doesn't apply (or allowed by default for admin)
        if (isAdmin) return true;
        if (!isTeacher) return false;
        if (!subscription || !subscription.plan) return false; // Default blocks if no plan
        return !!subscription.plan[featureKey];
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                loginWithTokens,
                register,
                logout,
                isAuthenticated,
                isAdmin,
                isTeacher,
                isStudent,
                profilePicture,
                setProfilePicture,
                subscription,
                hasPermission,
                refreshSubscription,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
