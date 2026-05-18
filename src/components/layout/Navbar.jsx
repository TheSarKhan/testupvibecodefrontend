import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineMenu, HiOutlineX, HiOutlineChevronDown,
    HiOutlineUser, HiOutlineLogout, HiOutlineCog,
    HiOutlineAcademicCap, HiOutlinePencilAlt,
    HiOutlineBell, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineSpeakerphone, HiOutlineCreditCard,
} from 'react-icons/hi';
import Logo from '../ui/Logo';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { fmtDateShort } from '../../utils/date';

const Navbar = () => {
    const { isAuthenticated, user, logout, isTeacher, isAdmin, isStudent, profilePicture } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasCollaborative, setHasCollaborative] = useState(false);
    const dropdownRef = useRef(null);
    const notifDesktopRef = useRef(null);
    const notifMobileRef = useRef(null);
    const navContainerRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

    useEffect(() => {
        if (isTeacher && !isAdmin) {
            api.get('/collaborative-exams/my-assignments')
                .then(r => setHasCollaborative(r.data.some(a => a.status !== 'APPROVED')))
                .catch(() => {});
        }
    }, [isTeacher, isAdmin]);

    // Update sliding indicator position when route or links change
    useEffect(() => {
        const update = () => {
            const container = navContainerRef.current;
            if (!container) return;
            const activeEl = container.querySelector('[data-active="true"]');
            if (activeEl) {
                setIndicator({
                    left: activeEl.offsetLeft,
                    width: activeEl.offsetWidth,
                    opacity: 1,
                });
            } else {
                setIndicator(prev => ({ ...prev, opacity: 0 }));
            }
        };
        // Defer to next frame to ensure DOM is painted
        const id = requestAnimationFrame(update);
        window.addEventListener('resize', update);
        return () => {
            cancelAnimationFrame(id);
            window.removeEventListener('resize', update);
        };
    }, [location.pathname, isStudent, isTeacher, isAdmin, hasCollaborative]);

    const isLinkActive = (link) => {
        if (link.end) return location.pathname === link.to;
        return location.pathname === link.to || location.pathname.startsWith(link.to + '/');
    };

    const navLinks = [
        { to: '/', label: 'Ana Səhifə', end: true },
        { to: '/haqqimizda', label: 'Haqqımızda' },
        { to: '/imtahanlar', label: isTeacher ? 'İmtahanlarım' : 'İmtahanlar' },
        ...(isStudent ? [{ to: '/imtahanlarim', label: 'İmtahanlarım' }] : []),
        ...(isTeacher && !isAdmin && hasCollaborative ? [{ to: '/birge-imtahanlari', label: 'Birgə İmtahanlar' }] : []),
        ...(isTeacher && !isAdmin ? [{ to: '/sual-bazasi', label: 'Sual Bazası' }] : []),
        ...(!isStudent ? [{ to: '/planlar', label: 'Planlar' }] : []),
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

        // Start WebSocket Connection for Real-Time Notifications
        if (!isAuthenticated || !user?.id) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${window.location.origin}/ws`),
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/notifications/${user.id}`, (message) => {
                    const newNotif = JSON.parse(message.body);

                    // Add to dropdown list and increase count
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show beautiful toast based on type
                    toast.custom((t) => (
                        <div
                            className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                            max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all cursor-pointer hover:bg-gray-100`}
                            onClick={() => {
                                toast.dismiss(t.id);
                                markRead(newNotif.id);
                                if (newNotif.actionUrl) {
                                    navigate(newNotif.actionUrl);
                                } else {
                                    setNotifOpen(true);
                                }
                            }}
                        >
                            <div className="flex-1 w-0 p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        {newNotif.type === 'EXAM_CREATED' && <HiOutlinePencilAlt className="h-10 w-10 text-emerald-500 bg-emerald-100 p-2 rounded-full" />}
                                        {newNotif.type === 'PAYMENT_SUCCESS' && <HiOutlineCreditCard className="h-10 w-10 text-blue-500 bg-blue-100 p-2 rounded-full" />}
                                        {newNotif.type === 'ANNOUNCEMENT' && <HiOutlineSpeakerphone className="h-10 w-10 text-emerald-500 bg-emerald-100 p-2 rounded-full" />}
                                        {newNotif.type === 'WARNING' && <HiOutlineExclamationCircle className="h-10 w-10 text-red-500 bg-red-100 p-2 rounded-full" />}
                                        {(!newNotif.type || newNotif.type === 'SYSTEM' || newNotif.type === 'EXAM_GRADED') && <HiOutlineBell className="h-10 w-10 text-blue-500 bg-blue-100 p-2 rounded-full" />}
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-bold text-gray-900">{newNotif.title}</p>
                                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{newNotif.message}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex border-l border-gray-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toast.dismiss(t.id);
                                    }}
                                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-blue-600 hover:text-blue-500 focus:outline-none"
                                >
                                    Bağla
                                </button>
                            </div>
                        </div>
                    ), { duration: 6000, position: 'top-right' });
                });
            },
            onStompError: () => {
            }
        });

        client.activate();

        return () => {
            if (client) {
                client.deactivate();
            }
        };
    }, [isAuthenticated, user?.id, navigate]);

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
            const insideNotif =
                (notifDesktopRef.current && notifDesktopRef.current.contains(e.target)) ||
                (notifMobileRef.current && notifMobileRef.current.contains(e.target));
            if (!insideNotif) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        setDropdownOpen(false);
        setMobileOpen(false);
    };

    const fmtTime = (iso) => {
        if (!iso) return '';
        // Backend sends LocalDateTime without timezone (e.g. "2026-03-25T18:30:00").
        // Parse as-is (browser treats it as local time). If it has timezone info, use it directly.
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        const now = new Date();
        const diff = Math.floor((now - d) / 60000);
        if (diff < 1) return 'İndicə';
        if (diff < 60) return `${diff} dəq əvvəl`;
        if (diff < 1440) return `${Math.floor(diff / 60)} saat əvvəl`;
        return fmtDateShort(d);
    };

    const UserAvatar = ({ size = 'sm' }) => {
        const cls = size === 'sm' ? 'h-8 w-8 text-[12.5px]' : 'h-10 w-10 text-[14px]';
        return (
            <div className={`${cls} rounded-full overflow-hidden flex-shrink-0`}>
                {profilePicture
                    ? <img src={profilePicture} alt={user?.fullName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    : <div
                        className="h-full w-full flex items-center justify-center text-white font-extrabold"
                        style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }}
                    >
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                }
            </div>
        );
    };

    return (
        <nav
            className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[var(--ink-150)]"
            style={{ boxShadow: '0 1px 24px -8px rgba(15, 23, 42, 0.08)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[78px]">

                    {/* Logo */}
                    <Link to="/" className="flex items-center shrink-0 group" aria-label="testup.az ana səhifə">
                        <span className="inline-block transition-transform duration-200 group-hover:scale-[1.03]">
                            <Logo size={36} />
                        </span>
                    </Link>

                    {/* Desktop nav links with sliding indicator */}
                    <div
                        ref={navContainerRef}
                        className="hidden md:flex relative items-center gap-1 bg-[var(--paper-cream)]/70 border border-[var(--ink-150)] rounded-full p-1.5"
                    >
                        {/* Sliding active indicator */}
                        <span
                            aria-hidden="true"
                            className="absolute top-1.5 bottom-1.5 bg-white rounded-full shadow-[var(--sh-sm)] ring-1 ring-[var(--brand-blue-100)] pointer-events-none"
                            style={{
                                left: indicator.left,
                                width: indicator.width,
                                opacity: indicator.opacity,
                                transition: 'left 350ms cubic-bezier(0.32, 0.72, 0, 1), width 350ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease-out',
                            }}
                        />
                        {navLinks.map((link) => {
                            const active = isLinkActive(link);
                            return (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    data-active={active ? 'true' : 'false'}
                                    className={`relative z-10 px-4 py-2 rounded-full text-[13px] font-semibold tracking-tight transition-colors duration-200 ${
                                        active ? 'text-[var(--primary)]' : 'text-[var(--ink-500)] hover:text-[var(--ink-900)]'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="hidden md:flex items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                {/* Notification bell */}
                                <div className="relative" ref={notifDesktopRef}>
                                    <button
                                        onClick={openNotifications}
                                        aria-label="Bildirişlər"
                                        className="relative w-[38px] h-[38px] rounded-full inline-flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] border border-transparent hover:border-[var(--brand-blue-100)] transition-colors"
                                    >
                                        <HiOutlineBell className="h-[18px] w-[18px]" />
                                        {unreadCount > 0 && (
                                            unreadCount > 9 ? (
                                                <span
                                                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full inline-flex items-center justify-center leading-none"
                                                    style={{ boxShadow: '0 0 0 2px var(--paper, white)' }}
                                                >
                                                    9+
                                                </span>
                                            ) : (
                                                <span
                                                    className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
                                                    style={{ boxShadow: '0 0 0 2px white' }}
                                                />
                                            )
                                        )}
                                    </button>

                                    {notifOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-[340px] bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] z-50 overflow-hidden">
                                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--ink-150)]">
                                                <h3 className="font-extrabold text-[var(--ink-900)] text-[14px] tracking-tight inline-flex items-center gap-2">
                                                    <HiOutlineBell className="w-4 h-4 text-[var(--primary)]" />
                                                    Bildirişlər
                                                    {unreadCount > 0 && (
                                                        <span className="text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary-hover)] px-2 py-0.5 rounded-full">{unreadCount}</span>
                                                    )}
                                                </h3>
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={markAllRead}
                                                        className="text-[11.5px] text-[var(--primary)] hover:text-[var(--primary-hover)] font-bold inline-flex items-center gap-1"
                                                    >
                                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Hamısını oxu
                                                    </button>
                                                )}
                                            </div>

                                            <div className="max-h-80 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="py-12 text-center text-[var(--ink-400)]">
                                                        <span className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[var(--ink-50)] inline-flex items-center justify-center">
                                                            <HiOutlineBell className="w-6 h-6 text-[var(--ink-300)]" />
                                                        </span>
                                                        <p className="text-[13px] font-semibold text-[var(--ink-500)]">Bildiriş yoxdur</p>
                                                        <p className="text-[11.5px] text-[var(--ink-400)] mt-0.5">Yeni bildirişlər burada görünəcək</p>
                                                    </div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => markRead(n.id)}
                                                            className={`px-5 py-3 border-b border-[var(--ink-100)] last:border-b-0 cursor-pointer hover:bg-[var(--paper-cream)]/60 transition-colors ${!n.isRead ? 'bg-[var(--primary-soft)]/40' : ''}`}
                                                        >
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.isRead ? 'bg-[var(--primary)]' : 'bg-transparent'}`} />
                                                                <div className="flex-1 min-w-0" onClick={() => {
                                                                    if (n.actionUrl) {
                                                                        navigate(n.actionUrl);
                                                                        setNotifOpen(false);
                                                                    }
                                                                }}>
                                                                    <p className={`text-[13px] font-bold tracking-tight ${!n.isRead ? 'text-[var(--ink-900)]' : 'text-[var(--ink-600)]'}`}>{n.title}</p>
                                                                    <p className="text-[12px] text-[var(--ink-500)] mt-0.5 leading-relaxed">{n.message}</p>
                                                                    <p className="text-[10.5px] text-[var(--ink-400)] mt-1.5 flex items-center gap-2">
                                                                        {fmtTime(n.createdAt)}
                                                                        {n.type && n.type !== 'SYSTEM' && (
                                                                            <span className="bg-[var(--ink-100)] text-[var(--ink-600)] px-1.5 py-0.5 rounded-full uppercase text-[9px] font-bold tracking-wider">
                                                                                {n.type.replace('_', ' ')}
                                                                            </span>
                                                                        )}
                                                                    </p>
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
                                        className="inline-flex items-center gap-2.5 pl-1 pr-3.5 py-1 rounded-full bg-white border border-[var(--ink-200)] hover:border-[var(--ink-300)] hover:bg-[var(--paper-cream)]/60 transition-all"
                                    >
                                        <UserAvatar size="sm" />
                                        <div className="text-left hidden lg:flex flex-col leading-[1.2]">
                                            <span className="text-[12.5px] font-bold text-[var(--ink-900)] tracking-tight">{user?.fullName}</span>
                                            <span className="text-[10.5px] text-[var(--ink-500)] font-medium">
                                                {isAdmin ? 'Admin' : isTeacher ? 'Müəllim' : 'Şagird'}
                                            </span>
                                        </div>
                                        <HiOutlineChevronDown className={`w-3.5 h-3.5 text-[var(--ink-400)] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] z-50 overflow-hidden">
                                            {/* Header — identity */}
                                            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                                                {/* Avatar with role micro-badge */}
                                                <div className="relative shrink-0">
                                                    <UserAvatar size="md" />
                                                    <span
                                                        className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full inline-flex items-center justify-center ring-2 ring-white ${
                                                            isAdmin
                                                                ? 'bg-[var(--brand-green-600)] text-white'
                                                                : isTeacher
                                                                    ? 'bg-[var(--primary)] text-white'
                                                                    : 'bg-[var(--brand-green-600)] text-white'
                                                        }`}
                                                        title={isAdmin ? 'Admin' : isTeacher ? 'Müəllim' : 'Şagird'}
                                                    >
                                                        {isAdmin
                                                            ? <HiOutlineCog className="w-3 h-3" />
                                                            : isTeacher
                                                                ? <HiOutlinePencilAlt className="w-3 h-3" />
                                                                : <HiOutlineAcademicCap className="w-3 h-3" />}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[14px] font-extrabold text-[var(--ink-900)] tracking-tight truncate">{user?.fullName}</p>
                                                    <p className="text-[11.5px] text-[var(--ink-500)] truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="mx-4 h-px bg-[var(--ink-150)]" />

                                            {/* Quick links */}
                                            <div className="px-2 pt-1.5 pb-2 space-y-0.5">
                                                {isAdmin && (
                                                    <Link
                                                        to="/admin"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[var(--brand-green-700)] hover:bg-[var(--brand-green-50)] transition-colors"
                                                    >
                                                        <span className="w-8 h-8 rounded-xl bg-[var(--brand-green-50)] text-[var(--brand-green-600)] inline-flex items-center justify-center shrink-0 group-hover:bg-white">
                                                            <HiOutlineCog className="w-4 h-4" />
                                                        </span>
                                                        <span>Admin Panel</span>
                                                        <HiOutlineChevronDown className="ml-auto -rotate-90 w-3.5 h-3.5 text-[var(--ink-400)] group-hover:text-[var(--brand-green-600)]" />
                                                    </Link>
                                                )}
                                                <Link
                                                    to="/profil"
                                                    onClick={() => setDropdownOpen(false)}
                                                    className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-cream)]/70 hover:text-[var(--primary)] transition-colors"
                                                >
                                                    <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center shrink-0 group-hover:bg-white">
                                                        <HiOutlineUser className="w-4 h-4" />
                                                    </span>
                                                    <span>Profilim</span>
                                                    <HiOutlineChevronDown className="ml-auto -rotate-90 w-3.5 h-3.5 text-[var(--ink-400)] group-hover:text-[var(--primary)]" />
                                                </Link>
                                                {isTeacher && !isAdmin && (
                                                    <Link
                                                        to="/imtahanlar"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-cream)]/70 hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center shrink-0 group-hover:bg-white">
                                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                                        </span>
                                                        <span>İmtahanlarım</span>
                                                        <HiOutlineChevronDown className="ml-auto -rotate-90 w-3.5 h-3.5 text-[var(--ink-400)] group-hover:text-[var(--primary)]" />
                                                    </Link>
                                                )}
                                                {isStudent && (
                                                    <Link
                                                        to="/imtahanlarim"
                                                        onClick={() => setDropdownOpen(false)}
                                                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-cream)]/70 hover:text-[var(--primary)] transition-colors"
                                                    >
                                                        <span className="w-8 h-8 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center shrink-0 group-hover:bg-white">
                                                            <HiOutlineAcademicCap className="w-4 h-4" />
                                                        </span>
                                                        <span>İmtahanlarım</span>
                                                        <HiOutlineChevronDown className="ml-auto -rotate-90 w-3.5 h-3.5 text-[var(--ink-400)] group-hover:text-[var(--primary)]" />
                                                    </Link>
                                                )}
                                            </div>

                                            {/* Logout */}
                                            <div className="px-2 pb-2 pt-1.5 border-t border-[var(--ink-150)]">
                                                <button
                                                    onClick={handleLogout}
                                                    className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <span className="w-8 h-8 rounded-xl bg-red-50 text-red-500 inline-flex items-center justify-center shrink-0 group-hover:bg-white">
                                                        <HiOutlineLogout className="w-4 h-4" />
                                                    </span>
                                                    <span>Çıxış</span>
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
                                    className="h-10 px-4 inline-flex items-center text-[13px] font-semibold text-[var(--ink-700)] hover:text-[var(--primary)] rounded-full transition-colors"
                                >
                                    Daxil ol
                                </Link>
                                <Link
                                    to="/register"
                                    className="h-10 px-5 inline-flex items-center text-[13px] font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full transition-all shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)]"
                                >
                                    Pulsuz başla
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile: bell + menu button */}
                    <div className="md:hidden flex items-center gap-1.5">
                        {isAuthenticated && (
                            <div className="relative" ref={notifMobileRef}>
                                <button
                                    onClick={openNotifications}
                                    aria-label="Bildirişlər"
                                    className="relative w-[38px] h-[38px] rounded-full inline-flex items-center justify-center text-[var(--ink-600)] hover:text-[var(--primary)] hover:bg-[var(--primary-soft)] border border-transparent hover:border-[var(--brand-blue-100)] transition-colors"
                                >
                                    <HiOutlineBell className="h-[18px] w-[18px]" />
                                    {unreadCount > 0 && (
                                        unreadCount > 9 ? (
                                            <span
                                                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold rounded-full inline-flex items-center justify-center leading-none"
                                                style={{ boxShadow: '0 0 0 2px white' }}
                                            >9+</span>
                                        ) : (
                                            <span
                                                className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"
                                                style={{ boxShadow: '0 0 0 2px white' }}
                                            />
                                        )
                                    )}
                                </button>

                                {notifOpen && (
                                    <div className="absolute right-0 top-full mt-3 w-[300px] bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] z-50 overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--ink-150)]">
                                            <h3 className="font-extrabold text-[var(--ink-900)] text-[13.5px] tracking-tight inline-flex items-center gap-2">
                                                <HiOutlineBell className="w-4 h-4 text-[var(--primary)]" />
                                                Bildirişlər
                                            </h3>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-[11px] text-[var(--primary)] font-bold">Hamısını oxu</button>
                                            )}
                                        </div>
                                        <div className="max-h-72 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="py-10 text-center text-[var(--ink-400)] text-[12.5px]">Bildiriş yoxdur</div>
                                            ) : notifications.map(n => (
                                                <div key={n.id} onClick={() => markRead(n.id)}
                                                    className={`px-5 py-3 border-b border-[var(--ink-100)] last:border-b-0 cursor-pointer hover:bg-[var(--paper-cream)]/60 transition-colors ${!n.isRead ? 'bg-[var(--primary-soft)]/40' : ''}`}>
                                                    <div className="flex items-start gap-2">
                                                        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${!n.isRead ? 'bg-[var(--primary)]' : 'bg-transparent'}`} />
                                                        <div className="flex-1 min-w-0" onClick={() => {
                                                            if (n.actionUrl) {
                                                                navigate(n.actionUrl);
                                                                setNotifOpen(false);
                                                                setMobileOpen(false);
                                                            }
                                                        }}>
                                                            <p className="text-[12.5px] font-bold tracking-tight text-[var(--ink-900)]">{n.title}</p>
                                                            <p className="text-[11.5px] text-[var(--ink-500)] mt-0.5">{n.message}</p>
                                                            <p className="text-[10px] text-[var(--ink-400)] mt-1">{fmtTime(n.createdAt)}</p>
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
                            aria-label="Menyu"
                            className="w-[38px] h-[38px] rounded-full inline-flex items-center justify-center text-[var(--ink-600)] hover:bg-[var(--ink-100)] border border-transparent hover:border-[var(--ink-200)] transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-[var(--ink-150)] bg-white">
                    {isAuthenticated && (
                        <div className="flex items-center gap-3 px-4 py-4 bg-[var(--paper-cream)] border-b border-[var(--ink-150)]">
                            <UserAvatar size="md" />
                            <div className="min-w-0">
                                <p className="font-extrabold text-[var(--ink-900)] text-[14px] tracking-tight truncate">{user?.fullName}</p>
                                <p className="text-[11.5px] text-[var(--ink-500)] truncate">{user?.email}</p>
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
                                    `block px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors ${isActive
                                        ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
                                        : 'text-[var(--ink-600)] hover:bg-[var(--ink-100)] hover:text-[var(--ink-900)]'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}

                        {isAuthenticated ? (
                            <div className="border-t border-[var(--ink-150)] pt-2 mt-2 space-y-0.5">
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-bold text-[var(--brand-green-700)] hover:bg-[var(--brand-green-50)] transition-colors"
                                    >
                                        <HiOutlineCog className="w-4 h-4" /> Admin Panel
                                    </Link>
                                )}
                                <Link
                                    to="/profil"
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-cream)] hover:text-[var(--primary)] transition-colors"
                                >
                                    <HiOutlineUser className="w-4 h-4" /> Profilim
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <HiOutlineLogout className="w-4 h-4" /> Çıxış
                                </button>
                            </div>
                        ) : (
                            <div className="border-t border-[var(--ink-150)] pt-2 mt-2 space-y-1.5">
                                <Link to="/login" onClick={() => setMobileOpen(false)}
                                    className="block h-11 px-4 inline-flex items-center rounded-full text-[13px] font-semibold text-[var(--ink-700)] hover:bg-[var(--ink-100)]">
                                    Daxil ol
                                </Link>
                                <Link to="/register" onClick={() => setMobileOpen(false)}
                                    className="block h-11 inline-flex items-center justify-center rounded-full text-[13px] font-bold bg-[var(--primary)] text-white text-center hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors w-full">
                                    Pulsuz başla
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
