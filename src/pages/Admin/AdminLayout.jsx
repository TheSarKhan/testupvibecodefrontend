import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineChartBar, HiOutlineUsers, HiOutlineDocumentText, HiOutlineArrowLeft, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineTemplate, HiOutlineCurrencyDollar, HiOutlineSpeakerphone, HiOutlineBell, HiOutlineUserGroup, HiOutlineClipboardList, HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import api from '../../api/axios';

const navGroups = [
    {
        label: 'Ümumi',
        items: [
            { to: '/admin', label: 'Dashboard', icon: HiOutlineChartBar, end: true },
            { to: '/admin/users', label: 'İstifadəçilər', icon: HiOutlineUsers },
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
            { to: '/admin/fennler', label: 'Fənnlər', icon: HiOutlineBookOpen },
            { to: '/admin/sablonlar', label: 'Şablonlar', icon: HiOutlineTemplate },
            { to: '/admin/sual-bazasi', label: 'Sual Bazası', icon: HiOutlineBookOpen },
        ],
    },
    {
        label: 'Kontent & Maliyyə',
        items: [
            { to: '/admin/reklamlar', label: 'Reklamlar', icon: HiOutlineSpeakerphone },
            { to: '/admin/planlar', label: 'Abunəlik Planları', icon: HiOutlineCurrencyDollar },
        ],
    },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    useEffect(() => {
        const fetchPending = () => {
            api.get('/admin/collaborative-exams/pending-count')
                .then(r => setPendingCount(r.data.count || 0))
                .catch(() => {});
        };
        fetchPending();
        const interval = setInterval(fetchPending, 60000);
        return () => clearInterval(interval);
    }, []);

    const SidebarContent = () => (
        <>
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <span className="text-lg font-extrabold text-indigo-700 tracking-tight">testup.az</span>
                    <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                    <HiOutlineX className="w-5 h-5" />
                </button>
            </div>
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
                {navGroups.map(group => (
                    <div key={group.label}>
                        <p className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.label}</p>
                        <div className="space-y-0.5">
                            {group.items.map(({ to, label, icon: Icon, end }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isActive
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
                                </NavLink>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
            <div className="p-3 border-t border-gray-100">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-3 py-2.5 w-full text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors font-medium"
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
            <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm transform transition-transform duration-200
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
                    <span className="text-sm font-bold text-indigo-700">Admin Panel</span>
                </div>
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
