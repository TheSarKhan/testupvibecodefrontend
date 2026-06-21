import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import avatarTeacher from '../../assets/avatar-teacher.svg';
import avatarStudent from '../../assets/avatar-student.svg';
import { fmtDate, fmtDateShort } from '../../utils/date';
import getErrorMessage from '../../utils/getErrorMessage';
import {
    HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineClock,
    HiOutlineCheckCircle, HiOutlinePencilAlt, HiOutlineEye,
    HiOutlineDocumentText, HiOutlineStar, HiOutlineLockClosed,
    HiOutlineGlobe, HiOutlineClipboardList, HiOutlineExclamationCircle,
    HiOutlineKey, HiOutlineX, HiOutlineEyeOff, HiOutlineCamera, HiOutlineTrash,
    HiOutlineFlag, HiOutlineBookOpen, HiOutlineSparkles, HiOutlineFire,
    HiOutlineLightningBolt, HiOutlinePlus, HiOutlineArrowRight,
    HiOutlineSearch, HiOutlineBookmark, HiOutlineRefresh,
} from 'react-icons/hi';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const fmtScore = (v) => {
    if (v === null || v === undefined) return '0';
    const n = Math.round(v * 100) / 100;
    return n % 1 === 0 ? String(n) : n.toFixed(2);
};

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);

const bucketColor = (p) => p >= 80 ? 'var(--brand-green-600)' : p >= 50 ? '#F59E0B' : '#EF4444';
const bucketBg = (p) => p >= 80 ? 'bg-[var(--brand-green-600)]' : p >= 50 ? 'bg-amber-400' : 'bg-red-400';
const bucketText = (p) => p >= 80 ? 'text-[var(--brand-green-600)]' : p >= 50 ? 'text-amber-600' : 'text-red-600';

const statusConfig = {
    DRAFT:     { label: 'Qaralama',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    PUBLISHED: { label: 'Dərc edilib', cls: 'bg-[var(--primary-soft)] text-[var(--primary-hover)] border-[var(--brand-blue-100)]' },
    ACTIVE:    { label: 'Aktiv',       cls: 'bg-[var(--accent-soft)] text-[var(--brand-green-600)] border-[var(--brand-green-100)]' },
    COMPLETED: { label: 'Tamamlandı',  cls: 'bg-[var(--accent-soft)] text-[var(--brand-green-600)] border-[var(--brand-green-100)]' },
    CANCELLED: { label: 'Ləğv edildi', cls: 'bg-red-50 text-red-700 border-red-200' },
    ARCHIVED:  { label: 'Arxivdə',     cls: 'bg-[var(--ink-100)] text-[var(--ink-600)] border-[var(--ink-200)]' },
};

const fmtDuration = (mins) => {
    if (!mins) return '—';
    return mins >= 60 ? `${Math.floor(mins / 60)}s ${mins % 60}d` : `${mins} dəq`;
};

// ───────────────────────────────────────────────────────────────────────────
// Avatar
// ───────────────────────────────────────────────────────────────────────────

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
                toast.error('Şəkil yüklənmədi');
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
            toast.error('Şəkil silinmədi');
        } finally {
            setDeleting(false);
        }
    };

    const src = picture || defaultAvatar;

    return (
        <div className="relative group shrink-0">
            <div
                className="w-24 h-24 rounded-2xl overflow-hidden shadow-[var(--sh-md)] ring-4 ring-white"
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }}
            >
                {src
                    ? <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    : (
                        <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-[36px]">
                            {name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    )
                }
            </div>
            <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || deleting}
                className="absolute inset-0 rounded-2xl bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Şəkli dəyiş"
            >
                {uploading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <HiOutlineCamera className="w-6 h-6 text-white" />
                }
            </button>
            {picture && (
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Şəkli sil"
                    className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                    {deleting
                        ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        : <HiOutlineX className="w-3.5 h-3.5" />
                    }
                </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Change-password modal
// ───────────────────────────────────────────────────────────────────────────

const PasswordField = ({ id, label, value, showKey, show, setShow, setForm }) => (
    <div>
        <label className="block text-[12.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-1.5">{label}</label>
        <div className="relative">
            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] w-4 h-4 pointer-events-none" />
            <input
                type={show[showKey] ? 'text' : 'password'}
                value={value}
                onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                required
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-[var(--ink-50)] border border-[var(--ink-200)] text-[14px] text-[var(--ink-900)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors"
            />
            <button
                type="button"
                onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)]"
                tabIndex={-1}
            >
                {show[showKey] ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
        </div>
    </div>
);

const ChangePasswordModal = ({ onClose }) => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, new: false, confirm: false });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) { toast.error('Yeni şifrələr uyğun gəlmir'); return; }
        if (form.newPassword.length < 6) { toast.error('Yeni şifrə ən azı 6 simvol olmalıdır'); return; }
        setSaving(true);
        try {
            await api.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            toast.success('Şifrə uğurla dəyişdirildi');
            onClose();
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Şifrə dəyişdirilmədi');
        } finally {
            setSaving(false);
        }
    };

    const strength = Math.min(
        (form.newPassword.length >= 8 ? 1 : 0) +
        (/[A-Z]/.test(form.newPassword) && /[a-z]/.test(form.newPassword) ? 1 : 0) +
        (/[0-9]/.test(form.newPassword) ? 1 : 0) +
        (/[^A-Za-z0-9]/.test(form.newPassword) ? 1 : 0), 4
    );
    const strengthLabels = ['Çox zəif', 'Zəif', 'Orta', 'Yaxşı', 'Güclü'];
    const strengthColors = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-[var(--primary)]', 'bg-[var(--brand-green-600)]'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 border border-[var(--ink-200)]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--primary-soft)] text-[var(--primary)] rounded-xl flex items-center justify-center">
                            <HiOutlineKey className="w-5 h-5" />
                        </div>
                        <h2 className="text-[18px] font-extrabold text-[var(--ink-900)] tracking-tight">Şifrəni dəyiş</h2>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full text-[var(--ink-400)] hover:bg-[var(--ink-100)] hover:text-[var(--ink-700)] flex items-center justify-center transition-colors">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <PasswordField id="currentPassword" label="Cari Şifrə" value={form.currentPassword} showKey="current" show={show} setShow={setShow} setForm={setForm} />
                    <PasswordField id="newPassword"     label="Yeni Şifrə" value={form.newPassword}     showKey="new"     show={show} setShow={setShow} setForm={setForm} />
                    <PasswordField id="confirmPassword" label="Yeni Şifrəni təsdiqlə" value={form.confirmPassword} showKey="confirm" show={show} setShow={setShow} setForm={setForm} />

                    {form.newPassword && (
                        <div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3, 4].map(i => (
                                    <span
                                        key={i}
                                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[Math.min(strength, 4)] : 'bg-[var(--ink-150)]'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-[11.5px] text-[var(--ink-500)] mt-1.5">
                                <strong className={strength >= 3 ? 'text-[var(--brand-green-600)]' : strength >= 2 ? 'text-amber-600' : 'text-red-600'}>
                                    {strengthLabels[strength]}
                                </strong>
                                {form.newPassword.length < 6 && ' · Ən azı 6 simvol'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13.5px] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            Ləğv et
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 h-11 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[13.5px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all disabled:opacity-60"
                        >
                            {saving ? 'Saxlanılır...' : 'Dəyiş'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Inline email-change flow (used inside EditProfileModal).
// Step 1 emails an OTP to the new address; step 2 confirms it.
// confirmEmailChange() refreshes the tokens + user via AuthContext, so the
// displayed email updates automatically.
// ───────────────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN = 60;

const EmailChangeSection = ({ currentEmail }) => {
    const { requestEmailChange, confirmEmailChange } = useAuth();
    const [open, setOpen] = useState(false);
    const [stage, setStage] = useState('email'); // 'email' | 'otp'
    const [newEmail, setNewEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    const reset = () => {
        setOpen(false);
        setStage('email');
        setNewEmail('');
        setOtp('');
        setCooldown(0);
    };

    const sendCode = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await requestEmailChange(newEmail.trim());
            toast.success('Təsdiq kodu yeni e-poçta göndərildi');
            setStage('otp');
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            if (!err._handled) toast.error(getErrorMessage(err, 'Kod göndərilmədi'));
        } finally {
            setBusy(false);
        }
    };

    const confirm = async () => {
        if (busy || otp.length < 6) return;
        setBusy(true);
        try {
            await confirmEmailChange(otp);
            toast.success('E-poçt yeniləndi');
            reset();
        } catch (err) {
            if (!err._handled) toast.error(getErrorMessage(err, 'Kod yanlış və ya vaxtı keçib'));
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        if (cooldown > 0 || busy) return;
        setBusy(true);
        try {
            await requestEmailChange(newEmail.trim());
            toast.success('Kod yenidən göndərildi');
            setCooldown(RESEND_COOLDOWN);
        } catch (err) {
            if (!err._handled) toast.error(getErrorMessage(err, 'Kod göndərilmədi'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">E-poçt</label>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={currentEmail || ''}
                    disabled
                    className="flex-1 min-w-0 h-11 px-3.5 rounded-2xl border border-[var(--ink-150)] bg-[var(--ink-50)] text-[14px] text-[var(--ink-500)] outline-none cursor-not-allowed"
                />
                {!open && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="shrink-0 h-11 px-4 rounded-2xl border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13px] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                    >
                        Dəyiş
                    </button>
                )}
            </div>

            {open && (
                <div className="mt-3 p-4 rounded-2xl border border-[var(--ink-200)] bg-[var(--ink-50)] space-y-3">
                    {stage === 'email' ? (
                        <>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">Yeni e-poçt</label>
                                <input
                                    type="email"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    autoFocus
                                    placeholder="yeni@nümunə.az"
                                    className="w-full h-11 px-3.5 rounded-2xl border border-[var(--ink-200)] bg-white text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                                />
                            </div>
                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex-1 h-10 rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13px] hover:bg-[var(--ink-100)] transition-colors"
                                >
                                    Ləğv et
                                </button>
                                <button
                                    type="button"
                                    onClick={sendCode}
                                    disabled={busy || !newEmail.trim()}
                                    className="flex-1 h-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[13px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    {busy ? 'Göndərilir...' : 'Kod göndər'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-[12.5px] text-[var(--ink-500)]">
                                <strong className="text-[var(--ink-700)] font-semibold break-all">{newEmail.trim()}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil edin
                            </p>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                autoFocus
                                autoComplete="one-time-code"
                                placeholder="000000"
                                className="w-full text-center text-xl font-bold tracking-[0.5em] h-12 rounded-2xl bg-white border-2 border-[var(--ink-200)] text-[var(--ink-900)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors placeholder-[var(--ink-300)] placeholder:tracking-[0.5em]"
                            />
                            <div className="text-center text-[12px] text-[var(--ink-500)]">
                                Kod gəlmədi?{' '}
                                {cooldown > 0 ? (
                                    <span className="text-[var(--ink-400)] font-semibold">Yenidən göndər ({cooldown})</span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={resend}
                                        disabled={busy}
                                        className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors disabled:opacity-50"
                                    >
                                        Kodu yenidən göndər
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex-1 h-10 rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13px] hover:bg-[var(--ink-100)] transition-colors"
                                >
                                    Ləğv et
                                </button>
                                <button
                                    type="button"
                                    onClick={confirm}
                                    disabled={busy || otp.length < 6}
                                    className="flex-1 h-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[13px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    {busy ? 'Təsdiqlənir...' : 'Təsdiqlə'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Edit-profile modal — lets the user update their display name and e-mail.
// ───────────────────────────────────────────────────────────────────────────

const EditProfileModal = ({ initial, onClose }) => {
    const { user } = useAuth();
    const [fullName, setFullName] = useState(initial?.fullName || '');
    const [saving, setSaving] = useState(false);

    const save = async (e) => {
        e?.preventDefault?.();
        const trimmed = fullName.trim();
        if (!trimmed) { toast.error('Ad boş ola bilməz'); return; }
        if (trimmed === initial?.fullName) { onClose(); return; }
        setSaving(true);
        try {
            await api.put('/users/me', { fullName: trimmed });
            toast.success('Profil yeniləndi');
            // Reload to refresh AuthContext with the new name everywhere.
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Profil yenilənmədi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-[var(--ink-900)]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={save} className="bg-white rounded-3xl shadow-[var(--sh-lg)] border border-[var(--ink-200)] w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--ink-150)]">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] inline-flex items-center justify-center">
                            <HiOutlinePencilAlt className="w-4.5 h-4.5" />
                        </span>
                        <h3 className="text-[16px] font-extrabold text-[var(--ink-900)] tracking-tight">Profili düzəlt</h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-xl text-[var(--ink-400)] hover:text-[var(--ink-700)] hover:bg-[var(--ink-50)]">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1.5">Ad Soyad</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            autoFocus
                            disabled={saving}
                            className="w-full h-11 px-3.5 rounded-2xl border border-[var(--ink-200)] text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-colors"
                            placeholder="Ad Soyad"
                        />
                    </div>
                    <EmailChangeSection currentEmail={user?.email} />
                </div>

                <div className="flex gap-2.5 px-6 pb-6 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 h-11 rounded-full border border-[var(--ink-200)] text-[var(--ink-700)] font-semibold text-[13px] hover:bg-[var(--ink-100)] transition-colors"
                    >
                        Ləğv et
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !fullName.trim()}
                        className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--brand-blue-300)] disabled:cursor-not-allowed text-white font-bold text-[13px] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-colors"
                    >
                        {saving ? <><div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saxlanır...</> : 'Yadda saxla'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Building blocks
// ───────────────────────────────────────────────────────────────────────────

const HeroGradient = () => (
    <div
        className="relative h-28 md:h-32 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--brand-blue-700) 0%, var(--primary) 60%, var(--brand-green-600) 130%)' }}
    >
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-white/10 rounded-full" />
        <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
            }}
        />
    </div>
);

const StatCard = ({ Icon, label, value, color, soft }) => (
    <div className="relative bg-white border border-[var(--ink-200)] rounded-2xl p-5 flex items-center gap-4 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: soft, color }}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
            <div className="text-[24px] font-extrabold text-[var(--ink-900)] leading-none truncate">{value}</div>
            <div className="text-[12.5px] text-[var(--ink-500)] mt-1.5">{label}</div>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// STUDENT PROFILE
// ───────────────────────────────────────────────────────────────────────────

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
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
    const [removingDepot, setRemovingDepot] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                // All four requests share the .catch fallback now — the
                // earlier asymmetry let a transient /my-results 500 blank
                // the whole profile even though the rest had loaded fine.
                let resultsFailed = false;
                const [res, on, me, dep] = await Promise.all([
                    api.get('/submissions/my-results').catch(() => { resultsFailed = true; return { data: [] }; }),
                    api.get('/submissions/ongoing').catch(() => ({ data: [] })),
                    api.get('/users/me').catch(() => ({ data: {} })),
                    api.get('/depot').catch(() => ({ data: [] })),
                ]);
                setResults(res.data);
                setOngoing(on.data || []);
                setProfilePicture(me.data?.profilePicture || '');
                setDepot(dep.data || []);
                if (resultsFailed) toast.error('Nəticələr yüklənə bilmədi');
            } finally {
                setLoading(false);
            }
        };
        load();
        const onFocus = () => {
            api.get('/submissions/my-results').then(r => setResults(r.data)).catch(() => {});
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, []);

    const handleRemoveFromDepot = async (shareLink) => {
        setRemovingDepot(shareLink);
        try {
            await api.delete(`/depot/${shareLink}`);
            setDepot(prev => prev.filter(e => e.shareLink !== shareLink));
            toast.success('Depodan silindi');
        } catch {
            toast.error('Depodan silinmədi');
        } finally {
            setRemovingDepot(null);
        }
    };

    const resultPct = (r) => pct(r.totalScore, r.maxScore);
    const filtered = results
        .filter(r => r.examTitle?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    const completed = results.filter(r => r.submittedAt);
    const totalExams = completed.length;
    const avgPct = totalExams > 0 ? Math.round(completed.reduce((s, r) => s + resultPct(r), 0) / totalExams) : 0;
    const bestPct = totalExams > 0 ? Math.max(...completed.map(r => resultPct(r))) : 0;
    const pendingCount = results.filter(r => !r.isFullyGraded && r.submittedAt).length;

    const trendData = [...completed]
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
        .slice(-7);

    // 4 achievements — matches the testup student-dashboard design.
    // "Cəld həll" is wired to a fast-solver signal derived from submission timing
    // (when a teacher exposes durationMinutes & startedAt/submittedAt the helper
    // returns true if the student used < 50% of the allotted time).
    const fastSolver = completed.some(r => {
        if (!r.startedAt || !r.submittedAt || !r.durationMinutes) return false;
        const usedSec = (new Date(r.submittedAt) - new Date(r.startedAt)) / 1000;
        return usedSec > 0 && usedSec < (r.durationMinutes * 60) * 0.5;
    });
    const achievements = [
        { Icon: HiOutlineFlag,        label: 'İlk imtahan', desc: 'İlk imtahanı tamamladı', got: totalExams >= 1, color: '#2563EB' },
        { Icon: HiOutlineStar,        label: 'Əla nəticə',  desc: '90%+ bal qazandı',       got: bestPct >= 90,   color: '#F59E0B' },
        { Icon: HiOutlineCheckCircle, label: 'Mükəmməl',    desc: '100% bal qazandı',       got: bestPct === 100, color: '#16A34A' },
        { Icon: HiOutlineLightningBolt, label: 'Cəld həll', desc: 'Vaxtın 50%-ini istifadə etdi', got: fastSolver, color: '#7C3AED' },
    ];
    const gotCount = achievements.filter(a => a.got).length;

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <Helmet><title>Profilim — testup.az</title></Helmet>
            {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
            {showEditProfile && (
                <EditProfileModal
                    initial={{ fullName: user?.fullName || '' }}
                    onClose={() => setShowEditProfile(false)}
                />
            )}

            <HeroGradient />

            <div className="container-main max-w-5xl relative">
                {/* Profile card — explicit z-10 keeps it above the hero gradient even
                    when the avatar overflows upward. -mt-12 gives a smaller overlap
                    that pairs with the trimmed hero height (h-28/h-32). */}
                <div className="relative z-10 bg-white border border-[var(--ink-200)] rounded-3xl p-6 md:p-7 -mt-12 mb-6 shadow-[var(--sh-md)]">
                    <div className="flex flex-col md:flex-row md:items-center gap-5">
                        <Avatar
                            name={user?.fullName}
                            picture={profilePicture}
                            defaultAvatar={avatarStudent}
                            onUpload={setProfilePicture}
                            onUploadGlobal={setGlobalPicture}
                        />
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[22px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight truncate">
                                {user?.fullName || 'İstifadəçi'}
                            </h1>
                            <p className="text-[13.5px] text-[var(--ink-500)] mt-0.5 truncate">{user?.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--primary-hover)] bg-[var(--primary-soft)] border border-[var(--brand-blue-100)] px-2.5 py-1 rounded-full">
                                    <HiOutlineAcademicCap className="w-3.5 h-3.5" /> Şagird
                                </span>
                                {pendingCount > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                        <HiOutlineClock className="w-3.5 h-3.5" /> {pendingCount} yoxlanılır
                                    </span>
                                )}
                                {totalExams > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2.5 py-1 rounded-full">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> {totalExams} imtahan tamamlandı
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 shrink-0">
                            <button
                                onClick={() => setShowPwModal(true)}
                                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-semibold text-[var(--ink-700)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                <HiOutlineKey className="w-3.5 h-3.5" /> Şifrəni dəyiş
                            </button>
                            <button
                                onClick={() => setShowEditProfile(true)}
                                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_6px_18px_-8px_rgba(37,99,235,0.55)] transition-all"
                            >
                                <HiOutlinePencilAlt className="w-3.5 h-3.5" /> Profili düzəlt
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard Icon={HiOutlineDocumentText} label="İmtahan"      value={totalExams}        color="#2563EB" soft="#EFF4FF" />
                    <StatCard Icon={HiOutlineChartBar}     label="Orta nəticə"  value={`${avgPct}%`}      color="#16A34A" soft="#ECFDF3" />
                    <StatCard Icon={HiOutlineStar}         label="Ən yüksək"    value={`${bestPct}%`}     color="#F59E0B" soft="#FEF3C7" />
                    <StatCard Icon={HiOutlineClock}        label="Yoxlanılır"   value={pendingCount}      color="#7C3AED" soft="#F3EEFE" />
                </div>

                {/* Trend + Achievements */}
                {totalExams > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 mb-6">
                        {trendData.length >= 1 && (
                            <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
                                <h3 className="text-[15px] font-bold text-[var(--ink-900)]">Son nəticələr</h3>
                                <p className="text-[12.5px] text-[var(--ink-500)] mt-0.5 mb-5">Son {trendData.length} imtahanın faiz nəticəsi</p>
                                <div className="flex items-end justify-around gap-2 h-[160px] pt-5">
                                    {trendData.map((r, i) => {
                                        const p = resultPct(r);
                                        const color = bucketColor(p);
                                        const h = Math.max((p / 100) * 100, 4);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-2 max-w-[60px]">
                                                <div className="relative w-full flex-1 flex items-end">
                                                    <div
                                                        className="w-full rounded-t-lg transition-all duration-700 relative"
                                                        style={{ height: `${h}%`, background: color, minHeight: '6px' }}
                                                    >
                                                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[var(--ink-700)]">{p}%</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-[var(--ink-500)] font-mono">
                                                    {fmtDateShort(r.submittedAt)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-[var(--ink-150)] text-[11.5px] text-[var(--ink-500)]">
                                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--brand-green-600)]" /> 80%+</span>
                                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 50–79%</span>
                                    <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt; 50%</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[15px] font-bold text-[var(--ink-900)]">Nailiyyətlər</h3>
                                <span className="text-[11.5px] font-bold text-[var(--ink-500)] bg-[var(--ink-100)] px-2 py-0.5 rounded-full">{gotCount} / {achievements.length}</span>
                            </div>
                            <p className="text-[12.5px] text-[var(--ink-500)] mb-4">Qazandığınız nailiyyətlər</p>
                            <div className="flex flex-col gap-2.5">
                                {achievements.map((a, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${a.got ? '' : 'opacity-50'}`}
                                        style={a.got ? { background: `${a.color}10`, borderColor: `${a.color}22` } : { background: 'var(--ink-50)', borderColor: 'var(--ink-150)' }}
                                    >
                                        <span
                                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={a.got ? { background: a.color, color: '#fff' } : { background: 'var(--ink-200)', color: 'var(--ink-400)' }}
                                        >
                                            <a.Icon className="w-4 h-4" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-bold text-[var(--ink-900)] truncate">{a.label}</div>
                                            <div className="text-[11.5px] text-[var(--ink-500)] truncate">{a.desc}</div>
                                        </div>
                                        {a.got && (
                                            <span className="w-5 h-5 rounded-full bg-[var(--brand-green-600)] text-white flex items-center justify-center shrink-0">
                                                <HiOutlineCheckCircle className="w-3 h-3" />
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Ongoing exams */}
                {ongoing.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
                        <p className="text-[13px] font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <HiOutlineExclamationCircle className="w-5 h-5" /> Davam edən imtahanlar
                        </p>
                        <div className="flex flex-col gap-2">
                            {ongoing.map(o => (
                                <div key={o.submissionId} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100">
                                    <span className="font-semibold text-[var(--ink-800)] text-[14px] truncate">{o.examTitle}</span>
                                    <button
                                        onClick={() => navigate(`/test/${o.submissionId}`)}
                                        className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        Davam et <HiOutlineArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs + content */}
                <div className="bg-white border border-[var(--ink-200)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--ink-150)] flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1 bg-[var(--ink-100)] rounded-full p-1">
                            <TabBtn active={activeTab === 'results'} onClick={() => setActiveTab('results')} Icon={HiOutlineClipboardList} count={results.length}>
                                Nəticələrim
                            </TabBtn>
                            <TabBtn active={activeTab === 'depot'} onClick={() => setActiveTab('depot')} Icon={HiOutlineBookmark} count={depot.length}>
                                Depom
                            </TabBtn>
                        </div>
                        {activeTab === 'results' && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-all min-w-[200px]">
                                <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="İmtahan axtar..."
                                    className="flex-1 bg-transparent outline-none text-[13px] text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                                />
                            </div>
                        )}
                    </div>

                    {activeTab === 'depot' ? (
                        depot.length === 0 ? (
                            <EmptyState
                                Icon={HiOutlineBookmark}
                                title="Depo boşdur"
                                subtitle="İmtahanlar səhifəsində bookmark ikonu ilə imtahanları əlavə edin"
                                cta={{ label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') }}
                            />
                        ) : (
                            <div className="divide-y divide-[var(--ink-150)]">
                                {depot.map(exam => (
                                    <div key={exam.id} className="px-5 py-4 hover:bg-[var(--ink-100)] transition-colors flex items-center gap-4">
                                        <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                                            <HiOutlineBookmark className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14.5px] font-bold text-[var(--ink-900)] truncate">{exam.title}</h3>
                                                {exam.isPaid ? (
                                                    <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                        {Number(exam.price).toFixed(2)} ₼ · Ödənilib
                                                    </span>
                                                ) : (
                                                    <span className="text-[10.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2 py-0.5 rounded-full">
                                                        Pulsuz
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-1.5 text-[11.5px] text-[var(--ink-500)]">
                                                <span className="inline-flex items-center gap-1"><HiOutlineDocumentText className="w-3 h-3" /> {exam.questionCount} sual</span>
                                                {exam.durationMinutes && <span className="inline-flex items-center gap-1"><HiOutlineClock className="w-3 h-3" /> {exam.durationMinutes} dəq</span>}
                                                <span>Əlavə: {fmtDate(exam.savedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => navigate(`/imtahan/${exam.shareLink}`)}
                                                className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                                            >
                                                Başla <HiOutlineArrowRight className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFromDepot(exam.shareLink)}
                                                disabled={removingDepot === exam.shareLink}
                                                className="w-9 h-9 rounded-full text-[var(--ink-400)] hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-50"
                                                title="Depodan sil"
                                            >
                                                <HiOutlineTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            Icon={HiOutlineDocumentText}
                            title={search ? 'Nəticə tapılmadı' : 'Hələ heç bir imtahanda iştirak etməmisiniz'}
                            subtitle={search ? 'Başqa açar söz cəhd edin' : 'İmtahanlara qoşulun və nəticələriniz burada görünəcək'}
                            cta={!search ? { label: 'İmtahanlara bax', onClick: () => navigate('/imtahanlar') } : null}
                        />
                    ) : (
                        <div className="divide-y divide-[var(--ink-150)]">
                            {filtered.map(r => {
                                const p = resultPct(r);
                                const durActual = r.submittedAt && r.startedAt
                                    ? Math.round((new Date(r.submittedAt) - new Date(r.startedAt)) / 60000)
                                    : null;
                                const showCount = r.correctCount != null && r.questionCount != null;
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => navigate(`/test/result/${r.id}`)}
                                        className="px-5 py-4 hover:bg-[var(--ink-100)] transition-colors cursor-pointer flex items-center gap-4 group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[14.5px] font-bold text-[var(--ink-900)] truncate group-hover:text-[var(--primary)] transition-colors">{r.examTitle}</h3>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <div className="flex items-center gap-2 min-w-[160px]">
                                                    <div className="flex-1 h-1.5 bg-[var(--ink-150)] rounded-full overflow-hidden max-w-[180px]">
                                                        <div className={`h-full rounded-full ${bucketBg(p)}`} style={{ width: `${p}%` }} />
                                                    </div>
                                                    <span className={`text-[13px] font-extrabold tabular-nums ${bucketText(p)}`}>{p}%</span>
                                                </div>
                                                {showCount && (
                                                    <span className="text-[12px] text-[var(--ink-500)] font-mono">
                                                        {r.correctCount} / {r.questionCount} sual
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-[11.5px] text-[var(--ink-500)]">
                                                <span className="inline-flex items-center gap-1">
                                                    <HiOutlineClock className="w-3 h-3" />
                                                    {durActual ? fmtDuration(durActual) : '—'}
                                                </span>
                                                <span>{fmtDate(r.submittedAt)}</span>
                                                <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                                                    r.isFullyGraded
                                                        ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]'
                                                        : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {r.isFullyGraded ? <><HiOutlineCheckCircle className="w-3 h-3" /> Yoxlanılıb</> : <><HiOutlineClock className="w-3 h-3" /> Yoxlanılır</>}
                                                </span>
                                                {r.rating && (
                                                    <span className="text-amber-500 font-bold">
                                                        {'★'.repeat(r.rating)}<span className="text-[var(--ink-200)]">{'★'.repeat(5 - r.rating)}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12.5px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] group-hover:bg-[var(--primary)] group-hover:text-white shrink-0 transition-all">
                                            <HiOutlineEye className="w-3.5 h-3.5" /> Bax
                                        </span>
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

// ───────────────────────────────────────────────────────────────────────────
// TEACHER PROFILE
// ───────────────────────────────────────────────────────────────────────────

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

    useEffect(() => {
        const load = async () => {
            try {
                const [ex, me, pn] = await Promise.all([
                    api.get('/exams'),
                    api.get('/users/me').catch(() => ({ data: {} })),
                    api.get('/submissions/teacher/pending').catch(() => ({ data: [] })),
                ]);
                setExams(ex.data);
                setProfilePicture(me.data?.profilePicture || '');
                setPending(pn.data || []);
            } catch {
                toast.error('İmtahanlar yüklənmədi');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleDeleteExam = async (examId) => {
        try {
            await api.delete(`/exams/${examId}`);
            setExams(prev => prev.filter(e => e.id !== examId));
            setPending(prev => prev.filter(s => s.examId !== examId));
            toast.success('İmtahan silindi');
        } catch {
            toast.error('İmtahan silinmədi');
        } finally {
            setConfirmDelete(null);
        }
    };

    const filtered = exams.filter(e => {
        const matchSearch = e.title?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalExams = exams.length;
    const activeExams = exams.filter(e => e.status === 'ACTIVE' || e.status === 'PUBLISHED').length;
    const draftExams = exams.filter(e => e.status === 'DRAFT').length;

    return (
        <div className="min-h-screen pb-16" style={{ background: 'var(--paper-cream)' }}>
            <Helmet><title>Profilim — testup.az</title></Helmet>
            {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}

            <HeroGradient />

            <div className="container-main max-w-5xl relative">
                {/* Profile card */}
                <div className="relative z-10 bg-white border border-[var(--ink-200)] rounded-3xl p-6 md:p-7 -mt-12 mb-6 shadow-[var(--sh-md)]">
                    <div className="flex flex-col md:flex-row md:items-center gap-5">
                        <Avatar
                            name={user?.fullName}
                            picture={profilePicture}
                            defaultAvatar={avatarTeacher}
                            onUpload={setProfilePicture}
                            onUploadGlobal={setGlobalPicture}
                        />
                        <div className="flex-1 min-w-0">
                            <h1 className="text-[22px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight truncate">
                                {user?.fullName}
                            </h1>
                            <p className="text-[13.5px] text-[var(--ink-500)] mt-0.5 truncate">{user?.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2.5 py-1 rounded-full">
                                    <HiOutlinePencilAlt className="w-3.5 h-3.5" /> Müəllim
                                </span>
                                {activeExams > 0 && (
                                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--primary-hover)] bg-[var(--primary-soft)] border border-[var(--brand-blue-100)] px-2.5 py-1 rounded-full">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5" /> {activeExams} aktiv imtahan
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                                onClick={() => setShowPwModal(true)}
                                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-semibold text-[var(--ink-700)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                <HiOutlineKey className="w-3.5 h-3.5" /> Şifrəni dəyiş
                            </button>
                            <Link
                                to="/imtahanlar/yarat"
                                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                <HiOutlinePlus className="w-3.5 h-3.5" /> Yeni imtahan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Subscription info */}
                {subscription?.plan && (() => {
                    const totalDays = Math.max(1, Math.ceil((new Date(subscription.endDate) - new Date(subscription.startDate)) / 86400000));
                    const remainingDays = Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000));
                    const usedPct = Math.min(100, Math.round(((totalDays - remainingDays) / totalDays) * 100));
                    const isExpiringSoon = remainingDays <= 7;
                    const isExpiringSoonish = remainingDays <= 30 && remainingDays > 7;
                    const barColor = isExpiringSoon ? '#EF4444' : isExpiringSoonish ? '#F59E0B' : 'var(--primary)';
                    const textColor = isExpiringSoon ? 'text-red-600' : isExpiringSoonish ? 'text-amber-600' : 'text-[var(--primary)]';
                    return (
                        <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                                    >
                                        <HiOutlineCheckCircle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-[16px] font-extrabold text-[var(--ink-900)] tracking-tight">{subscription.plan.name}</h2>
                                            <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                                                subscription.isActive
                                                    ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)] border-[var(--brand-green-100)]'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {subscription.isActive ? 'Aktivdir' : 'Aktiv deyil'}
                                            </span>
                                            {isExpiringSoon && (
                                                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse">
                                                    Tezliklə bitir!
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12.5px] text-[var(--ink-500)] mt-1">
                                            {fmtDate(subscription.startDate)} — {fmtDate(subscription.endDate)}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to="/planlar"
                                    className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[12.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    {isExpiringSoon ? 'Uzat' : 'Planı dəyiş'} <HiOutlineArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">Müddət</span>
                                    <span className={`text-[12.5px] font-bold ${textColor}`}>
                                        {remainingDays === 0 ? 'Bu gün bitir' : `${remainingDays} gün qalır`}
                                    </span>
                                </div>
                                <div className="h-2 bg-[var(--ink-150)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${usedPct}%`, background: barColor }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <StatCard Icon={HiOutlineClipboardList}     label="Cəmi imtahan"           value={totalExams}     color="#2563EB" soft="#EFF4FF" />
                    <StatCard Icon={HiOutlineCheckCircle}       label="Aktiv / Dərc"           value={activeExams}    color="#16A34A" soft="#ECFDF3" />
                    <StatCard Icon={HiOutlineDocumentText}      label="Qaralama"               value={draftExams}     color="#F59E0B" soft="#FEF3C7" />
                    <StatCard Icon={HiOutlineExclamationCircle} label="Yoxlama gözləyir"       value={pending.length} color="#7C3AED" soft="#F3EEFE" />
                </div>

                {/* Pending gradings */}
                {pending.length > 0 && (
                    <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden mb-6">
                        <div className="px-5 py-4 border-b border-amber-100 bg-amber-50 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <HiOutlineExclamationCircle className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-[14.5px] font-extrabold text-[var(--ink-900)]">Yoxlanılmağı gözləyən göndərişlər</h2>
                                <p className="text-[11.5px] text-amber-700 font-medium">{pending.length} göndəriş manual yoxlama tələb edir</p>
                            </div>
                        </div>
                        <div className="divide-y divide-[var(--ink-150)]">
                            {pending.slice(0, 5).map(s => (
                                <div key={s.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--ink-100)] transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-bold text-[var(--ink-900)] truncate">{s.examTitle}</p>
                                        <p className="text-[11.5px] text-[var(--ink-500)] mt-0.5 flex items-center gap-2">
                                            <span>{s.studentName}</span>
                                            {s.submittedAt && <span>· {fmtDate(s.submittedAt)}</span>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/test/review/${s.id}`)}
                                        className="shrink-0 inline-flex items-center gap-1 h-9 px-4 rounded-full text-[12.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                                    >
                                        Yoxla <HiOutlineArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {pending.length > 5 && (
                                <div className="px-5 py-3 text-[11.5px] text-center text-[var(--ink-500)] font-medium">
                                    +{pending.length - 5} daha göndəriş
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Exams list */}
                <div className="bg-white border border-[var(--ink-200)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[var(--ink-150)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-[15px] font-bold text-[var(--ink-900)]">Mənim imtahanlarım</h2>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="appearance-none h-10 pl-3.5 pr-9 bg-white border border-[var(--ink-200)] rounded-xl text-[13px] font-semibold text-[var(--ink-700)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                                >
                                    <option value="ALL">Bütün statuslar</option>
                                    {Object.entries(statusConfig).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] pointer-events-none">▾</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl focus-within:border-[var(--primary)] focus-within:bg-white transition-all min-w-[200px]">
                                <HiOutlineSearch className="w-4 h-4 text-[var(--ink-400)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="İmtahan axtar..."
                                    className="flex-1 bg-transparent outline-none text-[13px] text-[var(--ink-800)] placeholder-[var(--ink-400)]"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <EmptyState
                            Icon={HiOutlineDocumentText}
                            title={search ? 'Nəticə tapılmadı' : 'Hələ heç bir imtahan yaratmamısınız'}
                            subtitle={search ? 'Başqa açar söz cəhd edin' : 'İlk imtahanınızı yaradın və şagirdlərinizlə paylaşın'}
                            cta={!search ? { label: 'İlk imtahanı yarat', onClick: () => navigate('/imtahanlar/yarat') } : null}
                        />
                    ) : (
                        <div className="divide-y divide-[var(--ink-150)]">
                            {filtered.map(exam => {
                                const st = statusConfig[exam.status] || { label: exam.status, cls: 'bg-[var(--ink-100)] text-[var(--ink-600)] border-[var(--ink-200)]' };
                                const qCount = (exam.questions?.length || 0) + (exam.passages?.flatMap(p => p.questions || []).length || 0);
                                return (
                                    <div key={exam.id} className="px-5 py-4 hover:bg-[var(--ink-100)] transition-colors flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-[14.5px] font-bold text-[var(--ink-900)] truncate">{exam.title}</h3>
                                                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-2 text-[11.5px] text-[var(--ink-500)]">
                                                {(exam.subjects?.length > 0 || exam.subject) && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <HiOutlineAcademicCap className="w-3 h-3" />
                                                        {(exam.subjects || []).join(', ') || exam.subject}
                                                    </span>
                                                )}
                                                {qCount > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <HiOutlineDocumentText className="w-3 h-3" />
                                                        {qCount} sual
                                                    </span>
                                                )}
                                                {exam.durationMinutes && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <HiOutlineClock className="w-3 h-3" />
                                                        {fmtDuration(exam.durationMinutes)}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    {exam.visibility === 'PUBLIC'
                                                        ? <><HiOutlineGlobe className="w-3 h-3" /> İctimai</>
                                                        : <><HiOutlineLockClosed className="w-3 h-3" /> Gizli</>
                                                    }
                                                </span>
                                                <span>{fmtDate(exam.createdAt)}</span>
                                            </div>
                                            {exam.tags?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {exam.tags.map(tag => (
                                                        <span key={tag} className="text-[10.5px] bg-[var(--primary-soft)] text-[var(--primary-hover)] px-2 py-0.5 rounded-full">{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <IconBtn onClick={() => navigate(`/imtahanlar/${exam.id}/statistika`)} title="Statistika" hover="hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]">
                                                <HiOutlineChartBar className="w-4 h-4" />
                                            </IconBtn>
                                            <IconBtn onClick={() => navigate(`/imtahanlar/edit/${exam.id}`)} title="Redaktə et" hover="hover:text-[var(--brand-green-600)] hover:bg-[var(--accent-soft)]">
                                                <HiOutlinePencilAlt className="w-4 h-4" />
                                            </IconBtn>
                                            <IconBtn onClick={() => navigate(`/imtahanlar/${exam.id}`)} title="Bax" hover="hover:text-[var(--primary)] hover:bg-[var(--primary-soft)]">
                                                <HiOutlineEye className="w-4 h-4" />
                                            </IconBtn>
                                            {confirmDelete === exam.id ? (
                                                <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                                                    <span className="text-[10.5px] text-red-700 font-bold whitespace-nowrap">Silinsin?</span>
                                                    <button
                                                        onClick={() => handleDeleteExam(exam.id)}
                                                        className="text-[10.5px] font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-full transition-colors"
                                                    >
                                                        Bəli
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="text-[10.5px] font-bold text-[var(--ink-500)] hover:text-[var(--ink-800)] px-1 py-0.5 transition-colors"
                                                    >
                                                        Xeyr
                                                    </button>
                                                </div>
                                            ) : (
                                                <IconBtn onClick={() => setConfirmDelete(exam.id)} title="Sil" hover="hover:text-red-500 hover:bg-red-50">
                                                    <HiOutlineTrash className="w-4 h-4" />
                                                </IconBtn>
                                            )}
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

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const TabBtn = ({ active, onClick, Icon, count, children }) => (
    <button
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-all ${
            active
                ? 'bg-white text-[var(--ink-900)] shadow-[var(--sh-sm)]'
                : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
        }`}
    >
        <Icon className="w-3.5 h-3.5" />
        {children}
        {count != null && count > 0 && (
            <span className={`text-[11px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${active ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'bg-white text-[var(--ink-500)]'}`}>
                {count}
            </span>
        )}
    </button>
);

const IconBtn = ({ children, onClick, title, hover }) => (
    <button
        onClick={onClick}
        title={title}
        className={`w-9 h-9 rounded-lg text-[var(--ink-400)] ${hover} transition-colors flex items-center justify-center`}
    >
        {children}
    </button>
);

const EmptyState = ({ Icon, title, subtitle, cta }) => (
    <div className="text-center py-14 px-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--ink-100)] text-[var(--ink-400)] flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
        </div>
        <h4 className="text-[16px] font-bold text-[var(--ink-900)]">{title}</h4>
        <p className="text-[13.5px] text-[var(--ink-500)] mt-1 max-w-md mx-auto">{subtitle}</p>
        {cta && (
            <button
                onClick={cta.onClick}
                className="mt-5 h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                {cta.label} <HiOutlineArrowRight className="w-4 h-4" />
            </button>
        )}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Profile = () => {
    const { user, isTeacher } = useAuth();
    if (!user) return null;
    return isTeacher ? <TeacherProfile user={user} /> : <StudentProfile user={user} />;
};

export default Profile;
