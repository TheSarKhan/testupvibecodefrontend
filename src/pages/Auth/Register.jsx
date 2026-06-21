import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineEye, HiOutlineEyeOff,
    HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
    HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineChartBar,
    HiOutlineLightningBolt, HiOutlineSparkles, HiOutlineX, HiOutlineCheck,
    HiOutlineChevronLeft, HiOutlineArrowLeft, HiOutlineArrowRight,
    HiOutlineGift, HiOutlineChevronRight,
} from 'react-icons/hi';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { isValidPhoneNumber } from 'react-phone-number-input';
import GoogleRoleModal from '../../components/ui/GoogleRoleModal';
import PhoneInput from '../../components/ui/PhoneInput';
import Logo from '../../components/ui/Logo';
import EmailVerification from '../../components/ui/EmailVerification';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.4-.1-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.2 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.7 39.7 16.3 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.5l6.2 5.3c-.4.4 6.5-4.8 6.5-14.3 0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
);

const calcStrength = (pwd) => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
};

const STRENGTH_LABEL = ['Çox zəif', 'Zəif', 'Orta', 'Yaxşı', 'Güclü'];
const STRENGTH_COLOR = ['bg-red-400', 'bg-red-400', 'bg-amber-400', 'bg-[var(--primary)]', 'bg-[var(--brand-green-600)]'];

// ───────────────────────────────────────────────────────────────────────────
// Step indicator
// ───────────────────────────────────────────────────────────────────────────

const StepDots = ({ step, total = 4 }) => (
    <div className="flex items-center gap-2 justify-center mb-7">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                    i < step
                        ? 'w-2 h-2 bg-[var(--brand-green-600)]'
                        : i === step
                            ? 'w-7 h-2 bg-[var(--primary)]'
                            : 'w-2 h-2 bg-[var(--ink-200)]'
                }`}
            />
        ))}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Brand panel
// ───────────────────────────────────────────────────────────────────────────

const RegisterBrand = ({ role }) => {
    const isTeacher = role === 'TEACHER';
    const isStudent = role === 'STUDENT';
    return (
        <aside
            className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden text-white"
            style={{ background: 'linear-gradient(155deg, var(--brand-blue-700) 0%, var(--primary) 55%, var(--brand-green-600) 130%)' }}
        >
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/5 rounded-full" />
            <div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] bg-white/5 rounded-full" />
            <div className="absolute top-1/2 right-12 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />

            {/* Logo */}
            <Link to="/" className="relative z-10 w-fit" aria-label="testup.az ana səhifə">
                <Logo size={36} dark />
            </Link>

            {/* Body */}
            <div className="relative z-10 my-10">
                <h1 className="text-[34px] xl:text-[42px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-4">
                    {isTeacher ? (<>Müasir müəllim,<br />müasir alətlə<br />işləyir.</>)
                        : (<>Hazırlığa bir<br />addım qalıb.</>)}
                </h1>
                <p className="text-white/75 text-[15px] xl:text-[16px] leading-relaxed max-w-[440px]">
                    {isTeacher ? (
                        <>Müəllim kimi qeydiyyatdan keçin — <strong className="text-white font-semibold">2 aylıq Standart plan</strong> sizindir. Pulsuz.</>
                    ) : isStudent ? (
                        <>Hesabınızı yaradın, imtahanlara qoşulun, nəticələrinizi və inkişafınızı bir yerdə izləyin.</>
                    ) : (
                        <>Hesab yaradıb saniyələr içində ilk imtahanınıza qoşulun — qeydiyyat tamamilə pulsuzdur.</>
                    )}
                </p>

                <div className="mt-9 flex flex-col gap-4">
                    {[
                        { Icon: HiOutlineUserGroup,      name: 'Müəllim icması',    desc: 'Azərbaycanlı müəllimlərin yeni nəsil platforması' },
                        { Icon: HiOutlineChartBar,       name: 'Dərin statistika',  desc: 'Hər şagirdin nəticəsini ayrıca izləyin' },
                        { Icon: HiOutlineLightningBolt,  name: 'AI sual yaratma',   desc: 'Saniyələr içində hazır, keyfiyyətli suallar' },
                    ].map((f, i) => (
                        <div key={i} className="flex items-start gap-3.5">
                            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 backdrop-blur-sm">
                                <f.Icon className="w-5 h-5 text-white" />
                            </span>
                            <div>
                                <div className="font-bold text-[14.5px]">{f.name}</div>
                                <div className="text-[13px] text-white/65 mt-0.5">{f.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Teacher gift card */}
            <div className="relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                <div className="w-11 h-11 rounded-xl bg-[var(--brand-green-600)]/30 text-[var(--brand-green-100)] flex items-center justify-center shrink-0">
                    <HiOutlineGift className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-bold text-[14px]">{isTeacher ? 'Müəllim hədiyyəsi aktivdir' : 'Müəllim hədiyyəsi'}</div>
                    <div className="text-[12.5px] text-white/65 mt-0.5">Müəllim hesabına xüsusi hədiyyə — 2 ay Standart plan, büsbütün pulsuz</div>
                </div>
            </div>
        </aside>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Input validation helpers
// ───────────────────────────────────────────────────────────────────────────

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim());

// Ad, Soyad — hərflər (Azərbaycan əlifbası daxil), boşluq, defis; ən azı 3 simvol.
const isValidName = (v) => {
    const t = (v || '').trim();
    return t.length >= 3 && /^[\p{L}\s'.-]+$/u.test(t);
};

// Telefon validasiyası ortaq <PhoneInput> komponentindən gəlir (libphonenumber)
// — həm Azərbaycan, həm də istənilən beynəlxalq nömrəni düzgün yoxlayır.

// ───────────────────────────────────────────────────────────────────────────
// Field input (reusable)
// ───────────────────────────────────────────────────────────────────────────

const Field = ({ label, Icon, type = 'text', value, onChange, placeholder, required, autoComplete, trailing, maxLength, error }) => (
    <div className="mt-4">
        <label className="block text-[12.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-1.5">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] w-4 h-4 pointer-events-none" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                autoComplete={autoComplete}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`w-full h-12 ${Icon ? 'pl-11' : 'pl-4'} ${trailing ? 'pr-11' : 'pr-4'} rounded-xl bg-[var(--ink-50)] border text-[14px] text-[var(--ink-900)] placeholder-[var(--ink-400)] outline-none focus:bg-white focus:ring-4 transition-colors ${
                    error
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                        : 'border-[var(--ink-200)] focus:border-[var(--primary)] focus:ring-[var(--primary-soft)]'
                }`}
            />
            {trailing}
        </div>
        {error && <p className="mt-1.5 text-[12px] font-medium text-red-500">{error}</p>}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Steps
// ───────────────────────────────────────────────────────────────────────────

const StepRole = ({ role, setRole, googleLogin, onNext }) => (
    <>
        <StepDots step={0} />
        <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight text-center">
            Necə tanıyım sizi?
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--ink-500)] text-center">
            Rolunuzu seçin — istəsəniz sonra dəyişə bilərsiniz
        </p>

        <div className="mt-6 flex flex-col gap-3">
            {[
                { value: 'STUDENT', name: 'Şagird', desc: 'İmtahanlara qoşul, nəticəni anında gör', Icon: HiOutlineAcademicCap, bonus: null },
                { value: 'TEACHER', name: 'Müəllim', desc: 'İmtahan hazırla, nəticəni real vaxtda izlə', Icon: HiOutlineUserGroup, bonus: '✦ 2 ay hədiyyə' },
            ].map((r) => {
                const active = role === r.value;
                return (
                    <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all ${
                            active
                                ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.4)]'
                                : 'border-[var(--ink-200)] bg-white hover:border-[var(--ink-300)]'
                        }`}
                    >
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            r.value === 'TEACHER'
                                ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]'
                                : 'bg-[var(--primary-soft)] text-[var(--primary)]'
                        }`}>
                            <r.Icon className="w-6 h-6" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[15.5px] text-[var(--ink-900)]">{r.name}</span>
                                {r.bonus && (
                                    <span className="inline-flex items-center text-[10.5px] font-bold text-[var(--brand-green-600)] bg-[var(--accent-soft)] border border-[var(--brand-green-100)] px-2 py-0.5 rounded-full">
                                        {r.bonus}
                                    </span>
                                )}
                            </span>
                            <span className="block text-[13px] text-[var(--ink-500)] mt-0.5">{r.desc}</span>
                        </span>
                        <HiOutlineChevronRight className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`} />
                    </button>
                );
            })}
        </div>

        <button
            type="button"
            onClick={onNext}
            disabled={!role}
            className="w-full h-12 mt-6 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
        >
            Davam et <HiOutlineArrowRight className="w-4 h-4" />
        </button>

        <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--ink-150)]" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11.5px] font-semibold text-[var(--ink-400)] uppercase tracking-wider">və ya</span>
            </div>
        </div>

        <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-full border border-[var(--ink-200)] bg-white hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] text-[14px] font-semibold text-[var(--ink-800)] transition-all"
        >
            <GoogleIcon />
            Google ilə qeydiyyat
        </button>

        <p className="mt-6 text-center text-[13.5px] text-[var(--ink-500)]">
            Artıq hesabınız var?{' '}
            <Link to="/login" className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors">
                Daxil olun
            </Link>
        </p>
    </>
);

const StepDetails = ({ role, formData, set, onBack, onNext }) => {
    // Per-field errors only surface once the user has typed something, so the
    // form doesn't shout at an empty field on first render.
    const nameErr  = formData.fullName && !isValidName(formData.fullName) ? 'Ad və soyadınızı tam yazın' : '';
    const emailErr = formData.email && !isValidEmail(formData.email) ? 'Düzgün e-poçt ünvanı daxil edin' : '';
    const phoneErr = formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)
        ? 'Düzgün telefon nömrəsi daxil edin' : '';
    // All three fields are required & must be valid before advancing — this
    // matches the backend (@NotBlank phoneNumber) so the user is blocked here
    // rather than only failing at the final "Hesab yarat" step.
    const ready = isValidName(formData.fullName)
        && isValidEmail(formData.email)
        && isValidPhoneNumber(formData.phoneNumber || '');
    return (
        <>
            <StepDots step={1} />
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] transition-colors mb-3"
            >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Geri
            </button>

            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight">
                Məlumatlarınız
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--ink-500)]">
                {role === 'TEACHER' ? 'Müəllim' : 'Şagird'} kimi qeydiyyat
            </p>

            <Field
                label="Ad, Soyad"
                Icon={HiOutlineUser}
                value={formData.fullName}
                onChange={e => set('fullName', e.target.value)}
                placeholder="Ad Soyad"
                required
                error={nameErr}
            />
            <Field
                label="E-poçt"
                Icon={HiOutlineMail}
                type="email"
                value={formData.email}
                onChange={e => set('email', e.target.value)}
                placeholder="email@nümunə.az"
                autoComplete="email"
                required
                error={emailErr}
            />
            <PhoneInput
                label="Telefon nömrəsi"
                value={formData.phoneNumber}
                onChange={v => set('phoneNumber', v)}
                required
                error={phoneErr}
            />

            <button
                type="button"
                onClick={onNext}
                disabled={!ready}
                className="w-full h-12 mt-6 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                Davam et <HiOutlineArrowRight className="w-4 h-4" />
            </button>

            <p className="mt-6 text-center text-[13.5px] text-[var(--ink-500)]">
                Artıq hesabınız var?{' '}
                <Link to="/login" className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors">
                    Daxil olun
                </Link>
            </p>
        </>
    );
};

const StepPassword = ({ formData, set, onBack, onSubmit, loading }) => {
    const [showP1, setShowP1] = useState(false);
    const [showP2, setShowP2] = useState(false);
    const s = calcStrength(formData.password);
    const ready = formData.password.length >= 8 && formData.password === formData.confirmPassword && formData.termsAccepted;

    return (
        <>
            <StepDots step={2} />
            <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] transition-colors mb-3"
            >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Geri
            </button>

            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight">
                Şifrə yaradın
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--ink-500)]">
                Güclü şifrə — güvənli hesab
            </p>

            <Field
                label="Şifrə"
                Icon={HiOutlineLockClosed}
                type={showP1 ? 'text' : 'password'}
                value={formData.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                required
                trailing={
                    <button
                        type="button"
                        onClick={() => setShowP1(v => !v)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--ink-400)] hover:text-[var(--ink-700)]"
                        tabIndex={-1}
                    >
                        {showP1 ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                }
            />

            {formData.password && (
                <>
                    <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map(i => (
                            <span
                                key={i}
                                className={`flex-1 h-1 rounded-full transition-colors ${i <= s ? STRENGTH_COLOR[Math.min(s, 4)] : 'bg-[var(--ink-150)]'}`}
                            />
                        ))}
                    </div>
                    <div className="text-[11.5px] text-[var(--ink-500)] mt-1.5">
                        <strong className={s >= 3 ? 'text-[var(--brand-green-600)]' : s >= 2 ? 'text-amber-600' : 'text-red-600'}>{STRENGTH_LABEL[s]}</strong>
                        {formData.password.length < 8 && ' · Ən azı 8 simvol olmalıdır'}
                    </div>
                </>
            )}

            <Field
                label="Şifrəni təsdiqləyin"
                Icon={HiOutlineLockClosed}
                type={showP2 ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="••••••••"
                required
                trailing={
                    <button
                        type="button"
                        onClick={() => setShowP2(v => !v)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--ink-400)] hover:text-[var(--ink-700)]"
                        tabIndex={-1}
                    >
                        {showP2 ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                }
            />

            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11.5px] text-red-600 mt-1.5">Şifrələr uyğun gəlmir</p>
            )}

            <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
                <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={e => set('termsAccepted', e.target.checked)}
                    className="w-4 h-4 rounded accent-[var(--primary)] mt-0.5 shrink-0"
                />
                <span className="text-[13px] text-[var(--ink-700)] leading-snug">
                    <Link to="/istifade-sertleri" target="_blank" className="text-[var(--primary)] font-semibold hover:underline">İstifadə şərtləri</Link>
                    {' '}və{' '}
                    <Link to="/gizlilik-siyaseti" target="_blank" className="text-[var(--primary)] font-semibold hover:underline">Gizlilik Siyasətini</Link>
                    {' '}oxuyub qəbul edirəm
                </span>
            </label>

            <button
                type="button"
                onClick={onSubmit}
                disabled={!ready || loading}
                className="w-full h-12 mt-6 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                {loading ? (
                    <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Yaradılır...
                    </>
                ) : 'Hesab yarat'}
            </button>

            <p className="mt-6 text-center text-[13.5px] text-[var(--ink-500)]">
                Artıq hesabınız var?{' '}
                <Link to="/login" className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors">
                    Daxil olun
                </Link>
            </p>
        </>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Welcome gift modal (no emoji)
// ───────────────────────────────────────────────────────────────────────────

const WelcomeGiftModal = ({ onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div
                className="p-8 text-center text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--brand-blue-700) 0%, var(--primary) 55%, var(--brand-green-600) 130%)' }}
            >
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full" />
                <div className="relative">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <HiOutlineGift className="w-10 h-10" />
                    </div>
                    <h2 className="text-[24px] font-extrabold mb-1">Xoş gəldiniz!</h2>
                    <p className="text-white/75 text-[13.5px]">testup.az ilə imtahan hazırlığında yeni bir səhifə açıldı</p>
                </div>
            </div>
            <div className="p-6 text-center">
                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[12.5px] font-bold px-3 py-1.5 rounded-full mb-4">
                    <HiOutlineSparkles className="w-3.5 h-3.5" />
                    2 aylıq Standart plan — Pulsuz hədiyyə!
                </div>
                <p className="text-[var(--ink-600)] text-[13.5px] leading-relaxed mb-5">
                    Müəllim kimi qeydiyyatdan keçdiyiniz üçün sizə{' '}
                    <strong className="text-[var(--ink-900)]">2 aylıq Standart abunəlik</strong> hədiyyə edildi.
                </p>
                <div className="grid grid-cols-2 gap-2 mb-5 text-left">
                    {['Sınırsız sual bazası', 'PDF yükləmə', 'Detallı statistika', 'Şablon imtahanlar'].map(f => (
                        <div key={f} className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--ink-600)]">
                            <HiOutlineCheck className="w-3.5 h-3.5 text-[var(--brand-green-600)] shrink-0" />
                            {f}
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                >
                    Başlayaq
                </button>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white/75 hover:text-white">
                <HiOutlineX className="w-5 h-5" />
            </button>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Register = () => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: '',
        termsAccepted: false,
    });
    const [loading, setLoading] = useState(false);
    const [showGiftModal, setShowGiftModal] = useState(false);
    const [googlePending, setGooglePending] = useState(null);
    // After register() the account is created but unverified — we hold the
    // pending info (email + whether a gift plan was granted) until the OTP
    // is confirmed on step 3, which is when verifyEmail() actually logs in.
    const [pendingVerification, setPendingVerification] = useState(null);
    const { register, loginWithTokens } = useAuth();
    const navigate = useNavigate();

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            const { data } = await api.post('/auth/google', { accessToken: tokenResponse.access_token });
            if (data.status === 'LOGIN') {
                loginWithTokens(data);
                toast.success('Uğurla daxil oldunuz!');
                navigate(data.role === 'ADMIN' ? '/admin' : '/');
            } else if (data.status === 'NEEDS_REGISTRATION') {
                setGooglePending({ accessToken: tokenResponse.access_token, userInfo: data });
            }
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Google ilə qeydiyyat xətası');
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => toast.error('Google girişi ləğv edildi'),
    });

    const handleSubmit = async () => {
        // Backstop validation (the step buttons already gate this, but guard
        // against any path that reaches submit with bad data).
        if (!isValidName(formData.fullName)) { toast.error('Ad və soyadınızı tam yazın'); return; }
        if (!isValidEmail(formData.email)) { toast.error('Düzgün e-poçt ünvanı daxil edin'); return; }
        if (!isValidPhoneNumber(formData.phoneNumber || '')) { toast.error('Düzgün telefon nömrəsi daxil edin'); return; }
        if (!formData.termsAccepted) { toast.error('İstifadə şərtlərini qəbul etməlisiniz'); return; }
        if (formData.password !== formData.confirmPassword) { toast.error('Şifrələr uyğun gəlmir'); return; }
        setLoading(true);
        try {
            const data = await register({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                role: formData.role,
                termsAccepted: formData.termsAccepted,
            });
            // register() no longer logs the user in — it creates an unverified
            // account and emails an OTP. Move to the verification step; the
            // login happens inside verifyEmail() once the code is confirmed.
            if (data?.emailVerificationRequired) {
                setPendingVerification({
                    email: data.email || formData.email,
                    role: data.role || formData.role,
                    giftPlanAssigned: !!data.giftPlanAssigned,
                });
                toast.success('Təsdiq kodu e-poçtunuza göndərildi');
                setStep(3);
            }
        } catch (error) {
            if (!error._handled) toast.error(error.response?.data?.message || 'Qeydiyyat uğursuz oldu');
        } finally {
            setLoading(false);
        }
    };

    // OTP confirmed → verifyEmail() already set the tokens/user; route on.
    // Preserve the first-sign-in gift modal for teachers who were granted a plan.
    const handleVerified = () => {
        const role = pendingVerification?.role;
        const dest = role === 'ADMIN' ? '/admin' : '/';
        toast.success('Qeydiyyat uğurla tamamlandı!');
        if (pendingVerification?.giftPlanAssigned) setShowGiftModal(true);
        else navigate(dest);
    };

    const giftModalDest = pendingVerification?.role === 'ADMIN' ? '/admin' : '/';

    return (
        <>
            {showGiftModal && <WelcomeGiftModal onClose={() => navigate(giftModalDest)} />}

            {googlePending && (
                <GoogleRoleModal
                    accessToken={googlePending.accessToken}
                    userInfo={googlePending.userInfo}
                    onSuccess={(data) => {
                        loginWithTokens(data);
                        toast.success('Qeydiyyat tamamlandı!');
                        navigate(data.role === 'ADMIN' ? '/admin' : '/');
                    }}
                    onClose={() => setGooglePending(null)}
                />
            )}

            <div className="flex min-h-screen" style={{ background: 'var(--paper-cream)' }}>
                <RegisterBrand role={formData.role} />

                <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10">
                    {/* Top — back to site */}
                    <div className="w-full max-w-[460px] mb-6">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] transition-colors"
                        >
                            <HiOutlineChevronLeft className="w-4 h-4" />
                            Sayta qayıt
                        </Link>
                    </div>

                    {/* Mobile logo */}
                    <Link to="/" className="lg:hidden mb-6" aria-label="testup.az ana səhifə">
                        <Logo size={36} />
                    </Link>

                    {/* Form card */}
                    <div className="w-full max-w-[460px] bg-white border border-[var(--ink-200)] rounded-3xl p-7 sm:p-9 shadow-[var(--sh-sm)]">
                        {step === 0 && (
                            <StepRole
                                role={formData.role}
                                setRole={(r) => set('role', r)}
                                googleLogin={googleLogin}
                                onNext={() => setStep(1)}
                            />
                        )}
                        {step === 1 && (
                            <StepDetails
                                role={formData.role}
                                formData={formData}
                                set={set}
                                onBack={() => setStep(0)}
                                onNext={() => setStep(2)}
                            />
                        )}
                        {step === 2 && (
                            <StepPassword
                                formData={formData}
                                set={set}
                                onBack={() => setStep(1)}
                                onSubmit={handleSubmit}
                                loading={loading}
                            />
                        )}
                        {step === 3 && pendingVerification && (
                            <>
                                <StepDots step={3} />
                                <EmailVerification
                                    email={pendingVerification.email}
                                    onVerified={handleVerified}
                                />
                            </>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};

export default Register;
