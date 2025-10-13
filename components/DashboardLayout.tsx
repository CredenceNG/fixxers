import React, { CSSProperties } from 'react';
import { colors, borderRadius, shadows, spacing } from '@/lib/theme';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  includeHeader?: boolean;
}

export function DashboardLayout({ children, title, subtitle, actions, includeHeader = false }: DashboardLayoutProps) {
  const containerStyle: CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bgSecondary,
  };

  const headerStyle: CSSProperties = {
    backgroundColor: colors.white,
    borderBottom: `1px solid ${colors.border}`,
    padding: spacing.lg,
  };

  const headerContentStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle: CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: subtitle ? '4px' : '0',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: '14px',
    color: colors.textSecondary,
  };

  const mainStyle: CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.lg,
  };

  return (
    <div style={containerStyle}>
      {(title || actions) && (
        <div style={headerStyle}>
          <div style={headerContentStyle}>
            <div>
              {title && <h1 style={titleStyle}>{title}</h1>}
              {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
            </div>
            {actions && <div>{actions}</div>}
          </div>
        </div>
      )}
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}

interface DashboardCardProps {
  children: React.ReactNode;
  title?: string;
  padding?: string;
  style?: CSSProperties;
}

export function DashboardCard({ children, title, padding = spacing.lg, style }: DashboardCardProps) {
  const cardStyle: CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.card,
    overflow: 'hidden',
    ...style,
  };

  const titleStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.textPrimary,
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
  };

  const contentStyle: CSSProperties = {
    padding,
  };

  return (
    <div style={cardStyle}>
      {title && <div style={titleStyle}>{title}</div>}
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

interface DashboardButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  style?: CSSProperties;
}

export function DashboardButton({
  children,
  onClick,
  variant = 'primary',
  href,
  type = 'button',
  disabled = false,
  style
}: DashboardButtonProps) {
  const baseStyle: CSSProperties = {
    padding: '12px 24px',
    borderRadius: borderRadius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.gray800,
      color: colors.white,
    },
    outline: {
      backgroundColor: colors.white,
      color: colors.textPrimary,
      border: `1px solid ${colors.border}`,
    },
    danger: {
      backgroundColor: colors.error,
      color: colors.white,
    },
  };

  const buttonStyle = { ...baseStyle, ...variants[variant] };

  if (href) {
    return (
      <Link href={href} style={buttonStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
    >
      {children}
    </button>
  );
}

interface DashboardStatProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export function DashboardStat({ label, value, icon, color = colors.primary }: DashboardStatProps) {
  const statStyle: CSSProperties = {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    border: `1px solid ${colors.border}`,
    padding: spacing.lg,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  };

  const iconStyle: CSSProperties = {
    fontSize: '32px',
    width: '56px',
    height: '56px',
    borderRadius: borderRadius.md,
    backgroundColor: `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentStyle: CSSProperties = {
    flex: 1,
  };

  const labelStyle: CSSProperties = {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: '4px',
  };

  const valueStyle: CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: colors.textPrimary,
  };

  return (
    <div style={statStyle}>
      {icon && (
        <div style={iconStyle}>
          <span>{icon}</span>
        </div>
      )}
      <div style={contentStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={valueStyle}>{value}</div>
      </div>
    </div>
  );
}
