interface AttleeLogoProps {
  size?: number;
  showWordmark?: boolean;
  color?: string;
}

export default function AttleeLogo({
  size = 32,
  showWordmark = true,
  color = 'var(--type-hi)'
}: AttleeLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {/* Geometric square mark — outer border + filled inner square */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 22 22"
        fill="none"
      >
        <rect x="1" y="1" width="20" height="20" stroke={color} strokeWidth="1.4" />
        <rect x="6" y="6" width="10" height="10" fill={color} />
      </svg>
      {showWordmark && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 400,
          fontSize: size * 0.6,
          letterSpacing: '0.02em',
          color: color
        }}>
          attlee ai
        </span>
      )}
    </div>
  );
}
