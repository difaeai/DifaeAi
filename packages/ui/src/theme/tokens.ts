export const colors = {
  primary: '#4F46E5',
  accent: '#22D3EE',
  dark: '#0B1220',
  muted: '#1F2937',
  foreground: '#F9FAFB',
  background: '#070B16'
} as const;

export const fonts = {
  heading: 'var(--font-inter)',
  body: 'var(--font-inter)'
} as const;

export const radii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  pill: '999px'
} as const;

export const shadows = {
  soft: '0 20px 60px rgba(15, 23, 42, 0.25)',
  glow: '0 0 40px rgba(79, 70, 229, 0.45)'
} as const;

export const layout = {
  maxWidth: '1200px',
  sectionSpacing: '6rem'
} as const;

export type ThemeTokens = {
  colors: typeof colors;
  fonts: typeof fonts;
  radii: typeof radii;
  shadows: typeof shadows;
  layout: typeof layout;
};

export const theme: ThemeTokens = {
  colors,
  fonts,
  radii,
  shadows,
  layout
};
