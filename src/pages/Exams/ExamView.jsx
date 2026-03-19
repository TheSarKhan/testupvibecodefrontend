import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilAlt, HiOutlineClock, HiOutlineDocumentText, HiOutlineCheckCircle, HiOutlineLockClosed, HiOutlineRefresh } from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import LatexPreview from '../../components/ui/LatexPreview';


const fmtExpiry = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    if (d < now) return null; // expired
    const diffMs = d - now;
    const diffH = Math.floor(diffMs / 3600000);
    const diffM = Math.floor((diffMs % 3600000) / 60000);
    if (diffH > 0) return `${diffH} saat ${diffM} dəq qalıb`;
    return `${diffM} dəq qalıb`;
};

const AccessCodeCard = ({ exam, onCodeGenerated }) => {
    const [generating, setGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [remaining, setRemaining] = useState(() => {
        const active = exam.accessCode && exam.accessCodeExpiresAt && new Date(exam.accessCodeExpiresAt) > new Date();
        return active ? fmtExpiry(exam.accessCodeExpiresAt) : null;
    });

    const isActive = exam.accessCode && exam.accessCodeExpiresAt && new Date(exam.accessCodeExpiresAt) > new Date();

    useEffect(() => {
        if (!exam.accessCodeExpiresAt) return;
        const tick = () => {
            const val = fmtExpiry(exam.accessCodeExpiresAt);
            setRemaining(val);
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [exam.accessCodeExpiresAt]);

    const generateCode = async () => {
        setGenerating(true);
        try {
            const { data } = await api.post(`/exams/${exam.id}/generate-code`);
            onCodeGenerated(data);
            toast.success('Yeni kod yaradıldı');
        } catch {
            toast.error('Kod yaradılarkən xəta baş verdi');
        } finally {
            setGenerating(false);
        }
    };

    const copyCode = () => {
        if (!exam.accessCode) return;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(exam.accessCode);
        } else {
            const el = document.createElement('textarea');
            el.value = exam.accessCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`bg-white p-5 rounded-2xl border shadow-sm ${isActive ? 'border-indigo-200' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                    <HiOutlineLockClosed className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-700">Giriş Kodu</p>
                    {isActive
                        ? <p className="text-xs text-indigo-500 font-medium">{remaining}</p>
                        : <p className="text-xs text-gray-400">Aktiv kod yoxdur</p>
                    }
                </div>
            </div>

            {isActive && (
                <div
                    onClick={copyCode}
                    className="mb-4 flex items-center justify-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl py-3 cursor-pointer hover:bg-indigo-100 transition-colors"
                    title="Kopyalamaq üçün klikləyin"
                >
                    <span className="text-3xl font-black tracking-[0.3em] text-indigo-700 font-mono">
                        {exam.accessCode}
                    </span>
                    <span className="text-xs text-indigo-400">{copied ? '✓ Kopyalandı' : 'Kopyala'}</span>
                </div>
            )}

            <button
                onClick={generateCode}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
                <HiOutlineRefresh className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Yaradılır...' : isActive ? 'Yeni Kod Yarat' : 'Kod Yarat'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">Kod 12 saat ərzində keçərli olur</p>
        </div>
    );
};

const ExamView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExamDetails();
    }, [id]);

    const fetchExamDetails = async () => {
        try {
            const { data } = await api.get(`/exams/${id}/details`);
            setExam(data);
        } catch (error) {
            toast.error("İmtahan məlumatlarını yükləyərkən xəta baş verdi");
            navigate('/imtahanlar');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeGenerated = ({ accessCode, expiresAt }) => {
        setExam(prev => ({ ...prev, accessCode, accessCodeExpiresAt: expiresAt }));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                        <button
                            onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            Statistika
                        </button>
                        <button
                            onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                            Düzəliş et
                        </button>
                    </div>
                </div>
            </div>

            <div className="container-main mt-8">
                {/* Exam Summary Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <HiOutlineDocumentText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Sual sayı</p>
                            <p className="text-lg font-bold text-gray-900">{(exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0)} ədəd</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <HiOutlineCheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="text-lg font-bold text-gray-900">{exam.status}</p>
                        </div>
                    </div>

                    {/* Access code card — only for PRIVATE exams */}
                    {exam.visibility === 'PRIVATE' && (
                        <AccessCodeCard exam={exam} onCodeGenerated={handleCodeGenerated} />
                    )}
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        Suallar
                    </h2>

                    {exam.questions?.map((q, idx) => (
                        <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Sual {idx + 1} • {q.points} Bal
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">{q.questionType}</span>
                                </div>

                                <div className="text-lg text-gray-800 mb-6">
                                    <LatexPreview content={q.content} />
                                </div>

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

                                {/* Options (MCQ) */}
                                {q.questionType === 'MCQ' && (
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
                                                        <LatexPreview content={opt.content} />
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

                                {/* Matching */}
                                {q.questionType === 'MATCHING' && (
                                    <div className="space-y-2 mt-4">
                                        {q.matchingPairs?.map((pair, pIdx) => (
                                            <div key={pair.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex-1 font-medium text-gray-700">
                                                    <LatexPreview content={pair.leftItem} />
                                                </div>
                                                <div className="text-indigo-400">↔</div>
                                                <div className="flex-1 font-medium text-gray-700">
                                                    <LatexPreview content={pair.rightItem} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Open Ended */}
                                {(q.questionType === 'OPEN_AUTO' || q.questionType === 'OPEN_MANUAL') && (
                                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <p className="text-sm text-indigo-700 font-semibold mb-2">Nümunəvi Cavab:</p>
                                        <div className="text-gray-800">
                                            <LatexPreview content={q.correctAnswer} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExamView;
