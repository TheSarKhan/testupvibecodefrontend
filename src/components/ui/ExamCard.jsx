import { HiOutlineClock, HiOutlineDocumentText, HiOutlineEye, HiOutlineEyeOff, HiOutlineShare, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineChartBar, HiOutlineAcademicCap, HiLockClosed, HiOutlineDownload } from 'react-icons/hi';

import { Link } from 'react-router-dom';

const EXAM_TYPE_LABELS = { FREE: 'Sərbəst', TEMPLATE: 'Şablon' };

const ExamCard = ({ exam, onDelete, onShare, onToggleStatus, onDownloadPdf, canEdit = true, canDownloadPdf = true }) => {

    const isDraft = exam.status === 'DRAFT';
    const isPublished = exam.status === 'PUBLISHED';
    const typeLabel = EXAM_TYPE_LABELS[exam.examType] || exam.examType || '';
    const subjects = exam.subjects || [];

    return (
        <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full ${isDraft ? 'border-dashed border-gray-300' : 'border-gray-100'}`}>
            {/* Header: Main Tag and Actions */}
            <div className="p-5 border-b border-gray-50 flex justify-between items-start gap-4 bg-gray-50/50">
                <div className="flex items-center gap-2 flex-wrap">
                    {typeLabel && (
                        <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
                            {typeLabel}
                        </div>
                    )}
                    {isDraft && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-semibold">
                            Qaralama
                        </span>
                    )}
                    {!isDraft && (
                        onToggleStatus ? (
                            <button
                                onClick={() => onToggleStatus(exam.id)}
                                title={isPublished ? 'Bağlamaq üçün klikləyin' : 'Açmaq üçün klikləyin'}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-75 cursor-pointer ${isPublished ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}
                            >
                                {isPublished ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                                {isPublished ? 'Açıq' : 'Bağlı'}
                            </button>
                        ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${isPublished ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {isPublished ? <HiOutlineEye className="w-3.5 h-3.5" /> : <HiOutlineEyeOff className="w-3.5 h-3.5" />}
                                {isPublished ? 'Açıq' : 'Bağlı'}
                            </span>
                        )
                    )}
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {!isDraft && onShare && (
                        <button
                            onClick={() => onShare(exam.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Paylaş"
                        >
                            <HiOutlineShare className="w-5 h-5" />
                        </button>
                    )}
                    {!isDraft && onDownloadPdf && (
                        canDownloadPdf ? (
                            <button
                                onClick={() => onDownloadPdf(exam.id)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="PDF Yüklə"
                            >
                                <HiOutlineDownload className="w-5 h-5" />
                            </button>
                        ) : (
                            <span 
                                className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg relative group"
                                title="PDF yükləmə cari planınızda mövcud deyil"
                            >
                                <HiLockClosed className="w-5 h-5" />
                            </span>
                        )
                    )}

                    {canEdit ? (
                        <Link
                            to={`/imtahanlar/duzenle/${exam.id}`}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Düzəliş et"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                        </Link>
                    ) : (
                        <span
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg relative group"
                            title="İmtahan redaktəsi cəri planınızda mövcud deyil"
                        >
                            <HiLockClosed className="w-5 h-5" />
                        </span>
                    )}
                    <button
                        onClick={() => onDelete(exam.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Testi sil"
                    >
                        <HiOutlineTrash className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 flex flex-col relative">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {exam.title}
                </h3>

                {/* Minor Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {exam.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            #{tag}
                        </span>
                    ))}
                </div>

                <div className="mt-auto space-y-3">
                    {subjects.length > 0 && (
                        <div className="flex items-start gap-2 text-gray-600 text-sm">
                            <HiOutlineAcademicCap className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>Fənnlər: <strong>{subjects.join(', ')}</strong></span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HiOutlineClock className="w-5 h-5 text-gray-400" />
                        <span>Müddət: <strong>{exam.duration ? `${exam.duration} dəqiqə` : 'Sərbəst'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                        <span>Sual sayı: <strong>{exam.questionCount}</strong></span>
                    </div>
                </div>
            </div>

            {/* Footer: Primary Actions */}
            {isDraft ? (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {canEdit ? (
                        <Link
                            to={`/imtahanlar/duzenle/${exam.id}`}
                            className="flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors w-full"
                        >
                            <HiOutlinePencilAlt className="w-5 h-5" />
                            Davam Et
                        </Link>
                    ) : (
                        <div className="flex justify-center items-center gap-2 py-2.5 px-4 bg-gray-200 text-gray-400 text-sm font-semibold rounded-xl w-full cursor-not-allowed">
                            <HiLockClosed className="w-5 h-5" />
                            Redaktə Bağlı (Plan)
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <Link
                        to={`/imtahanlar/${exam.id}`}
                        className="flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineEye className="w-5 h-5" />
                        İmtahana bax
                    </Link>
                    <Link
                        to={`/imtahanlar/${exam.id}/statistika`}
                        className="flex justify-center items-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
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
