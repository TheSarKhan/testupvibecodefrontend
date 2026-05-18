/**
 * testup.az — official logo.
 *
 * Single source of truth for the brand mark + wordmark across the app.
 * The mark is "Tick Arrow": a tick that rises into an upward arrow.
 *
 * Usage:
 *   <Logo />                  // default horizontal lockup
 *   <Logo size={40} />        // larger mark + wordmark scales with it
 *   <Logo dark />             // wordmark in white (for dark surfaces)
 *   <Logo wordmark={false} /> // mark only
 *   <LogoMark size={24} />    // just the mark, no wordmark
 */

const PRIMARY = '#2563EB';
const PRIMARY_DARK = '#1E40AF';
const ACCENT = '#22C55E';

/**
 * Just the mark — a colored rounded square with the tick-arrow inside.
 * Each instance gets unique gradient ids so multiple marks on a page render
 * correctly (SVG defs are global; reusing ids breaks rendering).
 */
export const LogoMark = ({ size = 32, primary = PRIMARY, dark = PRIMARY_DARK, accent = ACCENT, className = '' }) => {
    // Random suffix so gradient defs never collide between instances.
    const uid = 'lm-' + Math.random().toString(36).slice(2, 9);
    const radius = Math.round(size * (16 / 64)); // proportional to design (16/64)
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={primary} />
                    <stop offset="100%" stopColor={dark} />
                </linearGradient>
                <radialGradient id={`${uid}-glow`} cx="100%" cy="0%" r="80%">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.55" />
                    <stop offset="60%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="64" height="64" rx={radius} fill={`url(#${uid}-bg)`} />
            <rect x="0" y="0" width="64" height="64" rx={radius} fill={`url(#${uid}-glow)`} />
            {/* Tick rising into arrow */}
            <path
                d="M14 33 L26 45 L50 17"
                stroke="white"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <path
                d="M44 17 L50 17 L50 23"
                stroke={accent}
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
};

/**
 * Full horizontal lockup: mark + "testup.az" wordmark.
 *
 * `size` controls the mark; the wordmark scales relative to it so the lockup
 * stays visually balanced (default mark=32 → wordmark text ≈ 18px).
 */
const Logo = ({
    size = 32,
    dark = false,
    wordmark = true,
    className = '',
    markClassName = '',
    wordmarkClassName = '',
}) => {
    const wordSize = Math.round(size * 0.56); // 32 → 18, 40 → 22, 24 → 13.5

    if (!wordmark) {
        return <LogoMark size={size} className={`${markClassName} ${className}`.trim()} />;
    }

    return (
        <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
            <LogoMark size={size} className={markClassName} />
            <span
                className={`font-extrabold tracking-tight leading-none ${dark ? 'text-white' : 'text-[var(--ink-900)]'} ${wordmarkClassName}`.trim()}
                style={{ fontSize: `${wordSize}px` }}
            >
                testup
                <span style={{ color: ACCENT }}>.az</span>
            </span>
        </span>
    );
};

export default Logo;
