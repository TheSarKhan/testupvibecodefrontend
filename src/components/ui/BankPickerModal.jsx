import { useState, useEffect, useMemo } from 'react';
import {
    HiOutlineX, HiOutlineBookOpen, HiOutlineSearch,
    HiOutlineChevronRight, HiOutlineArrowLeft, HiOutlineGlobe, HiOutlineUser,
    HiOutlineCheck, HiOutlineTag
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
    MCQ: 'bg-blue-50 text-blue-700', TRUE_FALSE: 'bg-blue-50 text-blue-700',
    MULTI_SELECT: 'bg-emerald-50 text-emerald-700', OPEN_AUTO: 'bg-green-50 text-green-700',
    OPEN_MANUAL: 'bg-orange-50 text-orange-700', FILL_IN_THE_BLANK: 'bg-yellow-50 text-yellow-700',
    MATCHING: 'bg-pink-50 text-pink-700',
};
const BACKEND_FRONTEND_MAP = {
    MCQ: 'MULTIPLE_CHOICE', TRUE_FALSE: 'MULTIPLE_CHOICE',
    MULTI_SELECT: 'MULTI_SELECT', OPEN_AUTO: 'OPEN_AUTO',
    OPEN_MANUAL: 'OPEN_MANUAL', FILL_IN_THE_BLANK: 'FILL_IN_THE_BLANK', MATCHING: 'MATCHING',
};
const DIFFICULTY_LABELS = { EASY: 'Asan', MEDIUM: 'Orta', HARD: 'Çətin' };
const DIFFICULTY_COLORS = {
    EASY: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-yellow-50 text-yellow-700',
    HARD: 'bg-red-50 text-red-700',
};
const GRADE_LEVELS = ['1-4', '5-8', '9-11', 'Buraxılış'];

/**
 * BankPickerModal
 * Props:
 *   onSelect(bankQuestion)   — kept for backward compatibility (single pick mode)
 *   onSelectMany(bankQuestions[]) — preferred: called once with all picked rows
 *   onClose()
 *   filterType – optional: only show questions of this frontend type
 *   allowMulti – default true; when false acts like the old single-pick modal
 */
const BankPickerModal = ({ onSelect, onSelectMany, onClose, filterType = null, allowMulti = true }) => {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [difficultyFilter, setDifficultyFilter] = useState('ALL');
    const [gradeFilter, setGradeFilter] = useState('ALL');
    const [topicFilter, setTopicFilter] = useState('ALL');
    const [selectedIds, setSelectedIds] = useState(() => new Set());
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
        setSelectedIds(new Set());
        setSearch(''); setTypeFilter('ALL'); setDifficultyFilter('ALL'); setGradeFilter('ALL'); setTopicFilter('ALL');
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
        setSelectedIds(new Set());
    };

    const filteredQuestions = useMemo(() => {
        const term = search.trim().toLowerCase();
        return questions.filter(q => {
            if (typeFilter !== 'ALL' && q.questionType !== typeFilter) return false;
            if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
            if (gradeFilter !== 'ALL' && q.gradeLevel !== gradeFilter) return false;
            if (topicFilter !== 'ALL' && q.topic !== topicFilter) return false;
            if (!term) return true;
            if (q.content?.toLowerCase().includes(term)) return true;
            if (q.correctAnswer?.toLowerCase().includes(term)) return true;
            return (q.options || []).some(o => (o.content || '').toLowerCase().includes(term));
        });
    }, [questions, search, typeFilter, difficultyFilter, gradeFilter, topicFilter]);

    const topics = useMemo(() => {
        const s = new Set(questions.map(q => q.topic).filter(Boolean));
        return [...s].sort();
    }, [questions]);
    const usedTypes = useMemo(() => {
        const s = new Set(questions.map(q => q.questionType).filter(Boolean));
        return [...s];
    }, [questions]);
    const usedDifficulties = useMemo(() => {
        const s = new Set(questions.map(q => q.difficulty).filter(Boolean));
        return ['EASY', 'MEDIUM', 'HARD'].filter(d => s.has(d));
    }, [questions]);
    const usedGrades = useMemo(() => {
        const s = new Set(questions.map(q => q.gradeLevel).filter(Boolean));
        return GRADE_LEVELS.filter(g => s.has(g));
    }, [questions]);

    const toggle = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAllFiltered = () => {
        setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    };
    const clearSelection = () => setSelectedIds(new Set());
    const pickRandom = (n) => {
        const pool = [...filteredQuestions];
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setSelectedIds(new Set(pool.slice(0, Math.min(n, pool.length)).map(q => q.id)));
    };

    const confirmBulk = () => {
        if (selectedIds.size === 0) return;
        const picked = questions.filter(q => selectedIds.has(q.id));
        if (onSelectMany) onSelectMany(picked);
        else if (onSelect) picked.forEach(p => onSelect(p));
        onClose?.();
    };

    const globalSubjects = subjects.filter(s => s.isGlobal);
    const ownSubjects = subjects.filter(s => !s.isGlobal);

    const SubjectButton = ({ s }) => (
        <button
            onClick={() => openSubject(s)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-100 transition-colors text-left"
        >
            <div className={`p-2 rounded-xl shrink-0 ${s.isGlobal ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        {selectedSubject && (
                            <button onClick={handleBack} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="Geri">
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

                {selectedSubject && (
                    <>
                        <div className="px-5 py-3 border-b border-gray-100 space-y-3">
                            <div className="relative">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Sual, variant və ya cavabda axtar..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                                />
                            </div>

                            {(usedTypes.length > 0 || usedDifficulties.length > 0 || usedGrades.length > 0 || topics.length > 0) && (
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {usedTypes.length > 0 && (
                                        <select
                                            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-full bg-white"
                                        >
                                            <option value="ALL">Bütün tiplər</option>
                                            {usedTypes.map(t => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
                                        </select>
                                    )}
                                    {usedDifficulties.length > 0 && (
                                        <select
                                            value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}
                                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-full bg-white"
                                        >
                                            <option value="ALL">Bütün çətinliklər</option>
                                            {usedDifficulties.map(d => <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>)}
                                        </select>
                                    )}
                                    {usedGrades.length > 0 && (
                                        <select
                                            value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
                                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-full bg-white"
                                        >
                                            <option value="ALL">Bütün siniflər</option>
                                            {usedGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    )}
                                    {topics.length > 0 && (
                                        <select
                                            value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
                                            className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-full bg-white max-w-[200px]"
                                        >
                                            <option value="ALL">Bütün mövzular</option>
                                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    )}
                                </div>
                            )}

                            {allowMulti && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={selectAllFiltered}
                                        className="text-xs font-semibold px-3 py-1.5 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-50"
                                    >
                                        Filtrlənənləri seç ({filteredQuestions.length})
                                    </button>
                                    <button
                                        onClick={() => pickRandom(10)}
                                        className="text-xs font-semibold px-3 py-1.5 border border-emerald-200 text-emerald-700 rounded-full hover:bg-emerald-50"
                                    >
                                        Təsadüfi 10
                                    </button>
                                    {selectedIds.size > 0 && (
                                        <button
                                            onClick={clearSelection}
                                            className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100"
                                        >
                                            Seçimi təmizlə
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-500 ml-auto">
                                        Seçilib: <b className="text-blue-700">{selectedIds.size}</b>
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="flex-1 overflow-y-auto">
                    {!selectedSubject ? (
                        loadingSubjects ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
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
                                            <HiOutlineGlobe className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Ümumi baza</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {globalSubjects.map(s => <SubjectButton key={s.id} s={s} />)}
                                        </div>
                                    </div>
                                )}
                                {ownSubjects.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                                            <HiOutlineUser className="w-3.5 h-3.5 text-blue-500" />
                                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Şəxsi baza</span>
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
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : filteredQuestions.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                {questions.length === 0 ? 'Bu fənndə sual yoxdur' : 'Filtrlərə uyğun sual tapılmadı'}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredQuestions.map((q, idx) => {
                                    const isDifferentType = filterType && BACKEND_FRONTEND_MAP[q.questionType] !== filterType;
                                    const checked = selectedIds.has(q.id);
                                    return (
                                    <div
                                        key={q.id}
                                        onClick={() => allowMulti ? toggle(q.id) : (onSelect?.(q), onClose?.())}
                                        className={`flex items-start gap-3 px-5 py-4 transition-colors cursor-pointer group ${checked ? 'bg-blue-50/60' : 'hover:bg-blue-50/30'}`}
                                    >
                                        {allowMulti && (
                                            <div className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                                            }`}>
                                                {checked && <HiOutlineCheck className="w-3.5 h-3.5" strokeWidth={3} />}
                                            </div>
                                        )}
                                        <span className="text-xs font-bold text-gray-400 mt-1 shrink-0 w-5">{idx + 1}.</span>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[q.questionType] || 'bg-gray-100 text-gray-600'}`}>
                                                    {TYPE_LABELS[q.questionType] || q.questionType}
                                                </span>
                                                {q.difficulty && (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty]}`}>
                                                        {DIFFICULTY_LABELS[q.difficulty]}
                                                    </span>
                                                )}
                                                {q.gradeLevel && (
                                                    <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
                                                        {q.gradeLevel}
                                                    </span>
                                                )}
                                                {q.topic && (
                                                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                                                        <HiOutlineTag className="w-2.5 h-2.5" />{q.topic}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-gray-400">{q.points} bal</span>
                                                {isDifferentType && (
                                                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                                                        Yalnız mətn köçürüləcək
                                                    </span>
                                                )}
                                            </div>
                                            {(() => {
                                                const stripped = (q.content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
                                                const hasText = stripped.length > 0;
                                                const hasImage = !!q.attachedImage;
                                                if (hasText) {
                                                    return (
                                                        <div className="text-sm text-gray-800 line-clamp-3">
                                                            <LatexPreview content={q.content} placeholder={null} />
                                                        </div>
                                                    );
                                                }
                                                if (hasImage) {
                                                    return (
                                                        <img
                                                            src={q.attachedImage}
                                                            alt=""
                                                            className="max-h-32 max-w-full rounded-md border border-gray-100 object-contain"
                                                        />
                                                    );
                                                }
                                                return (
                                                    <div className="text-sm text-gray-400 italic">Sualın şərti yoxdur</div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                {/* Sticky bulk action bar */}
                {selectedSubject && allowMulti && selectedIds.size > 0 && (
                    <div className="px-5 py-3 border-t border-gray-100 bg-gradient-to-r from-blue-50 to-emerald-50 flex items-center justify-between">
                        <p className="text-sm font-semibold text-blue-800">
                            {selectedIds.size} sual seçildi
                        </p>
                        <button
                            onClick={confirmBulk}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                        >
                            İmtahana əlavə et →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankPickerModal;
