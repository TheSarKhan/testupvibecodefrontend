import { useState, useEffect, useRef } from 'react';
import { HiOutlineArrowLeft, HiOutlineMail } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import getErrorMessage from '../../utils/getErrorMessage';

const RESEND_COOLDOWN = 60;

/**
 * Shared OTP email-verification screen used by Register (step 3) and Login
 * (when an unverified account tries to sign in). Lives inside the auth form
 * card — matches the Register/Login styling (var() colours, centered code
 * input like the password-reset modal). On a successful OTP it calls
 * verifyEmail(), which logs the user in, then hands the resulting AuthResponse
 * to `onVerified` so the caller can route.
 *
 * Props:
 *  - email      — address the code was sent to
 *  - onVerified — (data) => void, called with the AuthResponse (tokens) on success
 *  - onBack     — optional: render a "Geri" link that calls this
 */
const EmailVerification = ({ email, onVerified, onBack }) => {
    const { verifyEmail, resendVerification } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
    const [resending, setResending] = useState(false);
    const inputRef = useRef(null);

    // Start the cooldown on mount — a fresh code was just emailed by
    // register()/login(), so the user shouldn't immediately request another.
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setInterval(() => setCooldown(c => (c <= 1 ? 0 : c - 1)), 1000);
        return () => clearInterval(id);
    }, [cooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length < 6) return;
        setLoading(true);
        try {
            const data = await verifyEmail(email, otp);
            onVerified(data);
        } catch (error) {
            if (!error._handled) toast.error(getErrorMessage(error, 'Kod yanlış və ya vaxtı keçib'));
            setOtp('');
            inputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;
        setResending(true);
        try {
            await resendVerification(email);
            toast.success('Kod yenidən göndərildi');
            setCooldown(RESEND_COOLDOWN);
        } catch (error) {
            if (!error._handled) toast.error(getErrorMessage(error, 'Kod göndərilmədi'));
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            {onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--ink-600)] hover:text-[var(--primary)] transition-colors mb-3"
                >
                    <HiOutlineArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
            )}

            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                <HiOutlineMail className="w-7 h-7" />
            </div>

            <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--ink-900)] tracking-tight text-center">
                E-poçtunuzu təsdiqləyin
            </h1>
            <p className="mt-1.5 text-[14px] text-[var(--ink-500)] text-center">
                <strong className="text-[var(--ink-700)] font-semibold break-all">{email}</strong> ünvanına göndərilən 6 rəqəmli kodu daxil edin
            </p>
            <p className="mt-1.5 text-[12.5px] text-[var(--ink-400)] text-center">
                Kod gəlmədisə, <strong className="font-semibold text-[var(--ink-500)]">spam / junk</strong> qovluğunu da yoxlayın.
            </p>

            <form onSubmit={handleVerify} className="mt-6">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    autoComplete="one-time-code"
                    className="w-full text-center text-2xl font-bold tracking-[0.6em] h-14 rounded-xl bg-[var(--ink-50)] border-2 border-[var(--ink-200)] text-[var(--ink-900)] outline-none focus:bg-white focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] transition-colors placeholder-[var(--ink-300)] placeholder:tracking-[0.6em]"
                    placeholder="000000"
                />

                <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full h-12 mt-6 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[14px] text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)] transition-all"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Təsdiqlənir...
                        </>
                    ) : 'Təsdiqlə'}
                </button>
            </form>

            <p className="mt-5 text-center text-[13px] text-[var(--ink-500)]">
                Kod gəlmədi?{' '}
                {cooldown > 0 ? (
                    <span className="text-[var(--ink-400)] font-semibold">
                        Yenidən göndər ({cooldown})
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)] transition-colors disabled:opacity-50"
                    >
                        Kodu yenidən göndər
                    </button>
                )}
            </p>
        </>
    );
};

export default EmailVerification;
