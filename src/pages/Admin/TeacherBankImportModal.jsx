import { useState, useMemo } from 'react';
import {
    HiOutlineX, HiOutlineSearch, HiOutlineArrowRight, HiOutlineDownload,
    HiOutlineCheckCircle, HiOutlineAcademicCap, HiOutlineUser,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAdminUsers } from '../../hooks/admin/useAdminUsers';
import {
    useTeacherBankSubjects,
    useAdminSubjectQuestions,
    useImportFromTeacher,
} from '../../hooks/admin/useAdminQuestionBank';

const QUESTION_TYPE_LABELS = {
    MCQ: 'Qapalı', MULTIPLE_CHOICE: 'Qapalı', MULTI_SELECT: 'Çox seçimli',
    OPEN_AUTO: 'Açıq (avtomatik)', OPEN_MANUAL: 'Açıq (yoxlanılan)',
    MATCHING: 'Uyğunlaşdırma', FILL_IN_THE_BLANK: 'Boşluq doldurma', TRUE_FALSE: 'Doğru/Yanlış',
};

// Bank question content is HTML/LaTeX; for a selection list a plain-text
// preview is enough — strip tags and collapse whitespace.
const plain = (html) => (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Admin flow: pick a teacher → pick that teacher's subject → choose all or
 * specific questions → import (deep-copy) into the site's central bank, either
 * a new global subject or an existing one.
 */
const TeacherBankImportModal = ({ onClose }) => {
    const [teacher, setTeacher] = useState(null);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [sourceSubject, setSourceSubject] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set()); // empty = all
    const [destMode, setDestMode] = useState('new'); // 'new' | 'existing'
    const [destName, setDestName] = useState('');
    const [destSubjectId, setDestSubjectId] = useState('');

    const { data: usersData, isLoading: loadingUsers } = useAdminUsers({ role: 'TEACHER', search: teacherSearch, size: 50 });
    const teachers = usersData?.content ?? usersData ?? [];

    const { data: srcSubjects = [], isLoading: loadingSubjects } = useTeacherBankSubjects(teacher?.id);
    const { data: questions = [], isLoading: loadingQuestions } = useAdminSubjectQuestions(sourceSubject?.id);

    // Destination = existing site (global) subjects, fetched for admin.
    const { data: siteSubjects = [] } = useQuery({
        queryKey: ['admin', 'bank', 'site-subjects'],
        queryFn: () => api.get('/bank/subjects').then(r => r.data),
    });

    const importMut = useImportFromTeacher();

    const allSelected = questions.length > 0 && selectedIds.size === 0;
    const selectedCount = selectedIds.size === 0
        ? questions.length
        : [...selectedIds].filter(id => id !== -1).length;

    const toggleQuestion = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            // empty set means "all" — materialise the full set first, then toggle off
            if (next.size === 0) questions.forEach(q => next.add(q.id));
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const selectAll = () => setSelectedIds(new Set());        // empty = all
    const clearAll = () => setSelectedIds(new Set([-1]));     // sentinel = none selected

    const effectiveIds = useMemo(() => {
        if (selectedIds.size === 0) return null;              // all
        return [...selectedIds].filter(id => id !== -1);
    }, [selectedIds]);

    const noneSelected = selectedIds.size > 0 && (effectiveIds?.length ?? 0) === 0;

    const handleImport = async () => {
        if (!sourceSubject) { toast.error('Fənn seçin'); return; }
        if (noneSelected) { toast.error('Ən azı bir sual seçin'); return; }
        if (destMode === 'existing' && !destSubjectId) { toast.error('Hədəf bazanı seçin'); return; }
        try {
            const res = await importMut.mutateAsync({
                sourceSubjectId: sourceSubject.id,
                targetSubjectId: destMode === 'existing' ? Number(destSubjectId) : null,
                targetSubjectName: destMode === 'new' ? (destName.trim() || sourceSubject.name) : null,
                questionIds: effectiveIds,
            });
            toast.success(`${res.imported} sual "${res.targetSubjectName}" bazasına əlavə edildi`);
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'İdxal uğursuz oldu');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <HiOutlineDownload className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Müəllimdən idxal</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {/* Step 1 — teacher */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                            <HiOutlineUser className="w-3.5 h-3.5" /> 1. Müəllim
                        </label>
                        {teacher ? (
                            <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                <span className="text-sm font-semibold text-blue-900">{teacher.fullName || teacher.email}</span>
                                <button onClick={() => { setTeacher(null); setSourceSubject(null); setSelectedIds(new Set()); }}
                                    className="text-xs font-semibold text-blue-600 hover:underline">Dəyiş</button>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-2">
                                    <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)}
                                        placeholder="Müəllimi ad/e-poçt ilə axtar..."
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
                                </div>
                                <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                                    {loadingUsers ? (
                                        <div className="px-3 py-3 text-sm text-gray-400">Yüklənir...</div>
                                    ) : teachers.length === 0 ? (
                                        <div className="px-3 py-3 text-sm text-gray-400">Müəllim tapılmadı</div>
                                    ) : teachers.map(t => (
                                        <button key={t.id} onClick={() => setTeacher(t)}
                                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between">
                                            <span className="font-medium text-gray-800">{t.fullName || t.email}</span>
                                            <span className="text-xs text-gray-400">{t.email}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Step 2 — source subject */}
                    {teacher && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                <HiOutlineAcademicCap className="w-3.5 h-3.5" /> 2. Müəllimin fənni
                            </label>
                            {loadingSubjects ? (
                                <div className="text-sm text-gray-400">Yüklənir...</div>
                            ) : srcSubjects.length === 0 ? (
                                <div className="text-sm text-gray-400">Bu müəllimin sual bazası yoxdur</div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {srcSubjects.map(s => (
                                        <button key={s.id}
                                            onClick={() => { setSourceSubject(s); setSelectedIds(new Set()); setDestName(s.name); }}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                                                sourceSubject?.id === s.id
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                                            }`}>
                                            {s.name} <span className="opacity-70">· {s.questionCount ?? 0}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3 — questions */}
                    {sourceSubject && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    3. Suallar ({selectedCount}/{questions.length})
                                </label>
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                    <button onClick={selectAll} className={`px-2 py-0.5 rounded ${allSelected ? 'bg-blue-100 text-blue-700' : 'text-blue-600 hover:underline'}`}>Hamısı</button>
                                    <button onClick={clearAll} className="text-gray-500 hover:underline">Təmizlə</button>
                                </div>
                            </div>
                            {loadingQuestions ? (
                                <div className="text-sm text-gray-400">Yüklənir...</div>
                            ) : questions.length === 0 ? (
                                <div className="text-sm text-gray-400">Bu fənndə sual yoxdur</div>
                            ) : (
                                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                                    {questions.map((q, i) => {
                                        const isChecked = selectedIds.size === 0 ? true : selectedIds.has(q.id);
                                        return (
                                            <label key={q.id} className="flex items-start gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                                <input type="checkbox" checked={isChecked} onChange={() => toggleQuestion(q.id)}
                                                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-gray-800 line-clamp-2">
                                                        <span className="text-gray-400 font-mono text-xs mr-1">{i + 1}.</span>
                                                        {plain(q.content) || <span className="italic text-gray-400">(mətnsiz — şəkil)</span>}
                                                    </div>
                                                    <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                                        {QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4 — destination */}
                    {sourceSubject && questions.length > 0 && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                                4. Sayt bazasına hara
                            </label>
                            <div className="flex gap-2 mb-2">
                                <button onClick={() => setDestMode('new')}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border ${destMode === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                                    Yeni baza
                                </button>
                                <button onClick={() => setDestMode('existing')}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border ${destMode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                                    Mövcud baza
                                </button>
                            </div>
                            {destMode === 'new' ? (
                                <input value={destName} onChange={e => setDestName(e.target.value)}
                                    placeholder={sourceSubject.name}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none" />
                            ) : (
                                <select value={destSubjectId} onChange={e => setDestSubjectId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none bg-white">
                                    <option value="">Baza seçin...</option>
                                    {siteSubjects.filter(s => s.isGlobal).map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.questionCount ?? 0})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl">Ləğv et</button>
                    <button onClick={handleImport}
                        disabled={!sourceSubject || questions.length === 0 || noneSelected || importMut.isPending}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl">
                        {importMut.isPending
                            ? <>İdxal edilir...</>
                            : <><HiOutlineCheckCircle className="w-4 h-4" /> {selectedCount} sualı idxal et <HiOutlineArrowRight className="w-4 h-4" /></>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherBankImportModal;
