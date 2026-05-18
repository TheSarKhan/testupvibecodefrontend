import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LegalShell, Section, Bullet, Note, useActiveSection } from './PrivacyPolicy';

const SECTIONS = [
    { id: 'umumi',          title: 'Ümumi Müddəalar' },
    { id: 'teyinati',       title: 'Platformanın Təyinatı' },
    { id: 'qeydiyyat',      title: 'Qeydiyyat və Hesab' },
    { id: 'abuneliq',       title: 'Abunəlik Planları və Ödənişlər' },
    { id: 'davranis',       title: 'İstifadəçi Davranış Qaydaları' },
    { id: 'mulkiyyet',      title: 'Əqli Mülkiyyət' },
    { id: 'ai',             title: 'AI Xidmətləri' },
    { id: 'movcudluq',      title: 'Xidmətin Mövcudluğu və Dəyişdirilməsi' },
    { id: 'mesuliyyet',     title: 'Məsuliyyətin Məhdudlaşdırılması' },
    { id: 'legv',           title: 'Hesabın Ləğvi' },
    { id: 'sertler-deyis',  title: 'Şərtlərin Dəyişdirilməsi' },
    { id: 'qanunvericilik', title: 'Tətbiq Olunan Qanunvericilik' },
    { id: 'elaqe',          title: 'Əlaqə' },
];

const TermsOfService = () => {
    const [activeId, setActiveId] = useActiveSection(SECTIONS.map(s => s.id));

    return (
        <>
            <Helmet>
                <title>İstifadə Şərtləri | testup.az</title>
                <meta name="description" content="testup.az platformasının istifadə şərtləri" />
            </Helmet>

            <LegalShell
                kind="terms"
                breadcrumb="İstifadə Şərtləri"
                title="İstifadə Şərtləri"
                subtitle="testup.az platformasından istifadə etməklə aşağıdakı şərtləri qəbul etmiş olursunuz. Lütfən diqqətlə oxuyun — bu şərtlər sizin və bizim hüquq və öhdəliklərimizi müəyyən edir."
                meta={{ updated: '25.03.2026', version: '3.0' }}
                toc={SECTIONS}
                activeId={activeId}
                setActiveId={setActiveId}
            >
                <Section id="umumi" num={1} title="Şərtlərin qəbul edilməsi">
                    <p>
                        Bu İstifadə Şərtləri (bundan sonra "Şərtlər") <strong className="text-[var(--ink-900)]">testup.az</strong> platforması (bundan sonra "Platforma") və onun
                        sahibi <strong className="text-[var(--ink-900)]">TestUp MMC</strong> (bundan sonra "Şirkət") ilə istifadəçi arasındakı münasibətləri tənzimləyir.
                    </p>
                    <p>
                        Platformaya qeydiyyatdan keçməklə və ya istifadə etməklə siz bu Şərtləri tam oxuduğunuzu, başa düşdüyünüzü
                        və qəbul etdiyinizi təsdiq edirsiniz. Şərtlərlə razılaşmırsınızsa, Platformadan istifadə etməyin.
                    </p>
                    <Note>
                        <strong className="text-[var(--brand-green-700)]">Önəmli:</strong> Bu şərtləri qəbul etməklə Azərbaycan Respublikasının qanunvericiliyini tanıdığınızı təsdiq edirsiniz.
                    </Note>
                </Section>

                <Section id="teyinati" num={2} title="Platformanın Təyinatı">
                    <p>
                        testup.az müəllimlərin onlayn imtahan hazırlamasına, şagirdlərin imtahanlarda iştirak etməsinə, nəticələrin avtomatik
                        qiymətləndirilməsinə və statistik analizlər aparılmasına imkan verən SaaS (Software as a Service) tipli təhsil platformasıdır.
                    </p>
                    <p>
                        Platforma həmçinin süni intellekt (AI) vasitəsilə sual yaratma, sual bazası idarəetməsi, birgə imtahan hazırlığı və
                        PDF-dən sual idxalı kimi əlavə funksiyalar təqdim edir.
                    </p>
                </Section>

                <Section id="qeydiyyat" num={3} title="Qeydiyyat və Hesab">
                    <p>Platformadan istifadə etmək üçün hesab yaratmalısınız. Qeydiyyat zamanı:</p>
                    <ul className="space-y-2">
                        <Bullet>Düzgün və aktual məlumat təqdim etməlisiniz</Bullet>
                        <Bullet>Hesab məlumatlarınızın təhlükəsizliyinə özünüz cavabdehsiniz</Bullet>
                        <Bullet>Hesabınızdan icazəsiz istifadəni dərhal bizə bildirməlisiniz</Bullet>
                    </ul>
                    <p>
                        Şirkət istənilən vaxt, əvvəlcədən xəbərdarlıq etmədən, bu Şərtləri pozan hesabları dayandırmaq və ya silmək hüququnu
                        özündə saxlayır. Saxta məlumatlarla qeydiyyatdan keçən hesablar müəyyən edildikdə dayandırılır.
                    </p>
                </Section>

                <Section id="abuneliq" num={4} title="Abunəlik Planları və Ödənişlər">
                    <p>
                        Platforma həm pulsuz, həm də pullu abunəlik planları təklif edir. Hər planın imkanları, limitləri və qiyməti
                        Platformanın <Link to="/planlar" className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold">Qiymətlər</Link> səhifəsində göstərilir.
                    </p>
                    <p>
                        Aylıq istifadə limitləri (imtahan yaratma sayı, AI sual yaratma sayı və s.) hər təqvim ayının 1-i saat 00:00-da
                        avtomatik olaraq sıfırlanır. Ümumi limitlər (saxlanılan imtahan sayı, bir imtahanda maksimum sual sayı və s.)
                        aylıq sıfırlanmır.
                    </p>
                    <p>
                        <strong className="text-[var(--ink-900)]">Ödənişlər geri qaytarılmır.</strong> Ödəniş etməklə siz seçilmiş plan müddəti üçün xidmət aldığınızı
                        və pulun geri qaytarılmayacağını qəbul edirsiniz. Abunəlik müddəti bitdikdən sonra avtomatik yenilənmə
                        həyata keçirilmir.
                    </p>
                    <p>
                        Şirkət qiymətləri və plan imkanlarını dəyişdirmək hüququnu özündə saxlayır. Dəyişikliklər mövcud
                        aktiv abunəliklərə tətbiq edilmir, yalnız yeni alışlara şamil olunur.
                    </p>
                </Section>

                <Section id="davranis" num={5} title="İstifadəçi Davranış Qaydaları">
                    <p>Platformadan istifadə edərkən aşağıdakılar qadağandır:</p>
                    <ul className="space-y-2">
                        <Bullet>Qanunvericiliyə zidd, təhqiramiz, ayrı-seçkilik edən və ya üçüncü şəxslərin hüquqlarını pozan məzmun yerləşdirmək</Bullet>
                        <Bullet>Platformanın texniki infrastrukturuna müdaxilə etmək, hücum etmək və ya zəifliklərdən sui-istifadə etmək</Bullet>
                        <Bullet>Digər istifadəçilərin məlumatlarını icazəsiz toplamaq və ya paylaşmaq</Bullet>
                        <Bullet>Bot, skript və ya avtomatlaşdırılmış vasitələrlə Platformadan sui-istifadə etmək</Bullet>
                        <Bullet>Saxta və ya yanıldıcı hesablar yaratmaq</Bullet>
                        <Bullet>AI funksiyalarından imtahan kənarında kommersiya məqsədilə kütləvi sual istehsalı üçün istifadə etmək</Bullet>
                    </ul>
                    <p>
                        Bu qaydalara əməl etməmək hesabınızın dərhal bağlanmasına və lazım olduqda hüquqi addımlar atılmasına səbəb ola bilər.
                    </p>
                </Section>

                <Section id="mulkiyyet" num={6} title="Əqli Mülkiyyət">
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

                <Section id="ai" num={7} title="AI Xidmətləri">
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

                <Section id="movcudluq" num={8} title="Xidmətin Mövcudluğu və Dəyişdirilməsi">
                    <p>
                        Şirkət Platformanın fasiləsiz, xətasız və ya 24/7 əlçatan olmasına zəmanət vermir. Texniki qulluq,
                        yeniləmə və ya fors-major hallarında xidmətdə fasilələr yarana bilər.
                    </p>
                    <p>
                        Şirkət istənilən vaxt Platformanın funksiyalarını, dizaynını, planlarını və xidmət şərtlərini
                        dəyişdirmək, yeni funksiyalar əlavə etmək və ya mövcud funksiyaları ləğv etmək hüququnu özündə saxlayır.
                    </p>
                </Section>

                <Section id="mesuliyyet" num={9} title="Məsuliyyətin Məhdudlaşdırılması">
                    <p>
                        Platforma "olduğu kimi" (as is) təqdim olunur. Şirkət aşağıdakılara görə <strong className="text-[var(--ink-900)]">heç bir halda
                        məsuliyyət daşımır:</strong>
                    </p>
                    <ul className="space-y-2">
                        <Bullet>İstifadəçi tərəfindən yaradılmış məzmunun düzgünlüyü, qanuniliyi və ya uyğunluğu</Bullet>
                        <Bullet>AI tərəfindən yaradılmış sualların dəqiqliyi və ya akademik uyğunluğu</Bullet>
                        <Bullet>Texniki nasazlıq, server xətası və ya məlumat itkisi nəticəsində yaranan zərər</Bullet>
                        <Bullet>İstifadəçinin hesab məlumatlarının üçüncü şəxslər tərəfindən ələ keçirilməsi</Bullet>
                        <Bullet>Üçüncü tərəf xidmətlərinin (ödəniş sistemi, AI provayderi, hosting) yaratdığı problemlər</Bullet>
                        <Bullet>İmtahan nəticələrinin real akademik qiymətləndirməyə təsiri</Bullet>
                        <Bullet>Platformadan düzgün istifadə edilməməsi nəticəsində yaranan istənilən birbaşa və ya dolayı zərər</Bullet>
                    </ul>
                    <p>
                        Şirkətin bu Şərtlər çərçivəsindəki maksimal məsuliyyəti, istənilən halda, istifadəçinin son 12 ay
                        ərzində Platformaya ödədiyi ümumi məbləği aşa bilməz.
                    </p>
                </Section>

                <Section id="legv" num={10} title="Hesabın Ləğvi">
                    <p>
                        İstifadəçi istənilən vaxt hesabını silmək üçün <strong className="text-[var(--ink-900)]">info@testup.az</strong> ünvanına müraciət edə bilər.
                        Hesab silindikdən sonra bütün məlumatlar (imtahanlar, suallar, nəticələr) geri qaytarılmaz şəkildə silinir.
                    </p>
                    <p>
                        Aktiv abunəlik müddəti ərzində hesab silinərsə, ödəniş geri qaytarılmır.
                    </p>
                </Section>

                <Section id="sertler-deyis" num={11} title="Şərtlərin Dəyişdirilməsi">
                    <p>
                        Şirkət bu Şərtləri istənilən vaxt dəyişdirmək hüququnu özündə saxlayır. Əhəmiyyətli dəyişikliklər
                        barədə istifadəçilər Platforma daxilindəki bildiriş vasitəsilə xəbərdar ediləcək.
                    </p>
                    <p>
                        Dəyişikliklərdən sonra Platformadan istifadəyə davam etmək yenilənmiş Şərtləri qəbul etmək anlamına gəlir.
                    </p>
                </Section>

                <Section id="qanunvericilik" num={12} title="Tətbiq Olunan Qanunvericilik">
                    <p>
                        Bu Şərtlər Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq tənzimlənir və şərh edilir.
                        Mübahisələr ilk növbədə danışıqlar yolu ilə, mümkün olmadıqda isə Azərbaycan Respublikasının
                        səlahiyyətli məhkəmələri tərəfindən həll edilir.
                    </p>
                </Section>

                <Section id="elaqe" num={13} title="Əlaqə">
                    <p>
                        Bu Şərtlərlə bağlı suallarınız varsa, bizimlə əlaqə saxlayın:
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

export default TermsOfService;
