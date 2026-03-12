import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlineSave,
    HiOutlineBookOpen, HiOutlineSearch, HiOutlinePencil, HiOutlineEye,
    HiOutlineX, HiOutlineCheckCircle
} from 'react-icons/hi';
import { QuestionEditor, LatexPreview } from '../../components/ui';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Type config ──────────────────────────────────────────────────────────────
const BACKEND_TO_FRONTEND = {
    MCQ: 'MULTIPLE_CHOICE', TRUE_FALSE: 'MULTIPLE_CHOICE',
    MULTI_SELECT: 'MULTI_SELECT', OPEN_AUTO: 'OPEN_AUTO',
    OPEN_MANUAL: 'OPEN_MANUAL', FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};
const FRONTEND_TO_BACKEND = {
    MULTIPLE_CHOICE: 'MCQ', MULTI_SELECT: 'MULTI_SELECT',
    OPEN_AUTO: 'OPEN_AUTO', OPEN_MANUAL: 'OPEN_MANUAL',
    FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};
const TYPE_LABELS = {
    MULTIPLE_CHOICE: 'Qapalı', MULTI_SELECT: 'Çox seçimli',
    OPEN_AUTO: 'Açıq (Avto)', OPEN_MANUAL: 'Açıq (Müəllim)',
    FILL_IN_THE_BLANK: 'Boşluq', MATCHING: 'Uyğunlaşdırma',
};
const TYPE_COLORS = {
    MULTIPLE_CHOICE: 'bg-indigo-50 text-indigo-700',
    MULTI_SELECT: 'bg-violet-50 text-violet-700',
    OPEN_AUTO: 'bg-green-50 text-green-700',
    OPEN_MANUAL: 'bg-orange-50 text-orange-700',
    FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
    MATCHING: 'bg-pink-50 text-pink-700',
};

// ── Data mappers ─────────────────────────────────────────────────────────────
const bankToEditor = (bq) => ({
    id: String(bq.id),
    _bankId: bq.id,
    type: BACKEND_TO_FRONTEND[bq.questionType] || 'MULTIPLE_CHOICE',
    text: bq.content || '',
    attachedImage: bq.attachedImage || null,
    points: bq.points ?? 1,
    orderIndex: bq.orderIndex ?? 0,
    subjectGroup: null,
    options: (bq.options || [])
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map(o => ({ id: String(o.id), text: o.content || '', isCorrect: !!o.isCorrect, attachedImage: o.attachedImage || null })),
    matchingPairs: (bq.matchingPairs || [])
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map(mp => ({ id: String(mp.id), left: mp.leftItem || '', right: mp.rightItem || '' })),
    sampleAnswer: bq.correctAnswer || '',
});

const editorToBank = (subjectId, eq) => ({
    subjectId,
    content: eq.text,
    attachedImage: eq.attachedImage || null,
    questionType: FRONTEND_TO_BACKEND[eq.type] || 'MCQ',
    points: eq.points ?? 1,
    orderIndex: eq.orderIndex ?? 0,
    correctAnswer: eq.sampleAnswer || null,
    options: (eq.options || []).map((o, i) => ({
        content: o.text || '',
        isCorrect: !!o.isCorrect,
        orderIndex: i,
        attachedImage: o.attachedImage || null,
    })),
    matchingPairs: (eq.matchingPairs || []).map((mp, i) => ({
        leftItem: mp.left || '',
        rightItem: mp.right || '',
        orderIndex: i,
    })),
});

const newEditorQuestion = (orderIndex) => ({
    id: `new-${Date.now()}`,
    _bankId: null,
    type: 'MULTIPLE_CHOICE',
    text: '',
    attachedImage: null,
    points: 1,
    orderIndex,
    subjectGroup: null,
    options: [
        { id: `o1-${Date.now()}`, text: 'A', isCorrect: false },
        { id: `o2-${Date.now()}`, text: 'B', isCorrect: false },
        { id: `o3-${Date.now()}`, text: 'C', isCorrect: false },
        { id: `o4-${Date.now()}`, text: 'D', isCorrect: false },
    ],
    matchingPairs: [],
    sampleAnswer: '',
});

// ── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({ question, onClose }) => {
    if (!question) return null;
    const isChoice = question.type === 'MULTIPLE_CHOICE' || question.type === 'MULTI_SELECT';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLORS[question.type] || 'bg-gray-100 text-gray-600'}`}>
                            {TYPE_LABELS[question.type] || question.type}
                        </span>
                        <span className="text-xs text-gray-400">{question.points} bal</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    <div className="text-sm font-medium text-gray-900">
                        <LatexPreview content={question.text || '—'} />
                    </div>
                    {isChoice && question.options?.length > 0 && (
                        <div className="space-y-2">
                            {question.options.map((o, i) => (
                                <div key={o.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${o.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-100'}`}>
                                    {o.isCorrect
                                        ? <HiOutlineCheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                        : <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0 flex items-center justify-center text-[10px] text-gray-400 font-bold">{String.fromCharCode(65 + i)}</span>
                                    }
                                    <LatexPreview content={o.text} />
                                </div>
                            ))}
                        </div>
                    )}
                    {question.type === 'MATCHING' && question.matchingPairs?.length > 0 && (
                        <div className="space-y-2">
                            {question.matchingPairs.map((mp) => (
                                <div key={mp.id} className="flex items-center gap-3 text-sm bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                    <span className="font-medium text-indigo-700 min-w-0 flex-1"><LatexPreview content={mp.left} /></span>
                                    <span className="text-gray-400">→</span>
                                    <span className="text-gray-700 min-w-0 flex-1 text-right"><LatexPreview content={mp.right} /></span>
                                </div>
                            ))}
                        </div>
                    )}
                    {(question.type === 'OPEN_AUTO' || question.type === 'OPEN_MANUAL' || question.type === 'FILL_IN_THE_BLANK') && question.sampleAnswer && (
                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                            <p className="text-xs font-semibold text-green-700 mb-1">Düzgün cavab</p>
                            <p className="text-sm text-green-800"><LatexPreview content={question.sampleAnswer} /></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({ question, onSave, onClose, saving }) => {
    const [local, setLocal] = useState(question);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Sualı redaktə et</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>
                <QuestionEditor
                    question={local}
                    index={0}
                    onChange={(_qId, updated) => setLocal(prev => ({ ...updated, id: prev.id, _bankId: prev._bankId }))}
                    onDelete={null}
                    hidePoints={false}
                    hideDelete
                />
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm">Ləğv et</button>
                    <button
                        onClick={() => onSave(local)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                    >
                        <HiOutlineSave className="w-4 h-4" />
                        {saving ? 'Saxlanılır...' : 'Yadda saxla'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
const AdminQuestionBankSubject = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [viewQuestion, setViewQuestion] = useState(null);
    const [editQuestion, setEditQuestion] = useState(null);

    const filteredQuestions = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return questions;
        return questions.filter(question =>
            question.text.toLowerCase().includes(q) ||
            (question.options || []).some(o => o.text.toLowerCase().includes(q))
        );
    }, [questions, search]);

    useEffect(() => { fetchData(); }, [subjectId]);

    const fetchData = async () => {
        try {
            const [subjectsRes, questionsRes] = await Promise.all([
                api.get('/bank/subjects'),
                api.get(`/bank/subjects/${subjectId}/questions`),
            ]);
            const found = subjectsRes.data.find(s => String(s.id) === String(subjectId));
            setSubject(found || { name: 'Fənn', isGlobal: false });
            setQuestions(questionsRes.data.map(bankToEditor));
        } catch {
            toast.error('Məlumatlar yüklənmədi');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (localQuestion) => {
        if (!localQuestion.text.trim()) { toast.error('Sualın mətni boş ola bilməz'); return; }
        setSaving(true);
        try {
            const payload = editorToBank(Number(subjectId), localQuestion);
            let saved;
            if (localQuestion._bankId) {
                const { data } = await api.put(`/bank/questions/${localQuestion._bankId}`, payload);
                saved = data;
            } else {
                const { data } = await api.post('/bank/questions', payload);
                saved = data;
            }
            const updated = bankToEditor(saved);
            setQuestions(prev => prev.map(q => q.id === localQuestion.id ? updated : q));
            setEditQuestion(null);
            toast.success('Sual yadda saxlanıldı');
        } catch {
            toast.error('Yadda saxlanılmadı');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (localId) => {
        const q = questions.find(q => q.id === localId);
        if (!q) return;
        if (q._bankId) {
            if (!window.confirm('Bu sualı silmək istədiyinizdən əminsiniz?')) return;
            try {
                await api.delete(`/bank/questions/${q._bankId}`);
                toast.success('Sual silindi');
            } catch {
                toast.error('Xəta baş verdi');
                return;
            }
        }
        setQuestions(prev => prev.filter(q => q.id !== localId));
    };

    const handleAddQuestion = () => {
        const newQ = newEditorQuestion(questions.length);
        setQuestions(prev => [...prev, newQ]);
        setEditQuestion(newQ);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="p-6 pb-24 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/sual-bazasi')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <HiOutlineArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <HiOutlineBookOpen className="w-5 h-5 text-indigo-600 shrink-0" />
                    <h1 className="text-lg font-bold text-gray-900 truncate">{subject?.name}</h1>
                    {subject?.isGlobal && (
                        <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full shrink-0">Ümumi baza</span>
                    )}
                </div>
                <div className="relative w-56">
                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Sual axtar..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                    />
                </div>
                <button
                    onClick={handleAddQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                    <HiOutlinePlus className="w-4 h-4" /> Yeni sual
                </button>
            </div>

            {/* Table */}
            {questions.length === 0 ? (
                <div className="text-center py-20">
                    <HiOutlineBookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Bu fənndə hələ sual yoxdur</p>
                    <button onClick={handleAddQuestion} className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm">
                        İlk sualı əlavə et
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-3 text-left w-10">#</th>
                                <th className="px-4 py-3 text-left">Sual mətni</th>
                                <th className="px-4 py-3 text-left w-36">Tip</th>
                                <th className="px-4 py-3 text-center w-16">Bal</th>
                                <th className="px-4 py-3 text-right w-28">Əməliyyatlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400">
                                        <HiOutlineSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p>Axtarışa uyğun sual tapılmadı</p>
                                    </td>
                                </tr>
                            ) : filteredQuestions.map((q, idx) => (
                                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-xs text-gray-400 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="line-clamp-2 text-gray-800">
                                            <LatexPreview content={q.text || '—'} />
                                        </div>
                                        {!q._bankId && (
                                            <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">Yadda saxlanılmayıb</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_COLORS[q.type] || 'bg-gray-100 text-gray-600'}`}>
                                            {TYPE_LABELS[q.type] || q.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold text-gray-700">{q.points}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => setViewQuestion(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Bax">
                                                <HiOutlineEye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setEditQuestion(q)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Redaktə et">
                                                <HiOutlinePencil className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Sil">
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {viewQuestion && <ViewModal question={viewQuestion} onClose={() => setViewQuestion(null)} />}
            {editQuestion && (
                <EditModal
                    question={editQuestion}
                    onSave={handleSave}
                    onClose={() => setEditQuestion(null)}
                    saving={saving}
                />
            )}
        </div>
    );
};

export default AdminQuestionBankSubject;
