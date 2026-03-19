import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

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
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

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
                            localStorage.setItem('accessToken', data.accessToken);
                            localStorage.setItem('refreshToken', data.refreshToken);
                            const newDecoded = jwtDecode(data.accessToken);
                            setUser({
                                id: newDecoded.sub,
                                email: newDecoded.email,
                                role: newDecoded.role,
                                fullName: newDecoded.fullName,
                            });
                        } catch {
                            // Refresh also failed — clear storage
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                        }
                    } else {
                        localStorage.removeItem('accessToken');
                    }
                } catch {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                }
            } else if (refreshToken) {
                // No access token but refresh token exists — attempt refresh
                try {
                    const { default: axios } = await import('axios');
                    const { data } = await axios.post('/api/auth/refresh', { refreshToken });
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    const decoded = jwtDecode(data.accessToken);
                    setUser({
                        id: decoded.sub,
                        email: decoded.email,
                        role: decoded.role,
                        fullName: decoded.fullName,
                    });
                } catch {
                    localStorage.removeItem('refreshToken');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const refreshSubscription = async () => {
        if (!user?.id || (!isTeacher && !isAdmin)) return;
        try {
            const res = await api.get(`/user-subscriptions/user/${user.id}/active`);

            setSubscription(res.data);
        } catch (err) {
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

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
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
    const loginWithTokens = (data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setSubscription(null);
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const isStudent = user?.role === 'STUDENT';

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
