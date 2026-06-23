import { useEffect, useState } from 'react';

// Lightweight confetti — no external deps
export function Confetti({ trigger }: { trigger: boolean }) {
  const [pieces, setPieces] = useState<Array<{ id: number; x: number; color: string; rotate: number; delay: number }>>([]);

  useEffect(() => {
    if (!trigger) return;
    const colors = ['#7C3AED', '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];
    const newPieces = Array.from({ length: 60 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: Math.random() * 360,
      delay: Math.random() * 0.3,
    }));
    setPieces(newPieces);
    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {pieces.map(p => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            backgroundColor: p.color,
            animation: `confetti-fall 3.5s ${p.delay}s linear forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
