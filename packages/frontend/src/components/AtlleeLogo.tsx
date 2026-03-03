interface AttleeLogoProps {
  size?: number;
  color?: string;
  showWordmark?: boolean;
}

export default function AttleeLogo({
  size = 32,
  color = '#0F1923',
  showWordmark = true
}: AttleeLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <svg width={size} height={size} viewBox="0 0 72 72" fill="none">
        <polyline
          points="4,48 36,6 68,48"
          stroke={color}
          strokeWidth="6.5"
          fill="none"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        <line
          x1="0"
          y1="59"
          x2="72"
          y2="59"
          stroke="#C4A882"
          strokeWidth="5"
          strokeLinecap="square"
        />
        <line
          x1="0"
          y1="69"
          x2="72"
          y2="69"
          stroke="#C4A882"
          strokeWidth="5"
          strokeLinecap="square"
        />
      </svg>
      {showWordmark && (
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: size * 0.625,
            letterSpacing: '-0.01em',
            color
          }}
        >
          attlee
        </span>
      )}
    </div>
  );
}
