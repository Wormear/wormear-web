interface MascotProps {
  level?: number;
  size?: number;
  label?: string;
}

/**
 * Melody the earthworm — official Wormear mascot artwork.
 * `level` is accepted for back-compat with existing callers but no longer
 * changes the artwork (official SVG is used as-is).
 */
export default function Mascot({ level, size = 96, label = 'Melody, the Wormear mascot' }: MascotProps) {
  void level;
  const height = Math.round(size * (2048 / 1720));
  return (
    <img
      src="/brand/wormear-mascot.svg"
      alt={label}
      width={size}
      height={height}
      loading="lazy"
      decoding="async"
    />
  );
}
