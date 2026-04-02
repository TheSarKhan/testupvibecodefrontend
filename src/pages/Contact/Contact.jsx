import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineMail, HiOutlineLocationMarker, HiOutlineChatAlt2,
    HiOutlineCheckCircle, HiOutlineArrowRight, HiOutlineLightningBolt,
    HiOutlineChevronDown,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const InfoCard = ({ icon: Icon, iconBg, iconColor, title, value, sub }) => (
    <div className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{title}</p>
            <p className="font-bold text-gray-900 text-sm">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/contact', formData);
            toast.success('Mesajınız göndərildi. Tezliklə geri dönəcəyik!');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch {
            toast.error('Mesaj göndərilmədi. Yenidən cəhd edin.');
        } finally {
            setSending(false);
        }
    };

    const faqs = [
        { q: 'Qeydiyyat pulludur?', a: 'Xeyr, qeydiyyat tamamilə pulsuz. İmtahan yaratmaq da pulsuz.' },
        { q: 'Şagirdlər qeydiyyatdan keçməlidir?', a: 'Xeyr. Şagirdlər yalnız linki açıb adlarını daxil edərək imtahana qoşulur.' },
        { q: 'Riyazi simvollar dəstəklənir?', a: 'Bəli. Xüsusi riyazi klaviatura ilə kəsrlər, inteqrallar, kvadrat kökləri asanlıqla daxil edilir.' },
        { q: 'Sual bazasını necə istifadə edim?', a: '"Sual Bazası" bölməsindən fənn yaradın, suallarınızı əlavə edin. İmtahan yaradarkən bazadan seçin.' },
    ];

    return (
        <div className="bg-white min-h-screen">
            <Helmet>
                <title>Əlaqə — testup.az</title>
                <meta name="description" content="testup.az ilə əlaqə saxlayın. Texniki dəstək, suallar və əməkdaşlıq üçün bizimlə əlaqə saxlaya bilərsiniz." />
                <link rel="canonical" href="https://testup.az/elaqe" />
            </Helmet>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/20 pt-16 pb-20">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-32 -left-16 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />
                <div className="container-main relative z-10 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs font-semibold mb-8 shadow-sm">
                        <HiOutlineLightningBolt className="w-3.5 h-3.5" />
                        24 saatdan az müddətdə cavab
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
                        Əlaqə
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Sualınız, təklifiniz və ya texniki probleminiz var?
                        Bizimlə əlaqə saxlamaqdan çəkinməyin — tezliklə geri dönəcəyik.
                    </p>
                </div>
            </section>

            {/* ── Main content ── */}
            <section className="py-20 bg-white">
                <div className="container-main">
                    <div className="grid lg:grid-cols-5 gap-12 max-w-6xl mx-auto">

                        {/* Left — info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Əlaqə məlumatları</p>
                                <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Bizimlə əlaqə saxlayın</h2>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Texniki problem, sual, iş birliyi təklifi — hər mövzuda yazın. Ən qısa zamanda cavab veririk.
                                </p>
                            </div>

                            <InfoCard
                                icon={HiOutlineMail}
                                iconBg="bg-indigo-50" iconColor="text-indigo-600"
                                title="E-poçt"
                                value="info@testup.az"
                                sub="Ən sürətli cavab yolu"
                            />
                            <InfoCard
                                icon={HiOutlineLocationMarker}
                                iconBg="bg-purple-50" iconColor="text-purple-600"
                                title="Ünvan"
                                value="Bakı şəhəri, Azərbaycan"
                                sub="Azərbaycanlı komanda"
                            />
                            <InfoCard
                                icon={HiOutlineChatAlt2}
                                iconBg="bg-green-50" iconColor="text-green-600"
                                title="Cavab müddəti"
                                value="24 saatdan az"
                                sub="İş günlərində"
                            />

                            {/* Trust */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                                <p className="text-xs font-bold text-indigo-700 mb-3">Niyə testup.az?</p>
                                {[
                                    'Qeydiyyat pulsuz',
                                    'Azərbaycan dilində dəstək',
                                    'Yerli komanda, sürətli həll',
                                ].map(t => (
                                    <div key={t} className="flex items-center gap-2 text-sm text-gray-700 mb-2 last:mb-0">
                                        <HiOutlineCheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                                        {t}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right — form */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/60 p-8">
                                <h3 className="text-xl font-extrabold text-gray-900 mb-1">Bizə yazın</h3>
                                <p className="text-sm text-gray-400 mb-6">Aşağıdakı formu doldurun, qısa zamanda cavab alacaqsınız.</p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adınız *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                                                placeholder="Adınız Soyadınız"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">E-poçt *</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                                                placeholder="email@nümunə.az"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mövzu</label>
                                        <select
                                            value={formData.subject}
                                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm bg-white text-gray-700"
                                        >
                                            <option value="">Mövzu seçin...</option>
                                            <option value="texniki">Texniki problem</option>
                                            <option value="sual">Ümumi sual</option>
                                            <option value="eməkdaşlıq">Əməkdaşlıq təklifi</option>
                                            <option value="digər">Digər</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mesajınız *</label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={formData.message}
                                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-sm"
                                            placeholder="Sualınızı, probleminizi və ya təklifinizi ətraflı yazın..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200/60 disabled:opacity-60 text-sm"
                                    >
                                        {sending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Göndərilir...
                                            </>
                                        ) : (
                                            <>Mesajı göndər <HiOutlineArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 bg-gray-50/60">
                <div className="container-main max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">Tez-tez verilən suallar</p>
                        <h2 className="text-2xl font-extrabold text-gray-900">Cavab axtarırsınız?</h2>
                    </div>
                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <span className="font-bold text-gray-900 text-sm">{faq.q}</span>
                                    <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                {openFaq === i && (
                                    <div className="px-5 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
