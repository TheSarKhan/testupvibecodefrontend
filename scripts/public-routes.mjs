// Single source of truth for the site's publicly indexable pages.
//
// Everything in here is (a) reachable without authentication, (b) stable —
// no :params — and (c) safe for crawlers and agents to fetch. Auth pages
// (/login, /register), role-gated pages (/panel, /profil, /admin/*), payment
// callbacks and share-link pages are deliberately absent: they are either
// private, per-user, or unguessable.
//
// Consumed by scripts/generate-sitemap.mjs (sitemap.xml) and — indirectly,
// via robots.txt — by every crawler. Add a route here when you publish a new
// public page; the sitemap regenerates on the next `npm run build`.

export const SITE_ORIGIN = 'https://testup.az';

export const PUBLIC_ROUTES = [
    {
        path: '/',
        // Source file whose last commit date becomes <lastmod>.
        source: 'src/pages/Home/Home.jsx',
        changefreq: 'weekly',
        priority: '1.0',
    },
    {
        path: '/imtahanlar',
        source: 'src/pages/Exams/ExamList.jsx',
        changefreq: 'daily',
        priority: '0.9',
    },
    {
        path: '/planlar',
        source: 'src/pages/Pricing/Pricing.jsx',
        changefreq: 'weekly',
        priority: '0.8',
    },
    {
        path: '/haqqimizda',
        source: 'src/pages/About/About.jsx',
        changefreq: 'monthly',
        priority: '0.6',
    },
    {
        path: '/elaqe',
        source: 'src/pages/Contact/Contact.jsx',
        changefreq: 'monthly',
        priority: '0.6',
    },
    {
        path: '/istifade-sertleri',
        source: 'src/pages/Legal/TermsOfService.jsx',
        changefreq: 'yearly',
        priority: '0.3',
    },
    {
        path: '/gizlilik-siyaseti',
        source: 'src/pages/Legal/PrivacyPolicy.jsx',
        changefreq: 'yearly',
        priority: '0.3',
    },
];
