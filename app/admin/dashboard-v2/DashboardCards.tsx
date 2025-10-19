'use client';

import Link from 'next/link';
import { colors } from '@/lib/theme';
import { ReactNode } from 'react';

export function ActionCard({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: colors.white,
          padding: '16px 20px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
      >
        {children}
      </div>
    </Link>
  );
}

export function QuickActionCard({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>{icon}</div>
        <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{label}</p>
      </div>
    </Link>
  );
}
