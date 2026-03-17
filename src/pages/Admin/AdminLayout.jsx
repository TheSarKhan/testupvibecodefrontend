import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { HiOutlineChartBar, HiOutlineUsers, HiOutlineDocumentText, HiOutlineArrowLeft, HiOutlineAcademicCap, HiOutlineBookOpen, HiOutlineTemplate, HiOutlineCurrencyDollar, HiOutlineSpeakerphone, HiOutlineBell, HiOutlineUserGroup } from 'react-icons/hi';

const navGroups = [
    {
        label: 'Ümumi',
        items: [
            { to: '/admin', label: 'Dashboard', icon: HiOutlineChartBar, end: true },
            { to: '/admin/users', label: 'İstifadəçilər', icon: HiOutlineUsers },
            { to: '/admin/bildirişlər', label: 'Bildirişlər', icon: HiOutlineBell },
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
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 shrink-0 bg-white border-r border-gray-100 flex flex-col shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                    <span className="text-lg font-extrabold text-indigo-700 tracking-tight">testup.az</span>
                    <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
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
                                        {label}
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
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
