import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineLightBulb,
    HiOutlineAcademicCap,
    HiOutlineShieldCheck,
    HiOutlineCalculator,
    HiOutlineClipboardCheck,
    HiOutlineChip,
    HiOutlinePencilAlt,
    HiOutlineEye,
} from 'react-icons/hi';

const innovations = [
    {
        icon: <HiOutlineCalculator className="w-6 h-6 text-indigo-600" />,
        bg: 'bg-indigo-50',
        iconBg: 'bg-indigo-100',
        title: 'Riyaziyyat Klaviaturası',
        desc: 'Şagirdlər kəsrlər, kvadrat köklər, inteqrallar və digər riyazi ifadələri xüsusi klaviatura vasitəsilə rahat şəkildə daxil edə bilir. LaTeX-bazalı göstərim sayəsində düsturlar tam düzgün formatda əks olunur.',
    },
    {
        icon: <HiOutlineClipboardCheck className="w-6 h-6 text-purple-600" />,
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        title: 'Sonradan Yoxlanılan Suallar',
        desc: 'Açıq uçlu, esse tipli və ya əllə yoxlanılması tələb edən suallar üçün müəllim cavabları sonradan nəzərdən keçirərək qiymətləndirir. Avtomatik sistem mümkün olmayan hallarda insan dəqiqliyi qorunur.',
    },
    {
        icon: <HiOutlinePencilAlt className="w-6 h-6 text-green-600" />,
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        title: 'Çoxnövlü Sual Tipləri',
        desc: 'Çoxseçimli, boşluqdoldurma, doğru/yanlış, açıq cavab və riyazi ifadə tipli suallar — hamısı bir imtahanda bir arada istifadə edilə bilər.',
    },
    {
        icon: <HiOutlineEye className="w-6 h-6 text-orange-600" />,
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        title: 'Gizli Kod ilə Giriş',
        desc: 'Hər imtahan üçün unikal giriş kodu təyin edilir. Müəllim imtahanı yalnız istədiyi şagird qrupuna açıq edir, icazəsiz girişin qarşısı alınır.',
    },
    {
        icon: <HiOutlineChip className="w-6 h-6 text-blue-600" />,
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        title: 'Avtomatik Qiymətləndirmə',
        desc: 'Obyektiv tipli suallar sistem tərəfindən anında yoxlanılır, nəticələr avtomatik hesablanır. Müəllim vaxtını sual hazırlığına yönəldə bilir.',
    },
    {
        icon: <HiOutlineLightBulb className="w-6 h-6 text-yellow-600" />,
        bg: 'bg-yellow-50',
        iconBg: 'bg-yellow-100',
        title: 'Sınaq və Rəsmi İmtahanlar',
        desc: 'Açıq sınaq imtahanları ilə fərdi hazırlıq, gizli rəsmi imtahanlar ilə isə qiymətləndirmə — hər iki ssenari eyni platformada dəstəklənir.',
    },
];

const About = () => {
    return (
        <div className="bg-white min-h-screen">
            <Helmet>
                <title>Haqqımızda — testup.az</title>
                <meta name="description" content="testup.az haqqında: riyaziyyat klaviaturası, sonradan yoxlanılan suallar, çoxnövlü sual tipləri və avtomatik qiymətləndirmə ilə müasir onlayn imtahan platforması." />
                <meta property="og:title" content="Haqqımızda — testup.az" />
                <meta property="og:description" content="Müəllimlərin onlayn imtahan yaradıb idarə etdiyi, şagirdlərin həmin imtahanlara iştirak etdiyi innovativ platforma." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://testup.az/haqqimizda" />
            </Helmet>

            {/* Page Header */}
            <div className="bg-gray-50 py-16 border-b border-gray-100">
                <div className="container-main text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Haqqımızda</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Təhsili və qiymətləndirməni rəqəmsallaşdıran müasir platforma.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-main py-20">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            Bizim Missiyamız
                        </h2>
                        <div className="space-y-4 text-gray-600 text-lg leading-relaxed">
                            <p>
                                <strong>testup.az</strong> olaraq əsas məqsədimiz müəllimlərin fəaliyyətini asanlaşdırmaq və şagirdlər üçün rəqabətli, şəffaf imtahan mühiti formalaşdırmaqdır.
                            </p>
                            <p>
                                Ənənəvi kağız-qələm imtahanlarının yaratdığı vaxt itkisini, yoxlama çətinliklərini aradan qaldıraraq mərkəzləşdirilmiş və avtomatlaşdırılmış sistem təklif edirik.
                            </p>
                            <p>
                                İstər açıq sınaq imtahanları olsun, istərsə də kiçik qruplar üçün nəzərdə tutulmuş gizli kodlu yoxlamalar — hamısı bir neçə kliklə mümkündür.
                            </p>
                        </div>
                    </div>

                    {/* Vision Grid */}
                    <div className="grid gap-6">
                        <div className="bg-indigo-50 p-6 rounded-2xl flex gap-4">
                            <div className="bg-white p-3 rounded-xl h-fit shadow-sm">
                                <HiOutlineAcademicCap className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Təhsilin İnkişafı</h3>
                                <p className="text-gray-600">Texnologiyadan istifadə etməklə tədris prosesinin keyfiyyətinin yüksəldilməsi.</p>
                            </div>
                        </div>

                        <div className="bg-purple-50 p-6 rounded-2xl flex gap-4">
                            <div className="bg-white p-3 rounded-xl h-fit shadow-sm">
                                <HiOutlineLightBulb className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">İnnovativ Yanaşma</h3>
                                <p className="text-gray-600">Riyazi düsturlardan tutmuş müxtəlif sual tiplərinə qədər hərtərəfli dəstək.</p>
                            </div>
                        </div>

                        <div className="bg-green-50 p-6 rounded-2xl flex gap-4">
                            <div className="bg-white p-3 rounded-xl h-fit shadow-sm">
                                <HiOutlineShieldCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Etibarlılıq</h3>
                                <p className="text-gray-600">Məlumatların təhlükəsizliyi və nəticələrin obyektiv hesablanmasına tam zəmanət.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Innovations Section */}
            <div className="bg-gray-50 py-20 border-t border-gray-100">
                <div className="container-main">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">İnnovativ Yanaşmalarımız</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Platformamızı fərqləndirən xüsusiyyətlər — riyaziyyatdan tutmuş insan yoxlamasına qədər.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {innovations.map((item, i) => (
                            <div key={i} className={`${item.bg} p-6 rounded-2xl flex gap-4`}>
                                <div className={`${item.iconBg} p-3 rounded-xl h-fit`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="bg-gray-900 py-16 text-center">
                <div className="container-main">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Bizimlə birgə təhsilə töhfə verin</h2>
                    <Link to="/register" className="inline-block px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors">
                        Hesab Yarat
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default About;
