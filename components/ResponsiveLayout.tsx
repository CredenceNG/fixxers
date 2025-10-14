import { ReactNode } from 'react';

interface TwoColumnLayoutProps {
  children: ReactNode;
  ratio?: '1:1' | '3:1' | '2:1';
  className?: string;
}

/**
 * Two-column layout that automatically stacks to single column on mobile
 * Uses Tailwind CSS responsive utilities
 */
export function TwoColumnLayout({
  children,
  ratio = '1:1',
  className = '',
}: TwoColumnLayoutProps) {
  const ratioClasses = {
    '1:1': 'md:grid-cols-2',
    '3:1': 'md:grid-cols-[3fr_1fr]',
    '2:1': 'md:grid-cols-[2fr_1fr]',
  };

  return (
    <div className={`grid grid-cols-1 ${ratioClasses[ratio]} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Form field grid (2 columns) that becomes single column on mobile
 * Uses Tailwind CSS responsive utilities
 */
export function FormGrid({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Responsive flex container that adapts direction based on screen size
 * Uses Tailwind CSS responsive utilities
 */
export function ResponsiveFlex({
  children,
  mobileDirection = 'column',
  desktopDirection = 'row',
  align = 'stretch',
  justify = 'start',
  className = '',
}: {
  children: ReactNode;
  mobileDirection?: 'row' | 'column';
  desktopDirection?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}) {
  const mobileFlexDir = mobileDirection === 'row' ? 'flex-row' : 'flex-col';
  const desktopFlexDir = desktopDirection === 'row' ? 'md:flex-row' : 'md:flex-col';

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div className={`flex ${mobileFlexDir} ${desktopFlexDir} gap-4 ${alignClasses[align]} ${justifyClasses[justify]} ${className}`}>
      {children}
    </div>
  );
}
