/** Which artwork to show: follow the site theme, or always the light-text version (for dark surfaces). */
export type LogoTone = 'auto' | 'on-dark';

interface LogoHorizontalProps {
  height?: number;
  className?: string;
  alt?: string;
  tone?: LogoTone;
}

interface LogoMarkProps {
  size?: number;
  className?: string;
  alt?: string;
}

interface WordmarkProps {
  height?: number;
  className?: string;
  alt?: string;
  tone?: LogoTone;
}

interface MascotImgProps {
  size?: number;
  className?: string;
  alt?: string;
}

/** Official Wormear horizontal lockup (mark + text). Byte-identical SVG served from public/brand. */
export function LogoHorizontal({ height = 32, className, alt = 'Wormear logo', tone = 'auto' }: LogoHorizontalProps) {
  const width = Math.round(height * (2107 / 517));
  if (tone === 'on-dark') {
    return (
      <img
        src="/brand/logo-horizontal-wormear-dark.svg"
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="eager"
        decoding="async"
      />
    );
  }
  const cls = className ? `logo-swap ${className}` : 'logo-swap';
  return (
    <span className={cls} style={{ display: 'inline-flex', width, height }} role="img" aria-label={alt}>
      <img
        src="/brand/logo-horizontal-wormear.svg"
        alt=""
        width={width}
        height={height}
        className="logo-theme-light"
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
      <img
        src="/brand/logo-horizontal-wormear-dark.svg"
        alt=""
        width={width}
        height={height}
        className="logo-theme-dark"
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
    </span>
  );
}

/** Official Wormear mark (favicon / icon use). */
export function LogoMark({ size = 32, className, alt = 'Wormear logo' }: LogoMarkProps) {
  const height = Math.round(size * (517 / 495));
  return (
    <img
      src="/brand/logo-mark-wormear.svg"
      alt={alt}
      width={size}
      height={height}
      className={className}
      loading="eager"
      decoding="async"
    />
  );
}

/** Official Wormear wordmark (text-logo). */
export function Wordmark({ height = 28, className, alt = 'Wormear logo', tone = 'auto' }: WordmarkProps) {
  const width = Math.round(height * (1491 / 249));
  if (tone === 'on-dark') {
    return (
      <img
        src="/brand/text-logo-wormear-dark.svg"
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading="eager"
        decoding="async"
      />
    );
  }
  const cls = className ? `logo-swap ${className}` : 'logo-swap';
  return (
    <span className={cls} style={{ display: 'inline-flex', width, height }} role="img" aria-label={alt}>
      <img
        src="/brand/text-logo-wormear.svg"
        alt=""
        width={width}
        height={height}
        className="logo-theme-light"
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
      <img
        src="/brand/text-logo-wormear-dark.svg"
        alt=""
        width={width}
        height={height}
        className="logo-theme-dark"
        loading="eager"
        decoding="async"
        aria-hidden="true"
      />
    </span>
  );
}

/** Official Melody mascot artwork. */
export function MascotImg({ size = 96, className, alt = 'Melody, the Wormear mascot' }: MascotImgProps) {
  const height = Math.round(size * (2048 / 1720));
  return (
    <img
      src="/brand/wormear-mascot.svg"
      alt={alt}
      width={size}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}
