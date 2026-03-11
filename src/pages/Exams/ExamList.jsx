import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { HiOutlinePlusCircle, HiOutlineSearch, HiOutlineDocumentText, HiOutlineLockClosed, HiOutlineBookmark, HiBookmark, HiOutlineClock, HiOutlineQuestionMarkCircle, HiOutlineArrowRight } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { ExamCard, CreateExamModal } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ExamList = () => {
    const { user, isTeacher, isAdmin, isStudent, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Admin manages exams only from admin panel
    useEffect(() => {
        if (isAdmin) navigate('/admin/oz-imtahanlar', { replace: true });
    }, [isAdmin, navigate]);

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [savedExamLinks, setSavedExamLinks] = useState(new Set());
    const [savingLink, setSavingLink] = useState(null);

    useEffect(() => {
        fetchExams();
    }, [user]);

    useEffect(() => {
        if (isStudent && isAuthenticated) {
            api.get('/depot').then(res => {
                setSavedExamLinks(new Set(res.data.map(e => e.shareLink)));
            }).catch(() => {});
        }
    }, [isStudent, isAuthenticated]);

    const handleToggleDepot = async (exam) => {
        if (!isAuthenticated) {
            toast.error('Depoya əlavə etmək üçün hesabınıza daxil olun');
            return;
        }
        const isSaved = savedExamLinks.has(exam.shareLink);
        setSavingLink(exam.shareLink);
        try {
            if (isSaved) {
                await api.delete(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => { const n = new Set(prev); n.delete(exam.shareLink); return n; });
                toast.success('Depodan silindi');
            } else {
                await api.post(`/depot/${exam.shareLink}`);
                setSavedExamLinks(prev => new Set([...prev, exam.shareLink]));
                toast.success('Depoya əlavə edildi');
                navigate('/profil', { state: { tab: 'depot' } });
            }
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setSavingLink(null);
        }
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            let data;
            if (isStudent) {
                // Students see admin-created public exams
                const response = await api.get('/exams/public');
                data = response.data;
            } else if (isTeacher || isAdmin) {
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

    const handleToggleStatus = async (id) => {
        try {
            const { data } = await api.patch(`/exams/${id}/toggle-status`);
            setExams(prev => prev.map(e => e.id === id ? { ...e, status: data.status } : e));
            toast.success(data.status === 'PUBLISHED' ? 'İmtahan açıldı' : 'İmtahan bağlandı');
        } catch (err) {
            toast.error(err.message || 'Xəta baş verdi');
        }
    };

    const handleShare = (id) => {
        const exam = exams.find(e => e.id === id);
        if (!exam) return;
        const link = `${window.location.origin}/imtahan/${exam.shareLink}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(link);
        } else {
            const el = document.createElement('textarea');
            el.value = link;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        toast.success("Paylaşım linki kopyalandı");
    };

    const handleJoinExam = (exam) => {
        navigate(`/imtahan/${exam.shareLink}`);
    };

    const draftExams = exams.filter(e => e.status === 'DRAFT');
    const publishedExams = exams.filter(e => e.status !== 'DRAFT');
    const filteredPublished = publishedExams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.tags && exam.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );
    const filteredDrafts = draftExams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.tags && exam.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );


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
                    {(isTeacher || isAdmin) && (
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
                        {/* Student mode */}
                        {isStudent ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredPublished.map(exam => {
                                        const isSaved = savedExamLinks.has(exam.shareLink);
                                        const isPaid = exam.price != null && Number(exam.price) > 0;
                                        const subjectName = (exam.subjects || []).join(', ') || exam.subject || '';
                                        return (
                                            <div key={exam.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
                                                {/* Colored top accent */}
                                                <div className={`h-1 w-full ${isPaid ? 'bg-amber-400' : 'bg-indigo-500'}`} />

                                                <div className="p-5 flex flex-col flex-1">
                                                    {/* Top row: subject + bookmark */}
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                                                            {subjectName}
                                                        </span>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); handleToggleDepot(exam); }}
                                                            disabled={savingLink === exam.shareLink}
                                                            title={isSaved ? 'Depodan çıxar' : 'Depoya əlavə et'}
                                                            className={`p-1.5 rounded-xl transition-all disabled:opacity-50 shrink-0 ${isSaved ? 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                                        >
                                                            {savingLink === exam.shareLink
                                                                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                : isSaved
                                                                    ? <HiBookmark className="w-4 h-4" />
                                                                    : <HiOutlineBookmark className="w-4 h-4" />
                                                            }
                                                        </button>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                        {exam.title}
                                                    </h3>

                                                    {/* Description */}
                                                    {exam.description && (
                                                        <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-3">{exam.description}</p>
                                                    )}

                                                    {/* Meta info */}
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto mb-4">
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineQuestionMarkCircle className="w-3.5 h-3.5" />
                                                            {exam.questions?.length || 0} sual
                                                        </span>
                                                        {exam.durationMinutes && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineClock className="w-3.5 h-3.5" />
                                                                {exam.durationMinutes} dəq
                                                            </span>
                                                        )}
                                                        {exam.visibility === 'PRIVATE' && (
                                                            <span className="flex items-center gap-1">
                                                                <HiOutlineLockClosed className="w-3.5 h-3.5" /> Gizli
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Bottom row: price + CTA */}
                                                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50">
                                                        {isPaid ? (
                                                            <span className="text-sm font-black text-amber-600">
                                                                {Number(exam.price).toFixed(2)} ₼
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                                                Pulsuz
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => handleJoinExam(exam)}
                                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all ${isPaid ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                                        >
                                                            {isPaid ? '💳 Satın al' : 'Başla'}
                                                            <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {filteredPublished.length === 0 && (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <HiOutlineDocumentText className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {searchTerm ? 'Axtarışa uyğun imtahan tapılmadı' : 'Hazırda imtahan mövcud deyil'}
                                        </h3>
                                        <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                            {searchTerm ? 'Axtarış terminini dəyişərək yenidən yoxlayın.' : 'Admin hələ heç bir imtahan yerləşdirməyib.'}
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Teacher/Admin mode */
                            <>
                                {/* Drafts Section */}
                                {filteredDrafts.length > 0 && (
                                    <div className="mb-10">
                                        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                            <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                                            Qaralamalar
                                            <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredDrafts.length}</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredDrafts.map(exam => (
                                                <ExamCard
                                                    key={exam.id}
                                                    exam={{
                                                        ...exam,
                                                        subjects: exam.subjects || [],
                                                        tags: exam.tags || [],
                                                        duration: exam.durationMinutes,
                                                        questionCount: exam.questions?.length || 0
                                                    }}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Published / Cancelled Exams Section */}
                                {filteredPublished.length > 0 && (
                                    <div>
                                        {filteredDrafts.length > 0 && (
                                            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                                <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                                                Yayımlanmış İmtahanlar
                                                <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredPublished.length}</span>
                                            </h2>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredPublished.map(exam => (
                                                <ExamCard
                                                    key={exam.id}
                                                    exam={{
                                                        ...exam,
                                                        subjects: exam.subjects || [],
                                                        tags: exam.tags || [],
                                                        duration: exam.durationMinutes,
                                                        questionCount: exam.questions?.length || 0
                                                    }}
                                                    onDelete={handleDelete}
                                                    onShare={handleShare}
                                                    onToggleStatus={handleToggleStatus}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Empty State for Teacher */}
                                {filteredDrafts.length === 0 && filteredPublished.length === 0 && (
                                    <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <HiOutlineDocumentText className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {searchTerm ? 'Axtarışa uyğun imtahan tapılmadı' : 'Hazırda imtahan mövcud deyil'}
                                        </h3>
                                        <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                            {searchTerm ? 'Axtarış terminini dəyişərək yenidən yoxlayın.' : 'İlk imtahanınızı yaratmaqla başlayın.'}
                                        </p>
                                    </div>
                                )}
                            </>
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
