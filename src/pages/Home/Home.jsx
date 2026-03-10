import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiOutlineDocumentText, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineUserGroup } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Home = () => {
    const { isAuthenticated, isTeacher } = useAuth();

    const features = [
        {
            title: "Asan İmtahan Yaratma",
            description: "Saniyələr içində fərqli tipli suallarla imtahanlar təşkil edin.",
            icon: <HiOutlineDocumentText className="w-6 h-6 text-indigo-600" />
        },
        {
            title: "Avtomatik Yoxlama",
            description: "Qapalı və çoxseçimli suallar sistem tərəfindən anında qiymətləndirilir.",
            icon: <HiOutlineCheckCircle className="w-6 h-6 text-indigo-600" />
        },
        {
            title: "Ətraflı Statistika",
            description: "Şagirdlərin nəticələrini və ümumi performansı detallı izləyin.",
            icon: <HiOutlineChartBar className="w-6 h-6 text-indigo-600" />
        },
        {
            title: "Gizli və Açıq İmtahanlar",
            description: "İmtahanları hər kəsə açıq və ya xüsusi kodla qapalı formatda keçirin.",
            icon: <HiOutlineUserGroup className="w-6 h-6 text-indigo-600" />
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Helmet>
                <title>testup.az — Onlayn İmtahan Platforması</title>
                <meta name="description" content="Müəllimlərin onlayn imtahan yaradıb idarə etdiyi, şagirdlərin həmin imtahanlara iştirak etdiyi müasir veb platforması." />
                <meta property="og:title" content="testup.az — Onlayn İmtahan Platforması" />
                <meta property="og:description" content="Riyaziyyat klaviaturası, avtomatik qiymətləndirmə və daha çox xüsusiyyətlə zəngin imtahan platforması." />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://testup.az/" />
            </Helmet>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-16 md:pt-24 pb-32">
                <div className="absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-indigo-50/80 to-transparent"></div>

                <div className="container-main relative z-10 text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8 border border-indigo-100">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        testup.az versiya 1.0 aktivdir
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                        Onlayn imtahanları <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            ağıllı idarə edin
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Müəllimlər üçün sadə imtahan yaratma, şagirdlər üçün isə rahat iştirak və anında nəticə prosesini təmin edən etibarlı platforma.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {!isAuthenticated ? (
                            <>
                                <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                                    Pulsuz Qeydiyyat
                                </Link>
                                <Link to="/haqqimizda" className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold rounded-xl transition-all">
                                    Daha Ətraflı
                                </Link>
                            </>
                        ) : (
                            <Link to={isTeacher ? "/imtahanlar" : "/profil"} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                                Sistemə Keçid
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="container-main">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Niyə testup.az?</h2>
                        <p className="text-gray-600">Platformamız tədris və qiymətləndirmə prosesini sürətləndirmək və daha səmərəli etmək üçün dizayn olunub.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="container-main">
                    <div className="bg-indigo-600 rounded-3xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 p-12 md:p-20 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="max-w-2xl">
                                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                    İmtahan prosesinizi bizə etibar edin
                                </h2>
                                <p className="text-indigo-100 text-lg">
                                    İndi qoşulun və ilk sərbəst imtahanınızı 5 dəqiqə ərzində yaradın.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                {!isAuthenticated && (
                                    <Link to="/register" className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors">
                                        İndi Yoxla
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
