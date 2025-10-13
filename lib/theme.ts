import { CSSProperties } from 'react';

// Fiverr-Inspired Color Palette
export const colors = {
  // Primary brand color - Fiverr Green
  primary: '#1DBF73',
  primaryHover: '#19A463',
  primaryLight: '#E8F7F0',
  primaryDark: '#0D7D47',

  // Secondary colors
  secondary: '#222325',
  secondaryLight: '#404145',

  // Accent colors
  accent: '#FF7640',
  accentHover: '#E6632D',
  blue: '#446EE7',
  blueLight: '#EDF4FF',

  // Status colors
  warning: '#FFBE5B',
  warningDark: '#F59E0B',
  success: '#1DBF73',
  successDark: '#0D7D47',
  error: '#E74C3C',
  errorDark: '#C0392B',
  info: '#446EE7',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EBEBEB',
  gray300: '#D9D9D9',
  gray400: '#B5B6BA',
  gray500: '#95979D',
  gray600: '#74767E',
  gray700: '#62646A',
  gray800: '#404145',
  gray900: '#222325',

  // Text colors
  textPrimary: '#222325',
  textSecondary: '#62646A',
  textTertiary: '#95979D',
  textLight: '#74767E',

  // Background colors
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FAFAFA',
  bgTertiary: '#F5F5F5',

  // Border colors
  border: '#E4E5E7',
  borderLight: '#EBEBEB',
  borderDark: '#D9D9D9',
};

// Keep gradients for backward compatibility but not primary usage
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
  warning: `linear-gradient(135deg, ${colors.warning} 0%, ${colors.warningDark} 100%)`,
  success: `linear-gradient(135deg, ${colors.success} 0%, ${colors.successDark} 100%)`,
};

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  xxxl: '64px',
};

// Border Radius
export const borderRadius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  xxl: '20px',
  full: '9999px',
};

// Shadows - Subtle and clean
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
  xl: '0 8px 16px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
  xxl: '0 16px 32px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
  button: 'none', // Fiverr uses flat buttons
  card: '0 2px 4px rgba(0, 0, 0, 0.08)',
  hover: '0 4px 12px rgba(0, 0, 0, 0.12)',
};

// Typography
export const typography = {
  h1: {
    fontSize: '48px',
    fontWeight: '700',
    lineHeight: '1.2',
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '36px',
    fontWeight: '700',
    lineHeight: '1.3',
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '28px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  h4: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  h5: {
    fontSize: '20px',
    fontWeight: '600',
    lineHeight: '1.5',
  },
  h6: {
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '1.5',
  },
  body: {
    fontSize: '16px',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  bodyLarge: {
    fontSize: '18px',
    fontWeight: '400',
    lineHeight: '1.6',
  },
  bodySmall: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  small: {
    fontSize: '14px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  tiny: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.4',
  },
  caption: {
    fontSize: '12px',
    fontWeight: '400',
    lineHeight: '1.4',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1',
  },
};

// Reusable Style Objects
export const styles = {
  // Layout
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
  } as CSSProperties,

  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `${spacing.xl} ${spacing.lg}`,
  } as CSSProperties,

  // Header
  header: {
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  } as CSSProperties,

  headerContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: `${spacing.md} ${spacing.lg}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  headerTitle: {
    ...typography.h5,
    color: colors.textPrimary,
    margin: 0,
  } as CSSProperties,

  headerSubtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  } as CSSProperties,

  // Buttons
  buttonPrimary: {
    padding: `12px 24px`,
    backgroundColor: colors.primary,
    color: colors.white,
    borderRadius: borderRadius.md,
    fontWeight: '600',
    fontSize: '16px',
    textDecoration: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-block',
  } as CSSProperties,

  buttonSecondary: {
    padding: `12px 24px`,
    backgroundColor: 'transparent',
    color: colors.primary,
    border: `1px solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    display: 'inline-block',
  } as CSSProperties,

  buttonOutline: {
    padding: `12px 24px`,
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontWeight: '500',
    fontSize: '16px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    display: 'inline-block',
  } as CSSProperties,

  buttonGroup: {
    display: 'flex',
    gap: spacing.md,
    alignItems: 'center',
  } as CSSProperties,

  // Cards
  card: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.card,
    transition: 'box-shadow 0.2s ease',
  } as CSSProperties,

  cardHover: {
    boxShadow: shadows.hover,
  } as CSSProperties,

  cardSmall: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
  } as CSSProperties,

  // Stats Card
  statCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    textAlign: 'center' as const,
  } as CSSProperties,

  statLabel: {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase' as const,
    fontWeight: '600',
    letterSpacing: '0.5px',
  } as CSSProperties,

  statValue: {
    ...typography.statNumber,
    color: colors.textPrimary,
  } as CSSProperties,

  statValuePrimary: {
    ...typography.statNumber,
    color: colors.primary,
  } as CSSProperties,

  statValueGradient: (gradient: string) => ({
    ...typography.statNumber,
    color: colors.primary,
  } as CSSProperties),

  // Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  } as CSSProperties,

  // Section
  section: {
    marginBottom: spacing.xl,
  } as CSSProperties,

  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  } as CSSProperties,

  // Table Container
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  } as CSSProperties,

  // Alert Banners
  alertSuccess: {
    backgroundColor: colors.primaryLight,
    border: `1px solid ${colors.primary}`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  } as CSSProperties,

  alertError: {
    backgroundColor: '#FDEDEC',
    border: `1px solid ${colors.error}`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  } as CSSProperties,

  alertWarning: {
    backgroundColor: '#FEF5E7',
    border: `1px solid ${colors.warning}`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  } as CSSProperties,

  alertInfo: {
    backgroundColor: colors.blueLight,
    border: `1px solid ${colors.blue}`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  } as CSSProperties,

  alertBanner: (borderColor: string) => ({
    backgroundColor: colors.white,
    borderLeft: `4px solid ${borderColor}`,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    marginBottom: spacing.xl,
  } as CSSProperties),

  alertContent: {
    display: 'flex',
    alignItems: 'flex-start',
  } as CSSProperties,

  alertIcon: {
    flexShrink: 0,
  } as CSSProperties,

  alertText: {
    marginLeft: spacing.md,
    fontSize: '15px',
    color: colors.textPrimary,
    lineHeight: '1.5',
  } as CSSProperties,

  // Form Elements
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  } as CSSProperties,

  inputFocus: {
    borderColor: colors.primary,
  } as CSSProperties,

  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  } as CSSProperties,

  // Empty State
  emptyState: {
    textAlign: 'center' as const,
    padding: `${spacing.xxl} ${spacing.lg}`,
  } as CSSProperties,

  emptyStateText: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  } as CSSProperties,

  // Links
  link: {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease',
  } as CSSProperties,

  linkHover: {
    color: colors.primaryHover,
    textDecoration: 'underline',
  } as CSSProperties,
};

// Helper function to create gradient text (kept for backward compatibility)
export const gradientText = (gradient: string): CSSProperties => ({
  color: colors.primary,
  fontWeight: '700',
});

// Status badge styles
export const statusBadgeStyles = (status: string): CSSProperties => {
  const baseStyle: CSSProperties = {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: borderRadius.sm,
    display: 'inline-block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  const variants: Record<string, CSSProperties> = {
    PENDING: { backgroundColor: '#FEF5E7', color: '#95620D', border: `1px solid ${colors.warning}` },
    ACTIVE: { backgroundColor: colors.primaryLight, color: colors.primaryDark, border: `1px solid ${colors.primary}` },
    PAID: { backgroundColor: colors.blueLight, color: '#2952A3', border: `1px solid ${colors.blue}` },
    IN_PROGRESS: { backgroundColor: '#FEF5E7', color: '#95620D', border: `1px solid ${colors.warning}` },
    COMPLETED: { backgroundColor: colors.primaryLight, color: colors.primaryDark, border: `1px solid ${colors.primary}` },
    CANCELLED: { backgroundColor: '#FDEDEC', color: '#922B21', border: `1px solid ${colors.error}` },
    SUSPENDED: { backgroundColor: '#FDEDEC', color: '#922B21', border: `1px solid ${colors.error}` },
    REJECTED: { backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.border}` },
    QUOTED: { backgroundColor: colors.blueLight, color: '#2952A3', border: `1px solid ${colors.blue}` },
  };

  return { ...baseStyle, ...(variants[status] || variants.PENDING) };
};

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  shadows,
  typography,
  styles,
  gradientText,
  statusBadgeStyles,
};
