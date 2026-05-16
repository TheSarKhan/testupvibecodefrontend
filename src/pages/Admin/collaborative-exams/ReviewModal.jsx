import { useState, useEffect } from 'react';
import { HiOutlineX, HiOutlineCheck } from 'react-icons/hi';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import {
    useApproveCollaborator,
    useRejectCollaborator,
} from '../../../hooks/admin/useAdminCollaborativeExams';

const ReviewModal = ({ collaborator, onClose, onAction }) => {
    const [draftQuestions, setDraftQuestions] = useState([]);
    const [loadingQ, setLoadingQ] = useState(false);
    const [rejectComment, setRejectComment] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const approveMut = useApproveCollaborator();
    const rejectMut = useRejectCollaborator();
    const actioning = approveMut.isPending || rejectMut.isPending;

    useEffect(() => {
        if (collaborator.draftExamId) {
            setLoadingQ(true);
            api.get(`/exams/${collaborator.draftExamId}/details`)
                .then(r => setDraftQuestions(r.data.questions || []))
                .catch(() => {})
                .finally(() => setLoadingQ(false));
        }
    }, [collaborator.draftExamId]);

    const handleApprove = async () => {
        try {
            await approveMut.mutateAsync(collaborator.id);
            toast.success('Suallar təsdiqləndi və əsl imtahana əlavə edildi');
            onAction();
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleReject = async () => {
        try {
            await rejectMut.mutateAsync({ collaboratorId: collaborator.id, comment: rejectComment });
            toast.success('Suallar geri qaytarıldı');
            onAction();
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">{collaborator.teacherName} — Suallar</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Fənnlər: {(collaborator.subjects || []).join(', ')}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {loadingQ ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : draftQuestions.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">Sual tapılmadı</p>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {draftQuestions.map((q, i) => (
                                <div key={q.id} className="bg-gray-50 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xs font-bold text-gray-400 shrink-0 mt-0.5">{i + 1}.</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 font-medium leading-snug">{q.content || '(mətn yoxdur)'}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{q.questionType}</span>
                                                {q.subjectGroup && <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{q.subjectGroup}</span>}
                                                <span className="text-[11px] font-semibold text-gray-500">{q.points} xal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showRejectForm ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="flex-1 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors"
                            >
                                Geri qaytar
                            </button>
                            <button
                                onClick={handleApprove} disabled={actioning || draftQuestions.length === 0}
                                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <HiOutlineCheck className="w-4 h-4" />
                                {actioning ? 'Gözləyin...' : 'Təsdiqlə'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <textarea
                                value={rejectComment} onChange={e => setRejectComment(e.target.value)} rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none"
                                placeholder="Müəllimə şərh (ixtiyari)"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setShowRejectForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Ləğv et
                                </button>
                                <button
                                    onClick={handleReject} disabled={actioning}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    {actioning ? 'Gözləyin...' : 'Geri qaytar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;
