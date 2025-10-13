'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface GigActionsProps {
  gigId: string;
  status: string;
}

export default function GigActions({ gigId, status }: GigActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePause = async () => {
    if (!confirm('Are you sure you want to pause this gig? It will not be visible to clients.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/fixer/gigs/${gigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to pause gig');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fixer/gigs/${gigId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to activate gig');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'ACTIVE') {
    return (
      <button
        onClick={handlePause}
        disabled={loading}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.textSecondary,
          backgroundColor: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.md,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Pausing...' : 'Pause'}
      </button>
    );
  }

  if (status === 'PAUSED') {
    return (
      <button
        onClick={handleActivate}
        disabled={loading}
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.success,
          backgroundColor: colors.white,
          border: `1px solid ${colors.success}`,
          borderRadius: borderRadius.md,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Activating...' : 'Activate'}
      </button>
    );
  }

  return null;
}
