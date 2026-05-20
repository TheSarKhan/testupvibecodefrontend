import { useState } from 'react';
import { HiOutlineClock, HiOutlineDocumentText, HiOutlineEye, HiOutlineEyeOff, HiOutlineShare, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineChartBar, HiOutlineAcademicCap, HiLockClosed, HiOutlineDownload, HiOutlineDuplicate, HiOutlineClipboardCheck, HiOutlineKey } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import AccessCodeModal from './AccessCodeModal';

const EXAM_TYPE_LABELS = { FREE: 'Sərbəst', TEMPLATE: 'Şablon' };

const AccessCodeButton = ({ examId }) => {
    const [generating, setGenerating] = useState(false);
    const [modalCode, setModalCode] = useState(null);

    const generate = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        setGenerating(true);
        try {
            const { data } = await api.post(`/exams/${examId}/generate-code`);
            setModalCode(data.accessCode);
        } catch {
            toast.error('Kod yaradılmadı');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <>
            <button
                onClick={generate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 disabled:opacity-60 text-blue-700 text-sm font-bold rounded-xl border border-blue-100 transition-colors"
            >
                <HiOutlineKey className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                {generating ? 'Yaradılır...' : 'Tələbə Kodu Yarat'}
            </button>
            {modalCode && <AccessCodeModal code={modalCode} onClose={() => setModalCode(null)} />}
        </>
    );
};

const ExamCard = ({ exam, onDelete, onShare, onToggleStatus, onDownloadPdf, onClone, onTagClick, canEdit = true, canDownloadPdf = true }) => {

    const isDraft = exam.status === 'DRAFT';
    const isPublished = exam.status === 'PUBLISHED';
    const typeLabel = EXAM_TYPE_LABELS[exam.examType] || exam.examType || '';
    const subjects = exam.subjects || [];

    return (
        <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full ${isDraft ? 'border-dashed border-gray-300' : 'border-gray-100'}`}>

            {/* Body */}
            <div className="p-7 flex-1 flex flex-col">

                {/* Top row: type + status + actions */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {typeLabel && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wide">
                                {typeLabel}
                            </span>
                        )}
                        {isDraft ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 text-xs font-bold">
                                Qaralama
                            </span>
                        ) : (
                            onToggleStatus ? (
                                <button
                                    onClick={() => onToggleStatus(exam.id)}
                                    title={isPublished ? 'Bağlamaq üçün klikləyin' : 'Açmaq üçün klikləyin'}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-opacity hover:opacity-75 ${isPublished ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                                >
                                    {isPublished ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                                    {isPublished ? 'Açıq' : 'Bağlı'}
                                </button>
                            ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${isPublished ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {isPublished ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                                    {isPublished ? 'Açıq' : 'Bağlı'}
                                </span>
                            )
                        )}
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5 -mr-1">
                        {!isDraft && onShare && (
                            <button onClick={() => onShare(exam.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Paylaş">
                                <HiOutlineShare className="w-5 h-5" />
                            </button>
                        )}
                        {!isDraft && onDownloadPdf && (
                            canDownloadPdf ? (
                                <button onClick={() => onDownloadPdf(exam.id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="PDF Yüklə">
                                    <HiOutlineDownload className="w-5 h-5" />
                                </button>
                            ) : (
                                <span className="p-2 text-gray-300 cursor-not-allowed rounded-lg" title="PDF yükləmə cari planınızda mövcud deyil">
                                    <HiLockClosed className="w-5 h-5" />
                                </span>
                            )
                        )}
                        {canEdit ? (
                            <Link to={`/imtahanlar/duzenle/${exam.id}`} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Düzəliş et">
                                <HiOutlinePencilAlt className="w-5 h-5" />
                            </Link>
                        ) : (
                            <span className="p-2 text-gray-300 cursor-not-allowed rounded-lg" title="İmtahan redaktəsi cari planınızda mövcud deyil">
                                <HiLockClosed className="w-5 h-5" />
                            </span>
                        )}
                        {onClone && (
                            <button onClick={() => onClone(exam.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Kopyala">
                                <HiOutlineDuplicate className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={() => onDelete(exam.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Testi sil">
                            <HiOutlineTrash className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Pending manual grading banner */}
                {exam.pendingManualCount > 0 && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-orange-50 border border-orange-100 mb-4">
                        <HiOutlineClipboardCheck className="w-5 h-5 text-orange-500 shrink-0" />
                        <span className="text-sm font-semibold text-orange-700">{exam.pendingManualCount} yoxlanılmağı gözləyir</span>
                    </div>
                )}

                {/* Access code widget for PRIVATE non-draft exams */}
                {exam.visibility === 'PRIVATE' && !isDraft && (
                    <div className="mb-4">
                        <AccessCodeButton examId={exam.id} />
                    </div>
                )}

                {/* Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">
                    {exam.title}
                </h3>

                {/* Tags */}
                {(exam.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {(exam.tags || []).map((tag, index) => (
                            onTagClick ? (
                                <button
                                    key={index}
                                    onClick={() => onTagClick(tag)}
                                    className="px-2.5 py-1 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-500 text-xs rounded-full font-medium transition-colors"
                                    title={`"${tag}" teqinə görə filtrele`}
                                >
                                    #{tag}
                                </button>
                            ) : (
                                <span key={index} className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                                    #{tag}
                                </span>
                            )
                        ))}
                    </div>
                )}

                {/* Meta info */}
                <div className="mt-auto flex items-center gap-5 text-sm text-gray-500 pt-4 border-t border-gray-100">
                    {subjects.length > 0 && (
                        <span className="flex items-center gap-1.5" title="Fənnlər">
                            <HiOutlineAcademicCap className="w-[18px] h-[18px] text-gray-400" />
                            <span className="font-medium text-gray-700 truncate max-w-[160px]">{subjects.join(', ')}</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1.5" title="Müddət">
                        <HiOutlineClock className="w-[18px] h-[18px] text-gray-400" />
                        <span className="font-medium text-gray-700">{exam.duration ? `${exam.duration} dəq` : 'Sərbəst'}</span>
                    </span>
                    <span className="flex items-center gap-1.5" title="Sual sayı">
                        <HiOutlineDocumentText className="w-[18px] h-[18px] text-gray-400" />
                        <span className="font-medium text-gray-700">{exam.questionCount} sual</span>
                    </span>
                </div>
            </div>

            {/* Footer: Primary Actions */}
            {isDraft ? (
                <div className="px-7 pb-7">
                    {canEdit ? (
                        <Link
                            to={`/imtahanlar/duzenle/${exam.id}`}
                            className="flex justify-center items-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl transition-colors w-full"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                            Davam Et
                        </Link>
                    ) : (
                        <div className="flex justify-center items-center gap-2 py-3 bg-gray-200 text-gray-400 text-base font-semibold rounded-xl w-full cursor-not-allowed">
                            <HiLockClosed className="w-5 h-5" />
                            Redaktə Bağlı
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-7 pb-7 grid grid-cols-2 gap-2.5">
                    <Link
                        to={`/imtahanlar/${exam.id}`}
                        className="flex justify-center items-center gap-1.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineEye className="w-5 h-5" />
                        İmtahana bax
                    </Link>
                    <Link
                        to={`/imtahanlar/${exam.id}/statistika`}
                        className="flex justify-center items-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineChartBar className="w-5 h-5" />
                        Statistika
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ExamCard;
