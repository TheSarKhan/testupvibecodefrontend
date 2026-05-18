import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    HiOutlineSearch, HiOutlineUsers, HiOutlineChartBar,
    HiOutlineDocumentText, HiOutlineCurrencyDollar, HiOutlineBookOpen,
    HiOutlineSpeakerphone, HiOutlineMail, HiOutlineClipboardList,
    HiOutlineTemplate, HiOutlineTag, HiOutlineUserGroup,
} from 'react-icons/hi';
import api from '../../api/axios';

const PAGE_LINKS = [
    { id: 'page-dashboard',     label: 'Dashboard',           path: '/admin',                       icon: HiOutlineChartBar,       keywords: 'dashboard ana' },
    { id: 'page-users',         label: 'İstifadəçilər',       path: '/admin/users',                 icon: HiOutlineUsers,          keywords: 'users istifadeci' },
    { id: 'page-contact',       label: 'Əlaqə Mesajları',     path: '/admin/mesajlar',              icon: HiOutlineMail,           keywords: 'contact mesaj' },
    { id: 'page-notifications', label: 'Bildirişlər',          path: '/admin/bildirişlər',           icon: HiOutlineSpeakerphone,   keywords: 'notification bildiris' },
    { id: 'page-logs',          label: 'Loglar',               path: '/admin/loglar',                icon: HiOutlineClipboardList,  keywords: 'log audit' },
    { id: 'page-revenue',       label: 'Qazanc Hesabatı',     path: '/admin/qazanc',                icon: HiOutlineCurrencyDollar, keywords: 'revenue qazanc pul' },
    { id: 'page-exams',         label: 'Müəllim İmtahanları', path: '/admin/muellim-imtahanlar',    icon: HiOutlineDocumentText,   keywords: 'exam imtahan muellim' },
    { id: 'page-my-exams',      label: 'Öz İmtahanlarım',     path: '/admin/oz-imtahanlar',         icon: HiOutlineDocumentText,   keywords: 'my exam menim oz' },
    { id: 'page-templates',     label: 'Şablonlar',            path: '/admin/sablonlar',             icon: HiOutlineTemplate,       keywords: 'template sablon' },
    { id: 'page-subjects',      label: 'Fənnlər & Teqlər',    path: '/admin/fennler',               icon: HiOutlineBookOpen,       keywords: 'subject fen teq tag' },
    { id: 'page-bank',          label: 'Sual Bazası',          path: '/admin/sual-bazasi',           icon: HiOutlineBookOpen,       keywords: 'bank sual question' },
    { id: 'page-banners',       label: 'Reklamlar',            path: '/admin/reklamlar',             icon: HiOutlineSpeakerphone,   keywords: 'banner reklam' },
    { id: 'page-plans',         label: 'Abunəlik Planları',   path: '/admin/planlar',               icon: HiOutlineCurrencyDollar, keywords: 'plan subscription abuneli' },
    { id: 'page-collab',        label: 'Birgə İmtahanlar',    path: '/admin/birge-imtahanlar',      icon: HiOutlineUserGroup,      keywords: 'collaborative birge' },
];

const CommandPalette = ({ open, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);

    const trimmed = query.trim();

    // Live search users/exams only when query is non-trivial
    const { data: usersData } = useQuery({
        queryKey: ['palette', 'users', trimmed],
        queryFn: () => api.get(`/admin/users?search=${encodeURIComponent(trimmed)}&size=5`).then(r => r.data),
        enabled: open && trimmed.length >= 2,
        staleTime: 30_000,
    });
    const { data: examsData } = useQuery({
        queryKey: ['palette', 'exams', trimmed],
        queryFn: () => api.get(`/admin/exams?search=${encodeURIComponent(trimmed)}&size=5`).then(r => r.data),
        enabled: open && trimmed.length >= 2,
        staleTime: 30_000,
    });

    const items = useMemo(() => {
        const lower = trimmed.toLowerCase();
        const pages = lower
            ? PAGE_LINKS.filter(p => p.label.toLowerCase().includes(lower) || p.keywords.includes(lower))
            : PAGE_LINKS;
        const userItems = (usersData?.content ?? []).map(u => ({
            id: `user-${u.id}`,
            label: u.fullName || u.email,
            sublabel: u.email,
            section: 'İstifadəçi',
            icon: HiOutlineUsers,
            action: () => navigate(`/admin/users?focus=${u.id}`),
        }));
        const examItems = (examsData?.content ?? []).map(e => ({
            id: `exam-${e.id}`,
            label: e.title,
            sublabel: e.teacherName,
            section: 'İmtahan',
            icon: HiOutlineDocumentText,
            action: () => navigate(`/admin/muellim-imtahanlar?focus=${e.id}`),
        }));
        const pageItems = pages.map(p => ({
            id: p.id,
            label: p.label,
            section: 'Səhifə',
            icon: p.icon,
            action: () => navigate(p.path),
        }));
        return [...pageItems, ...userItems, ...examItems];
    }, [trimmed, usersData, examsData, navigate]);

    useEffect(() => { setActiveIdx(0); }, [trimmed, open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, items.length - 1)); }
            else if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const item = items[activeIdx];
                if (item) { item.action(); onClose(); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, items, activeIdx, onClose]);

    if (!open) return null;

    let lastSection = null;
    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[70vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <HiOutlineSearch className="w-5 h-5 text-gray-400 shrink-0" />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Səhifə, istifadəçi, imtahan axtar..."
                        className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
                    />
                    <kbd className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">ESC</kbd>
                </div>
                <div className="overflow-y-auto flex-1">
                    {items.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-12">Heç bir nəticə yoxdur</p>
                    ) : items.map((item, idx) => {
                        const Icon = item.icon;
                        const showSection = item.section !== lastSection;
                        lastSection = item.section;
                        return (
                            <div key={item.id}>
                                {showSection && (
                                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.section}</p>
                                )}
                                <button
                                    onClick={() => { item.action(); onClose(); }}
                                    onMouseEnter={() => setActiveIdx(idx)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                        idx === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 shrink-0 ${idx === activeIdx ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${idx === activeIdx ? 'text-blue-700' : 'text-gray-800'}`}>{item.label}</p>
                                        {item.sublabel && (
                                            <p className="text-xs text-gray-400 truncate">{item.sublabel}</p>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
                <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 flex items-center gap-3">
                    <span className="flex items-center gap-1"><kbd className="font-bold bg-gray-100 px-1.5 py-0.5 rounded">↑↓</kbd> naviqasiya</span>
                    <span className="flex items-center gap-1"><kbd className="font-bold bg-gray-100 px-1.5 py-0.5 rounded">↵</kbd> aç</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
