import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineChartBar, HiOutlineUserGroup, HiOutlineClock,
    HiOutlineSparkles, HiOutlineHome,
} from 'react-icons/hi';
import api from '../../api/axios';

// Public statistics page — anyone with the exam's shareLink can open it.
// Renders the same headline metrics + top-5 leaderboard the teacher sees
// on the dashboard, minus admin-only data (examPrice / internal id).
const PublicExamStats = () => {
    const { shareLink } = useParams();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        api.get(`/submissions/exam/share/${shareLink}/public-statistics`)
            .then(res => { if (!cancelled) setStats(res.data); })
            .catch(err => { if (!cancelled) setError(err?.response?.data?.message || 'Statistika yüklənmədi'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [shareLink]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center" style={{ background: 'var(--paper-cream)' }}>
                <h1 className="text-xl font-bold text-[var(--ink-900)]">Statistika tapılmadı</h1>
                <p className="text-sm text-[var(--ink-500)]">{error || 'Bu imtahan üçün paylaşılan statistika mövcud deyil.'}</p>
                <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-full text-sm font-semibold">
                    <HiOutlineHome className="w-4 h-4" /> Ana səhifə
                </Link>
            </div>
        );
    }

    const maxScore = Number(stats.maximumScore || 0);
    const avgScore = Number(stats.averageScore || 0);
    const avgPct = maxScore > 0 ? Math.round((avgScore / maxScore) * 100) : 0;

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>{stats.examTitle} — Nəticələr — testup.az</title>
            </Helmet>

            {/* Hero */}
            <section className="bg-white border-b border-[var(--ink-150)]">
                <div className="container-main py-10 md:py-14">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary-hover)] border border-[var(--brand-blue-100)]">
                        <HiOutlineChartBar className="w-3.5 h-3.5" />
                        İmtahan Statistikası
                    </span>
                    <h1 className="mt-4 text-[32px] sm:text-[40px] md:text-[48px] font-extrabold text-[var(--ink-900)] tracking-tight leading-[1.05]">
                        {stats.examTitle}
                    </h1>
                    <p className="mt-3 text-[15px] text-[var(--ink-500)] leading-relaxed max-w-2xl">
                        Bu imtahanın ümumi nəticələri və ən yaxşı iştirakçıları.
                    </p>
                </div>
            </section>

            {/* Stat tiles */}
            <div className="container-main mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Tile
                    icon={HiOutlineUserGroup}
                    label="İştirakçı"
                    value={stats.totalParticipants ?? 0}
                    sub="cəmi cəhd"
                />
                <Tile
                    icon={HiOutlineChartBar}
                    label="Orta bal"
                    value={avgScore.toFixed(1)}
                    sub={maxScore > 0 ? `${maxScore} bal-dan` : null}
                    accent={avgPct >= 75 ? 'green' : avgPct >= 50 ? 'amber' : 'red'}
                />
                <Tile
                    icon={HiOutlineSparkles}
                    label="Orta reytinq"
                    value={stats.averageRating ? Number(stats.averageRating).toFixed(1) : '—'}
                    sub="5 ulduzdan"
                />
                <Tile
                    icon={HiOutlineClock}
                    label="Orta vaxt"
                    value={`${stats.averageDurationMinutes ?? 0} dəq`}
                    sub="cavablandırma"
                />
            </div>

            {/* Top students */}
            <div className="container-main mt-8">
                <div className="bg-white rounded-3xl border border-[var(--ink-200)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--ink-150)] flex items-center gap-2">
                        <HiOutlineSparkles className="w-5 h-5 text-amber-500" />
                        <h2 className="font-bold text-[var(--ink-900)] text-[16px] tracking-tight">Top 5 iştirakçı</h2>
                    </div>
                    {!stats.topStudents || stats.topStudents.length === 0 ? (
                        <div className="p-10 text-center text-sm text-[var(--ink-400)]">
                            Hələ heç bir tamamlanmış cəhd yoxdur.
                        </div>
                    ) : (
                        <ul className="divide-y divide-[var(--ink-100)]">
                            {stats.topStudents.map((s, i) => {
                                const medal = ['#FBBF24', '#9CA3AF', '#B45309'][i] || '#E5E7EB';
                                const fg = i < 3 ? 'text-white' : 'text-[var(--ink-600)]';
                                return (
                                    <li key={i} className="px-5 py-3 flex items-center gap-4">
                                        <span
                                            className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-[12.5px] font-extrabold ${fg}`}
                                            style={{ background: medal }}
                                        >
                                            {i + 1}
                                        </span>
                                        <p className="flex-1 font-semibold text-[var(--ink-800)] truncate">{s.name}</p>
                                        <span className="text-xs text-[var(--ink-400)] font-mono">{s.timeSpent}</span>
                                        <span className="text-sm font-extrabold text-[var(--primary)] tabular-nums">
                                            {Number(s.score || 0).toFixed(1)}
                                            {maxScore > 0 && <span className="text-[var(--ink-400)] font-normal"> / {maxScore}</span>}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            <div className="container-main mt-8 text-center">
                <Link
                    to={`/imtahanlar/melumat/${shareLink}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full text-sm font-bold transition-colors"
                >
                    İmtahana keç
                </Link>
            </div>
        </div>
    );
};

const TILE_ACCENT = {
    green: 'text-[var(--brand-green-700)]',
    amber: 'text-amber-700',
    red:   'text-red-600',
};

const Tile = ({ icon: Icon, label, value, sub, accent }) => (
    <div className="bg-white rounded-2xl border border-[var(--ink-200)] px-5 py-4 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </div>
        <p className={`text-[24px] font-extrabold leading-tight ${TILE_ACCENT[accent] || 'text-[var(--ink-900)]'}`}>
            {value}
        </p>
        {sub && <p className="text-[11px] text-[var(--ink-400)]">{sub}</p>}
    </div>
);

export default PublicExamStats;
