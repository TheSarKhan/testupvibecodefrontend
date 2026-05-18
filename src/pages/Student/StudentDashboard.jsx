import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineClipboardList, HiOutlineClock, HiOutlineBookmark,
    HiOutlineArrowRight, HiOutlineCalendar, HiOutlineAcademicCap,
    HiOutlineStar, HiOutlineLockClosed, HiOutlinePencilAlt,
    HiOutlineSearch, HiOutlineLibrary, HiOutlineChartBar,
    HiOutlineFire, HiOutlineCheck, HiOutlineFlag, HiOutlineLightningBolt,
    HiOutlineSparkles, HiOutlineEye,
} from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { fmtDate, fmtDateShort } from '../../utils/date';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const initialOf = (name) => name ? name.trim().charAt(0).toUpperCase() : '?';

const pctBucket = (pct) => pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';

const bucketColor = {
    high: 'var(--brand-green-600)',
    mid:  '#F59E0B',
    low:  '#EF4444',
};

// ───────────────────────────────────────────────────────────────────────────
// Profile card — overlaps hero gradient
// ───────────────────────────────────────────────────────────────────────────

const ProfileCard = ({ user, examsTaken, onChangePassword, onEdit }) => (
    <div className="relative bg-white border border-[var(--ink-200)] rounded-3xl p-6 md:p-7 -mt-16 mb-6 shadow-[var(--sh-md)]">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
            {/* Avatar — single big letter, gradient */}
            <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-[36px] shrink-0 shadow-[var(--sh-md)]"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }}
            >
                {initialOf(user?.fullName || user?.email)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h1 className="text-[22px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight truncate">
                    {user?.fullName || 'Şagird'}
                </h1>
                <p className="text-[13.5px] text-[var(--ink-500)] mt-0.5 truncate">{user?.email || '—'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--primary-hover)] bg-[var(--primary-soft)] border border-[var(--brand-blue-100)] px-2.5 py-1 rounded-full">
                        <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                        Şagird
                    </span>
                    {examsTaken > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2.5 py-1 rounded-full">
                            <HiOutlineCheck className="w-3.5 h-3.5" />
                            {examsTaken} imtahan tamamlandı
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                    onClick={onChangePassword}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-semibold text-[var(--ink-700)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                >
                    <HiOutlineLockClosed className="w-3.5 h-3.5" />
                    Şifrəni dəyiş
                </button>
                <button
                    onClick={onEdit}
                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                >
                    <HiOutlinePencilAlt className="w-3.5 h-3.5" />
                    Profili düzəlt
                </button>
            </div>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Stats row
// ───────────────────────────────────────────────────────────────────────────

const StatCard = ({ Icon, num, label, color, soft }) => (
    <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex items-center gap-4">
        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: soft, color }}
        >
            <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
            <div className="text-[24px] font-extrabold text-[var(--ink-900)] leading-none truncate">{num}</div>
            <div className="text-[12.5px] text-[var(--ink-500)] mt-1.5">{label}</div>
        </div>
    </div>
);

const StatsRow = ({ stats }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard Icon={HiOutlineLibrary}  num={stats.examsTaken}      label="İmtahan"      color="#2563EB" soft="#EFF4FF" />
        <StatCard Icon={HiOutlineChartBar} num={`${stats.avgScore}%`}  label="Orta nəticə"  color="#16A34A" soft="#ECFDF3" />
        <StatCard Icon={HiOutlineStar}     num={`${stats.bestScore}%`} label="Ən yüksək"    color="#F59E0B" soft="#FEF3C7" />
        <StatCard Icon={HiOutlineClock}    num={stats.pending}         label="Yoxlanılır"   color="#7C3AED" soft="#F3EEFE" />
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Recent results chart
// ───────────────────────────────────────────────────────────────────────────

const RecentChart = ({ results }) => {
    const data = useMemo(() =>
        [...results]
            .filter(r => r.submittedAt && r.maxScore > 0)
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
            .slice(-6)
            .map(r => ({
                date: r.submittedAt,
                pct: Math.round((r.totalScore / r.maxScore) * 100),
            })),
        [results]
    );

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <h3 className="text-[15px] font-bold text-[var(--ink-900)]">Son nəticələr</h3>
            <p className="text-[12.5px] text-[var(--ink-500)] mt-0.5 mb-5">Son {data.length || 0} imtahanın faiz nəticəsi</p>

            {data.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-[var(--ink-400)]">
                    Hələ heç bir nəticə yoxdur
                </div>
            ) : (
                <>
                    <div className="flex items-end justify-around gap-2 h-[160px] pt-5">
                        {data.map((d, i) => {
                            const color = bucketColor[pctBucket(d.pct)];
                            const h = Math.max((d.pct / 100) * 100, 4);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 max-w-[60px]">
                                    <div className="relative w-full flex-1 flex items-end">
                                        <div
                                            className="w-full rounded-t-lg relative transition-all duration-700"
                                            style={{ height: `${h}%`, background: color, minHeight: '6px' }}
                                        >
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[var(--ink-700)]">
                                                {d.pct}%
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[var(--ink-500)] font-mono">{fmtDateShort(d.date)}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-[var(--ink-150)] text-[11.5px] text-[var(--ink-500)]">
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--brand-green-600)]" /> 80%+</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 50–79%</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt; 50%</span>
                    </div>
                </>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Achievements
// ───────────────────────────────────────────────────────────────────────────

const Achievements = ({ stats }) => {
    const items = [
        { Icon: HiOutlineFlag,            name: 'İlk imtahan',   desc: 'İlk imtahanı tamamladı',    got: stats.examsTaken >= 1,  color: '#2563EB' },
        { Icon: HiOutlineStar,            name: 'Əla nəticə',    desc: '90%+ bal qazandı',          got: stats.bestScore >= 90,  color: '#F59E0B' },
        { Icon: HiOutlineCheck,           name: 'Mükəmməl',      desc: '100% bal qazandı',          got: stats.bestScore >= 100, color: '#16A34A' },
        { Icon: HiOutlineLightningBolt,   name: 'Cəld həll',     desc: 'Vaxtın 50%-i ilə bitirdi',  got: stats.fastSolver,       color: '#7C3AED' },
        { Icon: HiOutlineFire,            name: 'Yüksək orta',   desc: 'Orta balı 75%+',            got: stats.avgScore >= 75,   color: '#EF4444' },
        { Icon: HiOutlineSparkles,        name: 'Çempion',       desc: '10 imtahan tamamladı',      got: stats.examsTaken >= 10, color: '#0891B2' },
    ];
    const got = items.filter(i => i.got).length;
    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-[15px] font-bold text-[var(--ink-900)]">Nailiyyətlər</h3>
                <span className="text-[11.5px] font-bold text-[var(--ink-500)] bg-[var(--ink-100)] px-2 py-0.5 rounded-full">
                    {got} / {items.length}
                </span>
            </div>
            <p className="text-[12.5px] text-[var(--ink-500)] mb-4">Qazandığınız nailiyyətlər</p>
            <div className="flex flex-col gap-2.5">
                {items.map((a, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${a.got ? 'border-[var(--ink-150)]' : 'border-[var(--ink-150)] opacity-50'}`}
                        style={a.got ? { background: `${a.color}10`, borderColor: `${a.color}22` } : { background: 'var(--ink-50)' }}
                    >
                        <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={a.got ? { background: a.color, color: '#fff' } : { background: 'var(--ink-200)', color: 'var(--ink-400)' }}
                        >
                            <a.Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-[13.5px] font-bold text-[var(--ink-900)]">{a.name}</div>
                            <div className="text-[11.5px] text-[var(--ink-500)] truncate">{a.desc}</div>
                        </div>
                        {a.got && (
                            <span className="w-5 h-5 rounded-full bg-[var(--brand-green-600)] text-white flex items-center justify-center shrink-0">
                                <HiOutlineCheck className="w-3 h-3" />
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Results / Depot list (with tabs)
// ───────────────────────────────────────────────────────────────────────────

const ResultsList = ({ results, savedExams, resultsLoading, depotLoading, navigate }) => {
    const [tab, setTab] = useState('results');
    const [search, setSearch] = useState('');

    const filteredResults = useMemo(() => {
        if (!search.trim()) return results;
        const q = search.toLowerCase();
        return results.filter(r =>
            (r.examTitle || '').toLowerCase().includes(q) ||
            (r.subjects || []).some(s => s.toLowerCase().includes(q)) ||
            (r.teacherName || '').toLowerCase().includes(q)
        );
    }, [results, search]);

    const filteredSaved = useMemo(() => {
        if (!search.trim()) return savedExams;
        const q = search.toLowerCase();
        return savedExams.filter(e =>
            (e.title || '').toLowerCase().includes(q) ||
            (e.subjects || []).some(s => s.toLowerCase().includes(q))
        );
    }, [savedExams, search]);

    return (
        <div className="bg-white border border-[var(--ink-200)] rounded-2xl overflow-hidden">
            {/* Head */}
            <div className="px-5 py-4 border-b border-[var(--ink-150)] flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-[var(--ink-100)] rounded-full p-1">
                    <TabBtn
                        active={tab === 'results'}
                        onClick={() => setTab('results')}
                        Icon={HiOutlineClipboardList}
                    >
                        Nəticələrim
                        <span className={`text-[11px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${tab === 'results' ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-white text-[var(--ink-500)]'}`}>
                            {results.length}
                        </span>
                    </TabBtn>
                    <TabBtn
                        active={tab === 'saved'}
                        onClick={() => setTab('saved')}
                        Icon={HiOutlineBookmark}
                    >
                        Depom
                        <span className={`text-[11px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${tab === 'saved' ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]' : 'bg-white text-[var(--ink-500)]'}`}>
                            {savedExams.length}
                        </span>
                    </TabBtn>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-all min-w-[220px]">
                    <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                    <input
                        type="text"
                        placeholder="İmtahan axtar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-[13px] text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                    />
                </div>
            </div>

            {/* Body */}
            {tab === 'results' ? (
                resultsLoading ? (
                    <SkeletonList />
                ) : filteredResults.length === 0 ? (
                    <EmptyState
                        Icon={HiOutlineClipboardList}
                        title={results.length === 0 ? 'Hələ heç bir nəticə yoxdur' : 'Axtarışa uyğun nəticə tapılmadı'}
                        subtitle={results.length === 0 ? 'İmtahanlara qoşulun və nəticələriniz burada görünəcək.' : 'Başqa açar söz cəhd edin.'}
                        cta={results.length === 0 ? { label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') } : null}
                    />
                ) : (
                    <div className="divide-y divide-[var(--ink-150)]">
                        {filteredResults.map(r => (
                            <ResultRow key={r.id} r={r} onClick={() => navigate(`/test/result/${r.id}`)} />
                        ))}
                    </div>
                )
            ) : (
                depotLoading ? (
                    <SkeletonList />
                ) : filteredSaved.length === 0 ? (
                    <EmptyState
                        Icon={HiOutlineBookmark}
                        title={savedExams.length === 0 ? 'Depo boşdur' : 'Axtarışa uyğun imtahan tapılmadı'}
                        subtitle={savedExams.length === 0 ? 'İmtahanlar səhifəsindən bookmark ikonu ilə imtahanları deponuza əlavə edin.' : 'Başqa açar söz cəhd edin.'}
                        cta={savedExams.length === 0 ? { label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') } : null}
                    />
                ) : (
                    <div className="divide-y divide-[var(--ink-150)]">
                        {filteredSaved.map(e => (
                            <SavedRow key={e.shareLink} e={e} onClick={() => navigate(`/imtahan/${e.shareLink}`)} />
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

const TabBtn = ({ active, onClick, Icon, children }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all ${
            active
                ? 'bg-white text-[var(--ink-900)] shadow-[var(--sh-sm)]'
                : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
        }`}
    >
        <Icon className="w-3.5 h-3.5" />
        {children}
    </button>
);

const ResultRow = ({ r, onClick }) => {
    const pct = r.maxScore > 0 ? Math.round((r.totalScore / r.maxScore) * 100) : 0;
    const color = bucketColor[pctBucket(pct)];
    const isPending = !r.isFullyGraded;
    const totalQ = (r.correctCount ?? 0) + (r.wrongCount ?? 0) + (r.skippedCount ?? 0) + (r.pendingManualCount ?? 0);
    return (
        <div
            onClick={onClick}
            className="group px-5 py-4 hover:bg-[var(--ink-100)] cursor-pointer flex items-center gap-4 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold text-[var(--ink-900)] group-hover:text-[var(--primary)] truncate transition-colors">
                    {r.examTitle}
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-1.5 bg-[var(--ink-150)] rounded-full overflow-hidden max-w-[260px]">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }}
                        />
                    </div>
                    <span className="text-[14px] font-extrabold tabular-nums" style={{ color }}>{pct}%</span>
                    <span className="text-[11.5px] text-[var(--ink-500)] font-mono">
                        {r.correctCount ?? 0} / {totalQ || r.correctCount || 0} sual
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11.5px] text-[var(--ink-500)] mt-2">
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineCalendar className="w-3 h-3" /> {fmtDate(r.submittedAt)}
                    </span>
                    {isPending ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                            <HiOutlineClock className="w-3 h-3" /> Yoxlanılır
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--brand-green-600)] font-semibold">
                            <HiOutlineCheck className="w-3 h-3" /> Yoxlanılıb
                        </span>
                    )}
                </div>
            </div>
            <span className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12.5px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all shrink-0">
                <HiOutlineEye className="w-3.5 h-3.5" /> Bax
            </span>
        </div>
    );
};

const SavedRow = ({ e, onClick }) => {
    const totalQ = (e.questions?.length || 0) + (e.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0) || e.questionCount || 0;
    return (
        <div
            onClick={onClick}
            className="group px-5 py-4 hover:bg-[var(--ink-100)] cursor-pointer flex items-center gap-4 transition-colors"
        >
            <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <HiOutlineBookmark className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold text-[var(--ink-900)] group-hover:text-[var(--primary)] truncate transition-colors">
                    {e.title}
                </div>
                <div className="flex items-center gap-3 text-[11.5px] text-[var(--ink-500)] mt-1.5">
                    <span className="inline-flex items-center gap-1">
                        <HiOutlineLibrary className="w-3 h-3" /> {totalQ} sual
                    </span>
                    {e.durationMinutes > 0 && (
                        <span className="inline-flex items-center gap-1">
                            <HiOutlineClock className="w-3 h-3" /> {e.durationMinutes} dəq
                        </span>
                    )}
                    {(e.subjects || []).length > 0 && (
                        <span className="truncate">{e.subjects[0]}</span>
                    )}
                </div>
            </div>
            <span className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shrink-0 transition-all">
                Başla <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </span>
        </div>
    );
};

const SkeletonList = () => (
    <div className="divide-y divide-[var(--ink-150)]">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="flex-1">
                    <div className="h-4 w-2/3 bg-[var(--ink-150)] rounded mb-3" />
                    <div className="h-2 w-full bg-[var(--ink-150)] rounded mb-3 max-w-[260px]" />
                    <div className="h-2.5 w-1/3 bg-[var(--ink-150)] rounded" />
                </div>
                <div className="h-9 w-20 bg-[var(--ink-150)] rounded-full" />
            </div>
        ))}
    </div>
);

const EmptyState = ({ Icon, title, subtitle, cta }) => (
    <div className="text-center py-14 px-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--ink-100)] text-[var(--ink-400)] flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
        </div>
        <h4 className="text-[16px] font-bold text-[var(--ink-900)]">{title}</h4>
        <p className="text-[13.5px] text-[var(--ink-500)] mt-1 max-w-md mx-auto">{subtitle}</p>
        {cta && (
            <button
                onClick={cta.onClick}
                className="mt-5 h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                {cta.label} <HiOutlineArrowRight className="w-4 h-4" />
            </button>
        )}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [results, setResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(true);
    const [savedExams, setSavedExams] = useState([]);
    const [depotLoading, setDepotLoading] = useState(true);

    useEffect(() => {
        api.get('/submissions/my-results')
            .then(r => setResults(r.data || []))
            .catch(() => {})
            .finally(() => setResultsLoading(false));

        api.get('/depot')
            .then(r => setSavedExams(r.data || []))
            .catch(() => {})
            .finally(() => setDepotLoading(false));
    }, []);

    const stats = useMemo(() => {
        const submitted = results.filter(r => r.submittedAt && r.maxScore > 0);
        const examsTaken = submitted.length;
        const avgScore = examsTaken > 0
            ? Math.round(submitted.reduce((s, r) => s + (r.totalScore / r.maxScore) * 100, 0) / examsTaken)
            : 0;
        const bestScore = examsTaken > 0
            ? Math.max(...submitted.map(r => Math.round((r.totalScore / r.maxScore) * 100)))
            : 0;
        const pending = results.filter(r => !r.isFullyGraded && r.submittedAt).length;
        // "Fast solver" — at least one submission finished with <50% of allotted time
        const fastSolver = submitted.some(r => {
            if (!r.startedAt || !r.submittedAt || !r.durationMinutes) return false;
            const usedSec = (new Date(r.submittedAt) - new Date(r.startedAt)) / 1000;
            return usedSec < r.durationMinutes * 60 * 0.5;
        });
        return { examsTaken, avgScore, bestScore, pending, fastSolver };
    }, [results]);

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>Şagird paneli — testup.az</title>
            </Helmet>

            {/* Hero strip — sits behind profile card */}
            <div
                className="h-32 md:h-40 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--brand-blue-700) 0%, var(--primary) 60%, var(--brand-green-600) 130%)' }}
            >
                <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full" />
                <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-white/10 rounded-full" />
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="container-main max-w-6xl">
                <ProfileCard
                    user={user}
                    examsTaken={stats.examsTaken}
                    onChangePassword={() => navigate('/profil', { state: { tab: 'password' } })}
                    onEdit={() => navigate('/profil')}
                />

                <StatsRow stats={stats} />

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-6">
                    <RecentChart results={results} />
                    <Achievements stats={stats} />
                </div>

                <ResultsList
                    results={results}
                    savedExams={savedExams}
                    resultsLoading={resultsLoading}
                    depotLoading={depotLoading}
                    navigate={navigate}
                />
            </div>
        </div>
    );
};

export default StudentDashboard;
