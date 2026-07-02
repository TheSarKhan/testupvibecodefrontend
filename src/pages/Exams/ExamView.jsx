import { useEffect, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilAlt, HiOutlineClock, HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlineKey } from 'react-icons/hi';
import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';
import AccessCodeModal from '../../components/ui/AccessCodeModal';
import ChipContent from '../../utils/chipContent';
import { QUESTION_TYPE_LABELS, labelOr } from '../../utils/enumLabels';

const STATUS_LABELS = {
    PUBLISHED: 'Aktiv',
    CANCELLED: 'Bağlı',
    DRAFT: 'Qaralama',
};

// Bağlantı oxlarının növbələnən rəngləri (mavi, bənövşəyi, yaşıl, narıncı, çəhrayı, firuzəyi)
const ARROW_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

// ---- MatchingPreview: sual redaktorda qurulduğu formada göstərilir ----
// Sütunlar + düzgün əlaqələri göstərən oxlar (ExamReview-dakı MatchingReview-un
// müəllif-cavabı variantı). Saxlanmış cüt = hər iki tərəfi dolu olduqda əlaqə;
// tək tərəfli cüt = distraktor (sütunda görünür, oxu olmur).
const MatchingPreview = ({ q }) => {
    const containerRef = useRef(null);
    const [arrows, setArrows] = useState([]);
    const [imgTick, setImgTick] = useState(0);

    const pairs = [...(q.matchingPairs || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    const keyOf = (text, img) => `${text || ''}|${img || ''}`;

    // Content-deduped columns in author order; a side may hold text, image or
    // both — fully-empty sides are skipped.
    const leftMap = {}, rightMap = {};
    pairs.forEach(p => {
        const lk = keyOf(p.leftItem, p.attachedImageLeft);
        if (lk !== '|' && !leftMap[lk]) leftMap[lk] = p;
        const rk = keyOf(p.rightItem, p.attachedImageRight);
        if (rk !== '|' && !rightMap[rk]) rightMap[rk] = p;
    });
    const leftNodes = Object.values(leftMap);
    const rightNodes = Object.values(rightMap);

    // Correct links between canonical (deduped) nodes
    const links = [];
    const seenLinks = new Set();
    pairs.forEach(p => {
        const lk = keyOf(p.leftItem, p.attachedImageLeft);
        const rk = keyOf(p.rightItem, p.attachedImageRight);
        if (lk === '|' || rk === '|') return;
        const key = `${lk}>>${rk}`;
        if (seenLinks.has(key)) return;
        seenLinks.add(key);
        links.push({ leftId: leftMap[lk].id, rightId: rightMap[rk].id });
    });

    useLayoutEffect(() => {
        const compute = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const computed = [];
            links.forEach((ln, idx) => {
                const leftEl = containerRef.current.querySelector(`[data-ml-id="${ln.leftId}"]`);
                const rightEl = containerRef.current.querySelector(`[data-mr-id="${ln.rightId}"]`);
                if (!leftEl || !rightEl) return;
                const lRect = leftEl.getBoundingClientRect();
                const rRect = rightEl.getBoundingClientRect();
                computed.push({
                    idx,
                    x1: lRect.right - rect.left,
                    y1: lRect.top + lRect.height / 2 - rect.top,
                    x2: rRect.left - rect.left,
                    y2: rRect.top + rRect.height / 2 - rect.top,
                });
            });
            setArrows(computed);
        };
        compute();
        window.addEventListener('resize', compute);
        return () => window.removeEventListener('resize', compute);
        // imgTick: şəkil yüklənəndə hündürlüklər dəyişir — oxlar yenidən hesablanır
    }, [q.id, imgTick]);

    const renderSide = (text, image) => (
        <>
            {text?.trim() && <div className="break-words"><ChipContent text={text} /></div>}
            {image && (
                <img
                    src={image}
                    alt=""
                    onLoad={() => setImgTick(t => t + 1)}
                    className="max-h-28 rounded-lg mx-auto mt-1 object-contain"
                />
            )}
        </>
    );

    return (
        <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
            <p className="text-sm font-semibold text-emerald-700 mb-4">Uyğunluq Cütləri:</p>
            <div ref={containerRef} className="relative flex justify-between py-2">
                {/* Left column */}
                <div className="w-[42%] space-y-5" style={{ position: 'relative', zIndex: 10 }}>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Sol tərəf</p>
                    {leftNodes.map(p => (
                        <div
                            key={`l-${p.id}`}
                            data-ml-id={p.id}
                            className="p-4 bg-white rounded-2xl border-2 border-emerald-200 text-gray-800 font-medium text-center min-h-[52px] flex flex-col justify-center"
                        >
                            {renderSide(p.leftItem, p.attachedImageLeft)}
                        </div>
                    ))}
                </div>
                {/* Right column */}
                <div className="w-[42%] space-y-5" style={{ position: 'relative', zIndex: 10 }}>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Sağ tərəf</p>
                    {rightNodes.map(p => (
                        <div
                            key={`r-${p.id}`}
                            data-mr-id={p.id}
                            className="p-4 bg-white rounded-2xl border-2 border-emerald-200 text-gray-800 font-medium text-center min-h-[52px] flex flex-col justify-center"
                        >
                            {renderSide(p.rightItem, p.attachedImageRight)}
                        </div>
                    ))}
                </div>
                {/* Connection arrows — hər bağlantı fərqli rəngdə (redaktordakı kimi) */}
                <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%', zIndex: 5 }}>
                    <defs>
                        {arrows.map(({ idx }) => (
                            <marker key={idx} id={`mp-arr-${q.id}-${idx}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={ARROW_COLORS[idx % ARROW_COLORS.length]} />
                            </marker>
                        ))}
                    </defs>
                    {arrows.map(({ idx, x1, y1, x2, y2 }) => {
                        const color = ARROW_COLORS[idx % ARROW_COLORS.length];
                        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                        const d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
                        return (
                            <g key={idx}>
                                <path d={d} stroke={color} strokeWidth="2.5" fill="none"
                                    markerEnd={`url(#mp-arr-${q.id}-${idx})`} opacity={0.9} />
                                <circle cx={mx} cy={my} r="10" fill="white" stroke={color} strokeWidth="1.5" />
                                <text x={mx} y={my + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={color}>✓</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

const ExamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [accessCode, setAccessCode] = useState(null);

    const generateAccessCode = async () => {
        if (!id || generatingCode) return;
        setGeneratingCode(true);
        try {
            const { data } = await api.post(`/exams/${id}/generate-code`);
            if (data?.accessCode) setAccessCode(data.accessCode);
        } catch {
            toast.error('Kod yaradılmadı');
        } finally {
            setGeneratingCode(false);
        }
    };

    useEffect(() => {
        fetchExamDetails();
    }, [id]);

    const fetchExamDetails = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExam(data);
        } catch (error) {
            const msg = error.response?.status === 404
                ? 'Belə bir imtahan tapılmadı'
                : (error.response?.data?.message || 'İmtahan yüklənmədi');
            toast.error(msg);
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!exam) return null;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="container-main py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{exam.title}</h1>
                            <p className="text-xs text-gray-500">ID: {exam.id} | {(exam.subjects || []).join(', ') || exam.subject}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {exam.visibility === 'PRIVATE' && exam.status === 'PUBLISHED' && (
                            <button
                                onClick={generateAccessCode}
                                disabled={generatingCode}
                                className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-60"
                            >
                                <HiOutlineKey className={`w-5 h-5 ${generatingCode ? 'animate-pulse' : ''}`} />
                                {generatingCode ? 'Yaradılır...' : 'Tələbə kodu yarat'}
                            </button>
                        )}
                        <button
                            onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)}
                            className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            Statistika
                        </button>
                        <button
                            onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                            Düzəliş et
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main mt-8">
                {/* Exam Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineClock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Müddət</p>
                            <p className="text-lg font-bold text-gray-900">{exam.durationMinutes} dəqiqə</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <HiOutlineDocumentText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sual sayı</p>
                            <p className="text-lg font-bold text-gray-900">{(exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0)} ədəd</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <HiOutlineCheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-lg font-bold text-gray-900">{STATUS_LABELS[exam.status] ?? exam.status}</p>
                        </div>
                    </div>
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Suallar
                    </h2>

                    {(() => {
                        // Combine all questions: standalone + passage questions, sorted by orderIndex
                        const allQuestions = [
                            ...(exam.questions || []),
                            ...(exam.passages || []).flatMap(p => p.questions || [])
                        ].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

                        return allQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Sual {idx + 1} • {q.points} Bal
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium">{labelOr(QUESTION_TYPE_LABELS, q.questionType)}</span>
                                    </div>

                                    {q.questionType !== 'FILL_IN_THE_BLANK' && (
                                        <div className="text-lg text-gray-800 mb-6">
                                            <LatexPreview content={q.content} />
                                        </div>
                                    )}

                                    {q.attachedImage && (
                                        <div className="mb-6 rounded-lg overflow-hidden border border-gray-200 inline-block">
                                            <img
                                                src={q.attachedImage}
                                                alt="Sual şəkli"
                                                className="max-w-full h-auto max-h-[600px] cursor-zoom-in transition-transform hover:scale-[1.01]"
                                                onClick={() => window.open(q.attachedImage, '_blank')}
                                                title="Şəkli tam ölçüdə açmaq üçün klikləyin"
                                            />
                                        </div>
                                    )}

                                    {/* Options (MCQ / TRUE_FALSE / MULTI_SELECT) */}
                                    {(q.questionType === 'MCQ' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MULTI_SELECT') && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {q.options?.map((opt, oIdx) => (
                                                <div
                                                    key={opt.id}
                                                    className={`p-4 rounded-xl border flex items-center gap-3 ${opt.isCorrect ? 'border-green-200 bg-green-50 text-green-800' : 'border-gray-100 bg-gray-50 text-gray-600'
                                                        }`}
                                                >
                                                    <span className="w-8 h-8 rounded-full bg-white border border-inherit flex items-center justify-center font-bold text-xs">
                                                        {String.fromCharCode(65 + oIdx)}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex flex-col gap-2">
                                                            <LatexPreview content={opt.content} placeholder={`${String.fromCharCode(65 + oIdx)} variantı`} />
                                                            {opt.attachedImage && (
                                                                <div className="mt-1 rounded-lg overflow-hidden border border-gray-100 inline-block w-fit">
                                                                    <img src={opt.attachedImage} alt="Variant şəkli" className="max-h-48 object-contain" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {opt.isCorrect && <HiOutlineCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Fill In The Blank */}
                                    {q.questionType === 'FILL_IN_THE_BLANK' && (() => {
                                        const parts = (q.content || '').split('___');
                                        let correctAnswers = [];
                                        try {
                                            const p = JSON.parse(q.correctAnswer || '[]');
                                            if (Array.isArray(p)) correctAnswers = p;
                                        } catch (e) {}

                                        return (
                                            <div className="space-y-4">
                                                <div className="text-lg text-gray-800 leading-relaxed">
                                                    {parts.map((part, i) => (
                                                        <span key={i}>
                                                            {part && <LatexPreview content={part} />}
                                                            {i < parts.length - 1 && (
                                                                <span className="inline-flex items-center justify-center mx-2 min-w-[100px] h-8 px-3 rounded-lg border-2 border-solid border-green-400 bg-green-50 text-green-700 text-sm font-semibold">
                                                                    {correctAnswers[i] ? <ChipContent text={correctAnswers[i]} /> : '___'}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>

                                                {correctAnswers.length > 0 && (
                                                    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                                        <p className="text-sm text-green-700 font-semibold mb-3">✓ Düzgün Cavablar:</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {correctAnswers.map((answer, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200 min-w-0">
                                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500 text-white text-xs font-bold shrink-0">
                                                                        {idx + 1}
                                                                    </span>
                                                                    <span className="font-semibold text-gray-800 min-w-0 break-words"><ChipContent text={answer} /></span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {q.options && q.options.length > 0 && (
                                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                        <p className="text-sm text-blue-700 font-semibold mb-3">Seçimlər:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {q.options.map(opt => (
                                                                <span key={opt.id} className="max-w-full px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 overflow-hidden">
                                                                    <ChipContent text={opt.content} />
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* Matching */}
                                    {q.questionType === 'MATCHING' && <MatchingPreview q={q} />}

                                    {/* Open Ended */}
                                    {q.questionType === 'OPEN_AUTO' && (
                                        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                            <p className="text-sm text-blue-700 font-semibold mb-2">Nümunəvi Cavab:</p>
                                            <div className="text-gray-800">
                                                <LatexPreview content={q.correctAnswer} />
                                            </div>
                                        </div>
                                    )}
                                    {q.questionType === 'OPEN_MANUAL' && (
                                        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <p className="text-sm text-amber-700 font-semibold mb-2">Müəllim tərəfindən yoxlanılır</p>
                                            {q.correctAnswer ? (
                                                <div className="text-gray-800">
                                                    <LatexPreview content={q.correctAnswer} />
                                                </div>
                                            ) : (
                                                <p className="text-sm text-amber-600 italic">Nümunəvi cavab göstərilməyib</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {accessCode && (
                <AccessCodeModal code={accessCode} onClose={() => setAccessCode(null)} />
            )}
        </div>
    );
};

export default ExamView;
