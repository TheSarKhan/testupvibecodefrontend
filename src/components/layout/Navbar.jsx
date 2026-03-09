import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineBell, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const Navbar = () => {
    const { isAuthenticated, user, logout, isTeacher } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { to: '/', label: 'Ana Səhifə' },
        { to: '/haqqimizda', label: 'Haqqımızda' },
        {
            to: '/imtahanlar',
            label: isTeacher ? 'İmtahanlarım' : 'İmtahanlar',
        },
        { to: '/elaqe', label: 'Əlaqə' },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            testup.az
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive
                                        ? 'text-indigo-600'
                                        : 'text-gray-600 hover:text-indigo-600'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAuthenticated ? (
                            <>
                                <button className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors">
                                    <HiOutlineBell className="h-6 w-6" />
                                </button>
                                <Link
                                    to="/profil"
                                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600"
                                >
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    {user?.fullName}
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Çıxış
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                                >
                                    Daxil ol
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-sm font-medium px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Qeydiyyat
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        className="md:hidden p-2 text-gray-500"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? (
                            <HiOutlineX className="h-6 w-6" />
                        ) : (
                            <HiOutlineMenu className="h-6 w-6" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-4 py-3 space-y-2">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-2 rounded-lg text-sm font-medium ${isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/profil"
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileOpen(false);
                                    }}
                                    className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50"
                                >
                                    Çıxış
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Daxil ol
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                                >
                                    Qeydiyyat
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
