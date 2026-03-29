import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </div>
);

const PrivacyPolicy = () => (
    <>
        <Helmet>
            <title>Gizlilik Siyasəti | testup.az</title>
            <meta name="description" content="testup.az platformasının gizlilik siyasəti və məlumatların qorunması" />
        </Helmet>

        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                        Gizlilik Siyasəti
                    </h1>
                    <p className="text-sm text-gray-500">
                        Son yenilənmə: 25 mart 2026 &middot; <Link to="/istifade-sertleri" className="text-indigo-600 hover:text-indigo-700 font-medium">İstifadə Şərtləri</Link>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">

                    <Section title="1. Giriş">
                        <p>
                            Bu Gizlilik Siyasəti <strong>TestUp MMC</strong> (bundan sonra "Şirkət") tərəfindən idarə olunan
                            <strong> testup.az</strong> platforması (bundan sonra "Platforma") vasitəsilə toplanan, saxlanan və emal
                            edilən şəxsi məlumatların necə idarə olunduğunu izah edir.
                        </p>
                        <p>
                            Platformadan istifadə etməklə siz bu Gizlilik Siyasətini oxuduğunuzu, başa düşdüyünüzü və
                            şəxsi məlumatlarınızın burada təsvir edilən qaydada emal olunmasına razılıq verdiyinizi təsdiq edirsiniz.
                        </p>
                    </Section>

                    <Section title="2. Toplanan Məlumatlar">
                        <p>Platforma aşağıdakı məlumat kateqoriyalarını toplayır:</p>

                        <p><strong>2.1. Qeydiyyat zamanı təqdim edilən məlumatlar:</strong></p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Ad, soyad</li>
                            <li>E-poçt ünvanı</li>
                            <li>Telefon nömrəsi (əgər daxil edilibsə)</li>
                            <li>Şifrə (şifrələnmiş formada saxlanılır)</li>
                            <li>Rol seçimi (müəllim/şagird)</li>
                        </ul>

                        <p><strong>2.2. Google hesabı ilə qeydiyyat:</strong></p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Google hesabında qeyd olunan ad və e-poçt ünvanı</li>
                            <li>Google profil şəkli</li>
                        </ul>
                        <p>
                            Google şifrəniz heç bir halda Platforma tərəfindən saxlanılmır və ya əldə edilmir.
                        </p>

                        <p><strong>2.3. İstifadə zamanı yaranan məlumatlar:</strong></p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>Yaradılan imtahanlar, suallar və cavab variantları</li>
                            <li>İmtahan nəticələri və statistika</li>
                            <li>Yüklənən şəkillər, PDF və audio fayllar</li>
                            <li>Abunəlik və ödəniş tarixçəsi</li>
                            <li>AI ilə yaradılmış suallar və istifadə statistikası</li>
                        </ul>

                        <p><strong>2.4. Avtomatik toplanan texniki məlumatlar:</strong></p>
                        <ul className="list-disc list-inside space-y-1 pl-1">
                            <li>IP ünvanı</li>
                            <li>Brauzer növü və versiyası</li>
                            <li>Giriş/çıxış vaxtları</li>
                        </ul>
                    </Section>

                    <Section title="3. Məlumatların İstifadə Məqsədi">
                        <p>Toplanan məlumatlar aşağıdakı məqsədlərlə istifadə olunur:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li>Hesabınızın yaradılması, idarə edilməsi və autentifikasiyası</li>
                            <li>Platformanın əsas funksiyalarının (imtahan yaratma, nəticə hesablama, statistika) təmin edilməsi</li>
                            <li>Abunəlik planı limitlərinin izlənməsi və tətbiqi</li>
                            <li>Ödəniş əməliyyatlarının emalı (üçüncü tərəf ödəniş sistemi vasitəsilə)</li>
                            <li>Xidmətin keyfiyyətinin artırılması və texniki problemlərin aradan qaldırılması</li>
                            <li>Qanunvericiliyin tələblərinə əməl edilməsi</li>
                        </ul>
                        <p>
                            Şirkət şəxsi məlumatlarınızı reklam, profillənmə və ya marketinq məqsədilə <strong>istifadə etmir</strong>.
                        </p>
                    </Section>

                    <Section title="4. Məlumatların Saxlanması">
                        <p>
                            Bütün məlumatlar <strong>Azərbaycan Respublikası ərazisində</strong> yerləşən serverlərdə saxlanılır.
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

                    <Section title="5. Məlumatların Paylaşılması">
                        <p>
                            Şirkət şəxsi məlumatlarınızı <strong>üçüncü şəxslərə satmır, icarəyə vermir və ya
                            kommersiya məqsədilə paylaşmır.</strong>
                        </p>
                        <p>Məlumatlar yalnız aşağıdakı hallarda paylaşıla bilər:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li>
                                <strong>Ödəniş emalı:</strong> Ödəniş zamanı kart məlumatlarınız birbaşa ödəniş provayderi
                                (Payriff/Kapital Bank) tərəfindən emal olunur. Şirkət kart nömrənizi heç vaxt görmür və ya saxlamır.
                            </li>
                            <li>
                                <strong>AI xidməti:</strong> AI sual yaratma funksiyası üçün fənn, mövzu və çətinlik məlumatları
                                üçüncü tərəf AI provayderinə göndərilir. Şəxsi məlumatlarınız (ad, e-poçt və s.) AI provayderinə
                                <strong> ötürülmür</strong>.
                            </li>
                            <li>
                                <strong>Qanuni tələblər:</strong> Azərbaycan Respublikasının qanunvericiliyinin tələb etdiyi hallarda
                                səlahiyyətli dövlət orqanlarına.
                            </li>
                        </ul>
                    </Section>

                    <Section title="6. Cookie (Çərəzlər)">
                        <p>
                            Platforma yalnız <strong>texniki çərəzlərdən</strong> (session və autentifikasiya token-ləri) istifadə edir.
                            Bu çərəzlər Platformanın düzgün işləməsi üçün zəruridir.
                        </p>
                        <p>
                            Platforma reklam çərəzlərindən, izləmə pikselindən (tracking pixel), Google Analytics və ya
                            oxşar analitika/reklam alətlərindən <strong>istifadə etmir</strong>.
                        </p>
                    </Section>

                    <Section title="7. İstifadəçi Hüquqları">
                        <p>Azərbaycan Respublikasının "Fərdi məlumatlar haqqında" Qanununa əsasən, siz aşağıdakı hüquqlara maliksiniz:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li><strong>Əldə etmək:</strong> Haqqınızda toplanan məlumatlar barədə məlumat almaq</li>
                            <li><strong>Düzəltmək:</strong> Yanlış və ya natamam məlumatların düzəldilməsini tələb etmək</li>
                            <li><strong>Silmək:</strong> Şəxsi məlumatlarınızın silinməsini tələb etmək</li>
                            <li><strong>Etiraz etmək:</strong> Məlumatlarınızın müəyyən məqsədlərlə emalına etiraz etmək</li>
                        </ul>
                        <p>
                            Bu hüquqlarınızdan istifadə etmək üçün <a href="mailto:info@testup.az" className="text-indigo-600 hover:text-indigo-700 font-medium">info@testup.az</a> ünvanına
                            müraciət edə bilərsiniz. Sorğulara 15 iş günü ərzində cavab verilir.
                        </p>
                    </Section>

                    <Section title="8. Uşaqların Məxfiliyi">
                        <p>
                            Platforma yaş məhdudiyyəti tətbiq etmir, lakin yetkinlik yaşına çatmamış şəxslərin
                            qeydiyyatı valideyn və ya qanuni nümayəndənin razılığı ilə həyata keçirilməlidir.
                        </p>
                        <p>
                            Yetkinlik yaşına çatmamış şəxslərin qanuni nümayəndəsi istənilən vaxt uşağın
                            məlumatlarının silinməsini tələb edə bilər.
                        </p>
                    </Section>

                    <Section title="9. Təhlükəsizlik Tədbirləri">
                        <p>Şirkət şəxsi məlumatlarınızın qorunması üçün aşağıdakı texniki tədbirləri tətbiq edir:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li>HTTPS/TLS şifrələməsi ilə məlumat ötürülməsi</li>
                            <li>Şifrələrin BCrypt ilə bir tərəfli hash edilməsi</li>
                            <li>JWT (JSON Web Token) əsaslı autentifikasiya</li>
                            <li>Serverlərə məhdud giriş və mütəmadi yeniləmələr</li>
                        </ul>
                        <p>
                            Buna baxmayaraq, Şirkət internet üzərindən heç bir məlumat ötürülməsinin 100% təhlükəsiz olduğuna
                            zəmanət verə bilməz. Hesab təhlükəsizliyinizi qorumaq üçün güclü şifrə istifadə edin və
                            hesab məlumatlarınızı başqaları ilə paylaşmayın.
                        </p>
                    </Section>

                    <Section title="10. Dəyişikliklər">
                        <p>
                            Şirkət bu Gizlilik Siyasətini istənilən vaxt yeniləmək hüququnu özündə saxlayır.
                            Əhəmiyyətli dəyişikliklər barədə Platforma daxilindəki bildiriş vasitəsilə xəbərdar ediləcəksiniz.
                        </p>
                        <p>
                            Dəyişikliklərdən sonra Platformadan istifadəyə davam etmək yenilənmiş Gizlilik Siyasətini
                            qəbul etmək anlamına gəlir.
                        </p>
                    </Section>

                    <Section title="11. Əlaqə">
                        <p>
                            Gizlilik Siyasəti ilə bağlı suallarınız və ya sorğularınız üçün:
                        </p>
                        <p>
                            <strong>TestUp MMC</strong><br />
                            E-poçt: <a href="mailto:info@testup.az" className="text-indigo-600 hover:text-indigo-700 font-medium">info@testup.az</a><br />
                            Veb: <a href="https://testup.az" className="text-indigo-600 hover:text-indigo-700 font-medium">testup.az</a>
                        </p>
                    </Section>

                </div>
            </div>
        </div>
    </>
);

export default PrivacyPolicy;
