import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { HiOutlinePlusCircle, HiOutlineSearch, HiOutlineDocumentText, HiOutlineLockClosed } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { ExamCard, CreateExamModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamList = () => {
    const { user, isTeacher, isStudent } = useAuth();
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchExams();
    }, [user]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            let data;
            if (isStudent) {
                // Students see admin-created public exams
                const response = await api.get('/exams/public');
                data = response.data;
            } else if (isTeacher || user?.role === 'ADMIN') {
                // Teachers/admins see their own exams
                const response = await api.get('/exams');
                data = response.data;
            } else {
                // Not logged in — show public exams too (optional, could be empty)
                const response = await api.get('/exams/public');
                data = response.data;
            }
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
        } catch {
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

    const handleJoinExam = (exam) => {
        navigate(`/imtahan/${exam.shareLink}`);
    };

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.tags && exam.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const subjectDisplayNames = {
        'RIYAZIYYAT': 'Riyaziyyat', 'FIZIKA': 'Fizika', 'KIMYA': 'Kimya',
        'BIOLOGIYA': 'Biologiya', 'AZERBAYCAN_DILI': 'Azərbaycan dili',
        'INGILIS_DILI': 'İngilis dili', 'TARIX': 'Tarix', 'COGRAFIYA': 'Coğrafiya',
        'INFORMATIKA': 'Informatika', 'MANTIQ': 'Məntiq'
    };

    return (
        <div className="bg-white min-h-screen py-10">
            <Helmet>
                <title>İmtahanlar — testup.az</title>
                <meta name="description" content="testup.az platformasındakı bütün imtahanları nəzərdən keçirin, yeni imtahan yaradın və ya mövcud imtahanlara qoşulun." />
                <meta property="og:title" content="İmtahanlar — testup.az" />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://testup.az/imtahanlar" />
            </Helmet>
            <div className="container-main">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isStudent ? 'İmtahanlar' : 'İmtahanlarım'}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {isStudent
                                ? 'Sizin üçün hazırlanmış imtahanların siyahısı.'
                                : 'Yaratdığınız və idarə etdiyiniz imtahanların siyahısı.'}
                        </p>
                    </div>

                    {/* Only teachers/admins can create exams */}
                    {(isTeacher || user?.role === 'ADMIN') && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            <HiOutlinePlusCircle className="w-6 h-6" />
                            Yeni İmtahan
                        </button>
                    )}
                </div>

                {/* Search */}
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

                {/* Loading */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Student mode: clickable cards that go directly to exam entry */}
                        {isStudent ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredExams.map(exam => (
                                    <div
                                        key={exam.id}
                                        onClick={() => handleJoinExam(exam)}
                                        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                                                {subjectDisplayNames[exam.subject] || exam.subject}
                                            </span>
                                            {exam.visibility === 'PRIVATE' && (
                                                <HiOutlineLockClosed className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                                            {exam.title}
                                        </h3>
                                        {exam.description && (
                                            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{exam.description}</p>
                                        )}
                                        <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-3 border-t border-gray-50">
                                            <span>{exam.questions?.length || 0} sual</span>
                                            {exam.durationMinutes && <span>⏱ {exam.durationMinutes} dəq</span>}
                                            <span className="text-indigo-500 font-medium group-hover:underline">İmtahana gir →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Teacher/Admin mode: full ExamCard with delete/share */
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
                        )}

                        {/* Empty State */}
                        {filteredExams.length === 0 && (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <HiOutlineDocumentText className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {searchTerm ? 'Axtarışa uyğun imtahan tapılmadı' : 'Hazırda imtahan mövcud deyil'}
                                </h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                    {searchTerm
                                        ? 'Axtarış terminini dəyişərək yenidən yoxlayın.'
                                        : isStudent
                                            ? 'Admin hələ heç bir imtahan yerləşdirməyib.'
                                            : 'İlk imtahanınızı yaratmaqla başlayın.'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateExamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

export default ExamList;
