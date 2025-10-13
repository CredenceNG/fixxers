'use client';

import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '12px 24px',
        backgroundColor: 'transparent',
        color: colors.textSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: borderRadius.md,
        fontWeight: '600',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.textSecondary;
        e.currentTarget.style.color = colors.textPrimary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.style.color = colors.textSecondary;
      }}
    >
      Logout
    </button>
  );
}
