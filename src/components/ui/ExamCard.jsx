import { useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineClock, HiOutlineDocumentText, HiOutlineEye, HiOutlineEyeOff, HiOutlineShare, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineChartBar, HiOutlineAcademicCap, HiLockClosed, HiOutlineDownload, HiOutlineDuplicate, HiOutlineClipboardCheck, HiOutlineKey, HiOutlineX } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EXAM_TYPE_LABELS = { FREE: 'Sərbəst', TEMPLATE: 'Şablon' };

const AccessCodeModal = ({ code, onClose }) => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 rounded-xl">
                            <HiOutlineKey className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">Tələbə Giriş Kodu</p>
                            <p className="text-xs text-gray-400">Tələbəyə göndər</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>

                <div
                    onClick={copy}
                    className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 cursor-pointer hover:bg-indigo-100 transition-colors mb-3"
                >
                    <span className="text-3xl font-black tracking-[0.4em] text-indigo-700 font-mono">{code}</span>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {copied ? '✓ Kopyalandı' : 'Kopyala'}
                    </span>
                </div>

                <p className="text-xs text-gray-400 text-center mb-4">Bu kod yalnız <b>1 dəfə</b> istifadə edilə bilər · <b>12 saat</b> keçərlidir</p>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                >
                    Bağla
                </button>
            </div>
        </div>,
        document.body
    );
};

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
                className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-60 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100 transition-colors"
            >
                <HiOutlineKey className={`w-3.5 h-3.5 ${generating ? 'animate-pulse' : ''}`} />
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
            <div className="p-5 flex-1 flex flex-col">

                {/* Top row: type + status + actions */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                        {typeLabel && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wide">
                                {typeLabel}
                            </span>
                        )}
                        {isDraft ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 text-[11px] font-bold">
                                Qaralama
                            </span>
                        ) : (
                            onToggleStatus ? (
                                <button
                                    onClick={() => onToggleStatus(exam.id)}
                                    title={isPublished ? 'Bağlamaq üçün klikləyin' : 'Açmaq üçün klikləyin'}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-opacity hover:opacity-75 ${isPublished ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
                                >
                                    {isPublished ? <HiOutlineEye className="w-3 h-3" /> : <HiOutlineEyeOff className="w-3 h-3" />}
                                    {isPublished ? 'Açıq' : 'Bağlı'}
                                </button>
                            ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${isPublished ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                    {isPublished ? <HiOutlineEye className="w-3 h-3" /> : <HiOutlineEyeOff className="w-3 h-3" />}
                                    {isPublished ? 'Açıq' : 'Bağlı'}
                                </span>
                            )
                        )}
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-0.5 -mr-1">
                        {!isDraft && onShare && (
                            <button onClick={() => onShare(exam.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Paylaş">
                                <HiOutlineShare className="w-4 h-4" />
                            </button>
                        )}
                        {!isDraft && onDownloadPdf && (
                            canDownloadPdf ? (
                                <button onClick={() => onDownloadPdf(exam.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="PDF Yüklə">
                                    <HiOutlineDownload className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg" title="PDF yükləmə cari planınızda mövcud deyil">
                                    <HiLockClosed className="w-4 h-4" />
                                </span>
                            )
                        )}
                        {canEdit ? (
                            <Link to={`/imtahanlar/duzenle/${exam.id}`} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Düzəliş et">
                                <HiOutlinePencilAlt className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg" title="İmtahan redaktəsi cari planınızda mövcud deyil">
                                <HiLockClosed className="w-4 h-4" />
                            </span>
                        )}
                        {onClone && (
                            <button onClick={() => onClone(exam.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Kopyala">
                                <HiOutlineDuplicate className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => onDelete(exam.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Testi sil">
                            <HiOutlineTrash className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Pending manual grading banner */}
                {exam.pendingManualCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100 mb-3">
                        <HiOutlineClipboardCheck className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-xs font-semibold text-orange-700">{exam.pendingManualCount} yoxlanılmağı gözləyir</span>
                    </div>
                )}

                {/* Access code widget for PRIVATE non-draft exams */}
                {exam.visibility === 'PRIVATE' && !isDraft && (
                    <div className="mb-3">
                        <AccessCodeButton examId={exam.id} />
                    </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                    {exam.title}
                </h3>

                {/* Tags */}
                {(exam.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {(exam.tags || []).map((tag, index) => (
                            onTagClick ? (
                                <button
                                    key={index}
                                    onClick={() => onTagClick(tag)}
                                    className="px-2 py-0.5 bg-gray-100 hover:bg-indigo-100 hover:text-indigo-700 text-gray-500 text-[11px] rounded-full font-medium transition-colors"
                                    title={`"${tag}" teqinə görə filtrele`}
                                >
                                    #{tag}
                                </button>
                            ) : (
                                <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] rounded-full font-medium">
                                    #{tag}
                                </span>
                            )
                        ))}
                    </div>
                )}

                {/* Meta info */}
                <div className="mt-auto flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    {subjects.length > 0 && (
                        <span className="flex items-center gap-1.5" title="Fənnlər">
                            <HiOutlineAcademicCap className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-700 truncate max-w-[120px]">{subjects.join(', ')}</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1.5" title="Müddət">
                        <HiOutlineClock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{exam.duration ? `${exam.duration} dəq` : 'Sərbəst'}</span>
                    </span>
                    <span className="flex items-center gap-1.5" title="Sual sayı">
                        <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">{exam.questionCount} sual</span>
                    </span>
                </div>
            </div>

            {/* Footer: Primary Actions */}
            {isDraft ? (
                <div className="px-5 pb-5">
                    {canEdit ? (
                        <Link
                            to={`/imtahanlar/duzenle/${exam.id}`}
                            className="flex justify-center items-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors w-full"
                        >
                            <HiOutlinePencilAlt className="w-4 h-4" />
                            Davam Et
                        </Link>
                    ) : (
                        <div className="flex justify-center items-center gap-2 py-2.5 bg-gray-200 text-gray-400 text-sm font-semibold rounded-xl w-full cursor-not-allowed">
                            <HiLockClosed className="w-4 h-4" />
                            Redaktə Bağlı
                        </div>
                    )}
                </div>
            ) : (
                <div className="px-5 pb-5 grid grid-cols-2 gap-2">
                    <Link
                        to={`/imtahanlar/${exam.id}`}
                        className="flex justify-center items-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineEye className="w-4 h-4" />
                        İmtahana bax
                    </Link>
                    <Link
                        to={`/imtahanlar/${exam.id}/statistika`}
                        className="flex justify-center items-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineChartBar className="w-4 h-4" />
                        Statistika
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ExamCard;
