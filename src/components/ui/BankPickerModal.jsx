import { useState, useEffect } from 'react';
import {
    HiOutlineX, HiOutlineBookOpen, HiOutlineSearch,
    HiOutlineChevronRight, HiOutlineArrowLeft, HiOutlineGlobe, HiOutlineUser
} from 'react-icons/hi';
import LatexPreview from './LatexPreview';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TYPE_LABELS = {
    MCQ: 'Qapalı', TRUE_FALSE: 'D/Y', MULTI_SELECT: 'Çox seçimli',
    OPEN_AUTO: 'Açıq (Avto)', OPEN_MANUAL: 'Açıq (Müəllim)',
    FILL_IN_THE_BLANK: 'Boşluq', MATCHING: 'Uyğunlaşdırma',
};
const TYPE_COLORS = {
    MCQ: 'bg-indigo-50 text-indigo-700', TRUE_FALSE: 'bg-blue-50 text-blue-700',
    MULTI_SELECT: 'bg-violet-50 text-violet-700', OPEN_AUTO: 'bg-green-50 text-green-700',
    OPEN_MANUAL: 'bg-orange-50 text-orange-700', FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
    MATCHING: 'bg-pink-50 text-pink-700',
};
const BACKEND_FRONTEND_MAP = {
    MCQ: 'MULTIPLE_CHOICE', TRUE_FALSE: 'MULTIPLE_CHOICE',
    MULTI_SELECT: 'MULTI_SELECT', OPEN_AUTO: 'OPEN_AUTO',
    OPEN_MANUAL: 'OPEN_MANUAL', FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};

/**
 * BankPickerModal
 * Props:
 *   onSelect(bankQuestion) – called with the raw BankQuestionResponse
 *   onClose()
 *   filterType – optional: only show questions of this frontend type
 */
const BankPickerModal = ({ onSelect, onClose, filterType = null }) => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingQuestions, setLoadingQuestions] = useState(false);

    useEffect(() => {
        api.get('/bank/subjects')
            .then(r => setSubjects(r.data))
            .catch(() => toast.error('Fənnlər yüklənmədi'))
            .finally(() => setLoadingSubjects(false));
    }, []);

    const openSubject = async (subject) => {
        setSelectedSubject(subject);
        setLoadingQuestions(true);
        try {
            const { data } = await api.get(`/bank/subjects/${subject.id}/questions`);
            setQuestions(data);
        } catch {
            toast.error('Suallar yüklənmədi');
        } finally {
            setLoadingQuestions(false);
        }
    };

    const handleBack = () => {
        setSelectedSubject(null);
        setQuestions([]);
        setSearch('');
    };

    const filteredQuestions = questions.filter(q => {
        return !search || q.content.toLowerCase().includes(search.toLowerCase());
    });

    const globalSubjects = subjects.filter(s => s.isGlobal);
    const ownSubjects = subjects.filter(s => !s.isGlobal);

    const SubjectButton = ({ s }) => (
        <button
            onClick={() => openSubject(s)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
        >
            <div className={`p-2 rounded-xl shrink-0 ${s.isGlobal ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {s.isGlobal ? <HiOutlineGlobe className="w-4 h-4" /> : <HiOutlineBookOpen className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                <p className="text-xs text-gray-400">{s.questionCount} sual</p>
            </div>
            <HiOutlineChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {selectedSubject && (
                            <button onClick={handleBack} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                                <HiOutlineArrowLeft className="w-4 h-4" />
                            </button>
                        )}
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {selectedSubject ? selectedSubject.name : 'Sual Bazası'}
                            </h2>
                            {selectedSubject && filterType && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Fərqli tipli suallardan yalnız mətn köçürüləcək
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                {/* Search (only in question view) */}
                {selectedSubject && (
                    <div className="px-5 py-3 border-b border-gray-100">
                        <div className="relative">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Sual axtar..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
                            />
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {!selectedSubject ? (
                        loadingSubjects ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        ) : subjects.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <HiOutlineBookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="text-sm">Sual bazanız boşdur</p>
                            </div>
                        ) : (
                            <div>
                                {globalSubjects.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                                            <HiOutlineGlobe className="w-3.5 h-3.5 text-purple-500" />
                                            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Ümumi baza</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {globalSubjects.map(s => <SubjectButton key={s.id} s={s} />)}
                                        </div>
                                    </div>
                                )}
                                {ownSubjects.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                                            <HiOutlineUser className="w-3.5 h-3.5 text-indigo-500" />
                                            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Şəxsi baza</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {ownSubjects.map(s => <SubjectButton key={s.id} s={s} />)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        loadingQuestions ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                {questions.length === 0 ? 'Bu fənndə sual yoxdur' : 'Axtarış üzrə nəticə tapılmadı'}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredQuestions.map((q, idx) => {
                                    const isDifferentType = filterType && BACKEND_FRONTEND_MAP[q.questionType] !== filterType;
                                    return (
                                    <div
                                        key={q.id}
                                        onClick={() => onSelect(q)}
                                        className="flex items-start gap-3 px-5 py-4 hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                                    >
                                        <span className="text-xs font-bold text-gray-400 mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[q.questionType] || 'bg-gray-100 text-gray-600'}`}>
                                                    {TYPE_LABELS[q.questionType] || q.questionType}
                                                </span>
                                                <span className="text-[10px] text-gray-400">{q.points} bal</span>
                                                {isDifferentType && (
                                                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                        Yalnız mətn köçürüləcək
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-800">
                                                <LatexPreview content={q.content} />
                                            </div>
                                        </div>
                                        <span className="text-xs text-indigo-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">Seç</span>
                                    </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default BankPickerModal;
