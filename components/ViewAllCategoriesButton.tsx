'use client';

import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';
import { useState } from 'react';

export function ViewAllCategoriesButton() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href="/gigs"
      style={{
        display: 'inline-block',
        padding: '14px 32px',
        backgroundColor: isHovered ? colors.primaryDark : colors.primary,
        color: colors.white,
        borderRadius: borderRadius.md,
        textDecoration: 'none',
        fontSize: '16px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      Browse All Service Offers
    </Link>
  );
}
