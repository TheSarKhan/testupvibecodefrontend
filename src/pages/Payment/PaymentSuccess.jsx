import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineArrowRight,
    HiOutlineExclamation, HiOutlineXCircle, HiOutlineClock,
    HiOutlineShieldCheck, HiOutlineHome, HiOutlineSparkles,
} from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/ui/Logo';

const MAX_WAIT_SECONDS = 120;
const LAST_COMPLETED_KEY = 'lastCompletedPayment';
const COMPLETED_TTL_MS = 60 * 60 * 1000; // remember a completed payment for 1h

// Remember the just-completed payment so returning to this page (browser
// back/forward) shows success instead of re-verifying a stale/absent order.
const readLastCompleted = () => {
    try {
        const obj = JSON.parse(localStorage.getItem(LAST_COMPLETED_KEY) || 'null');
        if (!obj?.at || Date.now() - obj.at > COMPLETED_TTL_MS) return null;
        return obj;
    } catch { return null; }
};
const writeLastCompleted = (obj) => {
    try { localStorage.setItem(LAST_COMPLETED_KEY, JSON.stringify({ ...obj, at: Date.now() })); } catch { /* ignore */ }
};

// ───────────────────────────────────────────────────────────────────────────
// Shared layout shell
// ───────────────────────────────────────────────────────────────────────────

const PaymentShell = ({ children }) => (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper-cream)' }}>
        {/* Top bar */}
        <div className="border-b border-[var(--ink-150)] bg-white">
            <div className="container-main py-3.5 flex items-center justify-between">
                <Link to="/" aria-label="testup.az ana səhifə">
                    <Logo size={32} />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-500)]">
                    <HiOutlineShieldCheck className="w-3.5 h-3.5 text-[var(--brand-green-600)]" />
                    SSL ilə qorunan ödəniş
                </span>
            </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
            {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-[var(--ink-150)] bg-white">
            <div className="container-main py-3.5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-[var(--ink-500)]">
                <div>© 2026 testup.az — Onlayn imtahan platforması</div>
                <div className="flex items-center gap-4">
                    <Link to="/gizlilik-siyaseti" className="hover:text-[var(--primary)]">Məxfilik</Link>
                    <Link to="/istifade-sertleri" className="hover:text-[var(--primary)]">Şərtlər</Link>
                    <Link to="/elaqe" className="hover:text-[var(--primary)]">Dəstək</Link>
                </div>
            </div>
        </footer>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Result card (used by all states)
// ───────────────────────────────────────────────────────────────────────────

const ResultCard = ({ accent, Icon, badge, title, subtitle, children }) => {
    const accents = {
        success: { ring: 'shadow-[0_30px_60px_-20px_rgba(34,197,94,0.35)]', iconBg: 'bg-[var(--accent-soft)]', iconFg: 'text-[var(--brand-green-600)]', gradient: 'linear-gradient(135deg, var(--brand-green-600) 0%, var(--primary) 100%)' },
        pending: { ring: 'shadow-[0_30px_60px_-20px_rgba(245,158,11,0.35)]', iconBg: 'bg-amber-50',            iconFg: 'text-amber-600',                 gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' },
        error:   { ring: 'shadow-[0_30px_60px_-20px_rgba(239,68,68,0.35)]',  iconBg: 'bg-red-50',              iconFg: 'text-red-600',                   gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    };
    const a = accents[accent] || accents.success;
    return (
        <div className={`relative w-full max-w-md bg-white rounded-3xl border border-[var(--ink-200)] overflow-hidden ${a.ring}`}>
            {/* Accent strip */}
            <div className="h-1.5 w-full" style={{ background: a.gradient }} />

            <div className="p-8 md:p-10 text-center">
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl ${a.iconBg} ${a.iconFg} flex items-center justify-center mx-auto mb-5 shadow-[var(--sh-sm)]`}>
                    <Icon className="w-10 h-10" />
                </div>

                {/* Badge (optional) */}
                {badge && (
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-[var(--ink-100)] text-[var(--ink-700)] mb-3">
                        {badge}
                    </span>
                )}

                <h1 className="text-[24px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight">{title}</h1>
                <p className="mt-2.5 text-[14.5px] text-[var(--ink-500)] leading-relaxed">{subtitle}</p>

                <div className="mt-7">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshSubscription, loading: authLoading } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying | success | pending | failed
    const [orderType, setOrderType] = useState(null);   // 'EXAM' | 'SUBSCRIPTION' | null
    const [examShareLink, setExamShareLink] = useState(null);
    const [waitSeconds, setWaitSeconds] = useState(0);
    const verified = useRef(false);
    const orderIdRef = useRef(null);
    const pollTimer = useRef(null);

    useEffect(() => {
        if (authLoading) return;
        if (verified.current) return;
        verified.current = true;

        // Order type (and exam link) captured at initiate time, so even a slow
        // verify that hasn't reached a terminal PAID — or a PAID without a
        // share link — still shows exam-context text instead of falling back
        // to subscription wording (#XXX).
        const storedType = localStorage.getItem('pendingPaymentType');
        if (storedType) setOrderType(storedType);
        const storedExamLink = localStorage.getItem('pendingPaymentExamShareLink');
        if (storedExamLink) setExamShareLink(storedExamLink);
        localStorage.removeItem('pendingPaymentType');
        localStorage.removeItem('pendingPaymentExamShareLink');

        const orderId = searchParams.get('orderId')
            || searchParams.get('order_id')
            || searchParams.get('id')
            || localStorage.getItem('pendingPaymentOrderId');

        // Returning to this page after a payment already completed (browser
        // back/forward). Don't re-verify a stale/absent order — restore the
        // success view from the remembered completion instead.
        const last = readLastCompleted();
        if (last && (!orderId || last.orderId === orderId)) {
            if (last.type) setOrderType(last.type);
            if (last.examShareLink) setExamShareLink(last.examShareLink);
            localStorage.removeItem('pendingPaymentOrderId');
            setStatus('success');
            return;
        }

        if (!orderId) {
            setStatus('pending');
            return;
        }
        localStorage.removeItem('pendingPaymentOrderId');
        orderIdRef.current = orderId;
        verify(orderId);
    }, [authLoading]);

    useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

    const verify = async (orderId) => {
        try {
            // Background poll with its own pending/failed UI — suppress the
            // global server-error toast (it would fire on every retry).
            const { data } = await api.post('/payment/verify', { orderId }, { skipErrorToast: true });
            // Capture the order type / exam link from EVERY response (the
            // backend now returns them in all states), so the context is known
            // even before — or without — a terminal PAID.
            if (data.orderType) setOrderType(data.orderType);
            if (data.examShareLink) setExamShareLink(data.examShareLink);
            if (data.status === 'NOT_FOUND') { setStatus('failed'); return; }
            if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                const isExamOrder = data.orderType === 'EXAM' || !!data.examShareLink;
                if (!isExamOrder) await refreshSubscription();
                localStorage.setItem('paymentCompleted', Date.now().toString());
                // Remember so a back/forward revisit shows success without re-verifying.
                writeLastCompleted({
                    orderId,
                    type: data.orderType || orderType,
                    examShareLink: data.examShareLink || examShareLink,
                });
                setStatus('success');
                return;
            }
            scheduleRetry(orderId);
        } catch {
            scheduleRetry(orderId);
        }
    };

    // True for exam purchases — known from the verify response or the type
    // stashed at initiate time. Drives exam-vs-subscription wording in every
    // state so a slow bank confirmation never shows plan text on an exam buy.
    const isExam = orderType === 'EXAM' || !!examShareLink;

    const scheduleRetry = (orderId) => {
        setWaitSeconds(prev => {
            const next = prev + 5;
            if (next >= MAX_WAIT_SECONDS) {
                setStatus('pending');
                return prev;
            }
            pollTimer.current = setTimeout(() => verify(orderId), 5000);
            return next;
        });
    };

    // ── Verifying ────────────────────────────────────────────────────────────
    if (status === 'verifying') {
        const pct = Math.min(100, (waitSeconds / MAX_WAIT_SECONDS) * 100);
        return (
            <PaymentShell>
                <ResultCard
                    accent="pending"
                    Icon={HiOutlineClock}
                    badge="Yoxlanılır"
                    title="Ödəniş yoxlanılır..."
                    subtitle="Bank tərəfindən təsdiqi gözləyirik. Bu adətən bir neçə saniyə çəkir."
                >
                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                    {waitSeconds > 0 && (
                        <>
                            <p className="text-[12.5px] text-[var(--ink-500)] mb-3 font-mono tabular-nums">
                                {waitSeconds} saniyə gözlənildi
                            </p>
                            <div className="w-full bg-[var(--ink-150)] rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
                                />
                            </div>
                        </>
                    )}
                </ResultCard>
            </PaymentShell>
        );
    }

    // ── Success ──────────────────────────────────────────────────────────────
    if (status === 'success') {
        return (
            <PaymentShell>
                <ResultCard
                    accent="success"
                    Icon={HiOutlineCheckCircle}
                    badge="Uğurlu"
                    title="Ödəniş uğurlu oldu!"
                    subtitle={
                        isExam
                            ? 'İmtahan alındı və hesabınızda hazırdır. İstədiyiniz vaxt başlaya bilərsiniz.'
                            : 'Abunəliyiniz aktivləşdirildi. Bütün imkanlardan istifadə edə bilərsiniz.'
                    }
                >
                    {isExam ? (
                        <div className="flex flex-col gap-2.5">
                            {examShareLink && (
                                <button
                                    onClick={() => navigate(`/imtahan/${examShareLink}`)}
                                    className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    İmtahana başla <HiOutlineArrowRight className="w-4 h-4" />
                                </button>
                            )}
                            <Link
                                to="/imtahanlarim"
                                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                İmtahanlarıma keç
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={() => navigate('/imtahanlar')}
                                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                <HiOutlineSparkles className="w-4 h-4" />
                                İmtahanlara keç
                            </button>
                            <Link
                                to="/planlar"
                                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                Plan detallarına bax
                            </Link>
                        </div>
                    )}
                </ResultCard>
            </PaymentShell>
        );
    }

    // ── Pending ──────────────────────────────────────────────────────────────
    if (status === 'pending') {
        return (
            <PaymentShell>
                <ResultCard
                    accent="pending"
                    Icon={HiOutlineRefresh}
                    badge="Gözləyir"
                    title="Ödəniş gözlənilir"
                    subtitle={
                        isExam
                            ? 'Ödəniş sistemi tərəfindən hələ təsdiqlənməyib. İmtahanınız təsdiqdən sonra bir neçə dəqiqə içində hesabınızda görünəcək.'
                            : 'Ödəniş sistemi tərəfindən hələ təsdiqlənməyib. Abunəliyiniz bir neçə dəqiqə içində avtomatik aktivləşəcək.'
                    }
                >
                    <div className="flex flex-col gap-2.5">
                        <button
                            onClick={() => { setStatus('verifying'); setWaitSeconds(0); verify(orderIdRef.current); }}
                            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-[0_8px_24px_-10px_rgba(245,158,11,0.6)] transition-all"
                        >
                            <HiOutlineRefresh className="w-4 h-4" />
                            Yenidən yoxla
                        </button>
                        <Link
                            to={isExam ? '/imtahanlarim' : '/planlar'}
                            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            {isExam ? 'İmtahanlarıma keç' : 'Planlara qayıt'}
                        </Link>
                    </div>
                </ResultCard>
            </PaymentShell>
        );
    }

    // ── Failed ───────────────────────────────────────────────────────────────
    return (
        <PaymentShell>
            <ResultCard
                accent="error"
                Icon={HiOutlineXCircle}
                badge="Xəta"
                title="Ödəniş təsdiqlənmədi"
                subtitle="Ödəniş yoxlanılarkən xəta baş verdi və ya sifariş tapılmadı. Zəhmət olmasa yenidən cəhd edin və ya bizimlə əlaqə saxlayın."
            >
                <div className="flex flex-col gap-2.5">
                    <button
                        onClick={() => navigate(isExam ? (examShareLink ? `/imtahan/${examShareLink}` : '/imtahanlar') : '/planlar')}
                        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                    >
                        Yenidən cəhd et <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                    <Link
                        to="/elaqe"
                        className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                    >
                        Dəstəklə əlaqə
                    </Link>
                </div>
            </ResultCard>
        </PaymentShell>
    );
};

export default PaymentSuccess;
