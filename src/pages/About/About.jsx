import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineLightBulb, HiOutlineAcademicCap, HiOutlineShieldCheck,
    HiOutlineCalculator, HiOutlineClipboardCheck, HiOutlinePencilAlt,
    HiOutlineEye, HiOutlineChip, HiOutlineArrowRight, HiOutlineCheckCircle,
    HiOutlineHeart, HiOutlineGlobe, HiOutlineSparkles,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Pricing from '../Pricing/Pricing';

const ValueCard = ({ icon: Icon, title, desc, from, to }) => (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${from} ${to} flex gap-4`}>
        <div className="bg-white/70 p-2.5 rounded-xl h-fit shadow-sm shrink-0">
            <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div>
            <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const InnovCard = ({ icon: Icon, iconColor, bg, title, desc }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
);

const About = () => {
    const { isAuthenticated } = useAuth();

    const innovations = [
        {
            icon: HiOutlineCalculator, iconColor: 'text-indigo-600', bg: 'bg-indigo-50',
            title: 'Riyaziyyat Klaviaturası (LaTeX)',
            desc: 'Kəsrlər, kvadrat köklər, inteqrallar və digər riyazi ifadələr MathQuill klaviaturası ilə daxil edilir. Düsturlar real vaxtda göstərilir.',
        },
        {
            icon: HiOutlineClipboardCheck, iconColor: 'text-purple-600', bg: 'bg-purple-50',
            title: 'Açıq Suallar + Əl ilə Yoxlama',
            desc: 'Esse tipli suallar müəllim tərəfindən nəzərdən keçirilir. Avtomatik sistemin yetmədiyi yerdə insan dəqiqliyi qorunur.',
        },
        {
            icon: HiOutlinePencilAlt, iconColor: 'text-pink-600', bg: 'bg-pink-50',
            title: '7 Sual Tipi',
            desc: 'MCQ, Çoxseçimli, D/Y, Açıq (Avto), Açıq (Müəllim), Boşluqdoldurma, Uyğunlaşdırma — hər fənn üçün uyğun format.',
        },
        {
            icon: HiOutlineEye, iconColor: 'text-orange-600', bg: 'bg-orange-50',
            title: 'Link ilə Gizli Giriş',
            desc: 'Unikal imtahan linki yaradılır. Şagirdlər qeydiyyatsız, yalnız ad daxil edərək qoşulur. İcazəsiz girişin qarşısı alınır.',
        },
        {
            icon: HiOutlineChip, iconColor: 'text-cyan-600', bg: 'bg-cyan-50',
            title: 'Avtomatik Qiymətləndirmə',
            desc: 'Qapalı suallar dərhal yoxlanılır, bal hesablanır. Müəllim vaxtını sual hazırlığına yönəldə bilər.',
        },
        {
            icon: HiOutlineLightBulb, iconColor: 'text-amber-600', bg: 'bg-amber-50',
            title: 'Sual Bazası & Şablonlar',
            desc: 'Sualları bir dəfə əlavə et, dəfələrlə istifadə et. Şablonlarla imtahan strukturunu öncədən hazırla.',
        },
    ];

    return (
        <div className="bg-white min-h-screen">
            <Helmet>
                <title>Haqqımızda — testup.az</title>
                <meta name="description" content="testup.az haqqında: riyaziyyat klaviaturası, 7 sual tipi, avtomatik qiymətləndirmə və sual bazası ilə Azərbaycanda müəllimlər üçün ən güclü onlayn imtahan platforması." />
                <link rel="canonical" href="https://testup.az/haqqimizda" />
            </Helmet>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/20 pt-16 pb-20">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-32 -left-16 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

                <div className="container-main relative z-10 text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-semibold mb-8 shadow-sm">
                        <HiOutlineHeart className="w-3.5 h-3.5" />
                        Azərbaycan təhsili üçün hazırlandı
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
                        Haqqımızda
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        <strong className="text-gray-900">testup.az</strong> — müəllimlərin vaxtını dəyərləndirən, şagirdlər üçün
                        ədalətli qiymətləndirmə mühiti yaradan onlayn imtahan platformasıdır.
                    </p>
                </div>
            </section>

            {/* ── Mission ── */}
            <section className="py-20 bg-white">
                <div className="container-main">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Missiyamız</p>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                                Tədris prosesini<br />daha səmərəli edək
                            </h2>
                            <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">
                                <p>
                                    Ənənəvi kağız-qələm imtahanlarının yaratdığı vaxt itkisini, çap xərclərini və yoxlama çətinliklərini
                                    aradan qaldıraraq müəllimlərə həqiqətən faydalı bir alət təqdim etmək istəyirik.
                                </p>
                                <p>
                                    Platformamız Azərbaycan tədris sisteminə uyğun hazırlanıb — riyaziyyat formullarından mürəkkəb
                                    uyğunlaşdırma suallarına qədər hər şey dəstəklənir.
                                </p>
                                <p>
                                    İstər açıq sınaq imtahanları, istərsə gizli qiymətləndirmə — ikisi də eyni sadə interfeysdə mümkündür.
                                </p>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {['Pulsuz qeydiyyat', 'Azərbaycan dili', 'LaTeX dəstəyi', 'Avtomatik yoxlama'].map(t => (
                                    <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <ValueCard
                                icon={HiOutlineAcademicCap}
                                title="Təhsilin inkişafı"
                                desc="Texnologiya vasitəsilə tədris prosesinin keyfiyyətini yüksəltmək — müəllimlərə daha çox vaxt, şagirdlərə daha ədalətli qiymət."
                                from="from-indigo-50" to="to-blue-50"
                            />
                            <ValueCard
                                icon={HiOutlineSparkles}
                                title="İnnovativ yanaşma"
                                desc="Riyazi düsturlardan tutmuş uyğunlaşdırma suallarına qədər — müasir tədrisin tələb etdiyi hər format platformamızda mövcuddur."
                                from="from-purple-50" to="to-pink-50"
                            />
                            <ValueCard
                                icon={HiOutlineShieldCheck}
                                title="Etibarlılıq"
                                desc="Məlumatların təhlükəsizliyi və nəticələrin obyektiv hesablanması — şagirdlərə ədalətli qiymətləndirmə, müəllimlərə rahatlıq."
                                from="from-green-50" to="to-emerald-50"
                            />
                            <ValueCard
                                icon={HiOutlineGlobe}
                                title="Azərbaycana xas"
                                desc="Dil, məzmun, tədris sistemi — platforma Azərbaycan müəllimlərinin ehtiyaclarına uyğun qurulub."
                                from="from-amber-50" to="to-orange-50"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Innovations ── */}
            <section className="py-20 bg-gray-50/60">
                <div className="container-main">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Texniki üstünlüklər</p>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Platformanı fərqləndirən xüsusiyyətlər</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Sadə görünsə də — hər detalı müəllimin həyatını asanlaşdırmaq üçün düşünülüb.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {innovations.map((item, i) => <InnovCard key={i} {...item} />)}
                    </div>
                </div>
            </section>

            {/* ── Who we are ── */}
            <section className="py-20 bg-white">
                <div className="container-main max-w-3xl mx-auto text-center">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Komanda</p>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Azərbaycanlı komanda tərəfindən yaradıldı
                    </h2>
                    <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                        testup.az yerli tədrisin problemlərini birbaşa yaşamış, öyrənmiş insanlar tərəfindən qurulub.
                        Hər funksionallıq real müəllim rəyləri əsasında inkişaf etdirilir.
                    </p>
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                        Məqsədimiz birdəfəlik deyil — platformanı daim inkişaf etdirməyi, müəllimlər üçün ən faydalı alət olmağa
                        davam etməyi hədəfləyirik.
                    </p>
                </div>
            </section>

            {/* ── Pricing ── */}
            <Pricing isEmbedded={true} />

            {/* ── CTA ── */}
            <section className="py-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="container-main relative z-10 text-center max-w-xl mx-auto">
                    <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
                        Bizimlə birgə təhsilə töhfə verin
                    </h2>
                    <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                        Qeydiyyat pulsuz, ilk imtahanı yaratmaq isə 5 dəqiqə çəkir.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors text-sm"
                                >
                                    Pulsuz qeydiyyat <HiOutlineArrowRight className="w-4 h-4" />
                                </Link>
                                <Link
                                    to="/elaqe"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-sm"
                                >
                                    Bizimlə əlaqə
                                </Link>
                            </>
                        ) : (
                            <Link
                                to="/imtahanlar"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors text-sm"
                            >
                                İmtahanlarıma keç <HiOutlineArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
