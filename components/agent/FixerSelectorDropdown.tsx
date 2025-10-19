'use client';

import { useState, useEffect } from 'react';
import { colors } from '@/lib/theme';

interface Fixer {
  id: string;
  fixer: {
    id: string;
    name: string;
    email: string;
    fixerProfile?: {
      status: string;
    };
  };
  vetStatus: string;
}

interface FixerSelectorDropdownProps {
  value: string;
  onChange: (fixerId: string) => void;
  onlyActive?: boolean;
}

export default function FixerSelectorDropdown({
  value,
  onChange,
  onlyActive = true,
}: FixerSelectorDropdownProps) {
  const [fixers, setFixers] = useState<Fixer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFixers();
  }, []);

  const fetchFixers = async () => {
    try {
      const res = await fetch('/api/agent/fixers');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch fixers');
      }

      let filteredFixers = data.fixers || [];

      // Filter to only active fixers if requested
      if (onlyActive) {
        filteredFixers = filteredFixers.filter(
          (f: Fixer) =>
            f.vetStatus === 'APPROVED' &&
            f.fixer.fixerProfile?.status === 'APPROVED'
        );
      }

      setFixers(filteredFixers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading fixers...</div>;
  }

  if (error) {
    return <div style={{ color: '#EF4444' }}>Error: {error}</div>;
  }

  if (fixers.length === 0) {
    return (
      <div style={{ padding: '12px', backgroundColor: '#FEF3C7', color: '#92400E', borderRadius: '8px' }}>
        You have no {onlyActive ? 'active' : ''} fixers available.
        {onlyActive && ' Only approved fixers can be selected.'}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '12px',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        backgroundColor: colors.white,
      }}
    >
      <option value="">Select a fixer</option>
      {fixers.map((fixer) => (
        <option key={fixer.id} value={fixer.fixer.id}>
          {fixer.fixer.name} ({fixer.fixer.email})
          {fixer.fixer.fixerProfile?.status && ` - ${fixer.fixer.fixerProfile.status}`}
        </option>
      ))}
    </select>
  );
}
