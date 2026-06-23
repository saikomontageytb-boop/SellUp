import { Star } from 'lucide-react';

export function Stars({ rating, size = 16, showNumber = false, count }: {
  rating: number | null | undefined;
  size?: number;
  showNumber?: boolean;
  count?: number;
}) {
  const r = rating || 0;
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(n => (
          <Star
            key={n}
            style={{ width: size, height: size }}
            className={n <= Math.round(r) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}
          />
        ))}
      </div>
      {showNumber && r > 0 && (
        <span className="text-sm text-white/70 ml-1">
          {r.toFixed(1)}
          {count !== undefined && count > 0 && <span className="text-white/40"> ({count})</span>}
        </span>
      )}
    </div>
  );
}

export function StarsInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-white/30 hover:text-white/50'}`}
          />
        </button>
      ))}
    </div>
  );
}
