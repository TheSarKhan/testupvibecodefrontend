import { useState, useEffect } from 'react';
import { HiOutlinePlusCircle, HiOutlineSearch, HiOutlineDocumentText } from 'react-icons/hi';
import { ExamCard, CreateExamModal } from '../../components/ui';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/exams');
            setExams(data);
        } catch (error) {
            console.error("Error fetching exams:", error);
            toast.error("İmtahanları yükləyərkən xəta baş verdi");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu imtahanı silmək istədiyinizə əminsiniz?')) return;

        try {
            await api.delete(`/exams/${id}`);
            toast.success("İmtahan silindi");
            setExams(exams.filter(e => e.id !== id));
        } catch (error) {
            toast.error("İmtahanı silmək mümkün olmadı");
        }
    };

    const handleShare = (id) => {
        const exam = exams.find(e => e.id === id);
        if (exam) {
            const link = `${window.location.origin}/imtahan/${exam.shareLink}`;
            navigator.clipboard.writeText(link);
            toast.success("Paylaşım linki kopyalandı");
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.tags && exam.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const subjectDisplayNames = {
        'RIYAZIYYAT': 'Riyaziyyat',
        'FIZIKA': 'Fizika',
        'KIMYA': 'Kimya',
        'BIOLOGIYA': 'Biologiya',
        'AZERBAYCAN_DILI': 'Azərbaycan dili',
        'INGILIS_DILI': 'İngilis dili',
        'TARIX': 'Tarix',
        'COGRAFIYA': 'Coğrafiya',
        'INFORMATIKA': 'Informatika',
        'MANTIQ': 'Məntiq'
    };

    return (
        <div className="bg-white min-h-screen py-10">
            <div className="container-main">

                {/* Header Sequence */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">İmtahanlarım</h1>
                        <p className="text-gray-600 mt-1">Yaratdığınız və idarə etdiyiniz imtahanların siyahısı.</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        <HiOutlinePlusCircle className="w-6 h-6" />
                        Yeni İmtahan
                    </button>
                </div>

                {/* Filters / Search */}
                <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 mb-8">
                    <HiOutlineSearch className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="İmtahan adı və ya tag ilə axtarış..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Grid of Exams */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredExams.map(exam => (
                                <ExamCard
                                    key={exam.id}
                                    exam={{
                                        ...exam,
                                        mainTag: subjectDisplayNames[exam.subject] || exam.subject,
                                        tags: exam.tags || [],
                                        duration: exam.durationMinutes,
                                        questionCount: exam.questions ? exam.questions.length : 0
                                    }}
                                    onDelete={handleDelete}
                                    onShare={handleShare}
                                />
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredExams.length === 0 && (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HiOutlineDocumentText className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {searchTerm ? 'Axtarışa uyğun imtahan tapılmadı' : 'Hələ heç bir imtahanınız yoxdur'}
                                </h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                    {searchTerm ? 'Axtarış terminini dəyişərək yenidən yoxlayın.' : 'İlk imtahanınızı yaratmaqla testup.az platformasının imkanlarından faydalanmağa başlayın.'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Exam Flow Modal */}
            <CreateExamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default ExamList;
