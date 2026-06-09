import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineArrowRight, HiOutlinePlay, HiOutlineCheck, HiOutlinePlus,
    HiOutlinePencilAlt, HiOutlineChartBar, HiOutlineLibrary,
    HiOutlineShieldCheck, HiOutlineAcademicCap, HiOutlineLightningBolt,
    HiOutlineLightBulb, HiOutlineDeviceMobile, HiOutlineBell, HiOutlineSparkles,
    HiOutlineClipboardList, HiOutlineBookmark, HiOutlineCollection, HiOutlineFlag,
    HiOutlineDocumentText, HiOutlineUserGroup,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import heroIllustration from '../../assets/hero-illustration.png';
import api from '../../api/axios';
import CreateExamModal from '../../components/ui/CreateExamModal';

// ───────────────────────────────────────────────────────────────────────────
// Building blocks
// ───────────────────────────────────────────────────────────────────────────

const BtnPrimary = ({ children, to, onClick, className = '', size = 'md' }) => {
    const sizes = { md: 'h-12 px-6 text-[15px]', lg: 'h-14 px-7 text-base' };
    const Tag = to ? Link : 'button';
    return (
        <Tag
            to={to}
            onClick={onClick}
            className={`${sizes[size]} ${className} inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_12px_28px_-10px_rgba(37,99,235,0.7)] transition-all active:translate-y-px`}
        >
            {children}
        </Tag>
    );
};

const BtnSecondary = ({ children, to, onClick, className = '', size = 'md' }) => {
    const sizes = { md: 'h-12 px-6 text-[15px]', lg: 'h-14 px-7 text-base' };
    const Tag = to ? Link : 'button';
    return (
        <Tag
            to={to}
            onClick={onClick}
            className={`${sizes[size]} ${className} inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all active:translate-y-px`}
        >
            {children}
        </Tag>
    );
};

const Eyebrow = ({ children }) => (
    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">{children}</span>
);

const SectionHead = ({ title, sub }) => (
    <div className="text-center max-w-[720px] mx-auto mb-14">
        <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)] text-balance">{title}</h2>
        {sub && <p className="mt-4 text-[17px] md:text-lg text-[var(--ink-500)] leading-relaxed">{sub}</p>}
    </div>
);

const FeatureCard = ({ Icon, title, desc, iconClass = 'bg-[var(--primary-soft)] text-[var(--primary)]' }) => (
    <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 hover:-translate-y-1 hover:shadow-[var(--sh-md)] hover:border-[var(--brand-blue-100)] transition-all">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconClass}`}>
            <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-[17px] font-bold text-[var(--ink-900)] mb-2">{title}</h3>
        <p className="text-[14px] text-[var(--ink-500)] leading-relaxed">{desc}</p>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Sections
// ───────────────────────────────────────────────────────────────────────────

const Hero = ({ isAuthenticated, isTeacher, onCreateExam }) => (
    <section className="relative pt-16 md:pt-20 pb-16 md:pb-24 overflow-hidden">
        {/* Grid background */}
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
                backgroundSize: '56px 56px',
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 75%)',
            }}
        />
        {/* Blobs */}
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full opacity-50 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, var(--brand-blue-100), transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-24 w-[400px] h-[400px] rounded-full opacity-50 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, var(--brand-green-100), transparent 70%)' }} />

        <div className="container-main relative">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
                {/* Left */}
                <div>
                    <h1 className="text-[44px] sm:text-[52px] md:text-[60px] lg:text-[64px] font-bold leading-[1.05] tracking-[-0.035em] text-[var(--ink-900)] text-balance">
                        Onlayn imtahanları{' '}
                        <span className="relative whitespace-nowrap text-[var(--primary)]">
                            dəqiqələr
                            <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute left-0 right-0 -bottom-2 w-full h-3.5 text-[var(--accent)]">
                                <path d="M2 8 Q 50 2 100 7 T 198 6" stroke="currentColor" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                            </svg>
                        </span>{' '}
                        içində yaradın və idarə edin
                    </h1>

                    <p className="mt-7 text-[18px] md:text-[19px] leading-[1.55] text-[var(--ink-500)] max-w-[540px]">
                        Müəllimlər və təlim mərkəzləri üçün hazırlanmış müasir platforma. Test bankı, avtomatik qiymətləndirmə və ətraflı analitika — hamısı bir yerdə.
                    </p>

                    <div className="mt-9 flex flex-wrap items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {isTeacher ? (
                                    <BtnPrimary onClick={onCreateExam} size="lg">
                                        Yeni imtahan yarat <HiOutlineArrowRight className="w-4 h-4" />
                                    </BtnPrimary>
                                ) : (
                                    <BtnPrimary to="/imtahanlar" size="lg">
                                        İmtahanlara bax <HiOutlineArrowRight className="w-4 h-4" />
                                    </BtnPrimary>
                                )}
                                <BtnSecondary to="/profil" size="lg">Profilə keç</BtnSecondary>
                            </>
                        ) : (
                            <>
                                <BtnPrimary to="/register" size="lg">Pulsuz başla <HiOutlineArrowRight className="w-4 h-4" /></BtnPrimary>
                                <button
                                    type="button"
                                    disabled
                                    title="Tezliklə"
                                    aria-disabled="true"
                                    className="h-14 px-7 text-base inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-500)] bg-white border border-[var(--ink-200)] opacity-60 cursor-not-allowed"
                                >
                                    <HiOutlinePlay className="w-3.5 h-3.5" /> Demo izlə
                                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--ink-100)] text-[var(--ink-500)]">Tezliklə</span>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Trust row */}
                    <div className="mt-8 flex flex-wrap items-center gap-5">
                        <div className="flex">
                            {[
                                { i: 'AS', bg: 'bg-[var(--brand-blue-100)]',  fg: 'text-[var(--brand-blue-700)]' },
                                { i: 'RM', bg: 'bg-[var(--brand-green-100)]', fg: 'text-[var(--brand-green-600)]' },
                                { i: 'NQ', bg: 'bg-amber-100',                fg: 'text-amber-700' },
                                { i: '+',  bg: 'bg-gray-200',                 fg: 'text-gray-700' },
                            ].map((a, idx) => (
                                <div
                                    key={idx}
                                    className={`w-8 h-8 rounded-full border-2 border-[var(--paper-cream)] -ml-2 first:ml-0 flex items-center justify-center text-[11px] font-bold ${a.bg} ${a.fg}`}
                                >
                                    {a.i}
                                </div>
                            ))}
                        </div>
                        <div className="text-[13.5px] text-[var(--ink-500)] leading-snug">
                            <div className="text-amber-500 tracking-widest text-sm">★★★★★ <strong className="text-[var(--ink-800)]">4.9</strong></div>
                            <div>Azərbaycanlı müəllimlərin platforması</div>
                        </div>
                    </div>
                </div>

                {/* Right — illustration */}
                <div className="flex items-center justify-center">
                    <img
                        src={heroIllustration}
                        alt="testup.az — onlayn imtahan platforması"
                        className="w-full max-w-[620px] h-auto"
                    />
                </div>
            </div>
        </div>
    </section>
);

const Stats = () => {
    const stats = [
        { num: '50',   plus: true, label: 'Aktiv müəllim' },
        { num: '800',  plus: true, label: 'Şagird qeydiyyatı' },
        { num: '2000', plus: true, label: 'Tamamlanmış imtahan' },
    ];
    return (
        <section className="py-10 md:py-14">
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
                                {s.num}{s.plus && <span className="text-[var(--accent)]">+</span>}{s.suffix}
                            </div>
                            <div className="text-[13px] text-white/65 mt-2">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const HowItWorks = () => {
    const steps = [
        { n: 1, t: 'Sualları daxil edin',    d: 'Hazır şablonlar, sual bankı və ya öz suallarınızla 5 dəqiqəyə imtahan yaradın. Şəkil, riyazi simvol, mətn və dinləmə sualları dəstəyi.' },
        { n: 2, t: 'Şagirdlərə paylaşın',     d: 'Bir linklə imtahanı sinifə göndərin. Şagirdlər istənilən cihazdan iştirak edə bilərlər — qeydiyyatla və ya qeydiyyatsız.' },
        { n: 3, t: 'Nəticələri analiz edin',  d: 'Avtomatik qiymətləndirmə, ətraflı statistika və hər şagird üçün fərdi hesabat.' },
    ];
    return (
        <section className="py-20 md:py-24" id="how">
            <div className="container-main">
                <SectionHead
                    eyebrow="Necə işləyir"
                    title="Üç addımda peşəkar imtahan"
                    sub="Hazırlığa saatlar sərf etmədən, ilk imtahanınızı bu gün yaradın və yayımlayın."
                />
                <div className="grid md:grid-cols-3 gap-6">
                    {steps.map(s => (
                        <div
                            key={s.n}
                            className="bg-white border border-[var(--ink-200)] rounded-2xl p-7 hover:-translate-y-1 hover:shadow-[var(--sh-md)] hover:border-[var(--brand-blue-100)] transition-all"
                        >
                            <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-sm flex items-center justify-center mb-5">
                                {s.n}
                            </div>
                            <h3 className="text-[18px] font-bold text-[var(--ink-900)] mb-2">{s.t}</h3>
                            <p className="text-[14.5px] text-[var(--ink-500)] leading-relaxed">{s.d}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeaturesTeacher = () => (
    <section className="py-20 md:py-24" id="teacher">
        <div className="container-main">
            <SectionHead
                eyebrow="Müəllimlər üçün"
                title="İmtahanı yaratmaqdan qiymətləndirməyə qədər — bir alət"
                sub="Kağız və Excel cədvəlləri unudun. testup.az ilə bütün proses avtomatlaşır."
            />
            <div className="grid md:grid-cols-3 gap-5 auto-rows-auto">
                <FeatureCard Icon={HiOutlinePencilAlt}  title="Vizual sual redaktoru" desc="Çoxseçimli, açıq cavab, doğru/yalan, uyğunluq, həmçinin mətn və dinləmə sualları. Şəkil və riyazi simvol əlavə edin." />

                {/* Big accent — grades table */}
                <div className="md:row-span-2 bg-white border border-[var(--ink-200)] rounded-2xl p-6">
                    <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--brand-green-600)] flex items-center justify-center mb-4">
                        <HiOutlineChartBar className="w-5 h-5" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[var(--ink-900)] mb-2">Ətraflı analitika</h3>
                    <p className="text-[14px] text-[var(--ink-500)] mb-5">Hər şagird, hər sual və hər mövzu üzrə nəticələr. Zəif tərəfləri dərhal görün.</p>

                    {/* mini grades table */}
                    <div className="border border-[var(--ink-150)] rounded-xl overflow-hidden text-[12.5px]">
                        <div className="grid grid-cols-6 bg-[var(--ink-50)] px-3 py-2 font-bold text-[var(--ink-500)] text-[10.5px] uppercase tracking-wider">
                            <span>Şagird</span><span>Riyaz.</span><span>Fizika</span><span>Kimya</span><span>Biolog.</span><span className="text-right">Orta</span>
                        </div>
                        {[
                            { n: 'Aysel S.', g: [94, 88, 91, 86], avg: 90, tone: 'bg-[var(--brand-green-100)] text-[var(--brand-green-600)]' },
                            { n: 'Rəşad M.', g: [76, 82, 71, 79], avg: 77, tone: 'bg-amber-100 text-amber-700' },
                            { n: 'Nigar Q.', g: [62, 58, 65, 60], avg: 61, tone: 'bg-red-100 text-red-700' },
                            { n: 'Elvin Ə.', g: [88, 92, 85, 90], avg: 89, tone: 'bg-[var(--brand-green-100)] text-[var(--brand-green-600)]' },
                        ].map((r, i) => (
                            <div key={i} className="grid grid-cols-6 px-3 py-2 border-t border-[var(--ink-150)] items-center">
                                <span className="font-semibold text-[var(--ink-800)]">{r.n}</span>
                                {r.g.map((v, j) => <span key={j} className="text-[var(--ink-600)]">{v}</span>)}
                                <span className="text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${r.tone}`}>{r.avg}%</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <FeatureCard Icon={HiOutlineLibrary}      title="Sual bankı"           desc="Şəxsi və ümumi sual bazalarınız. Fənn, mövzu və çətinlik üzrə filtrlə, bir kliklə imtahana əlavə et." />
                <FeatureCard Icon={HiOutlineSparkles}     title="AI ilə sual yaratma"  desc="Mövzu, çətinlik və sual tipini seçin — AI dərhal sual, variantlar və düz cavabı hazırlayır." />
                <FeatureCard Icon={HiOutlineDocumentText} title="PDF-dən sual idxalı"  desc="Köhnə imtahan vərəqələrinizi PDF olaraq yükləyin — mətn və şəkillər sual kartlarına çevrilir." />
            </div>
        </div>
    </section>
);

const FeaturesStudent = () => (
    <section className="py-20 md:py-24" id="student">
        <div className="container-main">
            <SectionHead
                eyebrow="Şagirdlər üçün"
                title="İmtahanlara hazırlaşın, biliyinizi yoxlayın"
                sub="Telefondan, planşetdən və ya kompüterdən — istənilən vaxt, istənilən yerdə."
            />
            <div className="grid md:grid-cols-3 gap-5">
                {/* Big live timer card */}
                <div className="md:row-span-2 bg-white border border-[var(--ink-200)] rounded-2xl p-6">
                    <div className="w-11 h-11 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-4">
                        <HiOutlineLightningBolt className="w-5 h-5" />
                    </div>
                    <h3 className="text-[17px] font-bold text-[var(--ink-900)] mb-2">Canlı imtahan rejimi</h3>
                    <p className="text-[14px] text-[var(--ink-500)] mb-5">Geri sayma, suallar arası rahat keçid və avtomatik saxlama. Bağlantı kəsilsə də, cavablar itməz.</p>

                    <div className="bg-[var(--ink-50)] rounded-xl p-4 border border-[var(--ink-150)]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-[var(--ink-500)] tracking-wider">QALAN VAXT</span>
                            <span className="font-mono text-[20px] font-bold text-[var(--ink-900)] tabular-nums">42:18</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--ink-200)] overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: '32%' }} />
                        </div>
                        <p className="text-[11px] font-bold text-[var(--ink-500)] mt-3.5 tracking-wider">SUALLAR</p>
                        <div className="grid grid-cols-10 gap-1 mt-2">
                            {Array.from({ length: 20 }).map((_, i) => {
                                const cls = i < 6
                                    ? 'bg-[var(--accent)] text-white'
                                    : i === 6
                                        ? 'bg-[var(--primary)] text-white ring-2 ring-[var(--primary-soft)]'
                                        : 'bg-[var(--ink-150)] text-[var(--ink-500)]';
                                return (
                                    <span key={i} className={`text-[10.5px] font-bold rounded h-6 flex items-center justify-center ${cls}`}>
                                        {i + 1}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <FeatureCard Icon={HiOutlineClipboardList} title="Ətraflı nəticə təhlili" desc="Hər imtahandan sonra fənn üzrə nəticə, doğru-səhv cavablar və müəllim izahatları ilə tam baxış." iconClass="bg-[var(--accent-soft)] text-[var(--brand-green-600)]" />
                <FeatureCard Icon={HiOutlineDeviceMobile}  title="Hər cihazda hazır"     desc="Telefon, planşet və ya kompüter — brauzerdə bütün funksiyalar. Heç bir quraşdırma tələb olunmur." />
                <FeatureCard Icon={HiOutlineCollection}    title="Müxtəlif sual formatları" desc="Test, çoxlu cavab, açıq sual, boşluq doldurma, uyğunluq, dinləmə və mətn parçası — hamısı bir yerdə." />
                <FeatureCard Icon={HiOutlineFlag}          title="Real imtahan formatı"     desc="DİM, MİQ və buraxılış imtahanları şablonu ilə dəqiq sual sayı, vaxt limiti və bal hesablanması." iconClass="bg-[var(--accent-soft)] text-[var(--brand-green-600)]" />
            </div>
        </div>
    </section>
);

// Derive a short feature bullet list from a backend SubscriptionPlanResponse.
// Picks the most user-meaningful flags + limits. Order matters — first 5 show.
const featuresFromPlan = (plan) => {
    const limitStr = (n, suffix) => (n == null || n < 0 ? `Limitsiz ${suffix}` : `${n} ${suffix}`);
    const bullets = [];
    if (plan.monthlyExamLimit != null) bullets.push(limitStr(plan.monthlyExamLimit, 'aylıq imtahan'));
    if (plan.maxParticipantsPerExam != null) bullets.push(limitStr(plan.maxParticipantsPerExam, 'şagirdə qədər'));
    if (plan.maxQuestionsPerExam != null) bullets.push(`İmtahanda ${plan.maxQuestionsPerExam < 0 ? 'limitsiz' : plan.maxQuestionsPerExam} sual`);
    if (plan.useAiExamGeneration) bullets.push(plan.monthlyAiQuestionLimit > 0 ? `AI ilə ${plan.monthlyAiQuestionLimit} sual / ay` : 'AI ilə sual yaratma');
    if (plan.useQuestionBank) bullets.push('Sual bankından istifadə');
    if (plan.createQuestionBank) bullets.push('Şəxsi sual bazası');
    if (plan.importQuestionsFromPdf) bullets.push('PDF-dən sual idxalı');
    if (plan.multipleSubjects) bullets.push('Çox fənli imtahanlar');
    if (plan.useTemplateExams) bullets.push('Hazır şablon imtahanlar');
    if (plan.addPassageQuestion) bullets.push('Mətn və dinləmə suallari');
    if (plan.addImage) bullets.push('Şəkil və formula dəstəyi');
    if (plan.manualChecking) bullets.push('Manual qiymətləndirmə');
    if (plan.downloadAsPdf) bullets.push('Nəticələri PDF olaraq yüklə');
    if (plan.studentResultAnalysis) bullets.push('Şagird üzrə analitika');
    return bullets.slice(0, 6);
};

const PricingPreview = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/subscription-plans')
            .then(r => {
                const sorted = [...(r.data || [])].sort((a, b) => (a.level ?? a.price) - (b.level ?? b.price));
                setPlans(sorted.slice(0, 3));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // The middle plan is featured by convention
    const featuredIdx = plans.length >= 3 ? 1 : 0;
    return (
        <section className="py-20 md:py-24" id="pricing">
            <div className="container-main">
                <SectionHead
                    eyebrow="Qiymət planları"
                    title="Şəffaf qiymət, gizli ödənişsiz"
                    sub="Pulsuz başlayın və ehtiyacınız böyüdükcə miqyaslandırın. İstənilən vaxt ləğv edə bilərsiniz."
                />
                {loading ? (
                    <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="rounded-3xl p-7 bg-white border border-[var(--ink-200)] animate-pulse">
                                <div className="h-4 w-1/3 bg-[var(--ink-100)] rounded" />
                                <div className="h-3 w-3/4 bg-[var(--ink-100)] rounded mt-3" />
                                <div className="h-12 w-1/2 bg-[var(--ink-100)] rounded mt-6" />
                                <div className="space-y-2 mt-6">
                                    <div className="h-3 bg-[var(--ink-100)] rounded" />
                                    <div className="h-3 bg-[var(--ink-100)] rounded" />
                                    <div className="h-3 bg-[var(--ink-100)] rounded" />
                                </div>
                                <div className="h-11 bg-[var(--ink-100)] rounded-full mt-7" />
                            </div>
                        ))}
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12 text-[var(--ink-500)] text-[14px]">
                        Planlar hazırlanır — qısa zamanda <Link to="/planlar" className="text-[var(--primary)] hover:underline font-semibold">qiymət səhifəsinə</Link> baxa bilərsiniz.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
                        {plans.map((p, i) => {
                            const featured = i === featuredIdx && plans.length >= 2;
                            const isFree = !p.price || Number(p.price) === 0;
                            const features = featuresFromPlan(p);
                            const ctaLabel = isFree ? 'Pulsuz başla' : 'Planı seç';
                            const ctaTo = isFree ? '/register' : '/planlar';
                            return (
                                <div
                                    key={p.id}
                                    className={`relative rounded-3xl p-7 transition-all ${
                                        featured
                                            ? 'bg-[var(--ink-900)] text-white border border-[var(--ink-900)] shadow-2xl md:scale-105'
                                            : 'bg-white text-[var(--ink-800)] border border-[var(--ink-200)] hover:-translate-y-1 hover:shadow-[var(--sh-md)]'
                                    }`}
                                >
                                    {featured && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent)] text-[#06351A] text-[11px] font-bold tracking-wider uppercase">
                                            Ən populyar
                                        </span>
                                    )}
                                    <div className={`text-[13px] font-bold uppercase tracking-[0.12em] ${featured ? 'text-[var(--accent)]' : 'text-[var(--primary)]'}`}>
                                        {p.name}
                                    </div>
                                    <p className={`mt-2 text-[14px] ${featured ? 'text-white/70' : 'text-[var(--ink-500)]'}`}>
                                        {p.description || 'Müəllimlər və təlim mərkəzləri üçün hazırlanmış plan.'}
                                    </p>
                                    <div className="mt-6 flex items-baseline gap-1.5">
                                        <span className={`text-[52px] font-bold leading-none tracking-tight ${featured ? 'text-white' : 'text-[var(--ink-900)]'}`}>
                                            {isFree
                                                ? '0'
                                                /* Match the Pricing page formatting exactly so the user
                                                   doesn't see 29.9 AZN here and 30 AZN on the home preview.
                                                   `maximumFractionDigits: 0` was previously rounding the
                                                   one-decimal prices (29.9, 59.9) up to integers. */
                                                : Number(p.price).toLocaleString('az-AZ', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                        </span>
                                        {!isFree && (
                                            <span className={`text-[14px] font-semibold ${featured ? 'text-white/70' : 'text-[var(--ink-500)]'}`}>AZN</span>
                                        )}
                                    </div>
                                    <div className={`text-[13px] mt-1 ${featured ? 'text-white/60' : 'text-[var(--ink-500)]'}`}>
                                        {isFree ? 'ömürlük pulsuz' : 'aylıq'}
                                    </div>

                                    {features.length > 0 && (
                                        <ul className={`mt-6 space-y-3 pt-6 border-t ${featured ? 'border-white/15' : 'border-[var(--ink-150)]'}`}>
                                            {features.map((f, j) => (
                                                <li key={j} className={`flex items-start gap-2.5 text-[14px] ${featured ? 'text-white/90' : 'text-[var(--ink-700)]'}`}>
                                                    <HiOutlineCheck className={`w-4 h-4 mt-0.5 shrink-0 ${featured ? 'text-[var(--accent)]' : 'text-[var(--primary)]'}`} />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <Link
                                        to={ctaTo}
                                        className={`mt-7 w-full inline-flex items-center justify-center h-12 rounded-full font-semibold text-[14.5px] transition-all ${
                                            featured
                                                ? 'bg-white text-[var(--ink-900)] hover:bg-white/95'
                                                : isFree
                                                    ? 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]'
                                                    : 'bg-[var(--ink-100)] text-[var(--ink-800)] hover:bg-[var(--ink-200)]'
                                        }`}
                                    >
                                        {ctaLabel}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="text-center mt-9">
                    <Link to="/planlar" className="inline-flex items-center gap-1.5 text-[var(--primary)] font-semibold text-[14px] hover:gap-2 transition-all">
                        Bütün planları və müqayisəni gör <HiOutlineArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </section>
    );
};

const Testimonials = () => {
    const items = [
        { q: 'Bir semestrdə 14 imtahan yaratdım. Əvvəllər kağızda yoxlamağa bir həftə gedirdi — indi 30 dəqiqəyə bütün analizi alıram.', n: 'Aysel Səfərova', r: 'Riyaziyyat müəllimi, 23 №-li məktəb', i: 'AS' },
        { q: 'Sual bankı və ətraflı analitika kursumuzun keyfiyyətini çox artırdı. Şagirdlər nəticələrini həm görür, həm də motivasiya alır.', n: 'Rəşad Məmmədov', r: 'Hazırlıq mərkəzinin direktoru', i: 'RM' },
        { q: 'Suala formula və şəkil əlavə etmək fizika üçün əla işləyir. AI köməyi ilə imtahan variantlarını dəqiqələrə hazırlayıram, nəticələri də telefonumdan real vaxtda izləyirəm.', n: 'Nigar Quliyeva', r: 'Fizika müəllimi, özəl lisey', i: 'NQ' },
    ];
    return (
        <section className="py-20 md:py-24">
            <div className="container-main">
                <SectionHead eyebrow="Rəylər" title="Azərbaycanın aparıcı müəllimləri seçir" />
                <div className="grid md:grid-cols-3 gap-5">
                    {items.map((t, i) => (
                        <div key={i} className="bg-white border border-[var(--ink-200)] rounded-2xl p-7">
                            <div className="text-amber-500 tracking-widest text-sm mb-3">★★★★★</div>
                            <p className="text-[15px] text-[var(--ink-700)] leading-relaxed mb-5">"{t.q}"</p>
                            <div className="flex items-center gap-3 pt-4 border-t border-[var(--ink-150)]">
                                <div className="w-10 h-10 rounded-full bg-[var(--brand-blue-100)] text-[var(--brand-blue-700)] flex items-center justify-center font-bold text-[13px]">{t.i}</div>
                                <div>
                                    <div className="text-[14px] font-bold text-[var(--ink-900)]">{t.n}</div>
                                    <div className="text-[12px] text-[var(--ink-500)]">{t.r}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQ = () => {
    const items = [
        { q: 'testup.az-dan istifadə tamamilə pulsuzdur?', a: 'Başlanğıc planı ömürlük pulsuzdur — 3 imtahan və 50 şagirdə qədər. Daha çox imkan üçün ödənişli planlardan birini seçə bilərsiniz.' },
        { q: 'Şagirdlərin qeydiyyatdan keçməsi vacibdirmi?', a: 'Xeyr. İmtahanı tək link vasitəsilə qeydiyyatsız da paylaşa bilərsiniz. Lakin uzunmüddətli izləmə üçün qeydiyyat tövsiyə olunur.' },
        { q: 'Hansı sual növlərini dəstəkləyirsiniz?', a: 'Çoxseçimli, çoxlu doğru cavab, doğru/yalan, açıq cavab, uyğunluq, ardıcıllıq və ədəd cavablı suallar, həmçinin mətn və dinləmə tapşırıqları. Şəkil və riyazi simvol da əlavə oluna bilər.' },
        { q: 'Sual bankı və AI ilə imtahan necə işləyir?', a: 'Suallarınızı fənn üzrə sual bankında saxlayıb təkrar-təkrar istifadə edə bilərsiniz. AI köməkçisi isə mövzu və çətinlik səviyyəsinə görə dəqiqələr içində yeni suallar və hazır imtahan variantları yaradır.' },
        { q: 'Nəticələri Excel formatında ixrac edə bilərəmmi?', a: 'Bəli. Hər imtahanın nəticələrini Excel faylı kimi yükləyə bilərsiniz.' },
    ];
    const [open, setOpen] = useState(-1);
    return (
        <section className="py-20 md:py-24" id="faq">
            <div className="container-main max-w-3xl">
                <SectionHead eyebrow="FAQ" title="Tez-tez verilən suallar" />
                <div className="bg-white border border-[var(--ink-200)] rounded-2xl divide-y divide-[var(--ink-150)] overflow-hidden">
                    {items.map((it, i) => (
                        <div key={i}>
                            <button
                                onClick={() => setOpen(open === i ? -1 : i)}
                                className="w-full flex items-center justify-between text-left px-6 py-5 hover:bg-[var(--ink-100)] transition-colors"
                            >
                                <span className="font-semibold text-[var(--ink-900)] text-[15.5px]">{it.q}</span>
                                <span className={`w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0 transition-transform ${open === i ? 'rotate-45' : ''}`}>
                                    <HiOutlinePlus className="w-4 h-4" />
                                </span>
                            </button>
                            {open === i && (
                                <div className="px-6 pb-5 text-[14.5px] text-[var(--ink-500)] leading-relaxed">{it.a}</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTABanner = ({ isAuthenticated, isTeacher, onCreateExam }) => (
    <section className="py-16 md:py-20">
        <div className="container-main">
            <div className="relative overflow-hidden rounded-3xl px-6 py-14 md:px-12 md:py-16 text-center text-white" style={{ background: 'linear-gradient(135deg, var(--brand-blue-700) 0%, var(--primary) 60%, var(--brand-green-600) 130%)' }}>
                <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                    backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.18), transparent 40%)',
                }} />
                <h2 className="relative text-[28px] md:text-[40px] font-bold tracking-tight leading-tight">
                    Bu gün ilk imtahanınızı yaradın
                </h2>
                <p className="relative mt-4 text-white/80 text-[16px] md:text-[17px] max-w-[600px] mx-auto leading-relaxed">
                    15 dəqiqəyə qeydiyyatdan keçin və ilk imtahanınızı pulsuz yaradın. Kredit kartı tələb olunmur.
                </p>
                <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                    {isAuthenticated ? (
                        isTeacher ? (
                            <button
                                type="button"
                                onClick={onCreateExam}
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--primary)] bg-white hover:bg-white/95 transition-all shadow-xl"
                            >
                                Yeni imtahan yarat <HiOutlineArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <Link
                                to="/imtahanlar"
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--primary)] bg-white hover:bg-white/95 transition-all shadow-xl"
                            >
                                İmtahanlara bax <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        )
                    ) : (
                        <>
                            <Link
                                to="/register"
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--primary)] bg-white hover:bg-white/95 transition-all shadow-xl"
                            >
                                Pulsuz başla <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/login"
                                className="h-14 px-7 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-white bg-white/10 border border-white/30 hover:bg-white/20 backdrop-blur-sm transition-all"
                            >
                                Daxil ol
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    </section>
);

// ───────────────────────────────────────────────────────────────────────────
// Dynamic banners
// ───────────────────────────────────────────────────────────────────────────

const AUTH_ONLY_PATHS = ['/login', '/register'];

const Banners = ({ banners, isAuthenticated }) => {
    if (!banners?.length) return null;
    const filtered = banners.filter(b => {
        if (b.audience === 'AUTH' && !isAuthenticated) return false;
        if (b.audience === 'ANON' && isAuthenticated) return false;
        return true;
    });
    if (!filtered.length) return null;
    return (
        <section className="py-6">
            <div className="container-main space-y-4">
                {filtered.map(b => {
                    const grad = b.bgGradient || 'from-[var(--primary)] to-[var(--accent)]';
                    const isAuthLink = b.linkUrl && AUTH_ONLY_PATHS.some(p => b.linkUrl === p || b.linkUrl.startsWith(p + '?'));
                    const showCta = b.linkUrl && !(isAuthenticated && isAuthLink);
                    const inner = (
                        <div className={`bg-gradient-to-r ${grad} rounded-2xl p-6 flex items-center gap-6 relative overflow-hidden group`}>
                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors rounded-2xl" />
                            {b.imageUrl && (
                                <img src={b.imageUrl} alt="" className="relative z-10 h-16 w-16 object-cover rounded-xl shrink-0 shadow-lg" />
                            )}
                            <div className="relative z-10 flex-1 min-w-0">
                                <p className="font-extrabold text-white text-lg leading-tight">{b.title}</p>
                                {b.subtitle && <p className="text-white/80 text-sm mt-1 line-clamp-2">{b.subtitle}</p>}
                            </div>
                            {showCta && (
                                <span className="relative z-10 shrink-0 inline-flex items-center px-5 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl border border-white/30 backdrop-blur-sm transition-colors whitespace-nowrap">
                                    {b.linkText || 'Ətraflı bax'} →
                                </span>
                            )}
                        </div>
                    );
                    const effectiveUrl = showCta ? b.linkUrl : null;
                    return effectiveUrl ? (
                        <a key={b.id} href={effectiveUrl} target={effectiveUrl.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="block">
                            {inner}
                        </a>
                    ) : (
                        <div key={b.id}>{inner}</div>
                    );
                })}
            </div>
        </section>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Home = () => {
    const { isAuthenticated, isTeacher } = useAuth();
    const [createOpen, setCreateOpen] = useState(false);

    const openCreate = () => setCreateOpen(true);

    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>testup.az — Onlayn İmtahan Platforması</title>
                <meta name="description" content="Müəllimlər və təlim mərkəzləri üçün hazırlanmış müasir onlayn imtahan platforması. Test bankı, avtomatik qiymətləndirmə və ətraflı analitika — hamısı bir yerdə." />
                <link rel="canonical" href="https://testup.az/" />
            </Helmet>

            <Hero isAuthenticated={isAuthenticated} isTeacher={isTeacher} onCreateExam={openCreate} />
            <Stats />
            <HowItWorks />
            <FeaturesTeacher />
            <FeaturesStudent />
            <PricingPreview />
            <Testimonials />
            <FAQ />
            <CTABanner isAuthenticated={isAuthenticated} isTeacher={isTeacher} onCreateExam={openCreate} />

            <CreateExamModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
};

export default Home;
