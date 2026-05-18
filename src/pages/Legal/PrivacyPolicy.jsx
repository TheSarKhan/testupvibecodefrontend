import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
    HiOutlineCalendar, HiOutlineDocumentText, HiOutlineGlobeAlt,
    HiOutlineDownload, HiOutlineCheckCircle, HiOutlineShieldCheck,
} from 'react-icons/hi';

// ───────────────────────────────────────────────────────────────────────────
// Shared section primitives (used by both PrivacyPolicy and TermsOfService)
// ───────────────────────────────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');

const Section = ({ id, num, title, children }) => (
    <section id={id} className="scroll-mt-28 mb-10">
        <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center justify-center w-9 h-7 rounded-md bg-[var(--primary-soft)] text-[var(--primary-hover)] text-[11px] font-extrabold font-mono tracking-wider">
                {pad2(num)}
            </span>
            <h2 className="text-[22px] md:text-[24px] font-extrabold text-[var(--ink-900)] tracking-tight">{title}</h2>
        </div>
        <div className="h-px bg-[var(--ink-150)] mb-4" />
        <div className="text-[14.5px] text-[var(--ink-700)] leading-[1.75] space-y-4">{children}</div>
    </section>
);

const Bullet = ({ children }) => (
    <li className="flex items-start gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-2.5 shrink-0" />
        <span>{children}</span>
    </li>
);

const Note = ({ children }) => (
    <div className="flex items-start gap-2.5 bg-[var(--brand-green-50)] border border-[var(--brand-green-200)] rounded-2xl px-4 py-3">
        <HiOutlineCheckCircle className="w-5 h-5 text-[var(--brand-green-600)] mt-0.5 shrink-0" />
        <p className="text-[13.5px] text-[var(--ink-700)] leading-relaxed">{children}</p>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Legal shell (header + sticky TOC + content)
// ───────────────────────────────────────────────────────────────────────────

const LegalShell = ({ kind, breadcrumb, title, subtitle, meta, toc, activeId, setActiveId, children }) => (
    <div className="min-h-screen" style={{ background: 'var(--paper-cream)' }}>
        {/* Header with subtle grid bg */}
        <header
            className="relative border-b border-[var(--ink-150)] overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, #F2F6FF 0%, #FAFBFE 100%)',
            }}
        >
            <div
                className="absolute inset-0 opacity-[0.35] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.06) 1px, transparent 1px)',
                    backgroundSize: '52px 52px',
                }}
            />
            <div className="relative container-main max-w-6xl py-10 sm:py-14">
                {/* Breadcrumb */}
                <nav className="text-[12.5px] text-[var(--ink-500)] mb-4 flex items-center gap-1.5 font-medium">
                    <Link to="/" className="hover:text-[var(--primary)] transition-colors">Ana Səhifə</Link>
                    <span className="text-[var(--ink-300)]">/</span>
                    <span className="text-[var(--ink-800)] font-semibold">{breadcrumb}</span>
                </nav>

                <h1 className="text-[34px] sm:text-[44px] md:text-[52px] font-extrabold text-[var(--ink-900)] tracking-tight leading-[1.05] mb-4">
                    {title}
                </h1>
                <p className="text-[14.5px] text-[var(--ink-600)] leading-relaxed max-w-2xl">
                    {subtitle}
                </p>

                {/* Meta chips */}
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 bg-white border border-[var(--ink-200)] rounded-full pl-3 pr-1 py-1">
                        <HiOutlineCalendar className="w-3.5 h-3.5 text-[var(--ink-500)]" />
                        <span className="text-[11.5px] text-[var(--ink-500)] font-medium">Son yenilənmə:</span>
                        <span className="text-[12px] font-bold text-[var(--ink-900)] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-2.5 py-0.5">
                            {meta.updated}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white border border-[var(--ink-200)] rounded-full pl-3 pr-1 py-1">
                        <HiOutlineDocumentText className="w-3.5 h-3.5 text-[var(--ink-500)]" />
                        <span className="text-[11.5px] text-[var(--ink-500)] font-medium">Versiya:</span>
                        <span className="text-[12px] font-bold text-[var(--ink-900)] bg-[var(--paper-cream)] border border-[var(--ink-150)] rounded-full px-2.5 py-0.5">
                            {meta.version}
                        </span>
                    </span>
                    <span className="inline-flex items-center gap-2 bg-white border border-[var(--ink-200)] rounded-full pl-3 pr-3 py-1">
                        <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-[var(--ink-500)]" />
                        <span className="text-[12px] font-bold text-[var(--ink-800)]">Azərbaycan</span>
                        <span className="text-[10.5px] text-[var(--ink-400)] font-mono">(AZ)</span>
                    </span>
                    <a
                        href={meta.pdfHref || '#'}
                        className="inline-flex items-center gap-1.5 bg-white border border-[var(--brand-blue-200)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] text-[var(--primary-hover)] rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors"
                    >
                        <HiOutlineDownload className="w-3.5 h-3.5" />
                        PDF yüklə
                    </a>
                </div>
            </div>
        </header>

        {/* Body */}
        <div className="container-main max-w-6xl py-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
            {/* Sidebar TOC */}
            <aside className="lg:sticky lg:top-6 self-start">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)] mb-3 px-2">
                    Mündəricat
                </div>
                <nav className="space-y-0.5">
                    {toc.map((t, i) => (
                        <a
                            key={t.id}
                            href={`#${t.id}`}
                            onClick={() => setActiveId(t.id)}
                            className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-colors ${
                                activeId === t.id
                                    ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)] border-l-2 border-[var(--primary)] font-bold'
                                    : 'text-[var(--ink-600)] hover:bg-white border-l-2 border-transparent'
                            }`}
                        >
                            <span className={`font-mono text-[10.5px] font-bold ${activeId === t.id ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`}>
                                {pad2(i + 1)}
                            </span>
                            <span className="truncate">{t.title}</span>
                        </a>
                    ))}
                </nav>

                {/* Doc switcher */}
                <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-white border border-[var(--ink-200)]">
                    <Link
                        to="/gizlilik-siyaseti"
                        className={`flex items-center gap-1.5 justify-center px-2 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                            kind === 'privacy'
                                ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)]'
                                : 'text-[var(--ink-500)] hover:bg-[var(--ink-100)]'
                        }`}
                    >
                        <span className={`font-mono text-[10px] ${kind === 'privacy' ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`}>
                            {pad2(toc.length + 1)}
                        </span>
                        Məxfilik
                    </Link>
                    <Link
                        to="/istifade-sertleri"
                        className={`flex items-center gap-1.5 justify-center px-2 py-2 rounded-xl text-[12px] font-bold transition-colors ${
                            kind === 'terms'
                                ? 'bg-[var(--primary-soft)] text-[var(--primary-hover)]'
                                : 'text-[var(--ink-500)] hover:bg-[var(--ink-100)]'
                        }`}
                    >
                        <span className={`font-mono text-[10px] ${kind === 'terms' ? 'text-[var(--primary)]' : 'text-[var(--ink-400)]'}`}>
                            {pad2(toc.length + 2)}
                        </span>
                        Şərtlər
                    </Link>
                </div>
            </aside>

            {/* Content */}
            <main>
                {children}
                <p className="mt-12 pt-6 border-t border-[var(--ink-150)] text-center text-[12px] text-[var(--ink-400)]">
                    © 2026 TestUp MMC — Bütün hüquqlar qorunur
                </p>
            </main>
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// IntersectionObserver hook to track active section
// ───────────────────────────────────────────────────────────────────────────

const useActiveSection = (ids) => {
    const [active, setActive] = useState(ids[0]);
    const stateRef = useRef(active);
    useEffect(() => { stateRef.current = active; }, [active]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: '-25% 0px -60% 0px', threshold: 0 }
        );
        ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [ids.join('|')]);

    return [active, setActive];
};

// ───────────────────────────────────────────────────────────────────────────
// PrivacyPolicy
// ───────────────────────────────────────────────────────────────────────────

const SECTIONS = [
    { id: 'giris',           title: 'Giriş' },
    { id: 'toplanan',        title: 'Toplanan Məlumatlar' },
    { id: 'meqsed',          title: 'Məlumatların İstifadə Məqsədi' },
    { id: 'saxlanma',        title: 'Məlumatların Saxlanması' },
    { id: 'paylasilma',      title: 'Məlumatların Paylaşılması' },
    { id: 'cookie',          title: 'Cookie (Çərəzlər)' },
    { id: 'huquqlar',        title: 'İstifadəçi Hüquqları' },
    { id: 'usaqlar',         title: 'Uşaqların Məxfiliyi' },
    { id: 'tehlukesizlik',   title: 'Təhlükəsizlik Tədbirləri' },
    { id: 'deyisiklikler',   title: 'Dəyişikliklər' },
    { id: 'elaqe',           title: 'Əlaqə' },
];

const PrivacyPolicy = () => {
    const [activeId, setActiveId] = useActiveSection(SECTIONS.map(s => s.id));

    return (
        <>
            <Helmet>
                <title>Gizlilik Siyasəti | testup.az</title>
                <meta name="description" content="testup.az platformasının gizlilik siyasəti və məlumatların qorunması" />
            </Helmet>

            <LegalShell
                kind="privacy"
                breadcrumb="Gizlilik Siyasəti"
                title="Gizlilik Siyasəti"
                subtitle="testup.az platformasından istifadə etməklə şəxsi məlumatlarınızın necə toplandığını, saxlandığını və qorunduğunu bilirsiniz."
                meta={{ updated: '25.03.2026', version: '3.0' }}
                toc={SECTIONS}
                activeId={activeId}
                setActiveId={setActiveId}
            >
                <Section id="giris" num={1} title="Giriş">
                    <p>
                        Bu Gizlilik Siyasəti <strong className="text-[var(--ink-900)]">TestUp MMC</strong> (bundan sonra "Şirkət") tərəfindən idarə olunan
                        <strong className="text-[var(--ink-900)]"> testup.az</strong> platforması (bundan sonra "Platforma") vasitəsilə toplanan, saxlanan və emal
                        edilən şəxsi məlumatların necə idarə olunduğunu izah edir.
                    </p>
                    <p>
                        Platformadan istifadə etməklə siz bu Gizlilik Siyasətini oxuduğunuzu, başa düşdüyünüzü və
                        şəxsi məlumatlarınızın burada təsvir edilən qaydada emal olunmasına razılıq verdiyinizi təsdiq edirsiniz.
                    </p>
                    <Note>
                        <strong className="text-[var(--brand-green-700)]">Önəmli:</strong> Bu sənədi qəbul etməklə Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununa uyğun şərtləri tanıdığınızı təsdiq edirsiniz.
                    </Note>
                </Section>

                <Section id="toplanan" num={2} title="Toplanan Məlumatlar">
                    <p>Platforma aşağıdakı məlumat kateqoriyalarını toplayır:</p>

                    <p><strong className="text-[var(--ink-900)]">2.1. Qeydiyyat zamanı təqdim edilən məlumatlar:</strong></p>
                    <ul className="space-y-2">
                        <Bullet>Ad, soyad</Bullet>
                        <Bullet>E-poçt ünvanı</Bullet>
                        <Bullet>Telefon nömrəsi (əgər daxil edilibsə)</Bullet>
                        <Bullet>Şifrə (şifrələnmiş formada saxlanılır)</Bullet>
                        <Bullet>Rol seçimi (müəllim/şagird)</Bullet>
                    </ul>

                    <p><strong className="text-[var(--ink-900)]">2.2. Google hesabı ilə qeydiyyat:</strong></p>
                    <ul className="space-y-2">
                        <Bullet>Google hesabında qeyd olunan ad və e-poçt ünvanı</Bullet>
                        <Bullet>Google profil şəkli</Bullet>
                    </ul>
                    <p>
                        Google şifrəniz heç bir halda Platforma tərəfindən saxlanılmır və ya əldə edilmir.
                    </p>

                    <p><strong className="text-[var(--ink-900)]">2.3. İstifadə zamanı yaranan məlumatlar:</strong></p>
                    <ul className="space-y-2">
                        <Bullet>Yaradılan imtahanlar, suallar və cavab variantları</Bullet>
                        <Bullet>İmtahan nəticələri və statistika</Bullet>
                        <Bullet>Yüklənən şəkillər, PDF və audio fayllar</Bullet>
                        <Bullet>Abunəlik və ödəniş tarixçəsi</Bullet>
                        <Bullet>AI ilə yaradılmış suallar və istifadə statistikası</Bullet>
                    </ul>

                    <p><strong className="text-[var(--ink-900)]">2.4. Avtomatik toplanan texniki məlumatlar:</strong></p>
                    <ul className="space-y-2">
                        <Bullet>IP ünvanı</Bullet>
                        <Bullet>Brauzer növü və versiyası</Bullet>
                        <Bullet>Giriş/çıxış vaxtları</Bullet>
                    </ul>
                </Section>

                <Section id="meqsed" num={3} title="Məlumatların İstifadə Məqsədi">
                    <p>Toplanan məlumatlar aşağıdakı məqsədlərlə istifadə olunur:</p>
                    <ul className="space-y-2">
                        <Bullet>Hesabınızın yaradılması, idarə edilməsi və autentifikasiyası</Bullet>
                        <Bullet>Platformanın əsas funksiyalarının (imtahan yaratma, nəticə hesablama, statistika) təmin edilməsi</Bullet>
                        <Bullet>Abunəlik planı limitlərinin izlənməsi və tətbiqi</Bullet>
                        <Bullet>Ödəniş əməliyyatlarının emalı (üçüncü tərəf ödəniş sistemi vasitəsilə)</Bullet>
                        <Bullet>Xidmətin keyfiyyətinin artırılması və texniki problemlərin aradan qaldırılması</Bullet>
                        <Bullet>Qanunvericiliyin tələblərinə əməl edilməsi</Bullet>
                    </ul>
                    <p>
                        Şirkət şəxsi məlumatlarınızı reklam, profillənmə və ya marketinq məqsədilə <strong className="text-[var(--ink-900)]">istifadə etmir</strong>.
                    </p>
                </Section>

                <Section id="saxlanma" num={4} title="Məlumatların Saxlanması">
                    <p>
                        Bütün məlumatlar <strong className="text-[var(--ink-900)]">Azərbaycan Respublikası ərazisində</strong> yerləşən serverlərdə saxlanılır.
                    </p>
                    <p>
                        Şifrələr BCrypt alqoritmi ilə bir tərəfli şifrələnir (hash) və orijinal formada heç vaxt saxlanılmır.
                        Şirkət əməkdaşları da daxil olmaqla heç kim şifrənizi görə bilməz.
                    </p>
                    <p>
                        Məlumatlar hesab aktiv olduğu müddətdə saxlanılır. Hesab silindikdə bütün şəxsi məlumatlar
                        və istifadəçiyə aid kontent (imtahanlar, suallar, nəticələr) geri qaytarılmaz şəkildə silinir.
                    </p>
                    <p>
                        Aylıq istifadə statistikası (imtahan yaratma sayı, AI sual sayı) 3 ay müddətinə saxlanılır,
                        sonra avtomatik silinir.
                    </p>
                </Section>

                <Section id="paylasilma" num={5} title="Məlumatların Paylaşılması">
                    <p>
                        Şirkət şəxsi məlumatlarınızı <strong className="text-[var(--ink-900)]">üçüncü şəxslərə satmır, icarəyə vermir və ya
                        kommersiya məqsədilə paylaşmır.</strong>
                    </p>
                    <p>Məlumatlar yalnız aşağıdakı hallarda paylaşıla bilər:</p>
                    <ul className="space-y-2">
                        <Bullet>
                            <strong className="text-[var(--ink-900)]">Ödəniş emalı:</strong> Ödəniş zamanı kart məlumatlarınız birbaşa ödəniş provayderi
                            (Kapital Bank) tərəfindən emal olunur. Şirkət kart nömrənizi heç vaxt görmür və ya saxlamır.
                        </Bullet>
                        <Bullet>
                            <strong className="text-[var(--ink-900)]">AI xidməti:</strong> AI sual yaratma funksiyası üçün fənn, mövzu və çətinlik məlumatları
                            üçüncü tərəf AI provayderinə göndərilir. Şəxsi məlumatlarınız (ad, e-poçt və s.) AI provayderinə
                            <strong className="text-[var(--ink-900)]"> ötürülmür</strong>.
                        </Bullet>
                        <Bullet>
                            <strong className="text-[var(--ink-900)]">Qanuni tələblər:</strong> Azərbaycan Respublikasının qanunvericiliyinin tələb etdiyi hallarda
                            səlahiyyətli dövlət orqanlarına.
                        </Bullet>
                    </ul>
                </Section>

                <Section id="cookie" num={6} title="Cookie (Çərəzlər)">
                    <p>
                        Platforma yalnız <strong className="text-[var(--ink-900)]">texniki çərəzlərdən</strong> (session və autentifikasiya token-ləri) istifadə edir.
                        Bu çərəzlər Platformanın düzgün işləməsi üçün zəruridir.
                    </p>
                    <p>
                        Platforma reklam çərəzlərindən, izləmə pikselindən (tracking pixel), Google Analytics və ya
                        oxşar analitika/reklam alətlərindən <strong className="text-[var(--ink-900)]">istifadə etmir</strong>.
                    </p>
                </Section>

                <Section id="huquqlar" num={7} title="İstifadəçi Hüquqları">
                    <p>Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununa əsasən, siz aşağıdakı hüquqlara maliksiniz:</p>
                    <ul className="space-y-2">
                        <Bullet><strong className="text-[var(--ink-900)]">Əldə etmək:</strong> Haqqınızda toplanan məlumatlar barədə məlumat almaq</Bullet>
                        <Bullet><strong className="text-[var(--ink-900)]">Düzəltmək:</strong> Yanlış və ya natamam məlumatların düzəldilməsini tələb etmək</Bullet>
                        <Bullet><strong className="text-[var(--ink-900)]">Silmək:</strong> Şəxsi məlumatlarınızın silinməsini tələb etmək</Bullet>
                        <Bullet><strong className="text-[var(--ink-900)]">Etiraz etmək:</strong> Məlumatlarınızın müəyyən məqsədlərlə emalına etiraz etmək</Bullet>
                    </ul>
                    <p>
                        Bu hüquqlarınızdan istifadə etmək üçün <a href="mailto:info@testup.az" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">info@testup.az</a> ünvanına
                        müraciət edə bilərsiniz. Sorğulara 15 iş günü ərzində cavab verilir.
                    </p>
                </Section>

                <Section id="usaqlar" num={8} title="Uşaqların Məxfiliyi">
                    <p>
                        Platforma yaş məhdudiyyəti tətbiq etmir, lakin yetkinlik yaşına çatmamış şəxslərin
                        qeydiyyatı valideyn və ya qanuni nümayəndənin razılığı ilə həyata keçirilməlidir.
                    </p>
                    <p>
                        Yetkinlik yaşına çatmamış şəxslərin qanuni nümayəndəsi istənilən vaxt uşağın
                        məlumatlarının silinməsini tələb edə bilər.
                    </p>
                </Section>

                <Section id="tehlukesizlik" num={9} title="Təhlükəsizlik Tədbirləri">
                    <p>Şirkət şəxsi məlumatlarınızın qorunması üçün aşağıdakı texniki tədbirləri tətbiq edir:</p>
                    <ul className="space-y-2">
                        <Bullet>HTTPS/TLS şifrələməsi ilə məlumat ötürülməsi</Bullet>
                        <Bullet>Şifrələrin BCrypt ilə bir tərəfli hash edilməsi</Bullet>
                        <Bullet>JWT (JSON Web Token) əsaslı autentifikasiya</Bullet>
                        <Bullet>Serverlərə məhdud giriş və mütəmadi yeniləmələr</Bullet>
                    </ul>
                    <p>
                        Buna baxmayaraq, Şirkət internet üzərindən heç bir məlumat ötürülməsinin 100% təhlükəsiz olduğuna
                        zəmanət verə bilməz. Hesab təhlükəsizliyinizi qorumaq üçün güclü şifrə istifadə edin və
                        hesab məlumatlarınızı başqaları ilə paylaşmayın.
                    </p>
                </Section>

                <Section id="deyisiklikler" num={10} title="Dəyişikliklər">
                    <p>
                        Şirkət bu Gizlilik Siyasətini istənilən vaxt yeniləmək hüququnu özündə saxlayır.
                        Əhəmiyyətli dəyişikliklər barədə Platforma daxilindəki bildiriş vasitəsilə xəbərdar ediləcəksiniz.
                    </p>
                    <p>
                        Dəyişikliklərdən sonra Platformadan istifadəyə davam etmək yenilənmiş Gizlilik Siyasətini
                        qəbul etmək anlamına gəlir.
                    </p>
                </Section>

                <Section id="elaqe" num={11} title="Əlaqə">
                    <p>
                        Gizlilik Siyasəti ilə bağlı suallarınız və ya sorğularınız üçün:
                    </p>
                    <p>
                        <strong className="text-[var(--ink-900)]">TestUp MMC</strong><br />
                        E-poçt: <a href="mailto:info@testup.az" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">info@testup.az</a><br />
                        Veb: <a href="https://testup.az" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">testup.az</a>
                    </p>
                </Section>
            </LegalShell>
        </>
    );
};

export default PrivacyPolicy;
export { LegalShell, Section, Bullet, Note, useActiveSection, pad2 };
