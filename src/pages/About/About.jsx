import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineLightBulb, HiOutlineAcademicCap, HiOutlineShieldCheck,
    HiOutlineCalculator, HiOutlineClipboardCheck, HiOutlinePencilAlt,
    HiOutlineEye, HiOutlineChip, HiOutlineArrowRight, HiOutlineCheckCircle,
    HiOutlineHeart, HiOutlineGlobe, HiOutlineSparkles, HiOutlineUserGroup,
    HiOutlineDuplicate, HiOutlineChartBar,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import Pricing from '../Pricing/Pricing';

const ValueCard = ({ icon: Icon, title, desc, from, to }) => (
    <div className={`rounded-2xl p-6 bg-gradient-to-br ${from} ${to} flex gap-4 cursor-pointer`}>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
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
            icon: HiOutlineSparkles, iconColor: 'text-violet-600', bg: 'bg-violet-50',
            title: 'AI ilə sual yaratma — saniyələr içində',
            desc: 'Fənn, mövzu, çətinlik seçin — AI sistemi sualları riyazi simvollarla birlikdə hazırlayır. Müəllim yalnız yoxlayır, təsdiqləyir.',
        },
        {
            icon: HiOutlineUserGroup, iconColor: 'text-blue-600', bg: 'bg-blue-50',
            title: 'Birgə imtahan — komanda işi',
            desc: 'Admin imtahanı fənlər üzrə müəllimlərə bölür. Hər müəllim öz sahəsini hazırlayır. Yekun imtahan bir yerdə birləşir, admin təsdiqləyir.',
        },
        {
            icon: HiOutlineCalculator, iconColor: 'text-indigo-600', bg: 'bg-indigo-50',
            title: 'Riyazi simvollar klaviaturası',
            desc: 'Kəsrlər, inteqrallar, kvadrat kökləri — xüsusi klaviatura ilə asanlıqla daxil edilir, real vaxtda göstərilir. Heç bir texniki bilik tələb olunmur.',
        },
        {
            icon: HiOutlineClipboardCheck, iconColor: 'text-purple-600', bg: 'bg-purple-50',
            title: 'Açıq suallar + insan dəqiqliyi',
            desc: 'Sistem bacardığını görür, müəllim qalan hissəni. Esse tipli cavablar şagird tərəfindən yazılır, müəllim tərəfindən qiymətləndirilir.',
        },
        {
            icon: HiOutlineChartBar, iconColor: 'text-cyan-600', bg: 'bg-cyan-50',
            title: '4 kateqoriyalı nəticə analizi',
            desc: 'Doğru, Yanlış, Boş, Yoxlanılmamış — hər cavab rənglənir, qrafikə çevrilir. Müəllim güclü və zəif nöqtələri bir baxışda görür.',
        },
        {
            icon: HiOutlinePencilAlt, iconColor: 'text-pink-600', bg: 'bg-pink-50',
            title: '7 sual tipi — bir interfeysdə',
            desc: 'MCQ, çoxseçimli, doğru/yanlış, açıq, boşluqdoldurma, uyğunlaşdırma — hansı fənn olursa olsun, uyğun format platformada var.',
        },
        {
            icon: HiOutlineEye, iconColor: 'text-orange-600', bg: 'bg-orange-50',
            title: 'Linklə paylaşım — qeydiyyatsız giriş',
            desc: 'Şagird nə profilə ehtiyac duyur, nə şifrəyə. Linki açır, adını yazır, imtahana başlayır. Bu qədər sadə.',
        },
        {
            icon: HiOutlineDuplicate, iconColor: 'text-teal-600', bg: 'bg-teal-50',
            title: 'Klonlama & şablonlar',
            desc: 'Keçən ilin imtahanını kopyala, yenilə, yayımla. Ya da şablondan başla — hər dəfə sıfırdan qurmaq artıq keçmişdə qaldı.',
        },
        {
            icon: HiOutlineChip, iconColor: 'text-amber-600', bg: 'bg-amber-50',
            title: 'Avtomatik qiymətləndirmə',
            desc: 'İmtahan bitən kimi ballar hazır olur. Qapalı suallar üçün müəllimin yoxlamağa qayıtmasına ehtiyac yoxdur — sistem hər şeyi görmüşdür.',
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
                        <strong className="text-gray-900">testup.az</strong> — müəllimin hər imtahan hazırlığında yanında olan,
                        sualdan nəticəyə qədər hər addımı sadələşdirən, Azərbaycan tədris sisteminə uyğun qurulmuş onlayn platforma.
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
                                Müəllimin vaxtı<br />ən dəyərli resursdur
                            </h2>
                            <div className="space-y-4 text-gray-600 text-[15px] leading-relaxed">
                                <p>
                                    Kağız çap xərcləri, əl ilə yoxlama, cavab vərəqləri — bu proseslərin hamısı müəllimin ən dəyərli resursunu aparır: vaxtını.
                                    <strong className="text-gray-800"> testup.az bu vaxtı geri qaytarmaq üçün yarandı.</strong>
                                </p>
                                <p>
                                    Platformamız Azərbaycan tədris sisteminə uyğun hazırlanıb — riyaziyyat düsturlarından tutmuş
                                    uyğunlaşdırma suallarına qədər hər format dəstəklənir.
                                </p>
                                <p>
                                    Açıq imtahanmı, yoxsa gizli qiymətləndirməmi? İkisi də eyni sadə interfeysdə mümkündür — fərq yalnız bir klikdədir.
                                </p>
                            </div>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {['Pulsuz qeydiyyat', 'AI sual yaratma', 'Riyazi simvollar', 'Birgə imtahan', 'Avtomatik yoxlama'].map(t => (
                                    <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                                        <HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            <ValueCard
                                icon={HiOutlineAcademicCap}
                                title="Müəllimin vaxtı geri qaytarılır"
                                desc="Yoxlama, bal hesablama, nəticə cədvəli — bunların hamısını sistem öz üzərinə götürür. Müəllim yalnız öyrətməyə fokuslanır."
                                from="from-indigo-50" to="to-blue-50"
                            />
                            <ValueCard
                                icon={HiOutlineSparkles}
                                title="Hər fənn üçün uyğun format"
                                desc="Riyazi düsturlardan dinləmə tapşırıqlarına, uyğunlaşdırmadan açıq suallara — müasir tədrisin tələb etdiyi hər format platformada mövcuddur."
                                from="from-purple-50" to="to-pink-50"
                            />
                            <ValueCard
                                icon={HiOutlineShieldCheck}
                                title="Nəticə heç vaxt subyektiv deyil"
                                desc="Qapalı suallar sistem tərəfindən ani yoxlanılır. Açıq suallar müəllim tərəfindən nəzərdən keçirilir. Qiymət ədalətli, şəffaf, izahatlıdır."
                                from="from-green-50" to="to-emerald-50"
                            />
                            <ValueCard
                                icon={HiOutlineGlobe}
                                title="Azərbaycan üçün, azərbaycanca"
                                desc="Dil, məzmun, istifadə təcrübəsi — hər şey Azərbaycan müəlliminin gündəlik həyatı nəzərə alınaraq hazırlanıb."
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
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Fərqi yaradan xüsusiyyətlər</p>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Hər funksionallıq bir ehtiyacdan doğub</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Sadə görünsə də — arxasında real müəllim rəyləri, real sinif otağı problemləri var.
                        </p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {innovations.map((item, i) => <InnovCard key={i} {...item} />)}
                    </div>
                </div>
            </section>

            {/* ── Who we are ── */}
            <section className="py-20 bg-white">
                <div className="container-main max-w-3xl mx-auto text-center">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Komanda</p>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
                        Yerli problem. Yerli həll.
                    </h2>
                    <p className="text-[15px] text-gray-600 leading-relaxed mb-6">
                        testup.az, yerli tədrisin problemlərini özü yaşamış insanlar tərəfindən qurulub.
                        Buradakı hər funksionallıq — bir müəllimin üzləşdiyi real sualın cavabıdır.
                    </p>
                    <p className="text-[15px] text-gray-600 leading-relaxed">
                        Məqsədimiz tək dəfəlik deyil. Platformamızı daim inkişaf etdiririk —
                        hər yenilik müəllim rəyinə əsaslanır, hər güncəlləmə daha yaxşı bir alət üçündür.
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
                        Müasir müəllim müasir alətlə işləyir
                    </h2>
                    <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
                        Qeydiyyat pulsuz. İlk imtahanı yaratmaq 5 dəqiqə çəkir. Fərqi isə şagirdləriniz görəcək.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        {!isAuthenticated ? (
                            <>
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-white text-indigo-700 font-bold rounded-xl shadow-xl hover:bg-indigo-50 transition-colors text-sm"
                                >
                                    Pulsuz başlayın <HiOutlineArrowRight className="w-4 h-4" />
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
