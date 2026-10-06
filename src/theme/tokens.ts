/**
 * Wormear shared design system — single source of truth for web + app.
 * MUST stay in sync with wormear-app/src/theme/tokens.ts.
 *
 * Brand (fixed by "I can play." artwork): cream paper, plum ink,
 * coral Melody, sun highlights, blush soft tint.
 *
 * Themes are designed independently — dark is NOT an inversion:
 * - light: cream bg #FBF3D3, paper cards, plum text (plum on cream ≈ 12:1)
 * - dark: deep plum bg #17102E, raised #241A4D surfaces, cream text,
 *   coral brightened for contrast, sun reserved for large/bold + focus.
 *
 * Shared language: radius 14 buttons / 12 inputs / 16–20 cards,
 * 2px borders, 3px tactile bottom edge on primary actions,
 * spacing 4/8/12/16/20/24/32, press scale .97, focus ring 3px.
 */
export const brand = {
  cream: '#FBF3D3',
  creamDeep: '#F5E7A8',
  paper: '#FFFEF6',
  plum: '#3B1F5C',
  plumDeep: '#28194A',
  coral: '#FF6B4A',
  coralDeep: '#D55236',
  coralBright: '#FF8A70',
  sun: '#FFC93C',
  sunDeep: '#B97F0A',
  sunTint: '#FFF1C0',
  blush: '#F8B7A3',
} as const;

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceRaised: string;
  ink: string;
  muted: string;
  faint: string;
  line: string;
  lineStrong: string;
  primary: string;
  primaryEdge: string;
  coral: string;
  coralEdge: string;
  sun: string;
  sunEdge: string;
  focus: string;
  success: string;
  danger: string;
  navBg: string;
}

export const lightColors: ThemeColors = {
  bg: '#FBF3D3',
  bgAlt: '#F5E7A8',
  surface: '#FFFEF6',
  surfaceRaised: '#FFFFFF',
  ink: '#3B1F5C',
  muted: '#61547F',
  faint: '#8B7FA8',
  line: '#E7D9A8',
  lineStrong: '#C9AE5E',
  primary: '#3B1F5C',
  primaryEdge: '#28194A',
  coral: '#FF6B4A',
  coralEdge: '#D55236',
  sun: '#FFC93C',
  sunEdge: '#B97F0A',
  focus: '#D55236',
  success: '#1D7A45',
  danger: '#B3371F',
  navBg: 'rgba(251, 243, 211, 0.94)',
};

export const darkColors: ThemeColors = {
  bg: '#17102E',
  bgAlt: '#1E1540',
  surface: '#241A4D',
  surfaceRaised: '#2E2260',
  ink: '#F7EFD0',
  muted: '#C4B8E8',
  faint: '#9A8CC8',
  line: '#4A3A7A',
  lineStrong: '#6A55A0',
  primary: '#FFC93C',
  primaryEdge: '#B97F0A',
  coral: '#FF8A70',
  coralEdge: '#D55236',
  sun: '#FFC93C',
  sunEdge: '#B97F0A',
  focus: '#FFC93C',
  success: '#4ADE80',
  danger: '#FF9A86',
  navBg: 'rgba(23, 16, 46, 0.92)',
};

export const radius = { sm: 12, md: 14, lg: 16, xl: 20, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

export const typeScale = {
  display: { size: 'clamp(2.4rem, 5.2vw, 4rem)', weight: 900, leading: 1.0, tracking: '-0.02em' },
  h2: { size: 'clamp(1.8rem, 3.4vw, 2.6rem)', weight: 900, leading: 1.05, tracking: '-0.02em' },
  h3: { size: '1.16rem', weight: 800, leading: 1.3, tracking: '0' },
  body: { size: '1rem', weight: 400, leading: 1.6, tracking: '0' },
} as const;

export const tokens = {
  brand,
  light: lightColors,
  dark: darkColors,
  radius,
  spacing,
  typeScale,
  font: "'Nunito', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  philosophy: ['Learn', 'Practice', 'Play', 'Progress', 'Repeat'] as const,
  promise: 'Turn people who wish they could play into people who actually play.',
  // Back-compat aliases (light theme)
  colors: {
    cream: '#FBF3D3',
    creamDeep: '#F5E7A8',
    paper: '#FFFEF6',
    plum: '#3B1F5C',
    plumDeep: '#28194A',
    coral: '#FF6B4A',
    coralDeep: '#D55236',
    sun: '#FFC93C',
    sunDeep: '#B97F0A',
    sunTint: '#FFF1C0',
    blush: '#F8B7A3',
    primary: '#3B1F5C',
    primaryDark: '#28194A',
    primaryDeep: '#28194A',
    sky: '#FFC93C',
    skyLight: '#FFF1C0',
    success: '#1D7A45',
    bg: '#FBF3D3',
    ink: '#3B1F5C',
    muted: '#61547F',
  },
} as const;

export type WormearColor = keyof typeof tokens.colors;
