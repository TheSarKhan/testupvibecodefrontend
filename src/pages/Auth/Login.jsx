import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
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

    return (
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
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Gözləyin...' : 'Daxil ol'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Hesabınız yoxdur?{' '}
                    <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                        Qeydiyyatdan keçin
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
