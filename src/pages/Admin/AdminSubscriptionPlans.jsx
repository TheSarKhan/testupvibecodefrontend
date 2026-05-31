import { useState, useMemo } from 'react';
import { HiOutlinePlus, HiOutlinePencilAlt, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
    useAdminSubscriptionPlans,
    useCreateSubscriptionPlan,
    useUpdateSubscriptionPlan,
    useDeleteSubscriptionPlan,
} from '../../hooks/admin/useAdminSubscriptionPlans';
import Pagination from '../../components/admin/Pagination';

const INITIAL_FORM = {
    name: '',
    price: 0,
    level: 0,
    description: '',
    monthlyExamLimit: 0,
    maxQuestionsPerExam: 0,
    maxSavedExamsLimit: 0,
    maxParticipantsPerExam: 0,
    studentResultAnalysis: false,
    examEditing: false,
    addImage: false,
    addPassageQuestion: false,
    downloadPastExams: false,
    downloadAsPdf: false,
    multipleSubjects: false,
    useTemplateExams: false,
    manualChecking: false,
    selectExamDuration: false,
    useQuestionBank: false,
    createQuestionBank: false,
    importQuestionsFromPdf: false,
    monthlyAiQuestionLimit: 'disabled',
    useAiExamGeneration: false,
    // New fields for the duration/visibility rollout.
    durationMonths: 1,
    visible: true,
};

const featureLabels = [
    { key: 'studentResultAnalysis', label: 'Şagird nəticə analizi' },
    { key: 'examEditing', label: 'İmtahan redaktəsi' },
    { key: 'addImage', label: 'Şəkil əlavə etmək' },
    { key: 'addPassageQuestion', label: 'Mətn/Dinləmə sualı əlavə etmək' },
    { key: 'downloadPastExams', label: 'Keçmiş imtahanları yükləmək' },
    { key: 'downloadAsPdf', label: 'İmtahanı PDF kimi yükləmək' },
    { key: 'multipleSubjects', label: 'Bir imtahanda çox fənn' },
    { key: 'useTemplateExams', label: 'Şablon imtahanlardan istifadə' },
    { key: 'manualChecking', label: 'Manual yoxlama' },
    { key: 'selectExamDuration', label: 'İmtahan müddətini seçmək' },
    { key: 'useQuestionBank', label: 'Sual bazasından istifadə' },
    { key: 'createQuestionBank', label: 'Sual bazası hazırlamaq' },
    { key: 'importQuestionsFromPdf', label: 'PDF-dən çoxlu sual əlavə etmək' },
    { key: 'useAiExamGeneration', label: 'AI ilə imtahan yaratmaq' }
];

const AdminSubscriptionPlans = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [editingId, setEditingId] = useState(null);

    const [page, setPage] = useState(0);
    const { data, isLoading: loading, error } = useAdminSubscriptionPlans({ page, size: 12 });
    const rawPlans = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;
    const totalElements = data?.totalElements ?? 0;
    const plans = useMemo(() => [...rawPlans].sort((a, b) => a.price - b.price), [rawPlans]);
    const createPlan = useCreateSubscriptionPlan();
    const updatePlan = useUpdateSubscriptionPlan();
    const deletePlan = useDeleteSubscriptionPlan();
    const saving = createPlan.isPending || updatePlan.isPending;
    const submittingDelete = deletePlan.isPending ? deletePlan.variables : null;

    if (error) toast.error('Planları yükləyərkən xəta baş verdi');

    const handleOpenModal = (plan = null) => {
        if (plan) {
            const aiLimit = plan.monthlyAiQuestionLimit;
            setForm({
                ...plan,
                level: plan.level ?? 0,
                durationMonths: plan.durationMonths ?? 1,
                visible: plan.visible !== false,
                monthlyAiQuestionLimit: aiLimit === -1 ? 'unlimited' : aiLimit > 0 ? String(aiLimit) : 'disabled',
            });
            setEditingId(plan.id);
        } else {
            setForm({ ...INITIAL_FORM, monthlyAiQuestionLimit: 'disabled' });
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setForm(INITIAL_FORM);
        setEditingId(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : name === 'monthlyAiQuestionLimit' ? value : type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const aiLimit = form.monthlyAiQuestionLimit;
        const payload = {
            ...form,
            level: form.level ?? 0,
            monthlyAiQuestionLimit: aiLimit === 'unlimited' ? -1 : aiLimit === 'disabled' ? 0 : (parseInt(aiLimit, 10) || 0),
        };
        try {
            if (editingId) {
                await updatePlan.mutateAsync({ id: editingId, plan: payload });
                toast.success('Plan uğurla yeniləndi');
            } else {
                await createPlan.mutateAsync(payload);
                toast.success('Yeni plan əlavə edildi');
            }
            handleCloseModal();
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Əməliyyat uğursuz oldu');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu planı silmək istədiyinizə əminsiniz?')) return;
        try {
            await deletePlan.mutateAsync(id);
            toast.success('Plan silindi');
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Silinmədi');
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Abunəlik Planları</h1>
                    <p className="text-gray-500 text-sm mt-1">Sistemdəki abunəlik planlarını idarə edin.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
                >
                    <HiOutlinePlus className="w-5 h-5" /> Şablon Yarat
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <p className="text-gray-500 font-medium">Hələ heç bir abunəlik planı yoxdur.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col transition-opacity ${plan.visible === false ? 'border-amber-200 bg-amber-50/40 opacity-90' : 'border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        {plan.durationMonths > 1 && (
                                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                {plan.durationMonths} ay
                                            </span>
                                        )}
                                        {plan.visible === false && (
                                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                <HiOutlineEyeOff className="w-3 h-3" /> Saytda gizli
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-black text-blue-600 mt-1">{plan.price} ₼ <span className="text-sm text-gray-400 font-medium">/{plan.durationMonths > 1 ? `${plan.durationMonths} ay` : 'ay'}</span></p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Quick visibility toggle — flips the `visible` flag without
                                        opening the full edit modal. Sends the existing plan back
                                        verbatim with only that field changed. */}
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updatePlan.mutateAsync({
                                                    id: plan.id,
                                                    plan: {
                                                        ...plan,
                                                        monthlyAiQuestionLimit: plan.monthlyAiQuestionLimit ?? 0,
                                                        visible: !plan.visible,
                                                    },
                                                });
                                                toast.success(plan.visible ? 'Plan saytdan gizləndi' : 'Plan saytda göstərilir');
                                            } catch (err) {
                                                if (!err._handled) toast.error('Görünürlük dəyişdirilə bilmədi');
                                            }
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${plan.visible === false ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                        title={plan.visible === false ? 'Saytda göstər' : 'Saytdan gizlət'}
                                    >
                                        {plan.visible === false ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(plan)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Redaktə et"
                                    >
                                        <HiOutlinePencilAlt className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        disabled={submittingDelete === plan.id}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                        title="Sil"
                                    >
                                        {submittingDelete === plan.id ? (
                                             <div className="w-4 h-4 border-2 border-red-500 border-t-transparent flex items-center justify-center rounded-full animate-spin"/>
                                        ) : (
                                            <HiOutlineTrash className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-6 flex-1">{plan.description}</p>
                            
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Limitlər</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Aylıq İmtahan:</span>
                                    <span className="font-semibold text-gray-900">{plan.monthlyExamLimit === -1 ? 'Limitsiz' : plan.monthlyExamLimit}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Sual (hər imtahan):</span>
                                    <span className="font-semibold text-gray-900">{plan.maxQuestionsPerExam === -1 ? 'Limitsiz' : plan.maxQuestionsPerExam}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Yadda saxlanılan:</span>
                                    <span className="font-semibold text-gray-900">{plan.maxSavedExamsLimit === -1 ? 'Limitsiz' : plan.maxSavedExamsLimit}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">İştirakçı:</span>
                                    <span className="font-semibold text-gray-900">{plan.maxParticipantsPerExam === -1 ? 'Limitsiz' : plan.maxParticipantsPerExam}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Aylıq AI Sual:</span>
                                    <span className="font-semibold text-gray-900">{plan.monthlyAiQuestionLimit === -1 ? 'Limitsiz' : plan.monthlyAiQuestionLimit > 0 ? plan.monthlyAiQuestionLimit : 'Deaktiv'}</span>
                                </div>
                                
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2">Populyar Xüsusiyyətlər</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    {plan.studentResultAnalysis ? <HiOutlineCheckCircle className="text-green-500 w-4 h-4" /> : <HiOutlineXCircle className="text-red-400 w-4 h-4" />}
                                    Analiz
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    {plan.useQuestionBank ? <HiOutlineCheckCircle className="text-green-500 w-4 h-4" /> : <HiOutlineXCircle className="text-red-400 w-4 h-4" />}
                                    Sual bazası
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {plans.length > 0 && (
                <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onChange={setPage} />
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={handleCloseModal}>
                    <div className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl my-8 relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black text-gray-900 mb-6">{editingId ? 'Planı Redaktə Et' : 'Yeni Plan'}</h2>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column: Basic Info & Limits */}
                                <div className="space-y-5">
                                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b pb-2">Əsas Məlumatlar</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Adı *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Qiymət (AZN) *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={form.price}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Müddət (ay)</label>
                                        <select
                                            name="durationMonths"
                                            value={form.durationMonths ?? 1}
                                            onChange={e => setForm(prev => ({ ...prev, durationMonths: Number(e.target.value) }))}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white"
                                        >
                                            <option value={1}>1 ay (Aylıq)</option>
                                            <option value={3}>3 ay</option>
                                            <option value={6}>6 ay</option>
                                            <option value={12}>12 ay (İllik)</option>
                                        </select>
                                        <p className="text-xs text-gray-400 mt-1">Qiymət bu müddətin tam dəyəridir (yox "ayda")</p>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer select-none p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                name="visible"
                                                checked={form.visible !== false}
                                                onChange={e => setForm(prev => ({ ...prev, visible: e.target.checked }))}
                                                className="w-4 h-4 accent-blue-600"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-semibold text-gray-700">Saytda göstər</span>
                                                <p className="text-xs text-gray-400">Söndürüldükdə plan Pricing səhifəsində görünmür, amma admin onu istifadəçilərə təyin edə bilir</p>
                                            </div>
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Səviyyə (Level) *</label>
                                        <input
                                            type="number"
                                            name="level"
                                            value={form.level}
                                            onChange={handleChange}
                                            required
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">0=Free, 1=Basic, 2=Limitsiz, 3+ = yeni planlar</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Açıqlama</label>
                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows="2"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 resize-none"
                                        />
                                    </div>

                                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b pb-2 pt-4">Limitlər (-1 = Limitsiz)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Aylıq İmtahan *</label>
                                            <input type="number" required name="monthlyExamLimit" value={form.monthlyExamLimit} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Max Sual/İmtahan *</label>
                                            <input type="number" required name="maxQuestionsPerExam" value={form.maxQuestionsPerExam} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Max Yadda Saxlanılan *</label>
                                            <input type="number" required name="maxSavedExamsLimit" value={form.maxSavedExamsLimit} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Max İştirakçı *</label>
                                            <input type="number" required name="maxParticipantsPerExam" value={form.maxParticipantsPerExam} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Aylıq AI Sual Limiti</label>
                                            <div className="flex gap-2 mb-2">
                                                {[
                                                    { value: 'disabled', label: 'Deaktiv' },
                                                    { value: 'limited', label: 'Limit qoy' },
                                                    { value: 'unlimited', label: 'Limitsiz' },
                                                ].map(opt => {
                                                    const isLimited = form.monthlyAiQuestionLimit !== 'disabled' && form.monthlyAiQuestionLimit !== 'unlimited';
                                                    const isActive = opt.value === 'limited' ? isLimited : form.monthlyAiQuestionLimit === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => setForm(prev => ({
                                                                ...prev,
                                                                monthlyAiQuestionLimit: opt.value === 'limited' ? '10' : opt.value
                                                            }))}
                                                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border-2 transition-colors ${isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {form.monthlyAiQuestionLimit !== 'disabled' && form.monthlyAiQuestionLimit !== 'unlimited' && (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={form.monthlyAiQuestionLimit}
                                                    onChange={e => setForm(prev => ({ ...prev, monthlyAiQuestionLimit: e.target.value }))}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                                                    placeholder="Məs: 30"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Features */}
                                <div>
                                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider border-b pb-2 mb-4">Xüsusiyyətlər (On/Off)</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                                        {featureLabels.map(feature => (
                                            <label key={feature.key} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        name={feature.key}
                                                        checked={form[feature.key]}
                                                        onChange={handleChange}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                                                    {feature.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 justify-end">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">
                                    Ləğv et
                                </button>
                                <button type="submit" disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-70">
                                    {saving ? 'Saxlanılır...' : 'Saxla'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubscriptionPlans;
