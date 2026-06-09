import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineArrowRight, HiOutlineUsers, HiOutlineGlobe,
    HiOutlineAcademicCap, HiOutlineHeart, HiOutlineShieldCheck,
    HiOutlineLightBulb, HiOutlineSparkles,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import aboutImage from '../../assets/about.png';

// ───────────────────────────────────────────────────────────────────────────
// Shared bits
// ───────────────────────────────────────────────────────────────────────────

const Eyebrow = ({ children }) => (
    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">{children}</span>
);

const SectionHead = ({ title, sub }) => (
    <div className="text-center max-w-[720px] mx-auto mb-14">
        <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)] text-balance">{title}</h2>
        {sub && <p className="mt-4 text-[17px] md:text-lg text-[var(--ink-500)] leading-relaxed">{sub}</p>}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Sections
// ───────────────────────────────────────────────────────────────────────────

const AboutHero = ({ isAuthenticated }) => (
    <section
        className="relative pt-16 md:pt-20 pb-16 md:pb-20 overflow-hidden border-b border-[var(--ink-150)]"
        style={{ background: 'linear-gradient(180deg, var(--brand-blue-50) 0%, transparent 100%)' }}
    >
        {/* Grid background */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: 'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)',
            }}
        />

        <div className="container-main relative">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[13.5px] text-[var(--ink-500)] mb-5">
                <Link to="/" className="hover:text-[var(--primary)]">Ana Səhifə</Link>
                <span className="text-[var(--ink-300)]">/</span>
                <span className="text-[var(--ink-800)] font-semibold">Haqqımızda</span>
            </div>

            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
                {/* Left */}
                <div>
                    <h1 className="text-[36px] sm:text-[44px] md:text-[56px] lg:text-[60px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--ink-900)] text-balance">
                        Azərbaycanın hər müəlliminə peşəkar imtahan alətləri
                    </h1>

                    <p className="mt-6 text-[18px] md:text-[19px] leading-[1.6] text-[var(--ink-500)] max-w-[560px]">
                        testup.az müəllimlərin və təlim mərkəzlərinin işini sadələşdirmək, şagirdlərin isə öz biliklərini ədalətli və müasir formada qiymətləndirmək məqsədilə Bakıda qurulmuş bir təhsil texnologiyaları platformasıdır.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/imtahanlar"
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                İmtahanlara bax <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                to="/register"
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                            >
                                Pulsuz başla <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                        <Link
                            to="/elaqe"
                            className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                        >
                            Bizimlə əlaqə
                        </Link>
                    </div>
                </div>

                {/* Right — about image with floating stat chips */}
                <div className="relative">
                    {/* Blurred blue glow */}
                    <div
                        className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-60 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at 50% 50%, var(--brand-blue-100), transparent 60%)' }}
                    />
                    <div className="relative rounded-3xl overflow-hidden bg-white border border-[var(--ink-200)] shadow-[var(--sh-lg)]">
                        <img src={aboutImage} alt="testup.az komandası" className="w-full h-auto block" />
                    </div>

                    {/* Floating chips */}
                    <div className="hidden md:flex absolute -top-4 -left-4 items-center gap-3 bg-white rounded-2xl border border-[var(--ink-200)] shadow-[var(--sh-lg)] px-5 py-3.5" style={{ transform: 'rotate(-3deg)' }}>
                        <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                            <HiOutlineUsers className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-[var(--ink-900)]">50+ müəllim</div>
                            <div className="text-[12.5px] text-[var(--ink-500)]">Aktiv istifadəçi</div>
                        </div>
                    </div>

                    <div className="hidden md:flex absolute -bottom-5 -right-3 items-center gap-3 bg-white rounded-2xl border border-[var(--ink-200)] px-5 py-3.5" style={{ transform: 'rotate(2deg)', boxShadow: 'var(--sh-lg), var(--sh-glow-blue)' }}>
                        <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--brand-green-600)] flex items-center justify-center shrink-0">
                            <HiOutlineAcademicCap className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-[var(--ink-900)]">2000+ imtahan</div>
                            <div className="text-[12.5px] text-[var(--ink-500)]">Tamamlanıb</div>
                        </div>
                    </div>

                    <div className="hidden lg:flex absolute -bottom-4 left-8 items-center gap-3 bg-white rounded-2xl border border-[var(--ink-200)] shadow-[var(--sh-lg)] px-5 py-3.5" style={{ transform: 'rotate(1deg)' }}>
                        <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                            <HiOutlineGlobe className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-[15px] font-bold text-[var(--ink-900)]">800+ şagird</div>
                            <div className="text-[12.5px] text-[var(--ink-500)]">Qeydiyyatdan keçib</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const Mission = () => {
    const values = [
        {
            Icon: HiOutlineLightBulb,
            title: 'Sadəlik',
            desc: 'Texnologiya texniki bilik tələb etməməlidir. Müəllim öz işinə fokuslanmalı, alət isə görünməz qalmalıdır.',
            tone: 'bg-[var(--primary-soft)] text-[var(--primary)]',
        },
        {
            Icon: HiOutlineSparkles,
            title: 'AI ilə dəstək',
            desc: 'Mövzu və çətinlik yazın — AI dərhal sual, variantlar və düz cavabı hazırlayır. PDF-dən köhnə imtahanlarınızı yükləyib bir kliklə sual kartına çevirin.',
            tone: 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]',
        },
        {
            Icon: HiOutlineHeart,
            title: 'Tələbə mərkəzli',
            desc: 'Qiymətləndirmə cəza deyil, inkişaf vasitəsidir. Şagirdə öz zəif tərəfini görmək imkanı veririk.',
            tone: 'bg-[var(--primary-soft)] text-[var(--primary)]',
        },
    ];
    return (
        <section className="py-20 md:py-24">
            <div className="container-main">
                <SectionHead
                    eyebrow="Missiya"
                    title="Hər müəllimin əlində dünya səviyyəli imtahan platforması"
                    sub="Müasir təhsil tələblərinə cavab verən, sadə və ədalətli qiymətləndirmə vasitələrini Azərbaycanın hər müəlliminə çatdırmaq."
                />
                <div className="grid md:grid-cols-3 gap-5">
                    {values.map((v, i) => (
                        <div
                            key={i}
                            className="bg-white border border-[var(--ink-200)] rounded-2xl p-7 hover:-translate-y-1 hover:shadow-[var(--sh-md)] hover:border-[var(--brand-blue-100)] transition-all"
                        >
                            <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 ${v.tone}`}>
                                <v.Icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-[19px] font-bold text-[var(--ink-900)] mb-2">{v.title}</h3>
                            <p className="text-[14.5px] text-[var(--ink-500)] leading-relaxed">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Story = () => {
    const items = [
        { year: '2025 — Avqust',  title: 'Layihəyə başlanılıb',           desc: 'testup.az komandası layihəni rəsmi olaraq başladır və ilkin texniki memarlıq, dizayn istiqamətləri müəyyənləşdirilir.' },
        { year: '2025 — Dekabr',  title: 'İlk imtahanlar keçirilib',       desc: 'Beta variantda ilk imtahanlar real müəllimlər və şagirdlərlə keçirilir, sistemdən gerçək vaxt rejimində geri bildirimlər toplanır.' },
        { year: '2026 — Fevral',  title: 'Yeni versiyaya keçid',           desc: 'Sual bankı, AI ilə sual yaratma və PDF idxalı kimi əsas funksiyalar tamamlanır. Yeni versiya istifadəyə verilir.' },
        { year: '2026 — May',     title: 'Platforma yekunlaşır',            desc: 'Tam yenilənmiş dizayn, ödəniş sistemi və admin paneli ilə platforma rəsmi olaraq təqdim edilir.' },
    ];
    return (
        <section className="py-20 md:py-24 bg-[var(--ink-50)]">
            <div className="container-main">
                <SectionHead
                    title="İdeyadan platformaya qədər"
                    sub="testup.az-ın inkişaf mərhələləri."
                />
                <div className="relative max-w-[760px] mx-auto pl-8">
                    {/* Vertical gradient line — left-8 (32px) so it runs through
                        the bullet centres (item pl-8 + bullet -left-8px + 9px half). */}
                    <div
                        className="absolute top-2 bottom-2 left-8 w-0.5 rounded-sm"
                        style={{ background: 'linear-gradient(180deg, var(--primary) 0%, var(--accent) 100%)' }}
                    />
                    {items.map((it, i) => {
                        const even = i % 2 === 1;
                        return (
                            <div key={i} className="relative pb-9 pl-8">
                                {/* Bullet */}
                                <span
                                    className="absolute -left-[8px] top-[6px] w-[18px] h-[18px] rounded-full bg-white"
                                    style={{
                                        border: `3px solid ${even ? 'var(--accent)' : 'var(--primary)'}`,
                                        boxShadow: '0 0 0 4px var(--ink-50)',
                                    }}
                                />
                                <div className={`text-[13px] font-bold uppercase tracking-[0.08em] ${even ? 'text-[var(--brand-green-600)]' : 'text-[var(--primary)]'}`}>
                                    {it.year}
                                </div>
                                <div className="text-[18px] font-bold text-[var(--ink-900)] mt-1.5 mb-1.5">{it.title}</div>
                                <p className="text-[14.5px] text-[var(--ink-500)] leading-[1.6]">{it.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const ByNumbers = () => {
    const stats = [
        { num: '50',  plus: true, label: 'Aktiv müəllim' },
        { num: '800', plus: true, label: 'Şagird qeydiyyatı' },
        { num: '2000', plus: true, label: 'Tamamlanmış imtahan' },
    ];
    return (
        <section className="py-12 md:py-16">
            <div className="container-main">
                <div
                    className="relative overflow-hidden rounded-3xl text-white px-6 py-10 md:px-8 md:py-12 grid grid-cols-1 md:grid-cols-3"
                    style={{ background: 'var(--ink-900)' }}
                >
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: 'radial-gradient(circle at 0% 100%, rgba(37,99,235,0.35), transparent 50%), radial-gradient(circle at 100% 0%, rgba(34,197,94,0.25), transparent 50%)',
                    }} />
                    {stats.map((s, i) => (
                        <div key={i} className={`relative text-center px-4 py-2 ${i > 0 ? 'md:border-l border-white/10' : ''}`}>
                            <div className="text-[36px] md:text-[40px] font-bold tracking-tight leading-none">
                                {s.num}{s.plus && <span className="text-[var(--accent)]">+</span>}
                            </div>
                            <div className="text-[13px] text-white/65 mt-2">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Team = () => {
    const team = [
        { i: 'SR', n: 'Səbuhi Ramazanov', r: 'Təsisçi · Riyaziyyat müəllimi' },
        { i: 'SB', n: 'Sərxan Babayev',   r: 'Product Owner' },
        { i: 'NM', n: 'Nicat Mazanlı',    r: 'Cyber Security' },
        { i: 'ÜƏ', n: 'Ülkər Əliyeva',    r: 'QA Tester' },
        { i: 'NƏ', n: 'Nigar Əliyeva',    r: 'Frontend Developer' },
        { i: 'TN', n: 'Teyran Nağıyeva',  r: 'Dizayner' },
        { i: 'EA', n: 'Eltun Aslanov',    r: 'Backend Developer' },
        { i: 'NM', n: 'Nərmin Məmmədli',  r: 'QA Tester' },
    ];
    return (
        <section className="py-20 md:py-24 bg-[var(--ink-50)]">
            <div className="container-main">
                <SectionHead
                    eyebrow="Komanda"
                    title="Müəllimlər, mühəndislər və dizaynerlər"
                    sub="Bakıda kiçik və yaxından işləyən komanda — birlikdə Azərbaycan təhsilini bir az da yaxşılaşdırmaq üçün."
                />
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {team.map((t, i) => (
                        <div
                            key={i}
                            className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 text-center hover:-translate-y-1 hover:shadow-[var(--sh-md)] transition-all"
                        >
                            <div
                                className="w-[84px] h-[84px] mx-auto mb-4 rounded-full flex items-center justify-center text-[26px] font-bold text-[var(--ink-900)]"
                                style={{ background: 'linear-gradient(135deg, var(--brand-blue-100), var(--brand-green-100))' }}
                            >
                                {t.i}
                            </div>
                            <div className="text-[16px] font-bold text-[var(--ink-900)]">{t.n}</div>
                            <div className="text-[13px] text-[var(--ink-500)] mt-1">{t.r}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PressMentions = () => {
    const mentions = ['Muallim.edu.az', 'Tehsilim.az', 'ATP.AZ', 'Trend.az', 'Report.az'];
    return (
        <section className="py-12 md:py-16">
            <div className="container-main">
                <div className="flex flex-wrap justify-around items-center gap-7 opacity-70">
                    {mentions.map((m, i) => (
                        <div
                            key={i}
                            className="text-[22px] font-bold tracking-[-0.02em] text-[var(--ink-500)]"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            {m}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTABanner = ({ isAuthenticated }) => (
    <section className="py-16 md:py-20">
        <div className="container-main">
            <div
                className="relative overflow-hidden rounded-3xl px-6 py-14 md:px-12 md:py-16 text-center text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand-blue-700) 0%, var(--primary) 60%, var(--brand-green-600) 130%)' }}
            >
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.18), transparent 40%)',
                }} />
                <h2 className="relative text-[28px] md:text-[40px] font-bold tracking-tight leading-tight">
                    Bir komanda, bir məqsəd — daha yaxşı təhsil
                </h2>
                <p className="relative mt-4 text-white/80 text-[16px] md:text-[17px] max-w-[600px] mx-auto leading-relaxed">
                    Bu missiyaya qoşulun. Müəllimsinizsə, bu gün pulsuz hesab açın və ilk imtahanınızı yaradın.
                </p>
                <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                    {isAuthenticated ? (
                        <Link
                            to="/imtahanlar"
                            className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--primary)] bg-white hover:bg-white/95 transition-all shadow-xl"
                        >
                            İmtahanlara bax <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link
                            to="/register"
                            className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--primary)] bg-white hover:bg-white/95 transition-all shadow-xl"
                        >
                            Pulsuz başla <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                    <Link
                        to="/elaqe"
                        className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-white/10 border border-white/30 hover:bg-white/20 backdrop-blur-sm transition-all"
                    >
                        Bizimlə əlaqə
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const About = () => {
    const { isAuthenticated } = useAuth();
    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>Haqqımızda — testup.az</title>
                <meta name="description" content="testup.az — Bakıda qurulmuş təhsil texnologiyaları platforması. Missiyamız, hekayəmiz və komandamız haqqında." />
                <link rel="canonical" href="https://testup.az/haqqimizda" />
            </Helmet>

            <AboutHero isAuthenticated={isAuthenticated} />
            <Mission />
            <Story />
            <ByNumbers />
            <Team />
            {/* Mətbuat bölməsi gələcəkdə real partnerlərlə bərpa ediləcək */}
            {/* <PressMentions /> */}
            <CTABanner isAuthenticated={isAuthenticated} />
        </div>
    );
};

export default About;
