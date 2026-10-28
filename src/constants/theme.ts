/**
 * Tokens de diseño de AppAr. La app es deliberadamente solo oscura: la paleta,
 * los degradados y la tipografía de abajo se comparten en todas las pantallas.
 */

import '@/global.css';

export const Colors = {
  background: '#07080C',
  backgroundAlt: '#0B0D13',
  surface: '#10131B',
  surfaceHigh: '#161A24',
  surfaceGlass: 'rgba(22, 26, 36, 0.72)',
  border: '#202532',
  borderSoft: 'rgba(255, 255, 255, 0.06)',
  text: '#F7F8FB',
  textSecondary: '#9AA4B8',
  textMuted: '#626C80',
  accent: '#7C5CFF',
  accentLight: '#A78BFA',
  accentSoft: 'rgba(124, 92, 255, 0.14)',
  cyan: '#31E1E8',
  positive: '#3DDC97',
  positiveSoft: 'rgba(61, 220, 151, 0.12)',
  negative: '#FF5C7C',
  negativeSoft: 'rgba(255, 92, 124, 0.12)',
  warning: '#FFB547',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const Gradients = {
  background: ['#080A11', '#07080C'] as const,
  hero: ['#2A1D63', '#161A2E', '#10131B'] as const,
  accent: ['#8B6CFF', '#6C4EF6'] as const,
  positive: ['rgba(61, 220, 151, 0.20)', 'rgba(61, 220, 151, 0.02)'] as const,
  negative: ['rgba(255, 92, 124, 0.20)', 'rgba(255, 92, 124, 0.02)'] as const,
  neutral: ['rgba(124, 92, 255, 0.18)', 'rgba(16, 19, 27, 0.02)'] as const,
  tabActive: ['rgba(124, 92, 255, 0.34)', 'rgba(124, 92, 255, 0.08)'] as const,
  chartLine: ['#A78BFA', '#7C5CFF'] as const,
} as const;

export const Fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
  mono: 'monospace',
} as const;

export type ThemeColor =
  | 'text'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'textSecondary';

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  xlarge: 26,
  pill: 999,
} as const;

export const BottomTabInset = 104;
export const MaxContentWidth = 760;
