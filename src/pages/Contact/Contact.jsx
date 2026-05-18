import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineMail, HiOutlineShieldCheck, HiOutlinePhone, HiOutlineLocationMarker,
    HiOutlineArrowRight, HiOutlinePlus, HiOutlineCheck,
    HiOutlineLibrary, HiOutlinePlay, HiOutlineUsers,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

// ───────────────────────────────────────────────────────────────────────────
// Shared
// ───────────────────────────────────────────────────────────────────────────

const SectionHead = ({ title, sub }) => (
    <div className="text-center max-w-[720px] mx-auto mb-12">
        <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)] text-balance">{title}</h2>
        {sub && <p className="mt-4 text-[17px] text-[var(--ink-500)] leading-relaxed">{sub}</p>}
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Hero
// ───────────────────────────────────────────────────────────────────────────

const ContactHero = () => (
    <section
        className="relative pt-16 md:pt-20 pb-12 md:pb-14 overflow-hidden border-b border-[var(--ink-150)]"
        style={{ background: 'linear-gradient(180deg, var(--brand-blue-50) 0%, transparent 100%)' }}
    >
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
            <div className="flex items-center gap-2 text-[13.5px] text-[var(--ink-500)] mb-5">
                <Link to="/" className="hover:text-[var(--primary)]">Ana Səhifə</Link>
                <span className="text-[var(--ink-300)]">/</span>
                <span className="text-[var(--ink-800)] font-semibold">Əlaqə</span>
            </div>
            <div className="text-center max-w-[720px] mx-auto">
                <h1 className="text-[36px] md:text-[52px] lg:text-[60px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--ink-900)] text-balance">
                    Bizimlə əlaqə saxlayın
                </h1>
                <p className="mt-4 text-[18px] text-[var(--ink-500)] max-w-[580px] mx-auto leading-relaxed">
                    Sualınız, təklifiniz və ya əməkdaşlıq fikriniz var? Komandamız sizinlə danışmaqdan məmnun olacaq.
                </p>
            </div>
        </div>
    </section>
);

// ───────────────────────────────────────────────────────────────────────────
// Info card (mailto / tel / etc)
// ───────────────────────────────────────────────────────────────────────────

const InfoCard = ({ href, Icon, green, label, value, sub }) => {
    const className = 'flex items-start gap-4 bg-white rounded-2xl border border-[var(--ink-200)] p-5 hover:border-[var(--primary)] hover:shadow-[var(--sh-sm)] transition-all';
    const inner = (
        <>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                green ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'
            }`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[var(--ink-400)]">{label}</p>
                <p className="text-[16px] font-semibold text-[var(--ink-900)] mt-0.5 leading-tight">{value}</p>
                {sub && <p className="text-[13.5px] text-[var(--ink-500)] mt-1">{sub}</p>}
            </div>
        </>
    );
    return href ? <a href={href} className={className}>{inner}</a> : <div className={className}>{inner}</div>;
};

// ───────────────────────────────────────────────────────────────────────────
// Contact form + info column
// ───────────────────────────────────────────────────────────────────────────

const ContactBody = () => {
    const [form, setForm] = useState({
        name: '', email: '', phone: '', org: '', topic: 'sales', subject: '', message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);

    const topics = [
        { key: 'sales',   label: 'Satış / Plan' },
        { key: 'support', label: 'Texniki dəstək' },
        { key: 'partner', label: 'Tərəfdaşlıq' },
        { key: 'media',   label: 'Mətbuat' },
        { key: 'other',   label: 'Digər' },
    ];

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/contact', {
                name: form.name,
                email: form.email,
                subject: form.subject || topics.find(t => t.key === form.topic)?.label || 'Əlaqə',
                message: form.message,
                phone: form.phone,
                org: form.org,
                topic: form.topic,
            });
            setSubmitted(true);
        } catch {
            toast.error('Mesaj göndərilmədi. Yenidən cəhd edin.');
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="py-16 md:py-20">
            <div className="container-main">
                <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10">
                    {/* Left — info & map */}
                    <div>
                        <h2 className="text-[26px] md:text-[30px] font-bold tracking-tight text-[var(--ink-900)] mb-2">
                            Necə kömək edə bilərik?
                        </h2>
                        <p className="text-[var(--ink-500)] text-[15px] mb-7 max-w-[520px] leading-relaxed">
                            Aşağıdakı kanallardan birini seçin və ya formu doldurun. İş günlərində 2 saat ərzində, həftəsonu isə ertəsi gün cavab veririk.
                        </p>

                        <div className="flex flex-col gap-3">
                            <InfoCard
                                href="mailto:hello@testup.az"
                                Icon={HiOutlineMail}
                                label="Email"
                                value="hello@testup.az"
                                sub="Ümumi məlumatlar və satış üçün"
                            />
                            <InfoCard
                                href="mailto:support@testup.az"
                                Icon={HiOutlineShieldCheck}
                                green
                                label="Texniki dəstək"
                                value="support@testup.az"
                                sub="İş günlərində 24 saat içində cavab"
                            />
                            <InfoCard
                                href="tel:+994555723023"
                                Icon={HiOutlinePhone}
                                label="Telefon"
                                value="+994 55 572 30 23"
                                sub="B.e — Cümə · 09:00 – 18:00"
                            />
                            <InfoCard
                                href="https://wa.me/994555723023"
                                Icon={WhatsAppIcon}
                                green
                                label="WhatsApp"
                                value="+994 55 572 30 23"
                                sub="Tez cavab üçün"
                            />
                            <InfoCard
                                Icon={HiOutlineLocationMarker}
                                label="Ofis"
                                value="Bakı, Azərbaycan"
                                sub="Nərimanov m/s çıxışı"
                            />
                        </div>

                        {/* Map card */}
                        <div className="relative mt-4 h-[280px] rounded-2xl overflow-hidden border border-[var(--ink-200)]">
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{
                                    background: 'radial-gradient(circle at 30% 40%, rgba(37,99,235,0.15), transparent 60%), radial-gradient(circle at 70% 60%, rgba(34,197,94,0.1), transparent 60%), linear-gradient(135deg, #E8EEF7 0%, #DCE5F0 100%)',
                                }}
                            >
                                {/* Subtle grid overlay */}
                                <div
                                    className="absolute inset-0 opacity-50"
                                    style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
                                        backgroundSize: '28px 28px',
                                    }}
                                />
                                {/* Pin */}
                                <div className="relative w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-[0_12px_30px_-8px_rgba(37,99,235,0.6)] z-10">
                                    <span
                                        className="absolute -inset-2 rounded-full bg-[var(--primary)] opacity-25 animate-ping"
                                        style={{ animationDuration: '2.4s' }}
                                    />
                                    <HiOutlineLocationMarker className="w-6 h-6 relative" />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-[var(--sh-md)] px-4 py-3 text-[13px]">
                                <div className="font-bold text-[var(--ink-900)]">testup.az HQ</div>
                                <div className="text-[var(--ink-500)] mt-0.5">Nizami küçəsi 203, Bakı</div>
                            </div>
                        </div>
                    </div>

                    {/* Right — form */}
                    <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-7 md:p-9 shadow-[var(--sh-sm)]">
                        {!submitted ? (
                            <form onSubmit={submit}>
                                <h3 className="text-[22px] font-bold text-[var(--ink-900)] mb-1">Bizə yazın</h3>
                                <p className="text-[14px] text-[var(--ink-500)] mb-6">Forma göndərildikdən sonra qəbz emailinizə gələcək.</p>

                                {/* Topic */}
                                <div className="mb-5">
                                    <label className="block text-[13px] font-semibold text-[var(--ink-700)] mb-2">Mövzu</label>
                                    <div className="flex flex-wrap gap-2">
                                        {topics.map(t => (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() => setForm({ ...form, topic: t.key })}
                                                className={`px-3.5 py-2 rounded-full border text-[13px] font-medium transition-all ${
                                                    form.topic === t.key
                                                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                                        : 'bg-white text-[var(--ink-700)] border-[var(--ink-200)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                                }`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Name + Email */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <Field
                                        label={<>Ad Soyad <span className="text-[var(--brand-green-600)]">*</span></>}
                                        required
                                        placeholder="Aysel Səfərova"
                                        value={form.name}
                                        onChange={v => setForm({ ...form, name: v })}
                                    />
                                    <Field
                                        type="email"
                                        label={<>Email <span className="text-[var(--brand-green-600)]">*</span></>}
                                        required
                                        placeholder="aysel@example.az"
                                        value={form.email}
                                        onChange={v => setForm({ ...form, email: v })}
                                    />
                                </div>

                                {/* Phone + Org */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <Field
                                        type="tel"
                                        label="Telefon"
                                        placeholder="+994 50 ..."
                                        value={form.phone}
                                        onChange={v => setForm({ ...form, phone: v })}
                                    />
                                    <Field
                                        label="Təşkilat / Məktəb"
                                        placeholder="Məsələn: 23 №-li məktəb"
                                        value={form.org}
                                        onChange={v => setForm({ ...form, org: v })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <Field
                                        label="Mövzu başlığı"
                                        placeholder="Qısaca mövzunu yazın"
                                        value={form.subject}
                                        onChange={v => setForm({ ...form, subject: v })}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-[13px] font-semibold text-[var(--ink-700)] mb-1.5">
                                        Mesajınız <span className="text-[var(--brand-green-600)]">*</span>
                                    </label>
                                    <textarea
                                        required
                                        placeholder="Bizə nə demək istəyirsiniz? Mümkün qədər ətraflı yazın."
                                        rows={4}
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        className="w-full px-4 py-3 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl text-[14.5px] text-[var(--ink-900)] focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors resize-y placeholder:text-[var(--ink-400)]"
                                    />
                                </div>

                                <p className="text-[12.5px] text-[var(--ink-500)] mb-5">
                                    Forma göndərməklə{' '}
                                    <a href="#" className="text-[var(--primary)] font-semibold">məxfilik siyasətini</a>{' '}
                                    qəbul etmiş olursunuz.
                                </p>

                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full h-14 inline-flex items-center justify-center gap-2 rounded-full font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-60 shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                                >
                                    {sending ? 'Göndərilir...' : <>Mesajı göndər <HiOutlineArrowRight className="w-4 h-4" /></>}
                                </button>
                                <p className="mt-3 text-center text-[12px] text-[var(--ink-500)]">
                                    Adətən 2 saat ərzində cavab veririk · İş saatları 9:00–18:00
                                </p>
                            </form>
                        ) : (
                            <div className="text-center py-10">
                                <div className="w-[72px] h-[72px] mx-auto mb-5 rounded-full bg-[var(--accent-soft)] text-[var(--brand-green-600)] flex items-center justify-center">
                                    <HiOutlineCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-[20px] font-bold text-[var(--ink-900)] mb-2">Mesajınız göndərildi!</h3>
                                <p className="text-[var(--ink-500)] text-[15px] mb-7">
                                    <span className="text-[var(--ink-800)] font-semibold">{form.email || 'Sizin email'}</span>-ə qəbz göndərdik. Komandamız 2 saat ərzində sizinlə əlaqə saxlayacaq.
                                </p>
                                <button
                                    onClick={() => {
                                        setSubmitted(false);
                                        setForm({ name: '', email: '', phone: '', org: '', topic: 'sales', subject: '', message: '' });
                                    }}
                                    className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full font-semibold text-[var(--ink-800)] bg-white border border-[var(--ink-200)] hover:bg-[var(--ink-100)] hover:border-[var(--ink-300)] transition-all"
                                >
                                    Yeni mesaj göndər
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

const Field = ({ type = 'text', label, required, placeholder, value, onChange }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-[var(--ink-700)]">{label}</label>
        <input
            type={type}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-[46px] px-4 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl text-[14.5px] text-[var(--ink-900)] focus:outline-none focus:border-[var(--primary)] focus:bg-white focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors placeholder:text-[var(--ink-400)]"
        />
    </div>
);

const WhatsAppIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.6 6.32A8.92 8.92 0 0 0 11.18 4 8.94 8.94 0 0 0 3.42 17.4L2 22l4.74-1.24a8.94 8.94 0 0 0 4.44 1.13c4.93 0 8.94-4 8.94-8.94a8.83 8.83 0 0 0-2.52-6.63zm-6.42 13.75a7.42 7.42 0 0 1-3.79-1.03l-.27-.16-2.81.74.75-2.74-.18-.28a7.42 7.42 0 0 1-1.14-3.95 7.43 7.43 0 0 1 12.7-5.27 7.36 7.36 0 0 1 2.19 5.26 7.44 7.44 0 0 1-7.45 7.43z" />
    </svg>
);

// ───────────────────────────────────────────────────────────────────────────
// Support channels
// ───────────────────────────────────────────────────────────────────────────

const SupportChannels = () => {
    // Knowledge base + community group cards are temporarily hidden — they don't
    // exist yet. Only the YouTube tutorials card stays, linking to the channel.
    const cards = [
        { Icon: HiOutlinePlay, title: 'Video təlimlər', desc: 'İlk imtahanı yaratmaqdan sertifikat şablonuna qədər — 5-10 dəqiqəlik video təlimlər.', cta: 'YouTube kanalına keç', href: 'https://www.youtube.com/@testupaz', green: true },
    ];
    return (
        <section className="py-20 md:py-24 bg-[var(--ink-50)]">
            <div className="container-main">
                <SectionHead
                    eyebrow="Sürətli kömək"
                    title="Sual göndərməyə ehtiyac olmaya bilər"
                    sub="Çox vaxt cavab artıq aşağıdakı resurslardan birindədir."
                />
                <div className="grid md:grid-cols-1 gap-5 max-w-md mx-auto">
                    {cards.map((c, i) => (
                        <div
                            key={i}
                            className="bg-white border border-[var(--ink-200)] rounded-2xl p-7 text-center hover:-translate-y-1 hover:shadow-[var(--sh-md)] hover:border-[var(--primary)] transition-all"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto ${
                                c.green ? 'bg-[var(--accent-soft)] text-[var(--brand-green-600)]' : 'bg-[var(--primary-soft)] text-[var(--primary)]'
                            }`}>
                                <c.Icon className="w-6 h-6" />
                            </div>
                            <h4 className="text-[17px] font-bold text-[var(--ink-900)] mb-2">{c.title}</h4>
                            <p className="text-[14px] text-[var(--ink-500)] leading-relaxed mb-4">{c.desc}</p>
                            <a
                                href={c.href || '#'}
                                target={c.href ? '_blank' : undefined}
                                rel={c.href ? 'noopener noreferrer' : undefined}
                                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--primary)] hover:gap-2 transition-all"
                            >
                                {c.cta} <HiOutlineArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// FAQ
// ───────────────────────────────────────────────────────────────────────────

const ContactFAQ = () => {
    const items = [
        { q: 'Cavabı nə qədər müddətə alaram?',                   a: 'İş günləri ərzində ortalama 2 saat. Həftəsonu və bayramlarda növbəti iş günündə cavab veririk. Texniki problemlər üçün Peşəkar plan istifadəçiləri prioritet sırada yer alır.' },
        { q: 'Demo görüş təyin edə bilərəmmi?',                   a: 'Bəli. Mərkəz planı və 50+ müəllimi olan təşkilatlar üçün şəxsi demo görüş təyin edirik. Forma vasitəsilə müraciət edin, biz vaxt təklif edək.' },
        { q: 'Texniki problem ilə üzləşmişəm — nə etməliyəm?',    a: 'destek@testup.az ünvanına yazın və ya istifadəçi panelinizdən "Dəstək" düyməsini sıxın. Mümkünsə ekran şəkili əlavə edin — bu prosesi xeyli sürətləndirir.' },
        { q: 'Mətbuatla əlaqə saxlamaq istəyirəm.',                a: 'Mətbuat materialları və müsahibə müraciətləri üçün press@testup.az ünvanına yazın. Loqo və əsas məlumat paketini istənildikdə göndəririk.' },
    ];
    const [open, setOpen] = useState(-1);
    return (
        <section className="py-20 md:py-24">
            <div className="container-main max-w-3xl">
                <div className="text-center max-w-[720px] mx-auto mb-12">
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">FAQ</span>
                    <h2 className="mt-3 text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)]">
                        Əlaqə ilə bağlı suallar
                    </h2>
                </div>
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

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Contact = () => {
    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>Əlaqə — testup.az</title>
                <meta name="description" content="testup.az ilə əlaqə saxlayın. Texniki dəstək, satış, tərəfdaşlıq və mətbuat üçün bizimlə əlaqə kanalları." />
                <link rel="canonical" href="https://testup.az/elaqe" />
            </Helmet>

            <ContactHero />
            <ContactBody />
            <SupportChannels />
            <ContactFAQ />
        </div>
    );
};

export default Contact;
