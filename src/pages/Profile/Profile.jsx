import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import avatarTeacher from '../../assets/avatar-teacher.svg';
import avatarStudent from '../../assets/avatar-student.svg';
import {
    HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineClock,
    HiOutlineCheckCircle, HiOutlinePencilAlt, HiOutlineEye,
    HiOutlineDocumentText, HiOutlineStar, HiOutlineLockClosed,
    HiOutlineGlobe, HiOutlineClipboardList, HiOutlineExclamationCircle,
    HiOutlineKey, HiOutlineX, HiOutlineEyeOff, HiOutlineCamera, HiOutlineTrash
} from 'react-icons/hi';

// ---- helpers ----
const fmtScore = (v) => {
    if (v === null || v === undefined) return '0';
    const n = Math.round(v * 100) / 100;
    return n % 1 === 0 ? String(n) : n.toFixed(2);
};

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);

const pctColor = (p) =>
    p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-yellow-400' : 'bg-red-400';

const pctTextColor = (p) =>
    p >= 80 ? 'text-green-600' : p >= 50 ? 'text-yellow-600' : 'text-red-500';

const statusConfig = {
    DRAFT:     { label: 'Qaralama',   cls: 'bg-gray-100 text-gray-600' },
    PUBLISHED: { label: 'Dərc edilib', cls: 'bg-blue-100 text-blue-700' },
    ACTIVE:    { label: 'Aktiv',       cls: 'bg-green-100 text-green-700' },
    COMPLETED: { label: 'Tamamlandı', cls: 'bg-purple-100 text-purple-700' },
    CANCELLED: { label: 'Ləğv edildi', cls: 'bg-red-100 text-red-600' },
    ARCHIVED:  { label: 'Arxivdə',    cls: 'bg-orange-100 text-orange-600' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDuration = (mins) => {
    if (!mins) return '—';
    return mins >= 60 ? `${Math.floor(mins / 60)}s ${mins % 60}d` : `${mins} dəq`;
};

// ---- Avatar ----
const Avatar = ({ name, picture, defaultAvatar, onUpload, onUploadGlobal }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Şəkil 5MB-dan böyük ola bilməz'); return; }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const base64 = ev.target.result;
                await api.post('/users/me/picture', { picture: base64 });
                onUpload?.(base64);
                onUploadGlobal?.(base64);
                toast.success('Profil şəkli yeniləndi');
            } catch {
                toast.error('Şəkil yüklənərkən xəta baş verdi');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        setDeleting(true);
        try {
            await api.delete('/users/me/picture');
            onUpload?.('');
            onUploadGlobal?.('');
            toast.success('Profil şəkli silindi');
        } catch {
            toast.error('Silinərkən xəta baş verdi');
        } finally {
            setDeleting(false);
        }
    };

    const src = picture || defaultAvatar;

    return (
        <div className="relative group shrink-0">
            <div className="h-24 w-24 rounded-full overflow-hidden shadow-xl ring-4 ring-white">
                {src
                    ? <img src={src} alt={name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    : <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl">
                        {name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                }
            </div>
            {/* Upload overlay */}
            <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || deleting}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Şəkli dəyiş"
            >
                {uploading
                    ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <HiOutlineCamera className="w-6 h-6 text-white" />
                }
            </button>
            {/* Delete button — only shown when user has a custom picture (not default) */}
            {picture && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Şəkli sil"
                    className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    {deleting
                        ? <div className="h-3 w-3 border border-white border-t-transparent rounded-full animate-spin" />
                        : <HiOutlineX className="w-3 h-3" />
                    }
                </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    );
};

// ---- PasswordField (defined outside modal to prevent remount on re-render) ----
const PasswordField = ({ id, label, value, showKey, show, setShow, setForm }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={show[showKey] ? 'text' : 'password'}
                value={value}
                onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                className="w-full pr-10 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                required
            />
            <button
                type="button"
                onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                {show[showKey] ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
        </div>
    </div>
);

// ---- ChangePasswordModal ----
const ChangePasswordModal = ({ onClose }) => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            toast.error('Yeni şifrələr uyğun gəlmir');
            return;
        }
        if (form.newPassword.length < 6) {
            toast.error('Yeni şifrə ən azı 6 simvol olmalıdır');
            return;
        }
        setSaving(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            toast.success('Şifrə uğurla dəyişdirildi');
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Xəta baş verdi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 rounded-xl">
                            <HiOutlineKey className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Şifrəni Dəyiş</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <PasswordField id="currentPassword" label="Cari Şifrə" value={form.currentPassword} showKey="current" show={show} setShow={setShow} setForm={setForm} />
                    <PasswordField id="newPassword" label="Yeni Şifrə" value={form.newPassword} showKey="new" show={show} setShow={setShow} setForm={setForm} />
                    <PasswordField id="confirmPassword" label="Yeni Şifrəni Təsdiqlə" value={form.confirmPassword} showKey="confirm" show={show} setShow={setShow} setForm={setForm} />

                    {/* Password strength hint */}
                    {form.newPassword && (
                        <div className="flex gap-1.5 mt-1">
                            {[1, 2, 3, 4].map(i => {
                                const strength = Math.min(
                                    (form.newPassword.length >= 6 ? 1 : 0) +
                                    (/[A-Z]/.test(form.newPassword) ? 1 : 0) +
                                    (/[0-9]/.test(form.newPassword) ? 1 : 0) +
                                    (/[^A-Za-z0-9]/.test(form.newPassword) ? 1 : 0), 4
                                );
                                return (
                                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength
                                        ? strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-yellow-400' : strength <= 3 ? 'bg-blue-400' : 'bg-green-500'
                                        : 'bg-gray-100'
                                    }`} />
                                );
                            })}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                        >
                            Ləğv et
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-60"
                        >
                            {saving ? 'Saxlanılır...' : 'Dəyiş'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ---- StatCard ----
const StatCard = ({ icon, label, value, sub, color = 'indigo' }) => {
    const colors = {
        indigo: 'bg-indigo-50 text-indigo-600',
        green:  'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <div className={`${colors[color]} p-3 rounded-xl`}>{icon}</div>
            <div>
                <p className="text-2xl font-black text-gray-900">{value}</p>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

// ==== STUDENT PROFILE ====
const StudentProfile = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setProfilePicture: setGlobalPicture } = useAuth();
    const [results, setResults] = useState([]);
    const [ongoing, setOngoing] = useState([]);
    const [depot, setDepot] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'results');
    const [showPwModal, setShowPwModal] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
    const [removingDepot, setRemovingDepot] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resData, onData, meData, depotData] = await Promise.all([
                    api.get('/submissions/my-results'),
                    api.get('/submissions/ongoing').catch(() => ({ data: [] })),
                    api.get('/users/me').catch(() => ({ data: {} })),
                    api.get('/depot').catch(() => ({ data: [] })),
                ]);
                setResults(resData.data);
                setOngoing(onData.data || []);
                setProfilePicture(meData.data?.profilePicture || '');
                setDepot(depotData.data || []);
            } catch {
                toast.error('Nəticələri yükləyərkən xəta baş verdi');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleRemoveFromDepot = async (shareLink) => {
        setRemovingDepot(shareLink);
        try {
            await api.delete(`/depot/${shareLink}`);
            setDepot(prev => prev.filter(e => e.shareLink !== shareLink));
            toast.success('Depodan silindi');
        } catch {
            toast.error('Xəta baş verdi');
        } finally {
            setRemovingDepot(null);
        }
    };

    const filtered = results.filter(r =>
        r.examTitle?.toLowerCase().includes(search.toLowerCase())
    );

    const completed = results.filter(r => r.submittedAt);
    const totalExams = completed.length;
    const avgPct = totalExams > 0
        ? Math.round(completed.reduce((s, r) => s + pct(r.totalScore, r.maxScore), 0) / totalExams)
        : 0;
    const bestPct = totalExams > 0
        ? Math.max(...completed.map(r => pct(r.totalScore, r.maxScore)))
        : 0;
    const pending = results.filter(r => !r.isFullyGraded && r.submittedAt).length;

    // Score trend: last 7 completed exams sorted by date
    const trendData = [...completed]
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .slice(-7);

    // Achievements
    const achievements = [
        totalExams >= 1  && { icon: '🎯', label: 'İlk İmtahan', desc: 'İlk imtahanı tamamladı' },
        totalExams >= 5  && { icon: '📚', label: 'Dəyişməz', desc: '5 imtahan tamamladı' },
        totalExams >= 10 && { icon: '🏆', label: 'Çempiyon', desc: '10 imtahan tamamladı' },
        bestPct >= 90    && { icon: '⭐', label: 'Əla Nəticə', desc: '90%+ bal qazandı' },
        bestPct === 100  && { icon: '💎', label: 'Mükəmməl', desc: '100% bal qazandı' },
        avgPct >= 75     && { icon: '🔥', label: 'Yüksək Orta', desc: 'Orta balı 75%+' },
    ].filter(Boolean);

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <Helmet>
                <title>Profilim — testup.az</title>
            </Helmet>

            {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 pt-10 pb-28 overflow-hidden">
                <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
                <div className="absolute top-4 right-24 h-20 w-20 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 left-12 h-28 w-28 rounded-full bg-white/5" />
            </div>

            <div className="container-main max-w-5xl -mt-20 space-y-6 relative z-10">
                {/* Profile card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar name={user?.fullName} picture={profilePicture} defaultAvatar={avatarStudent} onUpload={setProfilePicture} onUploadGlobal={setGlobalPicture} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-gray-900">{user?.fullName}</h1>
                        <p className="text-gray-500 mt-0.5">{user?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                                <HiOutlineAcademicCap className="w-3.5 h-3.5" /> Şagird
                            </span>
                            {pending > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold">
                                    <HiOutlineClock className="w-3.5 h-3.5" /> {pending} yoxlanılır
                                </span>
                            )}
                            {totalExams > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> {totalExams} imtahan tamamlandı
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPwModal(true)}
                        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 text-sm font-semibold rounded-xl transition-colors"
                    >
                        <HiOutlineKey className="w-4 h-4" /> Şifrəni Dəyiş
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<HiOutlineDocumentText className="w-6 h-6" />} label="İmtahan" value={totalExams} color="indigo" />
                    <StatCard icon={<HiOutlineChartBar className="w-6 h-6" />} label="Orta nəticə" value={`${avgPct}%`} color="purple" />
                    <StatCard icon={<HiOutlineStar className="w-6 h-6" />} label="Ən yüksək" value={`${bestPct}%`} color="green" />
                    <StatCard icon={<HiOutlineClock className="w-6 h-6" />} label="Yoxlanılır" value={pending} color="yellow" />
                </div>

                {/* Score trend + Achievements row */}
                {totalExams > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score trend chart */}
                        {trendData.length > 1 && (
                            <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                                <h2 className="text-base font-black text-gray-900 mb-5">Son Nəticələr</h2>
                                {/* Bar chart — fixed px heights so % bars render correctly */}
                                <div className="flex items-end gap-2" style={{ height: '90px' }}>
                                    {trendData.map((r, i) => {
                                        const p = pct(r.totalScore, r.maxScore);
                                        const barPx = Math.max(6, Math.round(p * 0.82)); // max ~82px at 100%
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-end group relative">
                                                <span className="text-[10px] font-bold text-gray-500 absolute -top-5 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">{p}%</span>
                                                <div className="w-full rounded-t-lg transition-all" style={{
                                                    height: `${barPx}px`,
                                                    backgroundColor: p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#f87171'
                                                }} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 mt-1.5">
                                    {trendData.map((r, i) => (
                                        <div key={i} className="flex-1 text-center text-[10px] text-gray-400 truncate">
                                            {new Date(r.submittedAt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short' })}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> 80%+</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400 inline-block" /> 50–79%</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" /> 50%-dən az</span>
                                </div>
                            </div>
                        )}

                        {/* Achievements */}
                        {achievements.length > 0 && (
                            <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 ${trendData.length <= 1 ? 'md:col-span-3' : ''}`}>
                                <h2 className="text-base font-black text-gray-900 mb-4">Nailiyyətlər</h2>
                                <div className="space-y-3">
                                    {achievements.slice(0, 4).map((a, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 bg-indigo-50/50 rounded-xl">
                                            <span className="text-2xl">{a.icon}</span>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">{a.label}</p>
                                                <p className="text-xs text-gray-400">{a.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Ongoing exams */}
                {ongoing.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                        <p className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5" /> Davam edən imtahanlar
                        </p>
                        <div className="space-y-2">
                            {ongoing.map(o => (
                                <div key={o.submissionId} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                                    <span className="font-semibold text-gray-800">{o.examTitle}</span>
                                    <button
                                        onClick={() => navigate(`/test/${o.submissionId}`)}
                                        className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
                                    >
                                        Davam et →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'results' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Nəticələrim
                                {results.length > 0 && <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{results.length}</span>}
                            </button>
                            <button
                                onClick={() => setActiveTab('depot')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'depot' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Depom
                                {depot.length > 0 && <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">{depot.length}</span>}
                            </button>
                        </div>
                        {activeTab === 'results' && (
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="İmtahan axtar..."
                                className="w-full sm:w-56 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        )}
                    </div>

                    {activeTab === 'depot' ? (
                        depot.length === 0 ? (
                            <div className="py-16 text-center text-gray-400">
                                <HiOutlineClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p className="font-medium">Depounuz boşdur</p>
                                <p className="text-sm mt-1">İmtahanlar səhifəsindəki 🔖 düyməsi ilə imtahan əlavə edin</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {depot.map(exam => (
                                    <div key={exam.id} className="px-6 py-5 hover:bg-gray-50/60 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 truncate">{exam.title}</h3>
                                                    {exam.isPaid ? (
                                                        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                            {Number(exam.price).toFixed(2)} ₼ · Ödənilib
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                                            Pulsuz
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                                                    <span>{exam.questionCount} sual</span>
                                                    {exam.durationMinutes && <span>⏱ {exam.durationMinutes} dəq</span>}
                                                    <span>Əlavə edilib: {new Date(exam.savedAt).toLocaleDateString('az-AZ')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => navigate(`/imtahan/${exam.shareLink}`)}
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors border border-indigo-100"
                                                >
                                                    Başla →
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveFromDepot(exam.shareLink)}
                                                    disabled={removingDepot === exam.shareLink}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                                                    title="Depodan sil"
                                                >
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">{search ? 'Nəticə tapılmadı' : 'Hələ heç bir imtahanda iştirak etməmisiniz'}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filtered.map(r => {
                                const p = pct(r.totalScore, r.maxScore);
                                const durActual = r.submittedAt && r.startedAt
                                    ? Math.round((new Date(r.submittedAt) - new Date(r.startedAt)) / 60000)
                                    : null;
                                return (
                                    <div key={r.id} className="px-6 py-5 hover:bg-gray-50/60 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{r.examTitle}</h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    {/* Score bar */}
                                                    <div className="flex items-center gap-2 min-w-[160px]">
                                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${pctColor(p)}`} style={{ width: `${p}%` }} />
                                                        </div>
                                                        <span className={`text-xs font-bold ${pctTextColor(p)}`}>{p}%</span>
                                                    </div>
                                                    <span className="text-sm text-gray-600 font-semibold">
                                                        {fmtScore(r.totalScore)} / {fmtScore(r.maxScore)} bal
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-2.5 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <HiOutlineClock className="w-3.5 h-3.5" />
                                                        {durActual ? fmtDuration(durActual) : '—'}
                                                    </span>
                                                    <span>{fmtDate(r.submittedAt)}</span>
                                                    <span className={`font-bold px-2 py-0.5 rounded-full ${r.isFullyGraded ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                        {r.isFullyGraded ? '✓ Yoxlanılıb' : '⏳ Yoxlanılır'}
                                                    </span>
                                                    {r.rating && (
                                                        <span className="flex items-center gap-0.5 text-yellow-500 font-bold">
                                                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/test/review/${r.id}`)}
                                                className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors border border-indigo-100"
                                            >
                                                Bax
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==== TEACHER PROFILE ====
const TeacherProfile = ({ user }) => {
    const navigate = useNavigate();
    const { setProfilePicture: setGlobalPicture, subscription } = useAuth();
    const [exams, setExams] = useState([]);
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showPwModal, setShowPwModal] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);

    const handleDeleteExam = async (examId) => {
        try {
            await api.delete(`/exams/${examId}`);
            setExams(prev => prev.filter(e => e.id !== examId));
            setPending(prev => prev.filter(s => s.examId !== examId));
            toast.success('İmtahan silindi');
        } catch {
            toast.error('Silinərkən xəta baş verdi');
        } finally {
            setConfirmDelete(null);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [examsData, meData, pendingData] = await Promise.all([
                    api.get('/exams'),
                    api.get('/users/me').catch(() => ({ data: {} })),
                    api.get('/submissions/teacher/pending').catch(() => ({ data: [] }))
                ]);
                setExams(examsData.data);
                setProfilePicture(meData.data?.profilePicture || '');
                setPending(pendingData.data || []);
            } catch {
                toast.error('İmtahanlar yüklənərkən xəta baş verdi');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filtered = exams.filter(e => {
        const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalExams = exams.length;
    const activeExams = exams.filter(e => e.status === 'ACTIVE' || e.status === 'PUBLISHED').length;
    const draftExams = exams.filter(e => e.status === 'DRAFT').length;

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <Helmet>
                <title>Profilim — testup.az</title>
            </Helmet>

            {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

            {/* Header banner */}
            <div className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 pt-10 pb-28 overflow-hidden">
                <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5" />
                <div className="absolute top-4 right-24 h-20 w-20 rounded-full bg-white/5" />
                <div className="absolute -bottom-6 left-12 h-28 w-28 rounded-full bg-white/5" />
            </div>

            <div className="container-main max-w-5xl -mt-20 space-y-6 relative z-10">
                {/* Profile card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <Avatar name={user?.fullName} picture={profilePicture} defaultAvatar={avatarTeacher} onUpload={setProfilePicture} onUploadGlobal={setGlobalPicture} />
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-gray-900">{user?.fullName}</h1>
                        <p className="text-gray-500 mt-0.5">{user?.email}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-xs font-bold">
                                <HiOutlinePencilAlt className="w-3.5 h-3.5" /> Müəllim
                            </span>
                            {activeExams > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> {activeExams} aktiv imtahan
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowPwModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 text-sm font-semibold rounded-xl transition-colors"
                        >
                            <HiOutlineKey className="w-4 h-4" /> Şifrəni Dəyiş
                        </button>
                        <Link
                            to="/imtahanlar"
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            + Yeni İmtahan
                        </Link>
                    </div>
                </div>

                {/* Subscription Info */}
                {subscription?.plan && (() => {
                    const totalDays = Math.max(1, Math.ceil((new Date(subscription.endDate) - new Date(subscription.startDate)) / 86400000));
                    const remainingDays = Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000));
                    const usedPct = Math.min(100, Math.round(((totalDays - remainingDays) / totalDays) * 100));
                    const isExpiringSoon = remainingDays <= 7;
                    const isExpiringSoonish = remainingDays <= 30 && remainingDays > 7;
                    const barColor = isExpiringSoon ? 'bg-red-500' : isExpiringSoonish ? 'bg-amber-400' : 'bg-indigo-500';
                    const textColor = isExpiringSoon ? 'text-red-600' : isExpiringSoonish ? 'text-amber-600' : 'text-indigo-600';
                    const bgColor = isExpiringSoon ? 'from-red-50 to-rose-50 border-red-100' : isExpiringSoonish ? 'from-amber-50 to-yellow-50 border-amber-100' : 'from-indigo-50 to-purple-50 border-indigo-100';
                    return (
                        <div className={`bg-gradient-to-r ${bgColor} rounded-3xl shadow-sm border p-6`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                                        <HiOutlineCheckCircle className={`w-8 h-8 ${textColor}`} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-lg font-black text-gray-900">{subscription.plan.name}</h2>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${subscription.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {subscription.isActive ? 'Aktivdir' : 'Aktiv deyil'}
                                            </span>
                                            {isExpiringSoon && (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                                                    Tezliklə bitir!
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {fmtDate(subscription.startDate)} — {fmtDate(subscription.endDate)}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/planlar" className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap text-sm">
                                    {isExpiringSoon ? 'Uzat' : 'Planı Dəyiş'}
                                </Link>
                            </div>
                            {/* Time progress bar */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-xs text-gray-500 font-medium">Müddət</span>
                                    <span className={`text-xs font-bold ${textColor}`}>
                                        {remainingDays === 0 ? 'Bu gün bitir' : `${remainingDays} gün qalır`}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/70 rounded-full overflow-hidden">
                                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${usedPct}%` }} />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<HiOutlineClipboardList className="w-6 h-6" />} label="Cəmi imtahan" value={totalExams} color="indigo" />
                    <StatCard icon={<HiOutlineCheckCircle className="w-6 h-6" />} label="Aktiv / Dərc" value={activeExams} color="green" />
                    <StatCard icon={<HiOutlineDocumentText className="w-6 h-6" />} label="Qaralama" value={draftExams} color="yellow" />
                    <StatCard icon={<HiOutlineExclamationCircle className="w-6 h-6" />} label="Yoxlanılmağı gözləyir" value={pending.length} color="purple" />
                </div>

                {/* Pending gradings */}
                {pending.length > 0 && (
                    <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-orange-100 bg-orange-50 flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-xl">
                                <HiOutlineExclamationCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-gray-900">Yoxlanılmağı Gözləyən Göndərişlər</h2>
                                <p className="text-xs text-orange-600 font-medium">{pending.length} göndəriş manual yoxlama tələb edir</p>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {pending.slice(0, 5).map(s => (
                                <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">{s.examTitle}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                                            <span>{s.studentName}</span>
                                            {s.submittedAt && <span>· {fmtDate(s.submittedAt)}</span>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/test/review/${s.id}`)}
                                        className="shrink-0 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl transition-colors"
                                    >
                                        Yoxla →
                                    </button>
                                </div>
                            ))}
                            {pending.length > 5 && (
                                <div className="px-6 py-3 text-xs text-center text-gray-400 font-medium">
                                    +{pending.length - 5} daha göndəriş
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Exams list */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-black text-gray-900">Mənim İmtahanlarım</h2>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Status filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                            >
                                <option value="ALL">Bütün statuslar</option>
                                {Object.entries(statusConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="İmtahan axtar..."
                                className="w-full sm:w-52 px-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center text-gray-400">
                            <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p className="font-medium">{search ? 'Nəticə tapılmadı' : 'Hələ heç bir imtahan yaratmamısınız'}</p>
                            {!search && (
                                <Link to="/imtahanlar" className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                                    İlk imtahanı yarat
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filtered.map(exam => {
                                const st = statusConfig[exam.status] || { label: exam.status, cls: 'bg-gray-100 text-gray-600' };
                                const qCount = (exam.questions?.length || 0) + (exam.passages?.flatMap(p => p.questions || []).length || 0);
                                return (
                                    <div key={exam.id} className="px-6 py-5 hover:bg-gray-50/60 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 truncate">{exam.title}</h3>
                                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                                                    {(exam.subjects?.length > 0 || exam.subject) && (
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineAcademicCap className="w-3.5 h-3.5" />
                                                            {(exam.subjects || []).join(', ') || exam.subject}
                                                        </span>
                                                    )}
                                                    {qCount > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineDocumentText className="w-3.5 h-3.5" />
                                                            {qCount} sual
                                                        </span>
                                                    )}
                                                    {exam.durationMinutes && (
                                                        <span className="flex items-center gap-1">
                                                            <HiOutlineClock className="w-3.5 h-3.5" />
                                                            {fmtDuration(exam.durationMinutes)}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        {exam.visibility === 'PUBLIC'
                                                            ? <><HiOutlineGlobe className="w-3.5 h-3.5" /> İctimai</>
                                                            : <><HiOutlineLockClosed className="w-3.5 h-3.5" /> Gizli</>
                                                        }
                                                    </span>
                                                    <span>{fmtDate(exam.createdAt)}</span>
                                                </div>
                                                {exam.tags?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {exam.tags.map(tag => (
                                                            <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                                    title="Statistika"
                                                >
                                                    <HiOutlineChartBar className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)}
                                                    className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                                                    title="Redaktə et"
                                                >
                                                    <HiOutlinePencilAlt className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/imtahanlar/${exam.id}`)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                                                    title="Bax"
                                                >
                                                    <HiOutlineEye className="w-5 h-5" />
                                                </button>
                                                {confirmDelete === exam.id ? (
                                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-xl px-2 py-1">
                                                        <span className="text-xs text-red-600 font-semibold whitespace-nowrap">Silinsin?</span>
                                                        <button
                                                            onClick={() => handleDeleteExam(exam.id)}
                                                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
                                                        >
                                                            Bəli
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(null)}
                                                            className="text-xs font-bold text-gray-500 hover:text-gray-700 px-1 py-1 rounded-lg transition-colors"
                                                        >
                                                            Xeyr
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setConfirmDelete(exam.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                        title="Sil"
                                                    >
                                                        <HiOutlineTrash className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==== MAIN ====
const Profile = () => {
    const { user, isTeacher } = useAuth();
    if (!user) return null;
    return isTeacher ? <TeacherProfile user={user} /> : <StudentProfile user={user} />;
};

export default Profile;
