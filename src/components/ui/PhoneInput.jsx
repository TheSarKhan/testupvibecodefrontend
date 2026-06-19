import PhoneInputBase from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './PhoneInput.css';

// ─────────────────────────────────────────────────────────────────────────────
// Reusable international phone field.
//
//  - Country picker with flags + per-country validation (libphonenumber).
//  - Defaults to Azerbaijan but accepts any country's number.
//  - `value` / `onChange` work in E.164 (e.g. "+994501234567"); onChange emits
//    undefined when empty, which we normalise to "".
//  - Styled to match the app's other text inputs (same height/border/focus ring).
//
// Validate with `isValidPhoneNumber` from 'react-phone-number-input' (the same
// rules this field enforces).
// ─────────────────────────────────────────────────────────────────────────────

const PhoneInput = ({
    label,
    value,
    onChange,
    error,
    required,
    defaultCountry = 'AZ',
    placeholder = '+994 50 000 00 00',
}) => (
    <div className="mt-4">
        {label && (
            <label className="block text-[12.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-600)] mb-1.5">
                {label}
            </label>
        )}
        <PhoneInputBase
            international
            defaultCountry={defaultCountry}
            value={value || undefined}
            onChange={(v) => onChange(v || '')}
            placeholder={placeholder}
            aria-required={required}
            className={`tu-phone flex items-center w-full h-12 px-3.5 rounded-xl bg-[var(--ink-50)] border outline-none transition-colors focus-within:bg-white focus-within:ring-4 ${
                error
                    ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-100'
                    : 'border-[var(--ink-200)] focus-within:border-[var(--primary)] focus-within:ring-[var(--primary-soft)]'
            }`}
        />
        {error && <p className="mt-1.5 text-[12px] font-medium text-red-500">{error}</p>}
    </div>
);

export default PhoneInput;
