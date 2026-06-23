// SellUp shop theme presets — full visual identities

export interface ThemePreset {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Visual config
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  bgPattern: 'glow' | 'grid' | 'dots' | 'gradient' | 'noise' | 'none';
  font: string;        // Google Font name
  radius: string;      // tailwind class suffix
  cardStyle: 'glass' | 'solid' | 'outline' | 'shadow';
  buttonStyle: 'rounded' | 'pill' | 'sharp';
  productCardHover: 'lift' | 'glow' | 'zoom' | 'tilt';
}

export const themes: Record<string, ThemePreset> = {
  default: {
    id: 'default',
    name: 'SellUp Default',
    emoji: '💜',
    description: 'Look premium violet, sombre, glassmorphism',
    primary: '#7C3AED',
    secondary: '#6366F1',
    accent: '#F59E0B',
    bg: '#08080C',
    bgPattern: 'glow',
    font: 'Inter',
    radius: 'xl',
    cardStyle: 'glass',
    buttonStyle: 'rounded',
    productCardHover: 'lift',
  },
  neon: {
    id: 'neon',
    name: 'Cyberpunk Neon',
    emoji: '🌃',
    description: 'Néons cyan/magenta sur fond noir profond',
    primary: '#00F0FF',
    secondary: '#FF00E5',
    accent: '#FAFF00',
    bg: '#040408',
    bgPattern: 'grid',
    font: 'Orbitron',
    radius: 'none',
    cardStyle: 'outline',
    buttonStyle: 'sharp',
    productCardHover: 'glow',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Light',
    emoji: '✨',
    description: 'Clair, épuré, typographie soignée',
    primary: '#000000',
    secondary: '#666666',
    accent: '#FF5500',
    bg: '#FAFAFA',
    bgPattern: 'none',
    font: 'Inter',
    radius: 'sm',
    cardStyle: 'solid',
    buttonStyle: 'rounded',
    productCardHover: 'zoom',
  },
  gaming: {
    id: 'gaming',
    name: 'Gaming Pro',
    emoji: '🎮',
    description: 'Violet/rose gaming, ambiance Discord',
    primary: '#7C3AED',
    secondary: '#EC4899',
    accent: '#F59E0B',
    bg: '#0F0817',
    bgPattern: 'dots',
    font: 'Rajdhani',
    radius: 'lg',
    cardStyle: 'glass',
    buttonStyle: 'pill',
    productCardHover: 'tilt',
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury Gold',
    emoji: '👑',
    description: 'Or et noir, élégance haut de gamme',
    primary: '#D4AF37',
    secondary: '#FFD700',
    accent: '#FF6B35',
    bg: '#0A0A0A',
    bgPattern: 'gradient',
    font: 'Playfair Display',
    radius: 'md',
    cardStyle: 'shadow',
    buttonStyle: 'rounded',
    productCardHover: 'lift',
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    emoji: '🌊',
    description: 'Bleu profond, ambiance aquatique',
    primary: '#0EA5E9',
    secondary: '#06B6D4',
    accent: '#10B981',
    bg: '#020617',
    bgPattern: 'gradient',
    font: 'Poppins',
    radius: 'xl',
    cardStyle: 'glass',
    buttonStyle: 'rounded',
    productCardHover: 'glow',
  },
};

export function applyTheme(shop: any): React.CSSProperties {
  const preset = themes[shop.theme_preset || 'default'] || themes.default;
  // Allow per-shop color override
  const primary = shop.theme_color || preset.primary;
  const secondary = shop.secondary_color || preset.secondary;
  const accent = shop.accent_color || preset.accent;
  const bg = shop.background_color || preset.bg;

  return {
    '--shop-primary': primary,
    '--shop-secondary': secondary,
    '--shop-accent': accent,
    '--shop-bg': bg,
    '--shop-radius': radiusMap[shop.border_radius || preset.radius] || '1rem',
    '--shop-font': `"${shop.font_family || preset.font}", sans-serif`,
  } as React.CSSProperties;
}

const radiusMap: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
};

export function getTheme(shop: any): ThemePreset {
  return themes[shop.theme_preset || 'default'] || themes.default;
}

// Inject Google Font once per font name
const loadedFonts = new Set<string>();
export function loadFont(fontFamily: string) {
  if (loadedFonts.has(fontFamily)) return;
  loadedFonts.add(fontFamily);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

// Background pattern component
export function getBackgroundStyle(shop: any): React.CSSProperties {
  const preset = getTheme(shop);
  const pattern = shop.background_pattern || preset.bgPattern;
  const bg = shop.background_color || preset.bg;
  const primary = shop.theme_color || preset.primary;

  switch (pattern) {
    case 'grid':
      return {
        backgroundColor: bg,
        backgroundImage: `linear-gradient(${primary}15 1px, transparent 1px), linear-gradient(90deg, ${primary}15 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      };
    case 'dots':
      return {
        backgroundColor: bg,
        backgroundImage: `radial-gradient(${primary}30 1.5px, transparent 1.5px)`,
        backgroundSize: '24px 24px',
      };
    case 'gradient':
      return {
        background: `linear-gradient(135deg, ${bg} 0%, ${primary}15 50%, ${bg} 100%)`,
      };
    case 'noise':
      return {
        backgroundColor: bg,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)'/%3E%3C/svg%3E")`,
      };
    case 'glow':
      return { backgroundColor: bg };
    case 'none':
    default:
      return { backgroundColor: bg };
  }
}
