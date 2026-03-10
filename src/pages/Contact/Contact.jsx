import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would normally send the message to the backend
        toast.success('Mesajınız uğurla göndərildi. Tezliklə sizinlə əlaqə saxlayacağıq.');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="bg-white min-h-screen">
            <Helmet>
                <title>Əlaqə — testup.az</title>
                <meta name="description" content="testup.az ilə əlaqə saxlayın. Suallarınız, təklifləriniz və ya əməkdaşlıq üçün bizimlə əlaqə saxlaya bilərsiniz." />
                <meta property="og:title" content="Əlaqə — testup.az" />
                <meta property="og:type" content="website" />
                <link rel="canonical" href="https://testup.az/elaqe" />
            </Helmet>
            {/* Page Header */}
            <div className="bg-gray-50 py-16 border-b border-gray-100">
                <div className="container-main text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Əlaqə</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Sualınız var və ya dəstəyə ehtiyacınız var? Bizimlə əlaqə saxlamaqdan çəkinməyin.
                    </p>
                </div>
            </div>

            <div className="container-main py-20">
                <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">

                    {/* Contact Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bizimlə Əlaqə Saxlayın</h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Hər hansı texniki problem yaşasanız və ya əməkdaşlıq barədə təklifiniz varsa, bizə yazın. Çalışacağıq ki ən qısa zamanda geri dönüş edək.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <HiOutlineMail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">E-poçt</h4>
                                    <p className="text-gray-600 mt-1">info@testup.az</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <HiOutlineLocationMarker className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Ünvan</h4>
                                    <p className="text-gray-600 mt-1">Bakı şəhəri, Azərbaycan</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                    <HiOutlinePhone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Telefon</h4>
                                    <p className="text-gray-600 mt-1">+994 12 345 67 89</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Bizə Yazın</h3>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Adınız</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                            placeholder="Adınız"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">E-poçt</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                            placeholder="email@nümunə.az"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mesajınız</label>
                                    <textarea
                                        rows="5"
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                                        placeholder="Sualınızı və ya təklifinizi bura yazın..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-indigo-200"
                                >
                                    Mesajı Göndər
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Contact;
