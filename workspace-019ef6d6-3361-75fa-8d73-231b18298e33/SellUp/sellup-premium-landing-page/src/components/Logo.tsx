interface LogoProps {
  size?: number;
  withText?: boolean;
  className?: string;
}

export function Logo({ size = 32, withText = false, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/logo/logo-256.png"
        alt="SellUp"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="font-extrabold tracking-tight" style={{ fontSize: size * 0.65 }}>
          Sell<span className="text-brand-purple">Up</span>
        </span>
      )}
    </div>
  );
}
