import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlinePlus, HiOutlineTrash, HiOutlinePencil,
    HiOutlineBookOpen, HiOutlineGlobe,
    HiOutlineX, HiOutlineCheck, HiOutlineSearch,
    HiOutlineCollection, HiOutlineDocumentText,
    HiOutlineLightningBolt, HiOutlineFire, HiOutlineClock,
    HiOutlineTag, HiOutlineAcademicCap,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
    useBankSubjects,
    useCreateBankSubject,
    useUpdateBankSubject,
    useDeleteBankSubject,
} from '../../hooks/admin/useAdminQuestionBank';
import { useAdminSubjects } from '../../hooks/admin/useAdminSubjects';
import Pagination from '../../components/admin/Pagination';
import { Combobox } from '../../components/ui';
import { formatRelativeTime } from '../../utils/date';

// Shared helper (utils/date) — parses naked backend timestamps as UTC, fixing
// the per-page `new Date(iso)` drift (BUG-10). Returns null when empty so the
// caller can hide the label.
const formatRelative = (iso) => formatRelativeTime(iso) || null;

const SummaryTile = ({ icon: Icon, label, value, sub, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-100 p-4 ${gradient}`}>
        <div className="flex items-start justify-between mb-2">
            <div className="p-2 rounded-xl bg-white/60 backdrop-blur-sm">
                <Icon className="w-5 h-5 text-gray-700" />
            </div>
        </div>
        <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        <div className="text-xs font-semibold text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
);

const DifficultyBar = ({ easy = 0, medium = 0, hard = 0 }) => {
    const total = easy + medium + hard;
    if (total === 0) return (
        <div className="h-1.5 w-full rounded-full bg-gray-100" />
    );
    return (
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            {easy > 0 && <div className="bg-green-400" style={{ width: `${(easy / total) * 100}%` }} title={`Asan: ${easy}`} />}
            {medium > 0 && <div className="bg-amber-400" style={{ width: `${(medium / total) * 100}%` }} title={`Orta: ${medium}`} />}
            {hard > 0 && <div className="bg-red-400" style={{ width: `${(hard / total) * 100}%` }} title={`Çətin: ${hard}`} />}
        </div>
    );
};

const AdminQuestionBank = () => {
    const navigate = useNavigate();

    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [editId, setEditId] = useState(null);
    const [editName, setEditName] = useState('');
    const [search, setSearch] = useState('');

    const [page, setPage] = useState(0);
    const { data, isLoading: loading, error } = useBankSubjects({ page, size: 24 });
    const subjects = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;
    const createSubject = useCreateBankSubject();
    const updateSubject = useUpdateBankSubject();
    const deleteSubject = useDeleteBankSubject();

    // Existing exam subjects for the create-combobox. Fetch a wide page so the
    // dropdown covers everything; bank.subjects is independent and small.
    const { data: examSubjData } = useAdminSubjects({ page: 0, size: 200 });
    const existingExamSubjects = examSubjData?.content ?? [];
    const subjectOptions = useMemo(() => {
        // Already-existing bank subjects shouldn't show up as creatable options.
        const taken = new Set(subjects.map(s => s.name.trim().toLowerCase()));
        return existingExamSubjects
            .filter(es => !taken.has(es.name.trim().toLowerCase()))
            .map(es => ({
                value: es.name,
                label: es.name,
                color: es.color || undefined,
                hint: (es.topics || []).length ? `${es.topics.length} mövzu` : undefined,
            }));
    }, [existingExamSubjects, subjects]);

    if (error) toast.error('Fənnlər yüklənmədi');

    const handleAdd = async () => {
        if (!newName.trim()) return;
        try {
            // Admin yaratdığı bazalar həmişə ümumidir — backend Role.ADMIN üçün
            // avtomatik isGlobal=true təyin edir, frontend buna heç müdaxilə etmir.
            await createSubject.mutateAsync({ name: newName.trim() });
            setNewName('');
            setAdding(false);
            toast.success('Ümumi baza əlavə edildi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleRename = async (id) => {
        if (!editName.trim()) return;
        try {
            await updateSubject.mutateAsync({ id, payload: { name: editName.trim() } });
            setEditId(null);
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`"${name}" bazasını silmək istədiyinizdən əminsiniz? Bütün suallar da silinəcək.`)) return;
        try {
            await deleteSubject.mutateAsync(id);
            toast.success('Baza silindi');
        } catch {
            toast.error('Əməliyyat uğursuz oldu');
        }
    };

    const filteredSubjects = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return subjects;
        return subjects.filter(s => s.name.toLowerCase().includes(q));
    }, [subjects, search]);

    // Aggregate stats over current page (cheap, gives admin a quick pulse).
    const agg = useMemo(() => {
        const a = { questions: 0, easy: 0, medium: 0, hard: 0, topics: 0 };
        for (const s of subjects) {
            a.questions += s.questionCount || 0;
            a.easy     += s.easyCount     || 0;
            a.medium   += s.mediumCount   || 0;
            a.hard     += s.hardCount     || 0;
            a.topics   += s.topicCount    || 0;
        }
        return a;
    }, [subjects]);

    const SubjectCard = ({ subject }) => {
        const isEditing = editId === subject.id;
        const total = subject.questionCount || 0;
        const easy = subject.easyCount || 0;
        const medium = subject.mediumCount || 0;
        const hard = subject.hardCount || 0;
        const categorised = easy + medium + hard;

        return (
            <div
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col"
                onClick={() => !isEditing && navigate(`/admin/sual-bazasi/${subject.id}`)}
            >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: subject.color ? `${subject.color}20` : '#eff6ff', color: subject.color || '#2563eb' }}
                        >
                            <HiOutlineAcademicCap className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            {isEditing ? (
                                <input
                                    autoFocus
                                    className="text-sm font-bold border border-blue-300 rounded-lg px-2 py-1 w-full"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onClick={e => e.stopPropagation()}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRename(subject.id);
                                        if (e.key === 'Escape') setEditId(null);
                                    }}
                                />
                            ) : (
                                <p className="text-sm font-bold text-gray-900 truncate leading-tight">{subject.name}</p>
                            )}
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                <HiOutlineGlobe className="w-2.5 h-2.5" /> Ümumi baza
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                        {isEditing ? (
                            <>
                                <button onClick={() => handleRename(subject.id)} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"><HiOutlineCheck className="w-4 h-4" /></button>
                                <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><HiOutlineX className="w-4 h-4" /></button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setEditId(subject.id); setEditName(subject.name); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"><HiOutlinePencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(subject.id, subject.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"><HiOutlineTrash className="w-4 h-4" /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main stat */}
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <div className="text-2xl font-extrabold text-gray-900 leading-none">{total}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mt-0.5">sual</div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-[11px] font-bold text-gray-600">
                            <HiOutlineTag className="w-3 h-3 text-blue-500" />
                            {subject.topicCount || 0}
                        </div>
                        <div className="text-[10px] text-gray-400">mövzu</div>
                    </div>
                </div>

                {/* Difficulty distribution */}
                <DifficultyBar easy={easy} medium={medium} hard={hard} />
                <div className="flex items-center justify-between mt-1.5 text-[10px] font-semibold">
                    <span className="flex items-center gap-0.5 text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> {easy}
                    </span>
                    <span className="flex items-center gap-0.5 text-amber-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {medium}
                    </span>
                    <span className="flex items-center gap-0.5 text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {hard}
                    </span>
                    <span className="text-gray-400">
                        {total > 0 ? `${categorised}/${total} təsnif` : 'boş'}
                    </span>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                        <HiOutlineClock className="w-3 h-3" />
                        {subject.lastAddedAt ? `Son: ${formatRelative(subject.lastAddedAt)}` : 'Heç sual yox'}
                    </span>
                    <span className="text-blue-500 font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Sual Bazası</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Bütün ümumi bazalar — admin yaratdığı bazalar avtomatik bütün müəllimlərə açıqdır
                    </p>
                </div>
                <button
                    onClick={() => setAdding(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
                >
                    <HiOutlinePlus className="w-4 h-4" /> Yeni baza
                </button>
            </div>

            {/* Aggregate stats */}
            {subjects.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <SummaryTile
                        icon={HiOutlineCollection}
                        label="Baza"
                        value={totalElements}
                        sub="ümumi"
                        gradient="bg-gradient-to-br from-blue-50 to-blue-50"
                    />
                    <SummaryTile
                        icon={HiOutlineDocumentText}
                        label="Sual"
                        value={agg.questions}
                        sub="bu səhifədə"
                        gradient="bg-gradient-to-br from-emerald-50 to-pink-50"
                    />
                    <SummaryTile
                        icon={HiOutlineLightningBolt}
                        label="Asan"
                        value={agg.easy}
                        sub={agg.questions > 0 ? `${Math.round((agg.easy / agg.questions) * 100)}%` : '—'}
                        gradient="bg-gradient-to-br from-green-50 to-emerald-50"
                    />
                    <SummaryTile
                        icon={HiOutlineFire}
                        label="Çətin"
                        value={agg.hard}
                        sub={agg.questions > 0 ? `${Math.round((agg.hard / agg.questions) * 100)}%` : '—'}
                        gradient="bg-gradient-to-br from-red-50 to-orange-50"
                    />
                    <SummaryTile
                        icon={HiOutlineTag}
                        label="Mövzu"
                        value={agg.topics}
                        sub="ümumi"
                        gradient="bg-gradient-to-br from-amber-50 to-yellow-50"
                    />
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Baza adı ilə axtar..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 bg-white"
                />
            </div>

            {/* Add form */}
            {adding && (
                <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <HiOutlineGlobe className="w-4 h-4 text-emerald-600" />
                        <p className="text-sm font-bold text-gray-700">Yeni ümumi baza</p>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            avtomatik ümumi
                        </span>
                    </div>
                    <div className="flex gap-3 flex-wrap items-start">
                        <div className="flex-1 min-w-64">
                            <Combobox
                                value={newName}
                                onChange={setNewName}
                                options={subjectOptions}
                                placeholder="Mövcud fənn seçin və ya yeni ad yazın..."
                                icon={<HiOutlineBookOpen className="w-4 h-4" />}
                                emptyHint="Bu adda fənn yoxdur"
                            />
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Mövcud fənnləri seçə bilərsiniz və ya yeni ad daxil edib ƏLAVƏ ET düyməsinə basın
                            </p>
                        </div>
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim() || createSubject.isPending}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createSubject.isPending ? 'Əlavə edilir...' : 'Əlavə et'}
                        </button>
                        <button
                            onClick={() => { setAdding(false); setNewName(''); }}
                            className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-100 text-sm"
                        >
                            Ləğv et
                        </button>
                    </div>
                </div>
            )}

            {/* Body */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                </div>
            ) : subjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <HiOutlineBookOpen className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900">Hələ heç bir baza yoxdur</h3>
                    <p className="text-sm text-gray-500 mt-1 mb-4">İlk ümumi sual bazasını yaradın — müəllimlər orada hazır suallardan istifadə edə biləcəklər</p>
                    <button onClick={() => setAdding(true)} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">
                        İlk bazanı yarat
                    </button>
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <HiOutlineSearch className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">Axtarışa uyğun baza tapılmadı</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSubjects.map(s => <SubjectCard key={s.id} subject={s} />)}
                    </div>
                    {totalPages > 1 && (
                        <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
                    )}
                </>
            )}
        </div>
    );
};

export default AdminQuestionBank;
