export default function Loading() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        zIndex: 9999,
        background: '#09090b',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          background: 'linear-gradient(90deg, transparent, #d4af37, transparent)',
          animation: 'graal-bar 1.2s ease-in-out infinite',
        }}
      />
    </div>
  );
}
