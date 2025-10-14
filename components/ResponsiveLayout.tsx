'use client';

import { useResponsive } from '@/lib/useResponsive';
import { CSSProperties, ReactNode } from 'react';

interface TwoColumnLayoutProps {
  children: ReactNode;
  ratio?: '1:1' | '3:1' | '2:1';
  mobileGap?: string;
  desktopGap?: string;
}

/**
 * Two-column layout that automatically stacks to single column on mobile
 * @param ratio - Column ratio (1:1, 3:1, or 2:1)
 * @param mobileGap - Gap between items on mobile (default: 16px)
 * @param desktopGap - Gap between items on desktop (default: 24px)
 */
export function TwoColumnLayout({
  children,
  ratio = '1:1',
  mobileGap = '16px',
  desktopGap = '24px',
}: TwoColumnLayoutProps) {
  const { isMobile } = useResponsive();

  const columnTemplates: Record<typeof ratio, string> = {
    '1:1': '1fr 1fr',
    '3:1': '3fr 1fr',
    '2:1': '2fr 1fr',
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : columnTemplates[ratio],
      gap: isMobile ? mobileGap : desktopGap
    }}>
      {children}
    </div>
  );
}

interface FormGridProps {
  children: ReactNode;
  gap?: string;
}

/**
 * Form field grid (2 columns) that becomes single column on mobile
 * Perfect for Country/State, Primary/Secondary Phone, etc.
 * @param gap - Gap between form fields (default: 16px)
 */
export function FormGrid({
  children,
  gap = '16px'
}: FormGridProps) {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap
    }}>
      {children}
    </div>
  );
}

interface ResponsiveFlexProps {
  children: ReactNode;
  gap?: string;
  mobileDirection?: 'row' | 'column';
  desktopDirection?: 'row' | 'column';
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
}

/**
 * Responsive flex container that adapts direction based on screen size
 * Default: row on desktop, column on mobile
 * @param gap - Gap between flex items (default: 16px)
 * @param mobileDirection - Flex direction on mobile (default: column)
 * @param desktopDirection - Flex direction on desktop (default: row)
 * @param align - Align items (default: stretch)
 * @param justify - Justify content (default: flex-start)
 */
export function ResponsiveFlex({
  children,
  gap = '16px',
  mobileDirection = 'column',
  desktopDirection = 'row',
  align = 'stretch',
  justify = 'flex-start',
}: ResponsiveFlexProps) {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? mobileDirection : desktopDirection,
      gap,
      alignItems: align,
      justifyContent: justify,
    }}>
      {children}
    </div>
  );
}
