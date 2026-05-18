import { useNavigate, Link } from 'react-router-dom';
import {
    HiOutlineXCircle, HiOutlineArrowLeft, HiOutlineShieldCheck,
    HiOutlineRefresh, HiOutlineSupport,
} from 'react-icons/hi';

// ───────────────────────────────────────────────────────────────────────────
// Shell (mirrors PaymentSuccess)
// ───────────────────────────────────────────────────────────────────────────

const PaymentShell = ({ children }) => (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--paper-cream)' }}>
        <div className="border-b border-[var(--ink-150)] bg-white">
            <div className="container-main py-3.5 flex items-center justify-between">
                <Link to="/" className="inline-flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="4 12 10 18 20 6" />
                        </svg>
                    </span>
                    <span className="font-extrabold text-[18px] tracking-tight text-[var(--ink-900)]">
                        testup<span className="text-[var(--brand-green-600)]">.az</span>
                    </span>
                </Link>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-500)]">
                    <HiOutlineShieldCheck className="w-3.5 h-3.5 text-[var(--brand-green-600)]" />
                    SSL ilə qorunan ödəniş
                </span>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
            {children}
        </div>

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
// Main
// ───────────────────────────────────────────────────────────────────────────

const PaymentDecline = () => {
    const navigate = useNavigate();

    return (
        <PaymentShell>
            <div className="relative w-full max-w-md bg-white rounded-3xl border border-[var(--ink-200)] overflow-hidden shadow-[0_30px_60px_-20px_rgba(239,68,68,0.35)]">
                {/* Accent strip */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }} />

                <div className="p-8 md:p-10 text-center">
                    {/* Icon */}
                    <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 shadow-[var(--sh-sm)]">
                        <HiOutlineXCircle className="w-10 h-10" />
                    </div>

                    {/* Badge */}
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-red-50 text-red-700 mb-3">
                        Ləğv edildi
                    </span>

                    <h1 className="text-[24px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight">
                        Ödəniş tamamlanmadı
                    </h1>
                    <p className="mt-2.5 text-[14.5px] text-[var(--ink-500)] leading-relaxed">
                        Ödəniş ləğv edildi və ya bank tərəfindən rədd edildi. Hesabınızdan heç bir məbləğ çıxarılmadı. Dilədiyiniz zaman yenidən cəhd edə bilərsiniz.
                    </p>

                    {/* Common reasons */}
                    <div className="mt-6 p-4 bg-[var(--ink-50)] border border-[var(--ink-150)] rounded-2xl text-left">
                        <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] mb-2.5">
                            Mümkün səbəblər
                        </p>
                        <ul className="space-y-1.5 text-[12.5px] text-[var(--ink-600)]">
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--ink-400)] mt-2 shrink-0" />
                                <span>Kartın limitində kifayət qədər vəsait olmaması</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--ink-400)] mt-2 shrink-0" />
                                <span>3D-Secure təsdiqi tamamlanmaması</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--ink-400)] mt-2 shrink-0" />
                                <span>Bank tərəfindən əməliyyatın bloklanması</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="w-1 h-1 rounded-full bg-[var(--ink-400)] mt-2 shrink-0" />
                                <span>İstifadəçi tərəfindən ləğv edilmə</span>
                            </li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2.5">
                        <button
                            onClick={() => navigate('/planlar')}
                            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[14px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                        >
                            <HiOutlineRefresh className="w-4 h-4" />
                            Yenidən cəhd et
                        </button>
                        <Link
                            to="/elaqe"
                            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            <HiOutlineSupport className="w-4 h-4" />
                            Dəstəklə əlaqə saxla
                        </Link>
                        <Link
                            to="/"
                            className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-full text-[12.5px] font-semibold text-[var(--ink-500)] hover:text-[var(--ink-800)] transition-colors"
                        >
                            <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                            Ana səhifəyə qayıt
                        </Link>
                    </div>
                </div>
            </div>
        </PaymentShell>
    );
};

export default PaymentDecline;
