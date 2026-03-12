export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
        gap: '20px',
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 512 512"
        style={{ animation: 'graal-pulse 1.8s ease-in-out infinite' }}
      >
        <defs>
          <linearGradient id="gold-loader" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8c54a" />
            <stop offset="100%" stopColor="#b8922a" />
          </linearGradient>
        </defs>
        <polygon
          points="256,80 396,148 396,364 256,432 116,364 116,148"
          fill="none"
          stroke="url(#gold-loader)"
          strokeWidth="6"
        />
        <path d="M216 190 h80 l-10 76 c-2 18-16 28-30 28s-28-10-30-28Z" fill="url(#gold-loader)" />
        <rect x="248" y="294" width="16" height="28" fill="url(#gold-loader)" />
        <rect x="228" y="318" width="56" height="8" rx="4" fill="url(#gold-loader)" />
      </svg>
      <span
        style={{
          color: '#d4af37',
          fontSize: '1.05rem',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
        }}
      >
        Graal
      </span>
      <style>{`
        @keyframes graal-pulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
