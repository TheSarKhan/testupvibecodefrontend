import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
        <div className="text-sm text-gray-600 leading-relaxed space-y-3">{children}</div>
    </div>
);

const TermsOfService = () => (
    <>
        <Helmet>
            <title>İstifadə Şərtləri | testup.az</title>
            <meta name="description" content="testup.az platformasının istifadə şərtləri" />
        </Helmet>

        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                        İstifadə Şərtləri
                    </h1>
                    <p className="text-sm text-gray-500">
                        Son yenilənmə: 25 mart 2026 &middot; <Link to="/gizlilik-siyaseti" className="text-indigo-600 hover:text-indigo-700 font-medium">Gizlilik Siyasəti</Link>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">

                    <Section title="1. Ümumi Müddəalar">
                        <p>
                            Bu İstifadə Şərtləri (bundan sonra "Şərtlər") <strong>testup.az</strong> platforması (bundan sonra "Platforma") və onun
                            sahibi <strong>TestUp MMC</strong> (bundan sonra "Şirkət") ilə istifadəçi arasındakı münasibətləri tənzimləyir.
                        </p>
                        <p>
                            Platformaya qeydiyyatdan keçməklə və ya istifadə etməklə siz bu Şərtləri tam oxuduğunuzu, başa düşdüyünüzü
                            və qəbul etdiyinizi təsdiq edirsiniz. Şərtlərlə razılaşmırsınızsa, Platformadan istifadə etməyin.
                        </p>
                    </Section>

                    <Section title="2. Platformanın Təyinatı">
                        <p>
                            testup.az müəllimlərin onlayn imtahan hazırlamasına, şagirdlərin imtahanlarda iştirak etməsinə, nəticələrin avtomatik
                            qiymətləndirilməsinə və statistik analizlər aparılmasına imkan verən SaaS (Software as a Service) tipli təhsil platformasıdır.
                        </p>
                        <p>
                            Platforma həmçinin süni intellekt (AI) vasitəsilə sual yaratma, sual bazası idarəetməsi, birgə imtahan hazırlığı və
                            PDF-dən sual idxalı kimi əlavə funksiyalar təqdim edir.
                        </p>
                    </Section>

                    <Section title="3. Qeydiyyat və Hesab">
                        <p>
                            Platformadan istifadə etmək üçün qeydiyyatdan keçmək tələb olunur. Qeydiyyat zamanı təqdim etdiyiniz məlumatlar
                            doğru, tam və aktual olmalıdır. Yanlış məlumat təqdim etmək hesabınızın bağlanmasına səbəb ola bilər.
                        </p>
                        <p>
                            Hesabınızın təhlükəsizliyi, o cümlədən şifrənizin məxfiliyi sizin məsuliyyətinizdədir. Hesabınız üzərindən həyata
                            keçirilən bütün əməliyyatlara görə siz məsuliyyət daşıyırsınız.
                        </p>
                        <p>
                            Şirkət istənilən vaxt, əvvəlcədən xəbərdarlıq etmədən, bu Şərtləri pozan hesabları dayandırmaq və ya silmək hüququnu
                            özündə saxlayır.
                        </p>
                    </Section>

                    <Section title="4. Abunəlik Planları və Ödənişlər">
                        <p>
                            Platforma həm pulsuz, həm də pullu abunəlik planları təklif edir. Hər planın imkanları, limitləri və qiyməti
                            Platformanın <Link to="/planlar" className="text-indigo-600 hover:text-indigo-700 font-medium">Qiymətlər</Link> səhifəsində göstərilir.
                        </p>
                        <p>
                            Aylıq istifadə limitləri (imtahan yaratma sayı, AI sual yaratma sayı və s.) hər təqvim ayının 1-i saat 00:00-da
                            avtomatik olaraq sıfırlanır. Ümumi limitlər (saxlanılan imtahan sayı, bir imtahanda maksimum sual sayı və s.)
                            aylıq sıfırlanmır.
                        </p>
                        <p>
                            <strong>Ödənişlər geri qaytarılmır.</strong> Ödəniş etməklə siz seçilmiş plan müddəti üçün xidmət aldığınızı
                            və pulun geri qaytarılmayacağını qəbul edirsiniz. Abunəlik müddəti bitdikdən sonra avtomatik yenilənmə
                            həyata keçirilmir.
                        </p>
                        <p>
                            Şirkət qiymətləri və plan imkanlarını dəyişdirmək hüququnu özündə saxlayır. Dəyişikliklər mövcud
                            aktiv abunəliklərə tətbiq edilmir, yalnız yeni alışlara şamil olunur.
                        </p>
                    </Section>

                    <Section title="5. İstifadəçi Davranış Qaydaları">
                        <p>Platformadan istifadə edərkən aşağıdakılar qadağandır:</p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li>Qanunvericiliyə zidd, təhqiramiz, ayrı-seçkilik edən və ya üçüncü şəxslərin hüquqlarını pozan məzmun yerləşdirmək</li>
                            <li>Platformanın texniki infrastrukturuna müdaxilə etmək, hücum etmək və ya zəifliklərdən sui-istifadə etmək</li>
                            <li>Digər istifadəçilərin məlumatlarını icazəsiz toplamaq və ya paylaşmaq</li>
                            <li>Bot, skript və ya avtomatlaşdırılmış vasitələrlə Platformadan sui-istifadə etmək</li>
                            <li>Saxta və ya yanıldıcı hesablar yaratmaq</li>
                            <li>AI funksiyalarından imtahan kənarında kommersiya məqsədilə kütləvi sual istehsalı üçün istifadə etmək</li>
                        </ul>
                        <p>
                            Bu qaydalara əməl etməmək hesabınızın dərhal bağlanmasına və lazım olduqda hüquqi addımlar atılmasına səbəb ola bilər.
                        </p>
                    </Section>

                    <Section title="6. Əqli Mülkiyyət">
                        <p>
                            Platformanın dizaynı, kodu, loqosu, interfeysi və bütün texniki infrastrukturu Şirkətin əqli mülkiyyətidir
                            və müəlliflik hüquqları ilə qorunur.
                        </p>
                        <p>
                            İstifadəçilər tərəfindən yaradılan məzmun (imtahanlar, suallar, şəkillər) həmin istifadəçilərin mülkiyyətidir.
                            Lakin Platformaya yükləməklə siz Şirkətə bu məzmunu platformanın funksionallığını təmin etmək üçün saxlamaq,
                            emal etmək və göstərmək üçün qeyri-eksklüziv, geri alınmaz lisenziya verirsiniz.
                        </p>
                        <p>
                            AI vasitəsilə yaradılmış suallar üzərində müəlliflik hüququ iddiası irəli sürülə bilməz. Bu suallar
                            yalnız Platforma daxilində istifadə üçün nəzərdə tutulub.
                        </p>
                    </Section>

                    <Section title="7. AI Xidmətləri">
                        <p>
                            Platforma üçüncü tərəf AI modelləri vasitəsilə sual yaratma xidməti təklif edir. Bu sualların keyfiyyəti,
                            dəqiqliyi və uyğunluğu üçün Şirkət zəmanət vermir.
                        </p>
                        <p>
                            AI tərəfindən yaradılmış sualları istifadə etməzdən əvvəl yoxlamaq müəllimin məsuliyyətindədir.
                            AI xidmətlərinin mövcudluğu və keyfiyyəti üçüncü tərəf provayderlərdən asılıdır və Şirkət
                            bu xidmətlərin fasiləsiz işləməsinə zəmanət vermir.
                        </p>
                    </Section>

                    <Section title="8. Xidmətin Mövcudluğu və Dəyişdirilməsi">
                        <p>
                            Şirkət Platformanın fasiləsiz, xətasız və ya 24/7 əlçatan olmasına zəmanət vermir. Texniki qulluq,
                            yeniləmə və ya fors-major hallarında xidmətdə fasilələr yarana bilər.
                        </p>
                        <p>
                            Şirkət istənilən vaxt Platformanın funksiyalarını, dizaynını, planlarını və xidmət şərtlərini
                            dəyişdirmək, yeni funksiyalar əlavə etmək və ya mövcud funksiyaları ləğv etmək hüququnu özündə saxlayır.
                        </p>
                    </Section>

                    <Section title="9. Məsuliyyətin Məhdudlaşdırılması">
                        <p>
                            Platforma "olduğu kimi" (as is) təqdim olunur. Şirkət aşağıdakılara görə <strong>heç bir halda
                            məsuliyyət daşımır:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1.5 pl-1">
                            <li>İstifadəçi tərəfindən yaradılmış məzmunun düzgünlüyü, qanuniliyi və ya uyğunluğu</li>
                            <li>AI tərəfindən yaradılmış sualların dəqiqliyi və ya akademik uyğunluğu</li>
                            <li>Texniki nasazlıq, server xətası və ya məlumat itkisi nəticəsində yaranan zərər</li>
                            <li>İstifadəçinin hesab məlumatlarının üçüncü şəxslər tərəfindən ələ keçirilməsi</li>
                            <li>Üçüncü tərəf xidmətlərinin (ödəniş sistemi, AI provayderi, hosting) yaratdığı problemlər</li>
                            <li>İmtahan nəticələrinin real akademik qiymətləndirməyə təsiri</li>
                            <li>Platformadan düzgün istifadə edilməməsi nəticəsində yaranan istənilən birbaşa və ya dolayı zərər</li>
                        </ul>
                        <p>
                            Şirkətin bu Şərtlər çərçivəsindəki maksimal məsuliyyəti, istənilən halda, istifadəçinin son 12 ay
                            ərzində Platformaya ödədiyi ümumi məbləği aşa bilməz.
                        </p>
                    </Section>

                    <Section title="10. Hesabın Ləğvi">
                        <p>
                            İstifadəçi istənilən vaxt hesabını silmək üçün <strong>info@testup.az</strong> ünvanına müraciət edə bilər.
                            Hesab silindikdən sonra bütün məlumatlar (imtahanlar, suallar, nəticələr) geri qaytarılmaz şəkildə silinir.
                        </p>
                        <p>
                            Aktiv abunəlik müddəti ərzində hesab silinərsə, ödəniş geri qaytarılmır.
                        </p>
                    </Section>

                    <Section title="11. Şərtlərin Dəyişdirilməsi">
                        <p>
                            Şirkət bu Şərtləri istənilən vaxt dəyişdirmək hüququnu özündə saxlayır. Əhəmiyyətli dəyişikliklər
                            barədə istifadəçilər Platforma daxilindəki bildiriş vasitəsilə xəbərdar ediləcək.
                        </p>
                        <p>
                            Dəyişikliklərdən sonra Platformadan istifadəyə davam etmək yenilənmiş Şərtləri qəbul etmək anlamına gəlir.
                        </p>
                    </Section>

                    <Section title="12. Tətbiq Olunan Qanunvericilik">
                        <p>
                            Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq tənzimlənir və şərh edilir.
                            Mübahisələr ilk növbədə danışıqlar yolu ilə, mümkün olmadıqda isə Azərbaycan Respublikasının
                            səlahiyyətli məhkəmələri tərəfindən həll edilir.
                        </p>
                    </Section>

                    <Section title="13. Əlaqə">
                        <p>
                            Bu Şərtlərlə bağlı suallarınız varsa, bizimlə əlaqə saxlayın:
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

export default TermsOfService;
