import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineDocumentText, HiOutlineChartBar, HiOutlineCheckCircle,
    HiOutlineLightningBolt, HiOutlineBookOpen, HiOutlineTemplate,
    HiOutlineUserGroup, HiOutlineArrowRight, HiOutlineSparkles,
    HiOutlinePencilAlt, HiOutlineAcademicCap, HiOutlineClock,
    HiOutlineShieldCheck, HiOutlineLink, HiOutlinePhotograph
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Pricing from '../Pricing/Pricing';

// ── Mini components ──────────────────────────────────────────────────────────

const TypeBadge = ({ label, color }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${color}`}>{label}</span>
);

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
    <div className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

const StepCard = ({ n, title, desc }) => (
    <div className="flex gap-5">
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                {n}
            </div>
            {n < 3 && <div className="flex-1 w-px bg-indigo-100 my-2" />}
        </div>
        <div className="pb-8">
            <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
        </div>
    </div>
);

// ── Mock exam card (decorative) ───────────────────────────────────────────────
const MockExamCard = () => (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden w-full max-w-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
            <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wide">Riyaziyyat · İmtahan</p>
            <h4 className="text-white font-bold text-base mt-1">Triqonometriya — II Yarımil</h4>
            <div className="flex items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-indigo-200 text-xs"><HiOutlineClock className="w-3.5 h-3.5" /> 60 dəq</span>
                <span className="flex items-center gap-1 text-indigo-200 text-xs"><HiOutlineDocumentText className="w-3.5 h-3.5" /> 20 sual</span>
                <span className="flex items-center gap-1 text-indigo-200 text-xs"><HiOutlineUserGroup className="w-3.5 h-3.5" /> 34 şagird</span>
            </div>
        </div>
        <div className="px-5 py-4 space-y-3">
            <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5 shrink-0">1</span>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">sin²α + cos²α = ?</p>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {['0', '1', '2', 'α'].map((opt, i) => (
                            <div key={i} className={`px-2 py-1.5 rounded-lg text-xs font-medium border ${i === 1 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                {String.fromCharCode(65 + i)}. {opt}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-50 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-400">74%</span>
                </div>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Aktiv</span>
            </div>
        </div>
    </div>
);

// ── Stat ─────────────────────────────────────────────────────────────────────
const Stat = ({ value, label }) => (
    <div className="text-center">
        <p className="text-3xl md:text-4xl font-extrabold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
);

// ── Main ─────────────────────────────────────────────────────────────────────
const Home = () => {
    const { isAuthenticated, isTeacher } = useAuth();

    const features = [
        { icon: HiOutlineLightningBolt, title: 'Sürətli imtahan yaratma', desc: 'Sualları əlavə edin, vaxt, bal və şərtləri tənzimləyin — hazırlıq 5 dəqiqədən az vaxt aparır.', color: 'bg-amber-50 text-amber-600' },
        { icon: HiOutlineCheckCircle, title: 'Avtomatik qiymətləndirmə', desc: 'Qapalı, çoxseçimli, boşluqdoldurma sualları sistem tərəfindən dərhal yoxlanılır.', color: 'bg-green-50 text-green-600' },
        { icon: HiOutlineSparkles, title: 'Riyazi formullar (LaTeX)', desc: 'MathQuill klaviaturası ilə mürəkkəb riyazi ifadələri asanlıqla daxil edin.', color: 'bg-purple-50 text-purple-600' },
        { icon: HiOutlineBookOpen, title: 'Sual bazası', desc: 'Sualları fənlər üzrə saxlayın, sonradan imtahanlara əlavə edin. Ümumi və şəxsi baza.', color: 'bg-indigo-50 text-indigo-600' },
        { icon: HiOutlineTemplate, title: 'Şablon imtahanlar', desc: 'Dərs planlarınıza uyğun şablonlar yaradın, hər dəfə yenidən qurmadan istifadə edin.', color: 'bg-pink-50 text-pink-600' },
        { icon: HiOutlineChartBar, title: 'Ətraflı statistika', desc: 'Sual üzrə düzgün cavab faizi, şagird performansı, qrup müqayisəsi və daha çoxu.', color: 'bg-cyan-50 text-cyan-600' },
        { icon: HiOutlineLink, title: 'Link ilə paylaşım', desc: 'İmtahanı bir link ilə paylaşın. Şagirdlər qeydiyyatsız, yalnız adla qoşula bilər.', color: 'bg-orange-50 text-orange-600' },
        { icon: HiOutlinePhotograph, title: 'PDF-dən sual idxalı', desc: 'Mövcud test materiallarını PDF formatında yükləyin, sualları avtomatik əlavə edin.', color: 'bg-teal-50 text-teal-600' },
    ];

    const questionTypes = [
        { label: 'Qapalı (MCQ)', color: 'bg-indigo-100 text-indigo-700', desc: 'Tək düzgün cavab' },
        { label: 'Çox seçimli', color: 'bg-violet-100 text-violet-700', desc: 'Birdən çox cavab' },
        { label: 'Doğru / Yanlış', color: 'bg-blue-100 text-blue-700', desc: 'İki variantlı seçim' },
        { label: 'Açıq (Avto)', color: 'bg-green-100 text-green-700', desc: 'Mətn, avtomatik yoxlanır' },
        { label: 'Açıq (Müəllim)', color: 'bg-orange-100 text-orange-700', desc: 'Müəllim tərəfindən qiymətləndirilir' },
        { label: 'Boşluqdoldurma', color: 'bg-yellow-100 text-yellow-700', desc: 'Boşluğa cavab yazılır' },
        { label: 'Uyğunlaşdırma', color: 'bg-pink-100 text-pink-700', desc: 'Sol-sağ uyğunluq' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Helmet>
                <title>testup.az — Onlayn İmtahan Platforması</title>
                <meta name="description" content="Müəllimlər üçün güclü onlayn imtahan platforması. LaTeX dəstəyi, avtomatik qiymətləndirmə, sual bazası, şablonlar və ətraflı statistika." />
                <link rel="canonical" href="https://testup.az/" />
            </Helmet>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 pt-16 md:pt-24 pb-16 md:pb-28">
                {/* decorative blobs */}
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

                <div className="container-main relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                        {/* Left */}
                        <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-semibold mb-8 shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                Azərbaycanda müəllimlər üçün #1 imtahan platforması
                            </div>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                                Onlayn imtahanı<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500">
                                    ağıllı qurun
                                </span>
                            </h1>

                            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
                                Müəllimlər üçün güclü alət: 7 sual tipi, riyazi formullar, avtomatik qiymətləndirmə,
                                sual bazası və ətraflı statistika — hamısı bir platformada.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                                {!isAuthenticated ? (
                                    <>
                                        <Link
                                            to="/register"
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200/60 transition-all hover:-translate-y-0.5 text-sm"
                                        >
                                            Pulsuz başla <HiOutlineArrowRight className="w-4 h-4" />
                                        </Link>
                                        <Link
                                            to="/imtahanlar"
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-gray-200 hover:border-indigo-300 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-50 text-sm"
                                        >
                                            İmtahanlara bax
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        to={isTeacher ? '/imtahanlar' : '/profil'}
                                        className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200/60 transition-all text-sm"
                                    >
                                        Sistemə keçid <HiOutlineArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 mt-8 text-xs text-gray-500">
                                {['Qeydiyyat tələb olunmur (şagirdlər üçün)', 'Pulsuz istifadə', '7 sual tipi'].map(t => (
                                    <span key={t} className="flex items-center gap-1.5">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Right — mock card */}
                        <div className="flex-shrink-0 w-full max-w-sm mx-auto lg:mx-0 relative">
                            <div className="absolute -top-4 -left-4 bg-green-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
                                ✓ Avtomatik qiymətləndirildi
                            </div>
                            <MockExamCard />
                            <div className="absolute -bottom-3 -right-3 bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 flex items-center gap-2.5 z-10">
                                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                    <HiOutlineUserGroup className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-900">34 şagird</p>
                                    <p className="text-[10px] text-gray-400">iştirak etdi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="py-12 border-y border-gray-100 bg-white">
                <div className="container-main">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <Stat value="7" label="Sual tipi" />
                        <Stat value="100%" label="Pulsuz qeydiyyat" />
                        <Stat value="∞" label="Sual bazası limiti yoxdur" />
                        <Stat value="5 dəq" label="İlk imtahanı yaratmaq üçün" />
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="py-20 bg-white">
                <div className="container-main">
                    <div className="flex flex-col lg:flex-row gap-16 items-start">
                        <div className="flex-1 max-w-sm">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Necə işləyir?</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
                                3 addımda imtahan hazır
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Mürəkkəb quraşdırma yoxdur. Qeydiyyatdan keçin, suallarınızı əlavə edin, linki şagirdlərlə paylaşın.
                            </p>
                        </div>
                        <div className="flex-1">
                            <StepCard n={1} title="Qeydiyyatdan keçin" desc="E-poçt ünvanınızla 30 saniyədə hesab yaradın. Heç bir ödəniş tələb olunmur." />
                            <StepCard n={2} title="İmtahanı qurun" desc="Sual tipini seçin, mətn daxil edin (LaTeX dəstəyi ilə), bal və vaxt limitini tənzimləyin." />
                            <StepCard n={3} title="Paylaşın və nəticəyə baxın" desc="Linki şagirdlərə göndərin. Bitdikdən sonra nəticələri dərhal görün, statistikaya baxın." />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-20 bg-gray-50/60">
                <div className="container-main">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">İmkanlar</p>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Müəllimə lazım olan hər şey</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Sadə interfeys, güclü alətlər. Hazırlıqdan nəticəyə qədər bütün addımlar bir platformada.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((f, i) => <FeatureCard key={i} {...f} />)}
                    </div>
                </div>
            </section>

            {/* ── Question types ── */}
            <section className="py-20 bg-white">
                <div className="container-main">
                    <div className="flex flex-col lg:flex-row gap-14 items-center">
                        <div className="flex-1">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Sual tipləri</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 leading-tight">
                                7 müxtəlif sual formatı
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                Sadə testdən tutmuş uyğunlaşdırma və açıq suallara qədər — hər fənn üçün uyğun format mövcuddur.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {questionTypes.map((t, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                                        <TypeBadge label={t.label} color={t.color} />
                                        <span className="text-xs text-gray-400 hidden sm:inline">{t.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 max-w-md w-full">
                            {/* Decorative question cards */}
                            <div className="space-y-3">
                                {/* MCQ */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Qapalı</span>
                                        <span className="text-[10px] text-gray-400">1 bal</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 mb-3">Hansı ədəd sadə ədəddir?</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['4', '7', '9', '15'].map((o, i) => (
                                            <div key={i} className={`px-3 py-2 rounded-xl text-xs font-medium border ${i === 1 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                {String.fromCharCode(65 + i)}. {o} {i === 1 && '✓'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Matching */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700">Uyğunlaşdırma</span>
                                    </div>
                                    <div className="space-y-2">
                                        {[['H₂O', 'Su'], ['NaCl', 'Xörək duzu'], ['O₂', 'Oksigen']].map(([l, r], i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs">
                                                <span className="flex-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-center">{l}</span>
                                                <span className="text-gray-300">→</span>
                                                <span className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 font-medium rounded-lg text-center">{r}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* LaTeX hint */}
                                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-4 flex items-center gap-3">
                                    <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                        <HiOutlineSparkles className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-purple-800">LaTeX dəstəyi</p>
                                        <p className="text-[11px] text-purple-600 mt-0.5">∫₀^π sin(x)dx = 2 kimi formullar daxil edin</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── For teachers / students ── */}
            <section className="py-20 bg-gray-50/60">
                <div className="container-main">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Teacher */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
                                    <HiOutlinePencilAlt className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-extrabold mb-3">Müəllimlər üçün</h3>
                                <ul className="space-y-2 mb-6">
                                    {[
                                        'İmtahan yarat, redaktə et, şablona çevir',
                                        'Sual bazasını fənlər üzrə idarə et',
                                        'Nəticələri ətraflı statistika ilə izlə',
                                        'Açıq sualları əl ilə qiymətləndir',
                                    ].map(t => (
                                        <li key={t} className="flex items-start gap-2.5 text-sm text-indigo-100">
                                            <HiOutlineCheckCircle className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" /> {t}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to={isAuthenticated ? '/imtahanlar' : '/register'}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition-colors"
                                >
                                    {isAuthenticated ? 'İmtahanlarıma keç' : 'Müəllim kimi qeydiyyat'} <HiOutlineArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                        {/* Student */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-full -translate-y-10 translate-x-10" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
                                    <HiOutlineAcademicCap className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Şagirdlər üçün</h3>
                                <ul className="space-y-2 mb-6">
                                    {[
                                        'Qeydiyyatsız, yalnız linkdən daxil ol',
                                        'İmtahana vaxt sayğacı ilə cavab ver',
                                        'Nəticəni dərhal öyrən',
                                        'Cavabları yoxla, xətaları gör',
                                    ].map(t => (
                                        <li key={t} className="flex items-start gap-2.5 text-sm text-gray-500">
                                            <HiOutlineCheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {t}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to="/imtahanlar"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors"
                                >
                                    İmtahanlara bax <HiOutlineArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Trust ── */}
            <section className="py-16 bg-white border-y border-gray-100">
                <div className="container-main">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                        <div className="flex flex-col items-center gap-3 p-6">
                            <HiOutlineShieldCheck className="w-8 h-8 text-indigo-400" />
                            <h4 className="font-bold text-gray-900">Etibarlı platforma</h4>
                            <p className="text-sm text-gray-500">Məlumatlarınız güvəndədir. HTTPS şifrələməsi və etibarlı server altyapısı.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6">
                            <HiOutlineLightningBolt className="w-8 h-8 text-amber-400" />
                            <h4 className="font-bold text-gray-900">Sürətli interfeys</h4>
                            <p className="text-sm text-gray-500">Optimallaşdırılmış UI — istər telefon, istərsə kompüterdən rahat istifadə.</p>
                        </div>
                        <div className="flex flex-col items-center gap-3 p-6">
                            <HiOutlineUserGroup className="w-8 h-8 text-purple-400" />
                            <h4 className="font-bold text-gray-900">Azərbaycanlı komanda</h4>
                            <p className="text-sm text-gray-500">Platforma Azərbaycan tədris sisteminə uyğun hazırlanıb. Dəstək Azərbaycan dilindədir.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <Pricing isEmbedded={true} />

            {/* ── Final CTA ── */}
            <section className="py-24 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="container-main relative z-10 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                        İmtahan prosesinizi bu gün modernləşdirin
                    </h2>
                    <p className="text-indigo-200 text-base mb-8 leading-relaxed">
                        Qeydiyyat pulsuz, imtahan yaratmaq isə 5 dəqiqə çəkir.
                    </p>
                    {!isAuthenticated ? (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to="/register"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors text-sm"
                            >
                                Pulsuz qeydiyyat <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/imtahanlar"
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
                            >
                                İmtahanlara nəzər sal
                            </Link>
                        </div>
                    ) : (
                        <Link
                            to={isTeacher ? '/imtahanlar' : '/profil'}
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors text-sm"
                        >
                            Sistemə keçid <HiOutlineArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Home;
