import { useId } from 'react';
import { WarningCircle, CheckCircle } from '@phosphor-icons/react';

/**
 * Shared Wormear text field — mirrors wormear-app TextField.
 * Label + hint + error/success, never color-alone validation,
 * 44px touch target, aria-invalid/describedby wired.
 */
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'password' | 'search' | 'tel';
  placeholder?: string;
  hint?: string;
  error?: string;
  success?: string;
  required?: boolean;
  autoComplete?: string;
  multiline?: boolean;
  id?: string;
}

export default function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  error,
  success,
  required = false,
  autoComplete,
  multiline = false,
  id,
}: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? `field-${autoId}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {label} {required && <span className="field-required" aria-hidden="true">*</span>}
      </label>
      {hint && !error && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {multiline ? (
        <textarea
          id={fieldId}
          className={`textarea${success && !error ? ' input-valid' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-required={required || undefined}
        />
      ) : (
        <input
          id={fieldId}
          className={`input${success && !error ? ' input-valid' : ''}`}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-required={required || undefined}
        />
      )}
      {error && (
        <p className="field-error-text" id={errorId} role="alert">
          <WarningCircle size={16} weight="fill" aria-hidden="true" /> {error}
        </p>
      )}
      {success && !error && (
        <p className="field-success-text">
          <CheckCircle size={16} weight="fill" aria-hidden="true" /> {success}
        </p>
      )}
    </div>
  );
}
