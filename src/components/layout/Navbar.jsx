import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineMenu, HiOutlineX, HiOutlineChevronDown,
    HiOutlineUser, HiOutlineLogout,
    HiOutlineAcademicCap, HiOutlinePencilAlt,
    HiOutlineBell, HiOutlineCheckCircle
} from 'react-icons/hi';
import logo from '../../assets/logo.png';
import api from '../../api/axios';

const Navbar = () => {
    const { isAuthenticated, user, logout, isTeacher, isAdmin, profilePicture } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    const navLinks = [
        { to: '/', label: 'Ana Səhifə', end: true },
        { to: '/haqqimizda', label: 'Haqqımızda' },
        { to: '/imtahanlar', label: isTeacher ? 'İmtahanlarım' : 'İmtahanlar' },
        { to: '/elaqe', label: 'Əlaqə' },
    ];

    const loadNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data);
            const unread = data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
        } catch {}
    }, [isAuthenticated]);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, [loadNotifications]);

    const openNotifications = async () => {
        const opening = !notifOpen;
        setNotifOpen(opening);
        setDropdownOpen(false);
        if (opening) {
            await loadNotifications();
        }
    };

    const markRead = async (id) => {
        const notif = notifications.find(n => n.id === id);
        if (!notif || notif.isRead) return;
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await api.post(`/notifications/${id}/read`);
        } catch {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
            setUnreadCount(prev => prev + 1);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await api.post('/notifications/read-all');
        } catch {
            await loadNotifications();
        }
    };

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileOpen(false);
        navigate('/');
    };

    const fmtTime = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.floor((now - d) / 60000);
        if (diff < 1) return 'İndicə';
        if (diff < 60) return `${diff} dəq əvvəl`;
        if (diff < 1440) return `${Math.floor(diff / 60)} saat əvvəl`;
        return d.toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' });
    };

    const UserAvatar = ({ size = 'sm' }) => {
        const cls = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base';
        return (
            <div className={`${cls} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-indigo-100`}>
                {profilePicture
                    ? <img src={profilePicture} alt={user?.fullName} className="h-full w-full object-cover" />
                    : <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                }
            </div>
        );
    };

    return (
        <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center shrink-0">
                        <img src={logo} alt="testup.az" className="h-11 w-auto" />
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                className={({ isActive }) =>
                                    `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'text-indigo-600 bg-indigo-50'
                                        : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                {/* Notification bell */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={openNotifications}
                                        className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                    >
                                        <HiOutlineBell className="h-5 w-5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {notifOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                                <h3 className="font-bold text-gray-900 text-sm">Bildirişlər</h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                                                    >
                                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Hamısını oxu
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="py-10 text-center text-gray-400">
                                                        <HiOutlineBell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                        <p className="text-sm">Bildiriş yoxdur</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markRead(n.id)}
                                                            className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                                                                    <p className="text-[11px] text-gray-400 mt-1">{fmtTime(n.createdAt)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => { setDropdownOpen(v => !v); setNotifOpen(false); }}
                                        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                                    >
                                        <UserAvatar size="sm" />
                                        <div className="text-left hidden lg:block">
                                            <p className="text-sm font-semibold text-gray-800 leading-none">{user?.fullName}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 leading-none">
                                                {isAdmin ? 'Admin' : isTeacher ? 'Müəllim' : 'Şagird'}
                                            </p>
                                        </div>
                                        <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                                            <div className="px-4 py-3 flex items-center gap-3">
                                                <UserAvatar size="md" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">{user?.fullName}</p>
                                                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                                </div>
                                            </div>

                                            <div className="mx-3 mb-2 mt-0.5">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${isAdmin ? 'bg-purple-50 text-purple-700' : isTeacher ? 'bg-violet-50 text-violet-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                    {isAdmin
                                                        ? <><span className="text-[10px] font-black">⚙</span> Admin</>
                                                        : isTeacher
                                                            ? <><HiOutlinePencilAlt className="w-3 h-3" /> Müəllim</>
                                                            : <><HiOutlineAcademicCap className="w-3 h-3" /> Şagird</>
                                                    }
                                                </span>
                                            </div>

                                            <div className="border-t border-gray-100 pt-1">
                                                {isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 hover:bg-purple-50 transition-colors font-semibold"
                                                    >
                                                        <span className="w-4 h-4 shrink-0 text-center text-xs font-black">⚙</span>
                                                        Admin Panel
                                                    </Link>
                                                )}
                                                <Link
                                                    to="/profil"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                                >
                                                    <HiOutlineUser className="w-4 h-4 shrink-0" />
                                                    Profilim
                                                </Link>
                                            </div>

                                            <div className="border-t border-gray-100 pt-1 mt-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl"
                                                >
                                                    <HiOutlineLogout className="w-4 h-4 shrink-0" />
                                                    Çıxış
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Daxil ol
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    Qeydiyyat
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile: bell + menu button */}
                    <div className="md:hidden flex items-center gap-1">
                        {isAuthenticated && (
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={openNotifications}
                                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <HiOutlineBell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                            <h3 className="font-bold text-gray-900 text-sm">Bildirişlər</h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs text-indigo-600 font-semibold">Hamısını oxu</button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="py-8 text-center text-gray-400 text-sm">Bildiriş yoxdur</div>
                                            ) : notifications.map(n => (
                                                <div key={n.id} onClick={() => markRead(n.id)}
                                                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-indigo-50/40' : ''}`}>
                                                    <div className="flex items-start gap-2">
                                                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                                                            <p className="text-[10px] text-gray-400 mt-1">{fmtTime(n.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    {isAuthenticated && (
                        <div className="flex items-center gap-3 px-4 py-4 bg-gray-50 border-b border-gray-100">
                            <UserAvatar size="md" />
                            <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{user?.fullName}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                        </div>
                    )}
                    <div className="px-3 py-3 space-y-0.5">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.end}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}

                        {isAuthenticated ? (
                            <div className="border-t border-gray-100 pt-2 mt-2 space-y-0.5">
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                                    >
                                        <span className="w-4 h-4 text-xs font-black">⚙</span> Admin Panel
                                    </Link>
                                )}
                                <Link
                                    to="/profil"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                >
                                    <HiOutlineUser className="w-4 h-4" /> Profilim
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <HiOutlineLogout className="w-4 h-4" /> Çıxış
                                </button>
                            </div>
                        ) : (
                            <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                                    Daxil ol
                                </Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white text-center hover:bg-indigo-700 transition-colors">
                                    Qeydiyyat
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
