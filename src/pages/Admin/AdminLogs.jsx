import { useState, useEffect } from 'react';
import {
    HiOutlineClipboardList,
    HiOutlineSearch,
    HiOutlineRefresh,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    // Auth
    HiOutlineLogin,
    HiOutlineUserAdd,
    HiOutlineKey,
    HiOutlineExclamationCircle,
    // User
    HiOutlineShieldCheck,
    HiOutlineSwitchVertical,
    HiOutlineUserGroup,
    HiOutlineTrash,
    // Exam
    HiOutlineDocumentAdd,
    HiOutlinePencilAlt,
    HiOutlineDocumentRemove,
    HiOutlineGlobeAlt,
    HiOutlineEyeOff,
    HiOutlineCurrencyDollar,
    HiOutlinePlay,
    HiOutlineCheckCircle,
    HiOutlineClipboardCheck,
    HiOutlineUsers,
    HiOutlineUpload,
    HiOutlineDownload,
    HiOutlineXCircle,
    // Content
    HiOutlineBookOpen,
    HiOutlineHashtag,
    HiOutlinePhotograph,
    HiOutlineTag,
    HiOutlineTemplate,
    HiOutlineCollection,
    HiOutlineViewGridAdd,
    HiOutlineDatabase,
    HiOutlineMail,
    HiOutlineBell,
    // AI
    HiOutlineSparkles,
    // Payment
    HiOutlineCreditCard,
    HiOutlineCash,
    HiOutlineReceiptRefund,
    HiOutlineGift,
    // System
    HiOutlineCog,
} from 'react-icons/hi';
import { useAdminLogs } from '../../hooks/admin/useAdminLogs';
import Pagination from '../../components/admin/Pagination';

// ─── Action metadata: icon + label + intent color ──────────────────────────
// intent: emerald (create/success) | blue (update) | rose (delete/fail) |
//         violet (submit/send) | amber (warn/system) | indigo (auth) | fuchsia (ai)

const ACTION_META = {
    // Auth
    USER_LOGIN:                       { icon: HiOutlineLogin,             label: 'Giriş',                       intent: 'indigo' },
    USER_LOGIN_FAILED:                { icon: HiOutlineExclamationCircle, label: 'Giriş uğursuz',               intent: 'rose'   },
    USER_REGISTERED:                  { icon: HiOutlineUserAdd,           label: 'Qeydiyyat',                   intent: 'emerald'},
    PASSWORD_CHANGED:                 { icon: HiOutlineKey,               label: 'Şifrə dəyişdirildi',          intent: 'blue'   },
    PASSWORD_RESET_REQUESTED:         { icon: HiOutlineKey,               label: 'Şifrə sıfırlama tələbi',      intent: 'amber'  },
    PASSWORD_RESET_COMPLETED:         { icon: HiOutlineKey,               label: 'Şifrə sıfırlandı',            intent: 'blue'   },

    // User management
    USER_ROLE_CHANGED:                { icon: HiOutlineShieldCheck,       label: 'Rol dəyişdirildi',            intent: 'blue'   },
    USER_DELETED:                     { icon: HiOutlineTrash,             label: 'İstifadəçi silindi',          intent: 'rose'   },
    USER_TOGGLED:                     { icon: HiOutlineSwitchVertical,    label: 'Status dəyişdi',              intent: 'blue'   },
    USER_EXAM_ASSIGNED:               { icon: HiOutlineUserGroup,         label: 'İmtahan təyin edildi',        intent: 'emerald'},

    // Exam lifecycle
    EXAM_CREATED:                     { icon: HiOutlineDocumentAdd,       label: 'İmtahan yaradıldı',           intent: 'emerald'},
    EXAM_UPDATED:                     { icon: HiOutlinePencilAlt,         label: 'İmtahan yeniləndi',           intent: 'blue'   },
    EXAM_DELETED:                     { icon: HiOutlineDocumentRemove,    label: 'İmtahan silindi',             intent: 'rose'   },
    EXAM_STATUS_CHANGED:              { icon: HiOutlineRefresh,           label: 'İmtahan statusu dəyişdi',     intent: 'blue'   },
    EXAM_SITE_PUBLISHED:              { icon: HiOutlineGlobeAlt,          label: 'Saytda paylaşıldı',           intent: 'emerald'},
    EXAM_SITE_UNPUBLISHED:            { icon: HiOutlineEyeOff,            label: 'Saytdan çıxarıldı',           intent: 'rose'   },
    EXAM_PRICE_CHANGED:               { icon: HiOutlineCurrencyDollar,    label: 'Qiymət dəyişdirildi',         intent: 'blue'   },
    EXAM_ACCESS_CODE_GENERATED:       { icon: HiOutlineKey,               label: 'Giriş kodu yaradıldı',        intent: 'indigo' },
    EXAM_PURCHASED:                   { icon: HiOutlineDocumentAdd,       label: 'İmtahan alındı',              intent: 'emerald'},
    EXAM_PDF_DOWNLOADED:              { icon: HiOutlineDownload,          label: 'PDF endirildi',               intent: 'amber'  },
    EXAM_RESULTS_EXPORTED:            { icon: HiOutlineDownload,          label: 'Nəticələr ixrac edildi',      intent: 'amber'  },

    // Exam session
    EXAM_STARTED:                     { icon: HiOutlinePlay,              label: 'İmtahan başlandı',            intent: 'violet' },
    EXAM_SUBMITTED:                   { icon: HiOutlineCheckCircle,       label: 'İmtahan təhvil verildi',      intent: 'emerald'},

    // Submission / grading
    SUBMISSION_MANUAL_GRADED:         { icon: HiOutlineClipboardCheck,    label: 'Əl ilə yoxlandı',             intent: 'blue'   },
    SUBMISSION_HIDDEN:                { icon: HiOutlineEyeOff,            label: 'Nəticə gizlədildi',           intent: 'rose'   },

    // Collaborative
    COLLABORATIVE_EXAM_CREATED:       { icon: HiOutlineUsers,             label: 'Birgə imtahan yaradıldı',     intent: 'emerald'},
    COLLABORATIVE_COLLABORATOR_ADDED: { icon: HiOutlineUserAdd,           label: 'Müəllim əlavə edildi',        intent: 'emerald'},
    COLLABORATIVE_DRAFT_SUBMITTED:    { icon: HiOutlineUpload,            label: 'Suallar göndərildi',          intent: 'violet' },
    COLLABORATIVE_DRAFT_APPROVED:     { icon: HiOutlineCheckCircle,       label: 'Suallar təsdiqləndi',         intent: 'emerald'},
    COLLABORATIVE_DRAFT_REJECTED:     { icon: HiOutlineXCircle,           label: 'Suallar geri qaytarıldı',     intent: 'rose'   },

    // Subject / Topic
    SUBJECT_ADDED:                    { icon: HiOutlineBookOpen,          label: 'Fənn əlavə edildi',           intent: 'emerald'},
    SUBJECT_UPDATED:                  { icon: HiOutlineBookOpen,          label: 'Fənn yeniləndi',              intent: 'blue'   },
    SUBJECT_DELETED:                  { icon: HiOutlineBookOpen,          label: 'Fənn silindi',                intent: 'rose'   },
    TOPIC_ADDED:                      { icon: HiOutlineHashtag,           label: 'Mövzu əlavə edildi',          intent: 'emerald'},
    TOPIC_DELETED:                    { icon: HiOutlineHashtag,           label: 'Mövzu silindi',               intent: 'rose'   },

    // Banner
    BANNER_CREATED:                   { icon: HiOutlinePhotograph,        label: 'Banner yaradıldı',            intent: 'emerald'},
    BANNER_UPDATED:                   { icon: HiOutlinePhotograph,        label: 'Banner yeniləndi',            intent: 'blue'   },
    BANNER_DELETED:                   { icon: HiOutlinePhotograph,        label: 'Banner silindi',              intent: 'rose'   },

    // Tag
    TAG_CREATED:                      { icon: HiOutlineTag,               label: 'Teq yaradıldı',               intent: 'emerald'},
    TAG_DELETED:                      { icon: HiOutlineTag,               label: 'Teq silindi',                 intent: 'rose'   },

    // Template / Subtitle / Section
    TEMPLATE_CREATED:                 { icon: HiOutlineTemplate,          label: 'Şablon yaradıldı',            intent: 'emerald'},
    TEMPLATE_UPDATED:                 { icon: HiOutlineTemplate,          label: 'Şablon yeniləndi',            intent: 'blue'   },
    TEMPLATE_DELETED:                 { icon: HiOutlineTemplate,          label: 'Şablon silindi',              intent: 'rose'   },
    TEMPLATE_SUBTITLE_CREATED:        { icon: HiOutlineCollection,        label: 'Altbaşlıq yaradıldı',         intent: 'emerald'},
    TEMPLATE_SUBTITLE_UPDATED:        { icon: HiOutlineCollection,        label: 'Altbaşlıq yeniləndi',         intent: 'blue'   },
    TEMPLATE_SUBTITLE_DELETED:        { icon: HiOutlineCollection,        label: 'Altbaşlıq silindi',           intent: 'rose'   },
    TEMPLATE_SECTION_CREATED:         { icon: HiOutlineViewGridAdd,       label: 'Bölmə yaradıldı',             intent: 'emerald'},
    TEMPLATE_SECTION_UPDATED:         { icon: HiOutlineViewGridAdd,       label: 'Bölmə yeniləndi',             intent: 'blue'   },
    TEMPLATE_SECTION_DELETED:         { icon: HiOutlineViewGridAdd,       label: 'Bölmə silindi',               intent: 'rose'   },

    // Question Bank
    BANK_SUBJECT_CREATED:             { icon: HiOutlineDatabase,          label: 'Bank fənni yaradıldı',        intent: 'emerald'},
    BANK_SUBJECT_UPDATED:             { icon: HiOutlineDatabase,          label: 'Bank fənni yeniləndi',        intent: 'blue'   },
    BANK_SUBJECT_DELETED:             { icon: HiOutlineDatabase,          label: 'Bank fənni silindi',          intent: 'rose'   },
    BANK_QUESTION_CREATED:            { icon: HiOutlineDatabase,          label: 'Bank sualı yaradıldı',        intent: 'emerald'},
    BANK_QUESTION_UPDATED:            { icon: HiOutlineDatabase,          label: 'Bank sualı yeniləndi',        intent: 'blue'   },
    BANK_QUESTION_DELETED:            { icon: HiOutlineDatabase,          label: 'Bank sualı silindi',          intent: 'rose'   },

    // AI
    AI_QUESTIONS_GENERATED:           { icon: HiOutlineSparkles,          label: 'AI sual generasiyası',        intent: 'fuchsia'},
    AI_EXAM_GENERATED:                { icon: HiOutlineSparkles,          label: 'AI imtahan generasiyası',     intent: 'fuchsia'},

    // Contact
    CONTACT_READ:                     { icon: HiOutlineMail,              label: 'Mesaj oxundu',                intent: 'blue'   },
    CONTACT_REPLIED:                  { icon: HiOutlineMail,              label: 'Mesaja cavab verildi',        intent: 'violet' },
    CONTACT_DELETED:                  { icon: HiOutlineMail,              label: 'Mesaj silindi',               intent: 'rose'   },

    // Notification
    NOTIFICATION_SENT:                { icon: HiOutlineBell,              label: 'Bildiriş göndərildi',         intent: 'violet' },

    // Payment / Subscription
    SUBSCRIPTION_PURCHASED:           { icon: HiOutlineCreditCard,        label: 'Abunəlik alındı',             intent: 'emerald'},
    SUBSCRIPTION_SWITCHED:            { icon: HiOutlineReceiptRefund,     label: 'Plan dəyişdirildi',           intent: 'blue'   },
    SUBSCRIPTION_ASSIGNED_MANUAL:     { icon: HiOutlineShieldCheck,       label: 'Plan əl ilə təyin edildi',    intent: 'emerald'},
    SUBSCRIPTION_CANCELLED:           { icon: HiOutlineXCircle,           label: 'Abunəlik ləğv edildi',        intent: 'rose'   },
    SUBSCRIPTION_GIFTED:              { icon: HiOutlineGift,              label: 'Hədiyyə plan verildi',        intent: 'fuchsia'},
    PLAN_CREATED:                     { icon: HiOutlineCash,              label: 'Plan yaradıldı',              intent: 'emerald'},
    PLAN_UPDATED:                     { icon: HiOutlineCash,              label: 'Plan yeniləndi',              intent: 'blue'   },
    PLAN_DELETED:                     { icon: HiOutlineCash,              label: 'Plan silindi',                intent: 'rose'   },

    // System
    SYSTEM_ERROR:                     { icon: HiOutlineCog,               label: 'Sistem xətası',               intent: 'amber'  },
};

// Intent → tailwind classes for the icon circle + badge
const INTENT_STYLES = {
    emerald: { circle: 'bg-emerald-50 text-emerald-600 ring-emerald-100', badge: 'bg-emerald-50 text-emerald-700' },
    blue:    { circle: 'bg-blue-50 text-blue-600 ring-blue-100',          badge: 'bg-blue-50 text-blue-700' },
    indigo:  { circle: 'bg-indigo-50 text-indigo-600 ring-indigo-100',    badge: 'bg-indigo-50 text-indigo-700' },
    violet:  { circle: 'bg-violet-50 text-violet-600 ring-violet-100',    badge: 'bg-violet-50 text-violet-700' },
    rose:    { circle: 'bg-rose-50 text-rose-600 ring-rose-100',          badge: 'bg-rose-50 text-rose-700' },
    amber:   { circle: 'bg-amber-50 text-amber-600 ring-amber-100',       badge: 'bg-amber-50 text-amber-700' },
    fuchsia: { circle: 'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100', badge: 'bg-fuchsia-50 text-fuchsia-700' },
    gray:    { circle: 'bg-gray-100 text-gray-500 ring-gray-100',         badge: 'bg-gray-100 text-gray-600' },
};

const CATEGORIES = [
    { key: 'ALL',     label: 'Hamısı' },
    { key: 'AUTH',    label: 'Giriş/Çıxış' },
    { key: 'USER',    label: 'İstifadəçi' },
    { key: 'EXAM',    label: 'İmtahan' },
    { key: 'CONTENT', label: 'Kontent' },
    { key: 'AI',      label: 'AI' },
    { key: 'PAYMENT', label: 'Ödəniş' },
    { key: 'SYSTEM',  label: 'Sistem' },
];

const CATEGORY_STYLES = {
    AUTH:    'bg-indigo-100 text-indigo-700',
    USER:    'bg-purple-100 text-purple-700',
    EXAM:    'bg-blue-100 text-blue-700',
    CONTENT: 'bg-teal-100 text-teal-700',
    AI:      'bg-fuchsia-100 text-fuchsia-700',
    PAYMENT: 'bg-emerald-100 text-emerald-700',
    SYSTEM:  'bg-amber-100 text-amber-700',
};

const PERIODS = [
    { key: '',      label: 'Hamısı' },
    { key: 'TODAY', label: 'Bu gün' },
    { key: 'WEEK',  label: 'Bu həftə' },
    { key: 'MONTH', label: 'Bu ay' },
];

const relativeTime = (isoStr) => {
    if (!isoStr) return '';
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'İndicə';
    if (mins < 60) return `${mins} dəq əvvəl`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat əvvəl`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Dünən';
    return `${days} gün əvvəl`;
};

const formatExact = (isoStr) => {
    if (!isoStr) return '';
    try {
        return new Date(isoStr).toLocaleString('az-AZ', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch {
        return isoStr;
    }
};

const SkeletonRow = () => (
    <div className="flex items-center gap-4 px-6 py-4 animate-pulse">
        <div className="w-10 h-10 bg-gray-100 rounded-xl" />
        <div className="flex-1 space-y-2">
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="w-56 h-3 bg-gray-100 rounded" />
        </div>
        <div className="w-20 h-3 bg-gray-100 rounded" />
    </div>
);

const AdminLogs = () => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [period, setPeriod] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [actor, setActor] = useState('');
    const [debouncedActor, setDebouncedActor] = useState('');
    const [page, setPage] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedActor(actor);
            setPage(0);
        }, 400);
        return () => clearTimeout(timer);
    }, [actor]);

    const { data, isFetching, refetch } = useAdminLogs({
        search: debouncedSearch,
        period,
        category: activeCategory,
        actor: debouncedActor,
        page,
        size: 30,
    });
    const logs = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;
    const loading = isFetching;
    const fetchLogs = refetch;

    const handlePeriodChange = (p) => {
        setPeriod(p);
        setPage(0);
    };

    const handleCategoryChange = (cat) => {
        setActiveCategory(cat);
        setPage(0);
    };

    const filteredLogs = logs;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Loglar</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Sistem əməliyyatlarının tam tarixçəsi</p>
                </div>
                <button
                    onClick={fetchLogs}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                    <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Yenilə
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4">
                {/* Search + Period bar */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="relative flex-1 max-w-sm">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="E-poçt, ad, hədəf axtar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => handlePeriodChange(p.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                                    period === p.key
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {totalElements > 0 && (
                        <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                            {totalElements} qeyd
                        </span>
                    )}
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => handleCategoryChange(cat.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                                activeCategory === cat.key
                                    ? cat.key === 'ALL'
                                        ? 'bg-gray-800 text-white'
                                        : `${CATEGORY_STYLES[cat.key]} ring-1 ring-inset ring-current`
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Advanced filters */}
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <input
                            type="text"
                            placeholder="Actor email filter..."
                            value={actor}
                            onChange={e => setActor(e.target.value)}
                            className="w-full pl-3 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
                        />
                    </div>
                    {actor && (
                        <button onClick={() => setActor('')} className="text-xs text-gray-400 hover:text-gray-700">
                            Təmizlə
                        </button>
                    )}
                </div>
            </div>

            {/* Log List */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-gray-50">
                        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <HiOutlineClipboardList className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-700 font-semibold text-base">Heç bir log tapılmadı</p>
                        <p className="text-gray-400 text-sm mt-1">Seçilmiş filtrə uyğun qeyd yoxdur</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredLogs.map(log => (
                            <LogRow key={log.id} log={log} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalElements > 0 && (
                <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
            )}
        </div>
    );
};

const tryParseJson = (str) => {
    if (!str || typeof str !== 'string') return null;
    const trimmed = str.trim();
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;
    try { return JSON.parse(trimmed); } catch { return null; }
};

const DetailsViewer = ({ details }) => {
    const parsed = tryParseJson(details);
    if (parsed) {
        return (
            <pre className="text-xs bg-gray-900 text-emerald-200 p-3 rounded-lg overflow-x-auto font-mono max-h-80">
{JSON.stringify(parsed, null, 2)}
            </pre>
        );
    }
    const kvPattern = /([A-Za-zƏəĞğİıÖöÜüÇçŞş\s]+):\s*([^,\n]+)/g;
    if (details.includes(':') && (details.includes(',') || details.length < 200)) {
        const parts = [];
        let m;
        while ((m = kvPattern.exec(details)) !== null) {
            parts.push({ key: m[1].trim(), value: m[2].trim() });
        }
        if (parts.length > 1) {
            return (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                    {parts.map((p, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-xs">
                            <span className="font-semibold text-gray-600 shrink-0">{p.key}:</span>
                            <span className="text-gray-800 font-mono">{p.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
    }
    return (
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap break-words font-mono">
            {details}
        </div>
    );
};

const LogRow = ({ log }) => {
    const [expanded, setExpanded] = useState(false);
    const meta = ACTION_META[log.action] || {
        icon: HiOutlineCog,
        label: log.action,
        intent: 'gray',
    };
    const Icon = meta.icon;
    const styles = INTENT_STYLES[meta.intent] || INTENT_STYLES.gray;
    const hasDetails = log.details && log.details.trim().length > 0;

    return (
        <div className="px-6 py-4 hover:bg-gray-50/60 transition-colors">
            <div
                onClick={() => hasDetails && setExpanded(!expanded)}
                className={`flex items-start gap-4 ${hasDetails ? 'cursor-pointer' : ''}`}
            >
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${styles.circle}`}>
                    <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md ${styles.badge}`}>
                            {meta.label}
                        </span>
                        <span className="text-sm font-semibold text-gray-800 truncate">
                            {log.actorName || log.actorEmail || '—'}
                        </span>
                        {log.actorEmail && log.actorName && log.actorEmail !== log.actorName && (
                            <span className="text-xs text-gray-400 truncate">{log.actorEmail}</span>
                        )}
                        {log.targetType && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wide">
                                {log.targetType}
                            </span>
                        )}
                    </div>
                    {log.targetName && (
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                            {log.targetName}
                        </p>
                    )}
                    {hasDetails && !expanded && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {log.details}
                        </p>
                    )}
                </div>

                <div className="flex-shrink-0 text-right flex items-center gap-2">
                    {hasDetails && (
                        <span className="text-[10px] text-indigo-500 font-semibold">
                            {expanded ? '▲' : '▼'}
                        </span>
                    )}
                    <span
                        className="text-xs text-gray-400 cursor-default"
                        title={formatExact(log.createdAt)}
                    >
                        {relativeTime(log.createdAt)}
                    </span>
                </div>
            </div>

            {hasDetails && expanded && (
                <div className="mt-3 pl-14">
                    <DetailsViewer details={log.details} />
                </div>
            )}
        </div>
    );
};

export default AdminLogs;
