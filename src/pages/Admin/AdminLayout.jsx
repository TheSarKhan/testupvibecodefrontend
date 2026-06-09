import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineChartBar, HiOutlineUsers, HiOutlineDocumentText, HiOutlineArrowLeft, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineTemplate, HiOutlineCurrencyDollar, HiOutlineSpeakerphone, HiOutlineBell, HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineMenu, HiOutlineX, HiOutlineMail, HiOutlineTrendingUp, HiOutlineTag, HiOutlineSearch } from 'react-icons/hi';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { adminKeys } from '../../hooks/admin/queryKeys';
import CommandPalette from '../../components/admin/CommandPalette';

const navGroups = [
    {
        label: 'Ümumi',
        items: [
            { to: '/admin', label: 'Dashboard', icon: HiOutlineChartBar, end: true },
            { to: '/admin/users', label: 'İstifadəçilər', icon: HiOutlineUsers },
            { to: '/admin/mesajlar', label: 'Əlaqə Mesajları', icon: HiOutlineMail, badge: 'contact' },
            { to: '/admin/bildirişlər', label: 'Bildirişlər', icon: HiOutlineBell },
            { to: '/admin/loglar', label: 'Loglar', icon: HiOutlineClipboardList },
        ],
    },
    {
        label: 'İmtahan İdarəsi',
        items: [
            { to: '/admin/oz-imtahanlar', label: 'Öz İmtahanlarım', icon: HiOutlineDocumentText },
            { to: '/admin/birge-imtahanlar', label: 'Birgə İmtahanlar', icon: HiOutlineUserGroup },
            { to: '/admin/muellim-imtahanlar', label: 'Müəllim İmtahanları', icon: HiOutlineAcademicCap },
            { to: '/admin/fennler', label: 'Fənnlər & Teqlər', icon: HiOutlineBookOpen },
            { to: '/admin/sablonlar', label: 'Şablonlar', icon: HiOutlineTemplate },
            { to: '/admin/sual-bazasi', label: 'Sual Bazası', icon: HiOutlineBookOpen },
        ],
    },
    {
        label: 'Kontent & Maliyyə',
        items: [
            { to: '/admin/reklamlar', label: 'Reklamlar', icon: HiOutlineSpeakerphone },
            { to: '/admin/planlar', label: 'Abunəlik Planları', icon: HiOutlineCurrencyDollar },
            { to: '/admin/qazanc', label: 'Qazanc Statistikası', icon: HiOutlineTrendingUp },
        ],
    },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Global Cmd+K / Ctrl+K
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const { data: pendingData } = useQuery({
        queryKey: adminKeys.collaborativeExamsPendingCount,
        queryFn: () => api.get('/admin/collaborative-exams/pending-count').then(r => r.data),
        refetchInterval: 60_000,
    });
    const { data: unreadData } = useQuery({
        queryKey: adminKeys.contactMessagesUnreadCount,
        queryFn: () => api.get('/admin/contact-messages/unread-count').then(r => r.data),
        refetchInterval: 60_000,
    });
    const pendingCount = pendingData?.count ?? 0;
    const unreadContactCount = unreadData?.count ?? 0;

    const SidebarContent = () => (
        <>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <span className="text-lg font-extrabold text-blue-700 tracking-tight">testup.az</span>
                    <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
            <button
                onClick={() => setPaletteOpen(true)}
                className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
                <HiOutlineSearch className="w-4 h-4" />
                <span className="flex-1 text-left">Tez axtar...</span>
            </button>
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
                {navGroups.map(group => (
                    <div key={group.label}>
                        <p className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.label}</p>
                        <div className="space-y-0.5">
                            {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`
                                    }
                                >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{label}</span>
                                    {to === '/admin/birge-imtahanlar' && pendingCount > 0 && (
                                        <span className="h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {pendingCount > 9 ? '9+' : pendingCount}
                                        </span>
                                    )}
                                    {badge === 'contact' && unreadContactCount > 0 && (
                                        <span className="h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadContactCount > 9 ? '9+' : unreadContactCount}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-3 py-2.5 w-full text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                    <HiOutlineArrowLeft className="w-4 h-4" />
                    Sayta qayıt
                </button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — hidden on mobile, slide-in when open */}
            <aside className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm transform transition-transform duration-200
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <SidebarContent />
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <HiOutlineMenu className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-bold text-blue-700">Admin Panel</span>
                </div>
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
};

export default AdminLayout;
