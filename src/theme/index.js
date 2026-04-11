// src/theme/index.js
// Apple Fitness-inspired theme with vibrant gradients and glow effects

export const colors = {
  // Apple Fitness-style dark backgrounds
  bgPrimary: '#000000',
  bgSecondary: '#0A0A0A',
  bgTertiary: '#141414',
  bgCard: '#1C1C1E',
  bgCardElevated: '#2C2C2E',
  bgInput: '#1C1C1E',

  // Apple Fitness vibrant ring colors
  // Move ring - Red/Pink
  ringRed: '#FF375F',
  ringRedLight: '#FF6B8A',
  ringRedDark: '#E0264B',
  ringRedMuted: 'rgba(255, 55, 95, 0.15)',
  ringRedGlow: 'rgba(255, 55, 95, 0.4)',

  // Exercise ring - Neon Green
  ringGreen: '#30D158',
  ringGreenLight: '#5AE07A',
  ringGreenDark: '#24A844',
  ringGreenMuted: 'rgba(48, 209, 88, 0.15)',
  ringGreenGlow: 'rgba(48, 209, 88, 0.4)',

  // Stand ring - Electric Blue/Cyan
  ringBlue: '#64D2FF',
  ringBlueLight: '#8FDEFF',
  ringBlueDark: '#40B8E6',
  ringBlueMuted: 'rgba(100, 210, 255, 0.15)',
  ringBlueGlow: 'rgba(100, 210, 255, 0.4)',

  // Legacy colors (mapped to new system)
  primary: '#64D2FF',
  primaryLight: '#8FDEFF',
  primaryDark: '#40B8E6',
  primaryMuted: 'rgba(100, 210, 255, 0.15)',
  primaryMutedStrong: 'rgba(100, 210, 255, 0.25)',

  success: '#30D158',
  successLight: '#5AE07A',
  successDark: '#24A844',
  successMuted: 'rgba(48, 209, 88, 0.15)',
  successMutedStrong: 'rgba(48, 209, 88, 0.25)',

  warning: '#FF9F0A',
  warningLight: '#FFB84D',
  warningDark: '#E68A00',
  warningMuted: 'rgba(255, 159, 10, 0.15)',
  warningMutedStrong: 'rgba(255, 159, 10, 0.25)',

  error: '#FF375F',
  errorLight: '#FF6B8A',
  errorDark: '#E0264B',
  errorMuted: 'rgba(255, 55, 95, 0.15)',
  errorMutedStrong: 'rgba(255, 55, 95, 0.25)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A6',
  textTertiary: '#636366',
  textDisabled: '#48484A',

  // Gradients
  gradients: {
    formScore: ['#FF375F', '#FF6B8A'],
    velocity: ['#30D158', '#5AE07A'],
    reps: ['#64D2FF', '#8FDEFF'],
    warmOrange: ['#FF9F0A', '#FFB84D'],
  },

  // Borders & Dividers
  border: '#38383A',
  borderLight: '#48484A',
  divider: 'rgba(255, 255, 255, 0.08)',
  separator: 'rgba(84, 84, 88, 0.65)',

  // Score tiers
  scoreGreat: '#30D158',
  scoreGood: '#FF9F0A',
  scoreAverage: '#FFB84D',
  scorePoor: '#FF375F',
};

export const typography = {
  weightRegular: '400',
  weightMedium: '500',
  weightSemibold: '600',
  weightBold: '700',
  weightExtrabold: '800',

  xs: 10,
  sm: 11,
  base: 13,
  lg: 15,
  xl: 17,
  '2xl': 20,
  '3xl': 22,
  '4xl': 28,
  '5xl': 34,
  '6xl': 48,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const borderRadius = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  glow: (color = colors.ringBlue) => ({
    shadowColor: color,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  }),
  ring: (color = colors.ringBlue) => ({
    shadowColor: color,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  }),
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export default theme;
