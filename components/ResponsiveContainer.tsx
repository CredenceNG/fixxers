'use client';

import React, { CSSProperties } from 'react';
import { useResponsive } from '@/lib/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  desktopStyle?: CSSProperties;
  mobileStyle?: CSSProperties;
  className?: string;
}

/**
 * A container that automatically applies different styles based on device type
 * On mobile: Stacks children vertically for easy scrolling
 * On desktop: Uses horizontal layouts
 */
export function ResponsiveContainer({
  children,
  desktopStyle = {},
  mobileStyle = {},
  className = '',
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();

  const style = isMobile ? mobileStyle : desktopStyle;

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: string;
  className?: string;
}

/**
 * A grid that automatically becomes a single column on mobile
 */
export function ResponsiveGrid({
  children,
  columns = 2,
  gap = '24px',
  className = '',
}: ResponsiveGridProps) {
  const { isMobile } = useResponsive();

  const style: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : `repeat(${columns}, 1fr)`,
    gap,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: string;
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch';
  className?: string;
  wrap?: boolean;
}

/**
 * A flex container that automatically stacks vertically on mobile
 */
export function ResponsiveFlex({
  children,
  direction = 'row',
  gap = '16px',
  justify = 'flex-start',
  align = 'stretch',
  className = '',
  wrap = false,
}: ResponsiveFlexProps) {
  const { isMobile } = useResponsive();

  const style: CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : direction,
    gap,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
