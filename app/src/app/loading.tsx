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
        <path
          d="M256 88 L404 424 L344 424 L298 320 L214 320 L168 424 L108 424 Z"
          fill="url(#gold-loader)"
        />
        <path d="M256 196 L226 288 L286 288 Z" fill="#09090b" />
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
