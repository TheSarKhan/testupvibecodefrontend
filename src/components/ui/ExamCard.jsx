import { HiOutlineClock, HiOutlineDocumentText, HiOutlineEye, HiOutlineShare, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineChartBar } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const ExamCard = ({ exam, onDelete, onShare }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
            {/* Header: Main Tag and Actions */}
            <div className="p-5 border-b border-gray-50 flex justify-between items-start gap-4 bg-gray-50/50">
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wide">
                    {exam.mainTag}
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onShare(exam.id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Paylaş"
                    >
                        <HiOutlineShare className="w-5 h-5" />
                    </button>
                    <Link
                        to={`/imtahanlar/edit/${exam.id}`}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Düzəliş et"
                    >
                        <HiOutlinePencilAlt className="w-5 h-5" />
                    </Link>
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
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HiOutlineClock className="w-5 h-5 text-gray-400" />
                        <span>Müddət: <strong>{exam.duration} dəqiqə</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                        <span>Sual sayı: <strong>{exam.questionCount}</strong></span>
                    </div>
                </div>
            </div>

            {/* Footer: Primary Actions */}
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
        </div>
    );
};

export default ExamCard;
