import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineChartBar, HiOutlineArrowLeft, HiOutlineUserGroup,
    HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineCheckCircle,
    HiOutlineClock,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSmartBack } from '../../hooks/useSmartBack';

import { fmtDateTime } from '../../utils/date';
import { QUESTION_TYPE_LABELS, labelOr } from '../../utils/enumLabels';
const fmtPct  = (v) => (v == null ? '—' : `${v.toFixed(1)}%`);
const fmtNum  = (v) => (v == null ? '—' : Number.isInteger(v) ? v : v.toFixed(2));
const fmtDate = (iso) => iso ? fmtDateTime(iso) : '—';

// Big aggregate tile. Tailwind purges dynamic classes — keep the colour map static.
const TILE_COLOR = {
    blue: 'text-blue-700',
    gray:   'text-gray-700',
    red:    'text-red-600',
    amber:  'text-amber-600',
    green:  'text-green-700',
};
const Tile = ({ label, value, sub, color = 'blue' }) => (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-extrabold ${TILE_COLOR[color] || TILE_COLOR.blue}`}>{value}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
);

// Per-question difficulty bar.
const DifficultyBar = ({ correctRate }) => {
    if (correctRate == null) return <span className="text-xs text-gray-400">Cəhd yoxdur</span>;
    const pct = Math.round(correctRate * 100);
    const cls =
        pct >= 75 ? 'bg-green-500' :
        pct >= 50 ? 'bg-amber-400' :
        pct >= 25 ? 'bg-orange-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${cls}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-gray-600 font-semibold w-10">{pct}%</span>
        </div>
    );
};

const CollaborativeStats = () => {
    const { collaboratorId } = useParams();
    const { isAdmin } = useAuth();
    const goBack = useSmartBack(isAdmin ? '/admin/birge-imtahanlar' : '/birge-imtahanlari');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('questions'); // 'questions' | 'students'

    useEffect(() => {
        setLoading(true);
        api.get(`/collaborative-exams/collaborator/${collaboratorId}/stats`)
            .then(r => setData(r.data))
            .catch(err => {
                toast.error(err.response?.data?.message || 'Statistika yüklənmədi');
            })
            .finally(() => setLoading(false));
    }, [collaboratorId]);

    // Question hardest-first ordering for the "problem questions" view.
    const sortedQuestions = useMemo(() => {
        if (!data?.questions) return [];
        return [...data.questions].sort((a, b) => {
            const ra = a.correctRate == null ? 2 : a.correctRate; // never-attempted at the end
            const rb = b.correctRate == null ? 2 : b.correctRate;
            return ra - rb;
        });
    }, [data]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        );
    }
    if (!data) {
        return (
            <div className="container-main py-20 text-center">
                <p className="text-gray-500">Məlumat tapılmadı.</p>
                <button onClick={goBack} className="text-blue-600 hover:underline mt-3 inline-block">
                    Geri qayıt
                </button>
            </div>
        );
    }

    const noQuestions = data.questionCount === 0;
    const noStudents = data.studentCount === 0;

    return (
        <div className="bg-gray-50/50 min-h-screen py-8">
            <Helmet>
                <title>{data.examTitle} — Mənim hissəm — testup.az</title>
            </Helmet>

            <div className="container-main max-w-5xl">
                {/* Breadcrumb */}
                <button onClick={goBack}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 mb-4">
                    <HiOutlineArrowLeft className="w-4 h-4" /> Geri qayıt
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 mb-1">
                        <HiOutlineChartBar className="w-7 h-7 text-blue-500" />
                        {data.examTitle}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Mənim hissəm — {(data.subjects || []).join(', ')}
                    </p>
                </div>

                {noQuestions ? (
                    <div className="bg-white border border-amber-200 bg-amber-50/40 rounded-2xl p-8 text-center">
                        <HiOutlineExclamationCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="font-bold text-amber-900 mb-1">Hələ təsdiqlənmiş sualınız yoxdur</h3>
                        <p className="text-sm text-amber-700 max-w-md mx-auto">
                            Admin sizin suallarınızı təsdiqlədikdən sonra burada statistika görünəcək.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Aggregates */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <Tile label="İştirakçı" value={data.studentCount}
                                  sub={noStudents ? 'Hələ heç kim cavablamayıb' : 'şagird cavablandırıb'}
                                  color="blue" />
                            <Tile label="Mənim sualım" value={data.questionCount}
                                  sub={`${fmtNum(data.totalPoints)} bal cəmi`} color="gray" />
                            <Tile label="Orta nəticə" value={fmtPct(data.avgPercent)}
                                  sub={data.avgScore != null ? `${fmtNum(data.avgScore)} / ${fmtNum(data.totalPoints)} bal` : '—'}
                                  color={data.avgPercent == null || data.avgPercent < 50 ? 'red' :
                                         data.avgPercent < 75 ? 'amber' : 'green'} />
                            <Tile label="Yoxlanılmayan" value={data.pendingManualCount}
                                  sub="Açıq sual cavabı" color={data.pendingManualCount > 0 ? 'amber' : 'gray'} />
                        </div>

                        {/* Pending manuals nudge */}
                        {data.pendingManualCount > 0 && (
                            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-amber-900">
                                        {data.pendingManualCount} cavab sizdən qiymət gözləyir
                                    </p>
                                    <p className="text-xs text-amber-700">
                                        Açıq (müəllim yoxlayır) tipli suallarınızda hələ qiymətləndirilməmiş cavablar var.
                                        Yoxlamağa başlamaq üçün şagirdin cavabına keçin.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex items-center gap-1 mb-3">
                            {[
                                { k: 'questions', label: 'Sual üzrə', n: data.questions.length },
                                { k: 'students',  label: 'Şagird üzrə', n: data.students.length },
                            ].map(t => (
                                <button key={t.k} onClick={() => setTab(t.k)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                                        tab === t.k
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}>
                                    {t.label} <span className="text-xs opacity-70">· {t.n}</span>
                                </button>
                            ))}
                        </div>

                        {/* Questions tab */}
                        {tab === 'questions' && (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                {noStudents ? (
                                    <div className="p-10 text-center text-sm text-gray-400">
                                        Şagirdlər cavablamağa başladıqdan sonra sual çətinliyi burada görünəcək.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/60 text-xs uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-bold w-12">№</th>
                                                <th className="text-left px-4 py-3 font-bold">Sual</th>
                                                <th className="text-left px-4 py-3 font-bold whitespace-nowrap">Çətinlik</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Düz</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Hissəvi</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Səhv</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Boş</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Orta bal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedQuestions.map((q, i) => (
                                                <tr key={q.questionId} className="border-t border-gray-50 hover:bg-gray-100/40">
                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-gray-800 font-medium leading-snug line-clamp-2 max-w-md">
                                                            {q.content || <span className="italic text-gray-400">(mətn yoxdur)</span>}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            {labelOr(QUESTION_TYPE_LABELS, q.questionType)} · {fmtNum(q.points)} bal
                                                            {q.subjectGroup && ` · ${q.subjectGroup}`}
                                                            {q.pendingManualCount > 0 &&
                                                                <span className="text-amber-600 font-semibold ml-1">
                                                                    · {q.pendingManualCount} yoxlanmamış
                                                                </span>}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3"><DifficultyBar correctRate={q.correctRate} /></td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-green-700 font-semibold">{q.correctCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-amber-600 font-semibold">{q.partialCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-red-600 font-semibold">{q.wrongCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">{q.skippedCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-gray-700 font-semibold">{fmtNum(q.avgScore)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {/* Students tab */}
                        {tab === 'students' && (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                {noStudents ? (
                                    <div className="p-10 text-center text-sm text-gray-400">
                                        Hələ heç bir şagird imtahanı bitirməyib.
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/60 text-xs uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-bold w-12">№</th>
                                                <th className="text-left px-4 py-3 font-bold">Şagird</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Bal</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">%</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Düz</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Hissəvi</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Səhv</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Boş</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap">Gözləyir</th>
                                                <th className="text-left  px-4 py-3 font-bold whitespace-nowrap">Tarix</th>
                                                <th className="text-right px-4 py-3 font-bold whitespace-nowrap w-20">İş</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.students.map((s, i) => (
                                                <tr key={s.submissionId} className="border-t border-gray-50 hover:bg-gray-100/40">
                                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                                                    <td className="px-4 py-3 text-gray-800 font-medium">
                                                        {s.studentName}
                                                        {!s.studentId && <span className="text-[11px] text-gray-400 ml-1.5">(qonaq)</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-800">
                                                        {fmtNum(s.score)} <span className="text-gray-400 font-normal">/ {fmtNum(s.maxScore)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`tabular-nums font-bold ${
                                                            s.percent == null ? 'text-gray-400' :
                                                            s.percent >= 75 ? 'text-green-700' :
                                                            s.percent >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                            {fmtPct(s.percent)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-green-700">{s.correctCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-amber-600">{s.partialCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-red-600">{s.wrongCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-gray-400">{s.skippedCount}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {s.pendingManualCount > 0
                                                            ? <span className="text-amber-700 font-bold">{s.pendingManualCount}</span>
                                                            : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(s.submittedAt)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link
                                                            to={`/test/review/${s.submissionId}`}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                                                s.pendingManualCount > 0
                                                                    ? 'text-white bg-amber-500 hover:bg-amber-600'
                                                                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100'
                                                            }`}
                                                        >
                                                            {s.pendingManualCount > 0 ? 'Yoxla' : 'Bax'}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CollaborativeStats;
