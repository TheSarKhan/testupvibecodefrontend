import { Link, useNavigate } from 'react-router-dom';
import {
    HiOutlineArrowLeft, HiOutlineHome, HiOutlineSearch,
    HiOutlineAcademicCap, HiOutlineSparkles, HiOutlineSupport,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

// ───────────────────────────────────────────────────────────────────────────
// 404 — Səhifə tapılmadı
// ───────────────────────────────────────────────────────────────────────────

const NotFound = () => {
    const navigate = useNavigate();
    const { user, isTeacher } = useAuth() || {};

    const homeHref = user ? (isTeacher ? '/panel' : '/panel') : '/';
    const exploreHref = '/imtahanlar';

    return (
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-10 sm:py-14" style={{ background: 'var(--paper-cream)' }}>
            <div className="relative w-full max-w-2xl">
                {/* Decorative blobs */}
                <div className="pointer-events-none absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-30 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
                <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-30 blur-3xl"
                    style={{ background: 'radial-gradient(circle, var(--brand-green-600) 0%, transparent 70%)' }} />

                <div className="relative bg-white rounded-3xl border border-[var(--ink-200)] shadow-[var(--sh-lg)] overflow-hidden">
                    {/* Accent strip */}
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)' }} />

                    <div className="p-8 md:p-12 text-center">
                        {/* 404 with brand gradient text */}
                        <div className="relative inline-block">
                            <h1
                                className="font-extrabold tracking-tighter leading-none text-[120px] sm:text-[160px] md:text-[180px]"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--brand-green-600) 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}
                            >
                                404
                            </h1>
                            {/* Floating sparkle */}
                            <span className="absolute top-4 -right-4 sm:-right-8 w-10 h-10 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shadow-[var(--sh-sm)] rotate-12">
                                <HiOutlineSparkles className="w-5 h-5" />
                            </span>
                        </div>

                        {/* Badge */}
                        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full bg-[var(--ink-100)] text-[var(--ink-600)] mt-2 mb-4">
                            <HiOutlineSearch className="w-3.5 h-3.5" />
                            Tapılmadı
                        </span>

                        <h2 className="text-[22px] md:text-[26px] font-extrabold text-[var(--ink-900)] tracking-tight">
                            Bu səhifə mövcud deyil
                        </h2>
                        <p className="mt-2.5 max-w-md mx-auto text-[14.5px] text-[var(--ink-500)] leading-relaxed">
                            Axtardığınız səhifə silinmiş, köçürülmüş və ya linkdə xəta ola bilər.
                            Aşağıdakı düymələrlə davam edin.
                        </p>

                        {/* Suggestions */}
                        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                            <Link
                                to={homeHref}
                                className="group p-4 rounded-2xl border border-[var(--ink-150)] bg-[var(--paper-cream)] hover:bg-white hover:border-[var(--brand-blue-200)] hover:shadow-[var(--sh-sm)] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                                        <HiOutlineHome className="w-5 h-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] font-bold text-[var(--ink-900)] truncate">
                                            {user ? 'Panelimə qayıt' : 'Ana səhifə'}
                                        </p>
                                        <p className="text-[11.5px] text-[var(--ink-500)] truncate">
                                            {user ? 'Şəxsi paneliniz' : 'Platforma haqqında'}
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            <Link
                                to={exploreHref}
                                className="group p-4 rounded-2xl border border-[var(--ink-150)] bg-[var(--paper-cream)] hover:bg-white hover:border-[var(--brand-green-200)] hover:shadow-[var(--sh-sm)] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-[var(--brand-green-50)] text-[var(--brand-green-600)] flex items-center justify-center shrink-0">
                                        <HiOutlineAcademicCap className="w-5 h-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] font-bold text-[var(--ink-900)] truncate">
                                            İmtahanları gör
                                        </p>
                                        <p className="text-[11.5px] text-[var(--ink-500)] truncate">
                                            Açıq imtahanları kəşf et
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        {/* Actions */}
                        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                            >
                                <HiOutlineArrowLeft className="w-4 h-4" />
                                Geri qayıt
                            </button>
                            <Link
                                to={homeHref}
                                className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center gap-2 rounded-full text-[13.5px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                <HiOutlineHome className="w-4 h-4" />
                                Ana səhifə
                            </Link>
                        </div>

                        {/* Support footer */}
                        <div className="mt-7 pt-5 border-t border-[var(--ink-150)]">
                            <Link
                                to="/elaqe"
                                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-500)] hover:text-[var(--primary)] transition-colors"
                            >
                                <HiOutlineSupport className="w-4 h-4" />
                                Problem davam edirsə dəstəklə əlaqə saxlayın
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
