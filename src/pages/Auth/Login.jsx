import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googlePending, setGooglePending] = useState(null); // {googleToken, userInfo}
    const { login, loginWithTokens } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(email, password);
            const { jwtDecode } = await import('jwt-decode');
            const decoded = jwtDecode(data.accessToken);
            toast.success('Uğurla daxil oldunuz!');
            if (decoded.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCredential = async (credentialResponse) => {
        try {
            const { data } = await api.post('/auth/google', { googleToken: credentialResponse.credential });
            if (data.status === 'LOGIN') {
                loginWithTokens(data);
                toast.success('Uğurla daxil oldunuz!');
                navigate(data.role === 'ADMIN' ? '/admin' : '/');
            } else if (data.status === 'NEEDS_REGISTRATION') {
                setGooglePending({ googleToken: credentialResponse.credential, userInfo: data });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Google ilə giriş xətası');
        }
    };

    return (
        <>
        {googlePending && (
            <GoogleRoleModal
                googleToken={googlePending.googleToken}
                userInfo={googlePending.userInfo}
                onSuccess={(data) => {
                    loginWithTokens(data);
                    toast.success('Qeydiyyat tamamlandı!');
                    navigate(data.role === 'ADMIN' ? '/admin' : '/');
                }}
                onClose={() => setGooglePending(null)}
            />
        )}
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 text-center">Daxil ol</h2>
                <p className="mt-2 text-sm text-gray-500 text-center">
                    Hesabınıza daxil olun
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-poçt
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="email@nümunə.az"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Şifrə
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Gözləyin...' : 'Daxil ol'}
                    </button>
                </form>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs text-gray-400">
                        <span className="bg-white px-2">və ya</span>
                    </div>
                </div>

                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleCredential}
                        onError={() => toast.error('Google girişi ləğv edildi')}
                        text="signin_with"
                        locale="az"
                        width="360"
                    />
                </div>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Hesabınız yoxdur?{' '}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        Qeydiyyatdan keçin
                    </Link>
                </p>
            </div>
        </div>
        </>
    );
};

export default Login;
