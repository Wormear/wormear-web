import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Shared Wormear button — mirrors wormear-app Button.
 * Variants: primary (theme action) · dark · coral · sun · light ·
 * secondary (alias of light) · ghost · white.
 * Sizes sm/md/lg. `loading` shows a spinner, disables, sets aria-busy.
 */
type Variant =
  | 'primary'
  | 'dark'
  | 'coral'
  | 'sun'
  | 'light'
  | 'secondary'
  | 'ghost'
  | 'white'
  | 'sky';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  to?: string;
  state?: unknown;
  href?: string;
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
}

// Legacy alias: old sky-blue secondary now maps to sun highlight.
const legacy: Record<string, Variant> = { sky: 'sun', secondary: 'light' };

export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  state,
  href,
  block = false,
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const v = legacy[variant] ?? variant;
  const cls = `btn btn-${v} btn-${size}${block ? ' btn-block' : ''}${loading ? ' btn-loading' : ''} ${className}`.trim();
  const isDisabled = disabled || loading;
  const content = (
    <>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link to={to} state={state as never} className={cls} {...(loading ? { 'aria-disabled': true } : {})}>
        {content}
      </Link>
    );
  }
  if (href && !isDisabled) {
    const external = /^https?:/.test(href);
    return (
      <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} disabled={isDisabled} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}
