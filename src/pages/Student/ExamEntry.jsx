import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HiOutlineUser, HiOutlineLockClosed, HiOutlineCheck, HiOutlineCheckCircle,
    HiOutlineArrowRight, HiOutlineClock, HiOutlineLibrary, HiOutlineUserGroup,
    HiOutlineExclamation, HiOutlineShieldCheck, HiOutlineQuestionMarkCircle,
    HiOutlineLogout, HiOutlineRefresh, HiOutlineCurrencyDollar,
} from 'react-icons/hi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import Logo from '../../components/ui/Logo';

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

const initialsOf = (name) => {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
};

// ───────────────────────────────────────────────────────────────────────────
// Left panel — exam meta (blue gradient)
// ───────────────────────────────────────────────────────────────────────────

const ExamMeta = ({ exam }) => {
    const subjects = exam.subjects?.length ? exam.subjects : (exam.subject ? [exam.subject] : []);
    const totalQ = (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);
    return (
        <div
            className="relative overflow-hidden text-white p-7 md:p-9 lg:p-10 flex flex-col"
            style={{ background: 'linear-gradient(155deg, var(--brand-blue-700) 0%, var(--primary) 55%, var(--brand-green-600) 130%)' }}
        >
            {/* Decorative orbs */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full" />
            <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 right-12 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2" />

            {/* Subjects eyebrow */}
            {subjects.length > 0 && (
                <div className="relative flex items-center gap-2 flex-wrap mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/80">
                    {subjects.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-2">
                            {i > 0 && <span className="text-white/40">·</span>}
                            {s}
                        </span>
                    ))}
                </div>
            )}

            {/* Title */}
            <h1 className="relative text-[24px] md:text-[28px] font-extrabold tracking-[-0.02em] leading-[1.2]">
                {exam.title}
            </h1>

            {/* Teacher */}
            {exam.teacherName && (
                <div className="relative flex items-center gap-2.5 mt-5">
                    <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-[12px] font-bold backdrop-blur-sm">
                        {initialsOf(exam.teacherName)}
                    </span>
                    <span className="text-[13.5px] text-white/85">
                        Müəllim: <strong className="text-white font-semibold">{exam.teacherName}</strong>
                    </span>
                </div>
            )}

            {/* Stats grid */}
            <div className="relative grid grid-cols-3 gap-3 mt-6">
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <HiOutlineLibrary className="w-[18px] h-[18px] text-white/80 shrink-0" />
                    <div>
                        <div className="text-[16px] font-extrabold leading-none">{totalQ}</div>
                        <div className="text-[10.5px] text-white/70 mt-1">Sual</div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <HiOutlineClock className="w-[18px] h-[18px] text-white/80 shrink-0" />
                    <div>
                        <div className="text-[16px] font-extrabold leading-none">{exam.durationMinutes ? `${exam.durationMinutes} dəq` : '∞'}</div>
                        <div className="text-[10.5px] text-white/70 mt-1">Müddət</div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                    <HiOutlineUserGroup className="w-[18px] h-[18px] text-white/80 shrink-0" />
                    <div>
                        <div className="text-[16px] font-extrabold leading-none">{exam.participantCount ?? 0}</div>
                        <div className="text-[10.5px] text-white/70 mt-1">İştirakçı</div>
                    </div>
                </div>
            </div>

            {/* Feature checklist */}
            <div className="relative flex flex-col gap-2.5 mt-7">
                {[
                    'Cavablar avtomatik saxlanılır — internet kəsilsə də itməz',
                    'Bütün suallar arasında rahat keçid imkanı',
                    'Nəticə imtahan bitdiyi anda hazır olur',
                ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] text-white/85 leading-snug">
                        <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5 backdrop-blur-sm">
                            <HiOutlineCheck className="w-3 h-3" />
                        </span>
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            {/* Visibility / price strip */}
            {(exam.visibility === 'PRIVATE' || (exam.price != null && exam.price > 0)) && (
                <div className="relative flex flex-wrap gap-2 mt-auto pt-7">
                    {exam.visibility === 'PRIVATE' && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 backdrop-blur-sm">
                            <HiOutlineLockClosed className="w-3 h-3" /> Gizli imtahan
                        </span>
                    )}
                    {exam.price != null && exam.price > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-50 backdrop-blur-sm">
                            <HiOutlineCurrencyDollar className="w-3 h-3" />
                            {Number(exam.price).toFixed(2)} ₼
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Right panel — join form
// ───────────────────────────────────────────────────────────────────────────

const JoinForm = ({
    exam, isAuthenticated, user, ctx, guestName, setGuestName,
    accessCode, setAccessCode, onStart, isJoining,
    isPaid, hasPurchased, isPurchasing, onPurchase,
    onLogout,
}) => {
    const titleByCtx = {
        login: 'Başlamağa hazırsınız',
        guest: 'İmtahana qoşul',
        code:  'İmtahan kodunu daxil edin',
    };
    const subByCtx = {
        login: 'Hesabınıza daxil olmusunuz. Aşağıdakı düyməyə basaraq dərhal başlaya bilərsiniz.',
        guest: 'Adınızı daxil edin və imtahana başlayın.',
        code:  'Müəllimdən aldığınız 6 rəqəmli kodu yazın.',
    };

    return (
        <div className="bg-white p-7 md:p-9 lg:p-10 flex flex-col">
            {/* Icon header */}
            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-4">
                <HiOutlineLibrary className="w-6 h-6" />
            </div>
            <h2 className="text-[22px] md:text-[24px] font-extrabold text-[var(--ink-900)] tracking-tight">
                {titleByCtx[ctx]}
            </h2>
            <p className="mt-2 text-[14px] text-[var(--ink-500)] leading-relaxed">
                {subByCtx[ctx]}
            </p>

            {/* ── Context-aware content ── */}

            {/* Guest: warning */}
            {ctx === 'guest' && (
                <div className="mt-5 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <HiOutlineExclamation className="w-4 h-4" />
                    </span>
                    <div className="text-[12.5px] text-amber-800 leading-relaxed">
                        <strong className="block text-amber-900 mb-0.5">Xəbərdarlıq</strong>
                        Qonaq kimi qoşulsanız, nəticələrinizə sonradan geri qayıda bilməyəcəksiniz.
                    </div>
                </div>
            )}

            {/* Login: user chip */}
            {ctx === 'login' && user && (
                <div className="mt-5 flex items-center gap-3 p-4 bg-[var(--accent-soft)] border border-[var(--brand-green-100)] rounded-2xl">
                    <span className="w-10 h-10 rounded-full bg-[var(--brand-green-600)] text-white inline-flex items-center justify-center font-bold text-[13px] shrink-0">
                        {initialsOf(user.fullName || user.email)}
                    </span>
                    <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-bold text-[var(--ink-900)] truncate">{user.fullName || 'İstifadəçi'}</div>
                        <div className="text-[12px] text-[var(--ink-500)] truncate">{user.email}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white text-[var(--brand-green-600)] rounded-full text-[10.5px] font-bold shrink-0">
                        <HiOutlineCheck className="w-3 h-3" /> Doğrulanıb
                    </span>
                </div>
            )}

            {/* Guest: name input */}
            {ctx === 'guest' && (
                <div className="mt-5">
                    <label className="block text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-1.5">
                        Ad və Soyad
                    </label>
                    <div className="relative">
                        <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-400)] w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder="Adınızı daxil edin"
                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-[var(--ink-50)] border border-[var(--ink-200)] text-[14px] text-[var(--ink-900)] placeholder-[var(--ink-400)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors"
                        />
                    </div>
                </div>
            )}

            {/* Code input (always 6-digit OTP-style; private exams) */}
            {ctx === 'code' && (
                <CodeInput value={accessCode} onChange={setAccessCode} />
            )}

            {/* Pre-flight checklist */}
            <div className="mt-5 flex flex-col gap-2">
                {[
                    'Cihazınız və internetiniz hazırdır',
                    'Sakit bir mühitdə olmağı tövsiyə edirik',
                    'İmtahan başlayandan sonra geri sayma davam edəcək',
                ].map((text, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--ink-600)]">
                        <span className="w-4 h-4 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)] flex items-center justify-center shrink-0 mt-0.5">
                            <HiOutlineCheck className="w-2.5 h-2.5" />
                        </span>
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            {/* Main CTA */}
            <div className="mt-6">
                {isPaid && !hasPurchased ? (
                    <button
                        onClick={onPurchase}
                        disabled={isPurchasing}
                        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.6)] transition-all disabled:opacity-60"
                    >
                        <HiOutlineCurrencyDollar className="w-4 h-4" />
                        {isPurchasing ? 'Emal edilir...' : `Satın al · ${Number(exam.price).toFixed(2)} ₼`}
                    </button>
                ) : (
                    <button
                        onClick={onStart}
                        disabled={isJoining}
                        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all disabled:opacity-60"
                    >
                        {isJoining ? 'Yüklənir...' : <>İmtahana başla <HiOutlineArrowRight className="w-4 h-4" /></>}
                    </button>
                )}
            </div>

            {/* Footer hint */}
            <div className="mt-5 text-center text-[12.5px] text-[var(--ink-500)]">
                {ctx === 'guest' && (
                    <>
                        Hesabınız varsa{' '}
                        <Link to="/login" state={{ returnUrl: window.location.pathname }} className="text-[var(--primary)] font-semibold hover:underline">
                            daxil olun
                        </Link>
                        {' '}və ya{' '}
                        <Link to="/register" state={{ returnUrl: window.location.pathname }} className="text-[var(--primary)] font-semibold hover:underline">
                            qeydiyyat olun
                        </Link>
                    </>
                )}
                {ctx === 'login' && (
                    <>
                        Siz deyilsiniz?{' '}
                        <button onClick={onLogout} className="text-[var(--primary)] font-semibold hover:underline">
                            Çıxış et
                        </button>
                    </>
                )}
                {ctx === 'code' && (
                    <>
                        Kod yoxdur?{' '}
                        <span className="text-[var(--ink-700)]">Müəllimdən soruşun</span>
                    </>
                )}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// 6-digit code input (OTP-style)
// ───────────────────────────────────────────────────────────────────────────

const CodeInput = ({ value, onChange }) => {
    const refs = useRef([]);
    const digits = (value || '').padEnd(6, ' ').slice(0, 6).split('');

    const setDigit = (i, v) => {
        const clean = v.replace(/\D/g, '').slice(-1);
        if (!clean && v !== '') return;
        const arr = (value || '').padEnd(6, ' ').slice(0, 6).split('');
        arr[i] = clean || ' ';
        const next = arr.join('').replace(/\s+$/, '').trimEnd();
        onChange(next.replace(/ /g, ''));
        if (clean && i < 5) refs.current[i + 1]?.focus();
    };

    const handleKey = (e, i) => {
        if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
            refs.current[i - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && i > 0) {
            refs.current[i - 1]?.focus();
        } else if (e.key === 'ArrowRight' && i < 5) {
            refs.current[i + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted) {
            e.preventDefault();
            onChange(pasted);
            const idx = Math.min(pasted.length, 5);
            setTimeout(() => refs.current[idx]?.focus(), 0);
        }
    };

    return (
        <div className="mt-5">
            <label className="block text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-3">
                6 rəqəmli kod
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5">
                {digits.map((d, i) => (
                    <input
                        key={i}
                        ref={el => refs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d.trim()}
                        onChange={e => setDigit(i, e.target.value)}
                        onKeyDown={e => handleKey(e, i)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        className="w-11 h-14 sm:w-12 sm:h-14 text-center text-[22px] font-extrabold text-[var(--ink-900)] bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors tabular-nums"
                    />
                ))}
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Resume ongoing exam panel (guest)
// ───────────────────────────────────────────────────────────────────────────

const ResumeOngoing = ({ ongoing, onResume, onFinish, finishing }) => (
    <div className="bg-white p-7 md:p-9 lg:p-10 flex flex-col">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <HiOutlineClock className="w-6 h-6" />
        </div>
        <h2 className="text-[22px] md:text-[24px] font-extrabold text-[var(--ink-900)] tracking-tight">
            Yarımçıq imtahanınız var
        </h2>
        <p className="mt-2 text-[14px] text-[var(--ink-500)] leading-relaxed">
            Bu imtahanı əvvəl başlatmısınız. Davam edə və ya bitirə bilərsiniz. Yeni imtahana başlamaq üçün əvvəlcə cari imtahanı bitirin.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
            <button
                onClick={onResume}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
            >
                İmtahana davam et <HiOutlineArrowRight className="w-4 h-4" />
            </button>
            <button
                onClick={onFinish}
                disabled={finishing}
                className="h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-all disabled:opacity-60"
            >
                {finishing ? 'Bitirilir...' : 'İmtahanı bitir'}
            </button>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Closed / Draft state
// ───────────────────────────────────────────────────────────────────────────

const ExamClosed = ({ exam }) => {
    const totalQ = (exam.questions?.length || 0) + (exam.passages?.reduce((s, p) => s + (p.questions?.length || 0), 0) || 0);
    return (
        <div className="bg-white p-7 md:p-9 lg:p-10 flex flex-col">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                <HiOutlineLockClosed className="w-6 h-6" />
            </div>
            <h2 className="text-[22px] md:text-[24px] font-extrabold text-[var(--ink-900)] tracking-tight">
                İmtahan hazırda bağlıdır
            </h2>
            <p className="mt-2 text-[14px] text-[var(--ink-500)] leading-relaxed">
                Müəllimlə əlaqə saxlayın və ya sonra yenidən yoxlayın. İmtahan yayımlananda burda görünəcək.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
                {totalQ > 0 && (
                    <div className="bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-2xl p-4 text-center">
                        <div className="text-[20px] font-extrabold text-[var(--ink-900)]">{totalQ}</div>
                        <div className="text-[11px] text-[var(--ink-500)] mt-1 uppercase tracking-wider">Sual</div>
                    </div>
                )}
                <div className="bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-2xl p-4 text-center">
                    <div className="text-[20px] font-extrabold text-[var(--ink-900)]">{exam.durationMinutes ? exam.durationMinutes : '∞'}</div>
                    <div className="text-[11px] text-[var(--ink-500)] mt-1 uppercase tracking-wider">{exam.durationMinutes ? 'Dəqiqə' : 'Sərbəst'}</div>
                </div>
            </div>
            <Link
                to="/imtahanlar"
                className="mt-6 h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-bold text-[var(--ink-700)] bg-[var(--ink-100)] hover:bg-[var(--ink-150)] transition-all"
            >
                Digər imtahanlar
            </Link>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const ExamEntry = () => {
    const { shareLink } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, logout } = useAuth();

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guestName, setGuestName] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [guestOngoing, setGuestOngoing] = useState(null);
    const [isFinishingOngoing, setIsFinishingOngoing] = useState(false);

    // ── Load exam ────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get(`/exams/${shareLink}`);
                if (cancelled) return;
                setExam(data);
                const isFree = data.price == null || Number(data.price) === 0;
                if (isFree) setHasPurchased(true);
                else if (isAuthenticated) {
                    try {
                        const status = await api.get(`/exams/${data.shareLink}/my-status`);
                        if (!cancelled) setHasPurchased(status.data.hasUnusedPurchase);
                    } catch {}
                }
            } catch {
                toast.error('İmtahan tapılmadı və ya aktiv deyil');
                navigate('/');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [shareLink, isAuthenticated]);

    // ── Detect guest ongoing ─────────────────────────────────────────────────
    useEffect(() => {
        if (isAuthenticated) { setGuestOngoing(null); return; }
        const raw = localStorage.getItem('guestOngoingExam');
        if (!raw) return;
        let stored;
        try { stored = JSON.parse(raw); } catch { localStorage.removeItem('guestOngoingExam'); return; }
        if (!stored?.submissionId || (stored.shareLink && stored.shareLink !== shareLink)) return;
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get(`/submissions/${stored.submissionId}/session`);
                if (cancelled) return;
                if (data.submittedAt || (data.durationMinutes && data.remainingSeconds <= 0)) {
                    localStorage.removeItem('guestOngoingExam');
                    return;
                }
                setGuestOngoing({
                    submissionId: stored.submissionId,
                    examTitle: data.examTitle || stored.examTitle,
                    startedAt: data.startedAt,
                    durationMinutes: data.durationMinutes,
                });
            } catch (err) {
                if (cancelled) return;
                if (err.response?.status === 404 || err.response?.status === 400) {
                    localStorage.removeItem('guestOngoingExam');
                }
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, shareLink]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleStart = async () => {
        if (!exam) return;
        if (!isAuthenticated && !guestName.trim()) {
            toast.error('Zəhmət olmasa adınızı qeyd edin');
            return;
        }
        if (exam.visibility === 'PRIVATE' && accessCode.length < 6) {
            toast.error('6 rəqəmli kodu tam daxil edin');
            return;
        }
        setIsJoining(true);
        try {
            const { data } = await api.post(`/submissions/start/${shareLink}`, {
                guestName: isAuthenticated ? undefined : guestName,
                accessCode: exam.visibility === 'PRIVATE' ? accessCode : undefined,
            });
            if (!isAuthenticated) {
                localStorage.setItem('guestOngoingExam', JSON.stringify({
                    submissionId: data.id,
                    examTitle: data.examTitle || exam.title,
                    startedAt: data.startedAt,
                    durationMinutes: data.durationMinutes,
                    shareLink,
                }));
            }
            navigate(`/test/take/${data.id}`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'İmtahana başlamaq mümkün olmadı');
        } finally {
            setIsJoining(false);
        }
    };

    const handlePurchase = async () => {
        if (!isAuthenticated) {
            toast('Ödənişli imtahan üçün hesabınıza daxil olun');
            navigate('/login', { state: { returnUrl: location.pathname } });
            return;
        }
        setIsPurchasing(true);
        try {
            const { data } = await api.post('/payment/initiate-exam', { shareLink });
            if (data.alreadyPurchased) {
                setHasPurchased(true);
                toast.success('Bu imtahanı artıq almışsınız. İmtahana başlaya bilərsiniz.');
                return;
            }
            localStorage.setItem('pendingPaymentOrderId', data.orderId);
            window.open(data.paymentUrl, '_blank', 'noopener');
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Ödəniş başladıla bilmədi');
        } finally {
            setIsPurchasing(false);
        }
    };

    const handleFinishOngoing = async () => {
        if (!guestOngoing) return;
        if (!window.confirm('Yarımçıq imtahanı bitirmək istədiyinizə əminsiniz?')) return;
        setIsFinishingOngoing(true);
        try {
            await api.post(`/submissions/${guestOngoing.submissionId}/finalize`);
            localStorage.removeItem('guestOngoingExam');
            toast.success('İmtahan bitirildi');
            navigate(`/test/result/${guestOngoing.submissionId}`);
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'İmtahanı bitirərkən xəta baş verdi');
        } finally {
            setIsFinishingOngoing(false);
        }
    };

    const handleLogout = () => {
        if (logout) logout();
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!exam) return null;

    const isClosed = exam.status === 'CANCELLED' || exam.status === 'DRAFT';
    const isPaid = exam.price != null && Number(exam.price) > 0;
    const ctx = isAuthenticated ? 'login' : (exam.visibility === 'PRIVATE' ? 'code' : 'guest');

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper-cream)' }}>
            {/* Top bar */}
            <div className="border-b border-[var(--ink-150)] bg-white">
                <div className="container-main py-3.5 flex items-center justify-between">
                    <Link to="/" aria-label="testup.az ana səhifə">
                        <Logo size={32} />
                    </Link>
                    <Link
                        to="/elaqe"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] hover:bg-[var(--ink-100)] transition-all"
                    >
                        <HiOutlineQuestionMarkCircle className="w-3.5 h-3.5" />
                        Köməyə ehtiyacın var?
                    </Link>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-4xl bg-white rounded-3xl border border-[var(--ink-200)] overflow-hidden shadow-[var(--sh-lg)] grid grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
                    <ExamMeta exam={exam} />

                    {isClosed ? (
                        <ExamClosed exam={exam} />
                    ) : guestOngoing && !isAuthenticated ? (
                        <ResumeOngoing
                            ongoing={guestOngoing}
                            onResume={() => navigate(`/test/take/${guestOngoing.submissionId}`)}
                            onFinish={handleFinishOngoing}
                            finishing={isFinishingOngoing}
                        />
                    ) : (
                        <JoinForm
                            exam={exam}
                            isAuthenticated={isAuthenticated}
                            user={user}
                            ctx={ctx}
                            guestName={guestName}
                            setGuestName={setGuestName}
                            accessCode={accessCode}
                            setAccessCode={setAccessCode}
                            onStart={handleStart}
                            isJoining={isJoining}
                            isPaid={isPaid}
                            hasPurchased={hasPurchased}
                            isPurchasing={isPurchasing}
                            onPurchase={handlePurchase}
                            onLogout={handleLogout}
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-[var(--ink-150)] bg-white">
                <div className="container-main py-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--ink-500)]">
                    <div>© 2026 testup.az — Onlayn imtahan platforması</div>
                    <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1 text-[var(--brand-green-600)] font-semibold">
                            <HiOutlineShieldCheck className="w-3.5 h-3.5" /> SSL ilə qorunan
                        </span>
                        <Link to="/gizlilik-siyaseti" className="hover:text-[var(--primary)]">Məxfilik</Link>
                        <Link to="/istifade-sertleri" className="hover:text-[var(--primary)]">Şərtlər</Link>
                        <Link to="/elaqe" className="hover:text-[var(--primary)]">Dəstək</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ExamEntry;
