import { Link } from 'react-router-dom';
import { HiOutlineLightBulb, HiOutlineAcademicCap, HiOutlineShieldCheck } from 'react-icons/hi';

const About = () => {
    return (
        <div className="bg-white min-h-screen">
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
