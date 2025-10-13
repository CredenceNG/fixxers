'use client';

import Link from 'next/link';
import { colors, borderRadius, shadows } from '@/lib/theme';
import { useState } from 'react';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  color: string;
  gigsCount: number;
  requestsCount: number;
}

export function CategoryCard({ id, name, icon, color, gigsCount, requestsCount }: CategoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={`/categories/${id}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          border: `1px solid ${isHovered ? colors.primary : colors.border}`,
          padding: '24px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          position: 'relative' as const,
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered ? shadows.lg : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Icon Circle */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            marginBottom: '16px',
          }}
        >
          {icon}
        </div>

        {/* Category Name */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: '12px',
          lineHeight: '1.3'
        }}>
          {name}
        </h3>

        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '16px',
          paddingTop: '12px',
          borderTop: `1px solid ${colors.borderLight}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>💼</span>
            <span style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: '500' }}>
              {gigsCount} {gigsCount === 1 ? 'offer' : 'offers'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>📋</span>
            <span style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: '500' }}>
              {requestsCount} {requestsCount === 1 ? 'request' : 'requests'}
            </span>
          </div>
        </div>

        {/* View Link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: colors.primary,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <span>View services</span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}
