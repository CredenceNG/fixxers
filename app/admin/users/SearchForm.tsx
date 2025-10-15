'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) {
      params.set('search', search.trim());
      params.set('page', '1'); // Reset to first page on new search
    } else {
      params.delete('search');
    }

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone, or service..."
          style={{
            padding: '10px 16px',
            paddingRight: search ? '40px' : '16px',
            fontSize: '14px',
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            outline: 'none',
            width: '300px',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        )}
      </div>
      <button
        type="submit"
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.white,
          backgroundColor: colors.primary,
          border: 'none',
          borderRadius: borderRadius.md,
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  );
}
