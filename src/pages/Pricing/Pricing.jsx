import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    HiOutlineCheck, HiOutlinePlus, HiOutlineCreditCard, HiOutlineX,
    HiOutlineArrowRight, HiOutlineShieldCheck,
} from 'react-icons/hi';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ───────────────────────────────────────────────────────────────────────────
// Static feature list used for the comparison table and the per-card features.
// ───────────────────────────────────────────────────────────────────────────

const FEATURE_LIST = [
    { key: 'monthlyExamLimit',        label: 'Aylıq İmtahan Sayı',                type: 'number' },
    { key: 'maxQuestionsPerExam',     label: 'Bir imtahanda max sual',            type: 'number' },
    { key: 'maxSavedExamsLimit',      label: 'Ümumi yadda saxlanılan imtahan',    type: 'number' },
    { key: 'maxParticipantsPerExam',  label: 'Max iştirakçı sayı',                type: 'number' },
    { key: 'studentResultAnalysis',   label: 'Şagird nəticələrinin analizi',      type: 'boolean' },
    { key: 'examEditing',             label: 'İmtahan redaktəsi',                 type: 'boolean' },
    { key: 'addImage',                label: 'Suala şəkil əlavə etmək',           type: 'boolean' },
    { key: 'addPassageQuestion',      label: 'Mətn / Dinləmə sualları',           type: 'boolean' },
    { key: 'downloadPastExams',       label: 'Keçmiş imtahanları yükləmək',       type: 'boolean' },
    { key: 'downloadAsPdf',           label: 'İmtahanı PDF kimi yükləmək',        type: 'boolean' },
    { key: 'multipleSubjects',        label: 'Bir imtahanda bir neçə fənn',       type: 'boolean' },
    { key: 'useTemplateExams',        label: 'Şablon imtahanlardan istifadə',     type: 'boolean' },
    { key: 'manualChecking',          label: 'Açıq sualların yoxlanışı',          type: 'boolean' },
    { key: 'selectExamDuration',      label: 'Xüsusi imtahan müddəti',            type: 'boolean' },
    { key: 'useQuestionBank',         label: 'Sual bazasından istifadə',          type: 'boolean' },
    { key: 'createQuestionBank',      label: 'Sual bazası yaratmaq',              type: 'boolean' },
    { key: 'importQuestionsFromPdf',  label: 'PDF-dən sualların kəsilməsi',       type: 'boolean' },
];

const MONTHS_OPTIONS = [
    { value: 1,  label: 'Aylıq' },
    { value: 12, label: 'İllik', discount: 20 },
];

const fmtNum = (v) => (v === -1 ? 'Limitsiz' : v == null ? '—' : v);

// ───────────────────────────────────────────────────────────────────────────
// Hero
// ───────────────────────────────────────────────────────────────────────────

const PlansHero = () => (
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
                <span className="text-[var(--ink-800)] font-semibold">Planlar</span>
            </div>
            <div className="text-center max-w-[720px] mx-auto">
                <h1 className="text-[36px] md:text-[52px] lg:text-[60px] font-bold leading-[1.05] tracking-[-0.03em] text-[var(--ink-900)] text-balance">
                    Hər müəllim və mərkəz üçün uyğun plan
                </h1>
                <p className="mt-4 text-[18px] text-[var(--ink-500)] max-w-[580px] mx-auto leading-relaxed">
                    Pulsuz başlayın, ehtiyacınız böyüdükcə miqyaslandırın. Bütün planlar əsas xüsusiyyətlərə daxildir — sizinçün dəyəri yalnız limitlər müəyyən edir.
                </p>
            </div>
        </div>
    </section>
);

// ───────────────────────────────────────────────────────────────────────────
// Billing toggle
// ───────────────────────────────────────────────────────────────────────────

const BillingToggle = ({ months, setMonths }) => (
    <div className="flex justify-center mb-10">
        <div className="inline-flex bg-[var(--ink-100)] border border-[var(--ink-200)] rounded-full p-1 gap-1">
            {MONTHS_OPTIONS.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => setMonths(opt.value)}
                    className={`relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-[14px] font-semibold transition-all ${
                        months === opt.value
                            ? 'bg-white text-[var(--ink-900)] shadow-[var(--sh-sm)]'
                            : 'text-[var(--ink-500)] hover:text-[var(--ink-700)]'
                    }`}
                >
                    {opt.label}
                    {opt.discount && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                            months === opt.value ? 'bg-[var(--brand-green-100)] text-[var(--brand-green-600)]' : 'bg-[var(--brand-green-50)] text-[var(--brand-green-600)]'
                        }`}>
                            −{opt.discount}%
                        </span>
                    )}
                </button>
            ))}
        </div>
    </div>
);

// ───────────────────────────────────────────────────────────────────────────
// Plan card — testup style with real backend data
// ───────────────────────────────────────────────────────────────────────────

const PlanCard = ({
    plan, featured, months, isCurrent, action, wallet, isFreeSwitch,
    displayPrice, onSubscribe, paying, remainingDays,
}) => {
    const ringSelected = featured;
    return (
        <div
            className={`relative rounded-3xl p-7 transition-all ${
                featured
                    ? 'bg-[var(--ink-900)] text-white border border-[var(--ink-900)] shadow-2xl md:scale-105'
                    : 'bg-white text-[var(--ink-800)] border border-[var(--ink-200)] hover:-translate-y-1 hover:shadow-[var(--sh-md)]'
            }`}
        >
            {featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--accent)] text-[#06351A] text-[11px] font-bold tracking-wider uppercase">
                    Ən populyar
                </span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                <div className={`text-[13px] font-bold uppercase tracking-[0.12em] ${ringSelected ? 'text-[var(--accent)]' : 'text-[var(--primary)]'}`}>
                    {plan.name}
                </div>
                {isCurrent && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        remainingDays <= 7  ? 'bg-red-100 text-red-700' :
                        remainingDays <= 30 ? 'bg-amber-100 text-amber-700' :
                                              'bg-green-100 text-green-700'
                    }`}>
                        {remainingDays === 0 ? 'Bu gün bitir' : `${remainingDays} gün qalır`}
                    </span>
                )}
            </div>

            <p className={`mt-2 text-[14px] ${featured ? 'text-white/70' : 'text-[var(--ink-500)]'} min-h-[40px]`}>
                {plan.description || 'Yeni imtahanlar yaradın və şagirdləri qiymətləndirin.'}
            </p>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-1.5">
                <span className={`text-[52px] font-bold leading-none tracking-tight ${featured ? 'text-white' : 'text-[var(--ink-900)]'}`}>
                    {plan.price > 0 ? (isFreeSwitch ? '0' : displayPrice) : '0'}
                </span>
                {plan.price > 0 && !isFreeSwitch && (
                    <span className={`text-[14px] font-semibold ${featured ? 'text-white/70' : 'text-[var(--ink-500)]'}`}>AZN</span>
                )}
            </div>
            <div className={`text-[13px] mt-1 ${featured ? 'text-white/60' : 'text-[var(--ink-500)]'}`}>
                {plan.price === 0
                    ? 'ömürlük pulsuz'
                    : months === 12 ? 'aylıq, illik ödəniş' : 'aylıq, AZN'}
            </div>

            {/* Credit breakdown */}
            {action === 'switch' && wallet?.creditAzn > 0 && (
                <div className={`mt-4 p-3 rounded-xl border text-[12px] ${
                    featured
                        ? (isFreeSwitch ? 'bg-emerald-500/15 border-emerald-400/30 text-white' : 'bg-amber-500/15 border-amber-400/30 text-white')
                        : (isFreeSwitch ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200')
                }`}>
                    <div className="flex justify-between">
                        <span className={featured ? 'opacity-80' : 'text-gray-600'}>Plan qiyməti</span>
                        <span>{(displayPrice * months).toFixed(2)} AZN</span>
                    </div>
                    <div className={`flex justify-between font-semibold mt-1 ${
                        isFreeSwitch ? 'text-[var(--brand-green-600)]' : 'text-amber-700'
                    } ${featured ? '!text-white' : ''}`}>
                        <span>Cari plan krediti</span>
                        <span>−{wallet.creditAzn.toFixed(2)} AZN</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1.5 mt-1.5 border-t border-current/15">
                        <span>Ödəniləcək</span>
                        <span>{isFreeSwitch ? 'Pulsuz' : wallet.chargeAmount.toFixed(2) + ' AZN'}</span>
                    </div>
                </div>
            )}

            {/* CTA */}
            <div className="mt-5">
                {plan.price === 0 ? (
                    <div className={`w-full text-center text-[13px] font-medium py-3 rounded-full ${
                        featured ? 'bg-white/10 text-white/70' : 'bg-[var(--ink-100)] text-[var(--ink-500)] border border-[var(--ink-200)]'
                    }`}>
                        Baza plan — hər zaman mövcuddur
                    </div>
                ) : (
                    <button
                        onClick={onSubscribe}
                        disabled={paying}
                        className={`w-full inline-flex items-center justify-center gap-2 h-12 rounded-full font-bold text-[14.5px] transition-all ${
                            paying
                                ? 'bg-[var(--ink-300)] text-white cursor-wait'
                                : featured
                                    ? 'bg-white text-[var(--ink-900)] hover:bg-white/95'
                                    : action === 'renew'
                                        ? 'bg-[var(--brand-green-600)] hover:bg-[var(--brand-green-600)]/90 text-white'
                                        : isFreeSwitch
                                            ? 'bg-[var(--accent)] hover:bg-[var(--brand-green-600)] text-[#06351A] hover:text-white'
                                            : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white'
                        }`}
                    >
                        {paying ? 'İşlənir...'
                            : action === 'renew'   ? <><HiOutlineCreditCard className="w-4 h-4" /> Uzat</>
                            : isFreeSwitch         ? <><HiOutlineCheck className="w-4 h-4" /> Ödənişsiz keçid</>
                            : action === 'switch'  ? <><HiOutlineCreditCard className="w-4 h-4" /> Plana keçid</>
                                                     : <>Planı seç <HiOutlineArrowRight className="w-4 h-4" /></>}
                    </button>
                )}
            </div>

            {/* Feature highlights */}
            <ul className={`mt-7 pt-6 space-y-2.5 border-t ${featured ? 'border-white/15' : 'border-[var(--ink-150)]'}`}>
                {FEATURE_LIST.map((f, j) => {
                    const v = plan[f.key];
                    const isBool = f.type === 'boolean';
                    const isIncluded = isBool ? v === true : (v === -1 || v > 0);
                    const displayVal = isBool ? null : (v === -1 ? 'Limitsiz' : v);
                    return (
                        <li key={j} className={`flex items-start gap-2.5 text-[13.5px] ${
                            isIncluded ? '' : 'opacity-40'
                        }`}>
                            <HiOutlineCheck className={`w-4 h-4 mt-0.5 shrink-0 ${
                                featured ? 'text-[var(--accent)]' : 'text-[var(--primary)]'
                            }`} />
                            <span className={featured ? 'text-white/90' : 'text-[var(--ink-700)]'}>
                                {f.label}
                                {displayVal !== null && (
                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                        featured ? 'bg-white/10' : 'bg-[var(--ink-100)]'
                                    }`}>
                                        {displayVal}
                                    </span>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Comparison table — uses real backend plan data
// ───────────────────────────────────────────────────────────────────────────

const CompareTable = ({ plans }) => {
    if (!plans?.length) return null;
    const cellVal = (plan, f) => {
        const v = plan[f.key];
        if (f.type === 'boolean') {
            return v === true
                ? <HiOutlineCheck className="w-5 h-5 mx-auto text-[var(--brand-green-600)]" />
                : <span className="text-[var(--ink-300)]">—</span>;
        }
        return <span className="font-semibold text-[var(--ink-800)]">{fmtNum(v)}</span>;
    };
    return (
        <section className="py-20 md:py-24">
            <div className="container-main">
                <div className="text-center max-w-[720px] mx-auto mb-12">
                    <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)]">
                        Bütün xüsusiyyətlər yan-yana
                    </h2>
                    <p className="mt-4 text-[17px] text-[var(--ink-500)] leading-relaxed">
                        Hansı planın sizinçün uyğun olduğunu görmək üçün xüsusiyyətləri müqayisə edin.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--ink-200)] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[14px] min-w-[640px]">
                            <thead>
                                <tr className="border-b border-[var(--ink-150)]">
                                    <th className="text-left px-5 py-4 text-[13px] font-bold text-[var(--ink-500)] uppercase tracking-wider min-w-[240px]">Xüsusiyyət</th>
                                    {plans.map((p, i) => {
                                        const isFeatured = i === 1;
                                        return (
                                            <th key={p.id} className={`px-5 py-4 text-center ${isFeatured ? 'bg-[var(--primary-soft)]' : ''}`}>
                                                <div className={`text-[15px] font-bold ${isFeatured ? 'text-[var(--primary)]' : 'text-[var(--ink-900)]'}`}>{p.name}</div>
                                                <div className="text-[12px] text-[var(--ink-500)] mt-0.5">
                                                    {p.price === 0 ? 'Pulsuz' : `${p.price} AZN/ay`}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={plans.length + 1} className="bg-[var(--ink-50)] px-5 py-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--primary)]">
                                        Əsas limitlər
                                    </td>
                                </tr>
                                {FEATURE_LIST.filter(f => f.type === 'number').map((f, j) => (
                                    <tr key={j} className="border-t border-[var(--ink-150)]">
                                        <td className="px-5 py-3 text-[var(--ink-700)]">{f.label}</td>
                                        {plans.map((p, i) => (
                                            <td key={p.id} className={`text-center px-5 py-3 ${i === 1 ? 'bg-[var(--primary-soft)]/40' : ''}`}>
                                                {cellVal(p, f)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={plans.length + 1} className="bg-[var(--ink-50)] px-5 py-3 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[var(--primary)]">
                                        Xüsusiyyətlər
                                    </td>
                                </tr>
                                {FEATURE_LIST.filter(f => f.type === 'boolean').map((f, j) => (
                                    <tr key={j} className="border-t border-[var(--ink-150)]">
                                        <td className="px-5 py-3 text-[var(--ink-700)]">{f.label}</td>
                                        {plans.map((p, i) => (
                                            <td key={p.id} className={`text-center px-5 py-3 ${i === 1 ? 'bg-[var(--primary-soft)]/40' : ''}`}>
                                                {cellVal(p, f)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Extra CTA — dark + light boxes
// ───────────────────────────────────────────────────────────────────────────

const ExtraCTA = () => (
    <section className="py-12 md:py-16">
        <div className="container-main">
            <div className="grid md:grid-cols-2 gap-5">
                {/* Dark box — sales */}
                <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 text-white" style={{ background: 'var(--ink-900)' }}>
                    <div className="absolute inset-0 pointer-events-none opacity-50" style={{
                        background: 'radial-gradient(circle at 0% 100%, rgba(37,99,235,0.35), transparent 50%), radial-gradient(circle at 100% 0%, rgba(34,197,94,0.25), transparent 50%)',
                    }} />
                    <h3 className="relative text-[24px] font-bold mb-3">Təhsil müəssisəsi üçün xüsusi qiymət</h3>
                    <p className="relative text-white/70 text-[15px] leading-relaxed mb-6">
                        50+ müəllimi olan məktəblər və universitetlər üçün xüsusi şərtlər təklif edirik — fərdi qiymət, treninq və miqrasiya dəstəyi daxil.
                    </p>
                    <Link
                        to="/elaqe"
                        className="relative inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-[var(--ink-900)] bg-white hover:bg-white/95 transition-all"
                    >
                        Satışla danış <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Light box — teacher 50% */}
                <div className="rounded-3xl p-8 md:p-10 bg-white border border-[var(--ink-200)]">
                    <h3 className="text-[24px] font-bold text-[var(--ink-900)] mb-3">Müəllim olmaqla 50% endirim</h3>
                    <p className="text-[var(--ink-500)] text-[15px] leading-relaxed mb-6">
                        Şəxsi müəllim hesabınızı təsdiqləməklə Peşəkar planda 50% endirim qazanın. Sənədi yükləyin, 24 saat ərzində təsdiq alırıq.
                    </p>
                    <Link
                        to="/elaqe"
                        className="inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all"
                    >
                        Endirim üçün müraciət et <HiOutlineArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

// ───────────────────────────────────────────────────────────────────────────
// FAQ
// ───────────────────────────────────────────────────────────────────────────

const PlansFAQ = () => {
    const items = [
        { q: 'Planı istənilən vaxt dəyişə bilərəmmi?', a: 'Bəli. Yüksək plana keçəndə fərq dərhal hesablanır. Aşağı plana keçəndə isə cari dövr başa çatdıqdan sonra dəyişiklik tətbiq olunur.' },
        { q: 'Pulsuz Başlanğıc planı nə qədər müddətə pulsuzdur?', a: 'Başlanğıc plan həmişə pulsuzdur — vaxt limiti yoxdur. Daha çox imkan istəsəniz, istənilən vaxt ödənişli plana keçə bilərsiniz.' },
        { q: 'Hansı ödəniş üsullarını qəbul edirsiniz?', a: 'Visa, Mastercard, MilliÖn, Hesab.az və bank köçürməsi. Mərkəz planı üçün rəsmi faktura təqdim edilir.' },
        { q: 'AZN-dən başqa valyuta ilə ödəyə bilərəmmi?', a: 'Bəli. Beynəlxalq kartlardan USD və EUR ilə ödəniş qəbul edirik. Konvertasiya bankınız tərəfindən aparılır.' },
        { q: 'Endirim kuponları və promo kodlar varmı?', a: 'Müəllim təsdiqi ilə 50%, illik ödənişlə 20% endirim mümkündür. Ayrıca yaz/payız tədris ilinin başlanğıcında xüsusi kampaniyalar elan olunur.' },
        { q: 'Pul qaytarma siyasətiniz necədir?', a: 'İlk 30 gün ərzində soruşmadan tam pul qaytarması. Daha sonra istifadə olunmamış müddət üçün proporsional qaytarma.' },
    ];
    const [open, setOpen] = useState(-1);
    return (
        <section className="py-20 md:py-24 bg-[var(--ink-50)]">
            <div className="container-main max-w-3xl">
                <div className="text-center max-w-[720px] mx-auto mb-12">
                    <h2 className="text-[30px] md:text-[44px] font-bold leading-[1.1] tracking-[-0.03em] text-[var(--ink-900)]">
                        Plan və ödənişlərlə bağlı suallar
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
// Confirmation modal
// ───────────────────────────────────────────────────────────────────────────

// Build a list of meaningful differences between current plan and target plan.
// Numbers: only flag if they actually changed; surface direction (yüksəliş /
// enmə) so the teacher sees whether they're losing capacity.
// Booleans: only flag features that flip — gained features in green, lost ones
// in amber. Identical feature values are skipped to keep the modal scannable.
const computePlanDiffs = (currentPlan, targetPlan) => {
    if (!currentPlan || !targetPlan) return { gained: [], lost: [], numericChanges: [] };
    const fmt = (v) => v === -1 ? 'Limitsiz' : v == null ? '—' : String(v);
    const gained = [];
    const lost = [];
    const numericChanges = [];
    for (const f of FEATURE_LIST) {
        const cur = currentPlan[f.key];
        const tgt = targetPlan[f.key];
        if (f.type === 'boolean') {
            if (cur === tgt) continue;
            if (tgt === true) gained.push(f.label);
            else lost.push(f.label);
        } else {
            // Numeric: -1 means unlimited (best). Compare by ranking unlimited > finite.
            if (cur === tgt) continue;
            const rank = (v) => v === -1 ? Infinity : (v == null ? -Infinity : v);
            const up = rank(tgt) > rank(cur);
            numericChanges.push({ label: f.label, from: fmt(cur), to: fmt(tgt), up });
        }
    }
    return { gained, lost, numericChanges };
};

const ConfirmModal = ({ confirmModal, setConfirmModal, selectedMonths, currentPlan, onConfirm }) => {
    if (!confirmModal) return null;
    const { plan, action, wallet, isFreeSwitch } = confirmModal;
    // Only show diffs when actually switching to a DIFFERENT plan; renewals
    // and same-plan top-ups would just show an empty diff section.
    const showDiffs = action === 'switch' && currentPlan && currentPlan.id !== plan.id;
    const diffs = showDiffs ? computePlanDiffs(currentPlan, plan) : null;
    const hasAnyDiff = diffs && (diffs.gained.length > 0 || diffs.lost.length > 0 || diffs.numericChanges.length > 0);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <button onClick={() => setConfirmModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <HiOutlineX className="w-5 h-5" />
                </button>
                <div className="p-6">
                    <h3 className="text-lg font-bold text-[var(--ink-900)] mb-1">
                        {action === 'renew' ? 'Planı uzat' : isFreeSwitch ? 'Ödənişsiz keçid' : 'Plana keçid'}
                    </h3>
                    <p className="text-sm text-[var(--ink-500)] mb-5">
                        <span className="font-semibold text-[var(--ink-800)]">{plan.name}</span> planına keçmək istədiyinizdən əminsiniz?
                    </p>

                    {action === 'switch' ? (
                        // Always show the breakdown on switches so the teacher
                        // can see exactly how their existing balance gets
                        // applied — even when the credit is 0 (i.e. coming
                        // from the free Başlanğıc plan), being explicit beats
                        // a vague "Ödəniləcək: 2.00 AZN" that looks like the
                        // discount system isn't engaged.
                        <div className={`rounded-xl p-4 mb-4 text-sm space-y-2 ${
                            isFreeSwitch ? 'bg-emerald-50'
                                : wallet.creditAzn > 0 ? 'bg-amber-50'
                                : 'bg-gray-50'
                        }`}>
                            <div className="flex justify-between text-gray-600">
                                <span>Yeni planın qiyməti ({selectedMonths} ay)</span>
                                <span>{(plan.price * selectedMonths).toFixed(2)} AZN</span>
                            </div>
                            {wallet.creditAzn > 0 ? (
                                <div className={`flex justify-between font-semibold ${isFreeSwitch ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    <span>Cari planın qalan dəyəri{wallet.remainingDays != null ? ` (${wallet.remainingDays} gün)` : ''}</span>
                                    <span>−{wallet.creditAzn.toFixed(2)} AZN</span>
                                </div>
                            ) : (
                                <div className="flex justify-between text-gray-400 text-[12.5px]">
                                    <span>Cari planın qalıq krediti</span>
                                    <span>0.00 AZN</span>
                                </div>
                            )}
                            <div className={`flex justify-between font-bold pt-2 border-t ${
                                isFreeSwitch ? 'border-emerald-200 text-emerald-800'
                                    : wallet.creditAzn > 0 ? 'border-amber-200 text-gray-900'
                                    : 'border-gray-200 text-gray-900'
                            }`}>
                                <span>Hesabınızdan çıxılacaq</span>
                                <span>{isFreeSwitch ? 'Pulsuz' : wallet.chargeAmount.toFixed(2) + ' AZN'}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 pt-1">
                                <span>{isFreeSwitch ? 'Yeni planın müddəti' : 'Müddət'}</span>
                                <span className="font-semibold text-gray-800">{wallet.durationDays} gün</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
                            <div className="flex justify-between font-semibold text-gray-800">
                                <span>Ödəniləcək məbləğ</span>
                                <span>{(plan.price * selectedMonths).toFixed(2)} AZN</span>
                            </div>
                            <div className="flex justify-between text-gray-500 mt-1">
                                <span>Müddət</span>
                                <span>{selectedMonths * 30} gün</span>
                            </div>
                        </div>
                    )}

                    {/* Plan diff — only on actual plan switches. For free switches
                        the teacher specifically wanted to see WHAT they're getting
                        (or giving up) before confirming. */}
                    {showDiffs && hasAnyDiff && (
                        <div className="rounded-xl border border-gray-200 p-4 mb-5 text-[13px] space-y-3 max-h-56 overflow-y-auto">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                {currentPlan.name} → {plan.name}
                            </div>
                            {diffs.numericChanges.length > 0 && (
                                <ul className="space-y-1">
                                    {diffs.numericChanges.map((c, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className={`shrink-0 mt-0.5 text-[14px] font-bold ${c.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {c.up ? '↑' : '↓'}
                                            </span>
                                            <span className="flex-1 text-gray-700">
                                                {c.label}: <span className="text-gray-400 line-through">{c.from}</span>{' '}
                                                <span className={`font-semibold ${c.up ? 'text-emerald-700' : 'text-amber-700'}`}>{c.to}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {diffs.gained.length > 0 && (
                                <div>
                                    <div className="text-[11px] font-bold text-emerald-700 mb-1">Yeni açılan imkanlar</div>
                                    <ul className="space-y-1">
                                        {diffs.gained.map((g, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-700">
                                                <HiOutlineCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <span>{g}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {diffs.lost.length > 0 && (
                                <div>
                                    <div className="text-[11px] font-bold text-amber-700 mb-1">İtirəcəyiniz imkanlar</div>
                                    <ul className="space-y-1">
                                        {diffs.lost.map((l, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-600">
                                                <HiOutlineX className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                                <span>{l}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={() => setConfirmModal(null)}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100"
                        >
                            Ləğv et
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
                                isFreeSwitch ? 'bg-[var(--accent)] hover:bg-[var(--brand-green-600)]' : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                            }`}
                        >
                            {isFreeSwitch ? 'Keçid et' : 'Ödənişə keç'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ───────────────────────────────────────────────────────────────────────────
// Main
// ───────────────────────────────────────────────────────────────────────────

const Pricing = ({ isEmbedded = false }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonths, setSelectedMonths] = useState(1);
    const [paying, setPaying] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);
    const [paymentWindowOpen, setPaymentWindowOpen] = useState(false);
    const { user, subscription, refreshSubscription } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await api.get('/subscription-plans');
                setPlans(response.data.sort((a, b) => a.price - b.price));
            } catch {
                toast.error('Planları yükləyərkən xəta baş verdi');
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
        refreshSubscription();
    }, []);

    const getDiscountedPrice = (price) => {
        const opt = MONTHS_OPTIONS.find(o => o.value === selectedMonths);
        if (!opt?.discount) return price;
        return +(price * (1 - opt.discount / 100)).toFixed(2);
    };

    const getWalletInfo = (plan) => {
        const baseCharge = plan.price * selectedMonths;
        const baseDuration = selectedMonths * 30;
        const empty = { creditAzn: 0, chargeAmount: baseCharge, durationDays: baseDuration, bonusDays: 0, remainingDays: 0, isFree: false };
        if (!subscription || !subscription.startDate || !subscription.endDate) return empty;
        if (subscription.plan?.id === plan.id || !plan.price) return empty;
        const totalDays = Math.max(1, Math.floor(
            (new Date(subscription.endDate) - new Date(subscription.startDate)) / 86400000
        ));
        const remainingDays = Math.max(0, Math.floor(
            (new Date(subscription.endDate) - Date.now()) / 86400000
        ));
        if (remainingDays === 0) return empty;
        // Credit ONLY when the active subscription was actually paid in cash.
        // Gift / welcome-bonus and internal credit-rollovers store
        // amountPaid=0, so they should never generate a credit on the
        // upgrade path — otherwise a new teacher with the 60-day Standart
        // gift could roll it into ~20 free days of Pro. The backend enforces
        // the same rule; this mirror is for UX so the popup shows
        // "Cari planın qalıq krediti: 0" instead of a fake non-zero number.
        const paidDailyRate = subscription.amountPaid && subscription.amountPaid > 0
            ? subscription.amountPaid / totalDays
            : 0;
        if (paidDailyRate <= 0) return { ...empty, remainingDays };
        const oldDailyRate = paidDailyRate;
        const creditAzn = oldDailyRate * remainingDays;
        const chargeAmount = Math.max(0, baseCharge - creditAzn);
        const totalValue = creditAzn + chargeAmount;
        const durationDays = Math.floor(totalValue / (plan.price / 30));
        const bonusDays = Math.max(0, durationDays - baseDuration);
        return { creditAzn, chargeAmount, durationDays, bonusDays, remainingDays, isFree: chargeAmount === 0 };
    };

    const getPlanAction = (plan) => {
        if (!user || !subscription) return 'subscribe';
        if (subscription.plan?.id === plan.id) return 'renew';
        return 'switch';
    };

    const openConfirm = (plan, action, wallet, isFreeSwitch) => {
        if (!user) {
            toast('Davam etmək üçün sistemə daxil olun', { icon: '🔒' });
            navigate('/login', { state: { returnUrl: '/planlar' } });
            return;
        }
        setConfirmModal({ plan, action, wallet, isFreeSwitch });
    };

    // Verify payment on window focus
    useEffect(() => {
        if (!paymentWindowOpen) return;
        const onFocus = async () => {
            const orderId = localStorage.getItem('pendingPaymentOrderId');
            if (!orderId) return;
            try {
                const { data } = await api.post('/payment/verify', { orderId });
                if (['PAID', 'APPROVED', 'SUCCESS'].includes(data.status) || data.alreadyProcessed) {
                    localStorage.removeItem('pendingPaymentOrderId');
                    setPaymentWindowOpen(false);
                    await refreshSubscription();
                    toast.success('Abunəlik aktivləşdirildi!');
                }
            } catch {}
        };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [paymentWindowOpen]);

    const handleSubscribe = async (planId) => {
        setConfirmModal(null);
        setPaying(planId);
        try {
            const { data } = await api.post('/payment/initiate', { planId, months: selectedMonths });
            if (data.directActivated) {
                await refreshSubscription();
                toast.success('Plan dəyişdirildi! Kredit ilə ödənişsiz keçid edildi.');
                return;
            }
            localStorage.setItem('pendingPaymentOrderId', data.orderId);
            window.open(data.paymentUrl, '_blank', 'noopener');
            setPaymentWindowOpen(true);
            toast('Ödəniş pəncərəsi açıldı. Ödənişi tamamlayıb bu səhifəyə qayıdın.', { icon: '💳', duration: 6000 });
        } catch (err) {
            if (!err._handled) toast.error(err.response?.data?.message || 'Ödəniş başladılarkən xəta baş verdi');
        } finally {
            setPaying(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--paper-cream)' }}>
                <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const content = (
        <>
            <BillingToggle months={selectedMonths} setMonths={setSelectedMonths} />
            <div className="container-main">
                <div className="grid md:grid-cols-3 gap-5 max-w-[1100px] mx-auto">
                    {plans.map((plan, i) => {
                        const featured = i === 1;
                        const isCurrent = subscription?.plan?.id === plan.id;
                        const displayPrice = plan.price > 0 ? getDiscountedPrice(plan.price) : 0;
                        const action = getPlanAction(plan);
                        const wallet = action === 'switch'
                            ? getWalletInfo(plan)
                            : { creditAzn: 0, isFree: false, chargeAmount: plan.price * selectedMonths, durationDays: selectedMonths * 30 };
                        const isFreeSwitch = action === 'switch' && wallet.isFree;
                        const remainingDays = isCurrent && subscription?.endDate
                            ? Math.max(0, Math.ceil((new Date(subscription.endDate) - Date.now()) / 86400000))
                            : null;
                        return (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                featured={featured}
                                months={selectedMonths}
                                isCurrent={isCurrent}
                                action={action}
                                wallet={wallet}
                                isFreeSwitch={isFreeSwitch}
                                displayPrice={displayPrice}
                                remainingDays={remainingDays}
                                paying={paying === plan.id}
                                onSubscribe={() => openConfirm(plan, action, wallet, isFreeSwitch)}
                            />
                        );
                    })}
                </div>
                <p className="mt-8 text-center text-[13px] text-[var(--ink-500)] inline-flex items-center justify-center gap-2 w-full">
                    <HiOutlineShieldCheck className="w-4 h-4 text-[var(--brand-green-600)]" />
                    Pulsuz planda kart məlumatı tələb olunmur · İstədiyiniz vaxt ləğv edə bilərsiniz
                </p>
            </div>
            <CompareTable plans={plans} />
            <ExtraCTA />
            <PlansFAQ />
            <ConfirmModal
                confirmModal={confirmModal}
                setConfirmModal={setConfirmModal}
                selectedMonths={selectedMonths}
                currentPlan={subscription?.plan}
                onConfirm={() => handleSubscribe(confirmModal.plan.id)}
            />
        </>
    );

    if (isEmbedded) {
        return <div className="py-12">{content}</div>;
    }

    return (
        <div style={{ background: 'var(--paper-cream)' }}>
            <Helmet>
                <title>Planlar — testup.az</title>
                <meta name="description" content="testup.az qiymət planları — pulsuz başlayın, ehtiyacınız böyüdükcə miqyaslandırın. Aylıq və illik abunəlik seçimləri." />
                <link rel="canonical" href="https://testup.az/planlar" />
            </Helmet>
            <PlansHero />
            <div className="pt-10 md:pt-12">{content}</div>
        </div>
    );
};

export default Pricing;
