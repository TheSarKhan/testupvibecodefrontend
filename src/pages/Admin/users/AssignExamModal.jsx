import { useState, useEffect, useRef } from 'react';
import {
    HiOutlineX, HiOutlineSearch, HiOutlineBookOpen,
    HiOutlineCheck, HiOutlinePlusCircle,
    HiOutlineChevronLeft, HiOutlineChevronRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAdminExams } from '../../../hooks/admin/useAdminExams';
import { useAssignExamToUser } from '../../../hooks/admin/useAdminUsers';

const STATUS_LABEL = {
    PUBLISHED: 'Dərc edilib',
    ACTIVE: 'Aktiv',
    DRAFT: 'Qaralama',
};

const STATUS_STYLE = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700',
    ACTIVE: 'bg-blue-100 text-blue-700',
};

const AssignExamModal = ({ user, onClose }) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(0);
    const [assignedExamIds, setAssignedExamIds] = useState(new Set());
    const [assigningExam, setAssigningExam] = useState(null);
    const debounceRef = useRef(null);

    const { data, isFetching: loading } = useAdminExams({
        search: debouncedSearch,
        page,
        size: 8,
    });
    const exams = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    const assignExamMut = useAssignExamToUser();

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(val);
            setPage(0);
        }, 400);
    };

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleAssign = async (examId) => {
        setAssigningExam(examId);
        try {
            await assignExamMut.mutateAsync({ userId: user.id, examId });
            setAssignedExamIds(prev => new Set([...prev, examId]));
            toast.success('İmtahan şagirdin deposuna əlavə edildi');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        } finally {
            setAssigningExam(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">İmtahan Əlavə Et</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            <span className="font-semibold text-gray-700">{user.fullName}</span> — şagirdin deposuna imtahan əlavə edin
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <HiOutlineX className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="px-7 py-4 border-b border-gray-50">
                    <div className="relative">
                        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İmtahan adı ilə axtar..."
                            value={search}
                            onChange={handleSearchChange}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-gray-50"
                            autoFocus
                        />
                        {search && (
                            <button onClick={() => { setSearch(''); setDebouncedSearch(''); setPage(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-7 py-3 space-y-2">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="text-center py-12">
                            <HiOutlineBookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">İmtahan tapılmadı</p>
                        </div>
                    ) : exams.map(exam => {
                        const isAssigned = assignedExamIds.has(exam.id);
                        const isAssigning = assigningExam === exam.id;
                        return (
                            <div key={exam.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${isAssigned ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{exam.title}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[exam.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_LABEL[exam.status] || exam.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-400">{exam.teacherName}</span>
                                        <span className={`text-xs font-bold ${exam.price ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {exam.price ? `${exam.price} ₼` : 'Pulsuz'}
                                        </span>
                                        {exam.questionCount != null && (
                                            <span className="text-xs text-gray-400">{exam.questionCount} sual</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => !isAssigned && handleAssign(exam.id)}
                                    disabled={isAssigned || isAssigning}
                                    className={`ml-4 shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                                        isAssigned
                                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60'
                                    }`}
                                >
                                    {isAssigning ? (
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : isAssigned ? (
                                        <><HiOutlineCheck className="w-4 h-4" /> Əlavə edildi</>
                                    ) : (
                                        <><HiOutlinePlusCircle className="w-4 h-4" /> Əlavə et</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1 px-7 py-4 border-t border-gray-100">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const start = Math.max(0, page - 2);
                            const n = start + i;
                            if (n >= totalPages) return null;
                            return (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${n === page ? 'bg-indigo-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {n + 1}
                                </button>
                            );
                        })}
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <HiOutlineChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssignExamModal;
