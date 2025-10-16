'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/gigs?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/gigs');
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <div className={styles.searchContainer}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' }}>
          <span style={{ fontSize: '20px', color: colors.textSecondary }}>🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "plumbing", "electrical"...'
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '18px',
              padding: '16px 0',
              color: colors.textPrimary,
              backgroundColor: 'transparent',
            }}
          />
        </div>
        <button type="submit" className={styles.searchButton} style={{ backgroundColor: colors.primary }}>
          Search
        </button>
      </div>

      {/* Popular Searches */}
      <div style={{ marginTop: '24px' }}>
        <span style={{ fontSize: '14px', color: colors.textSecondary, marginRight: '12px' }}>Popular:</span>
        {['Plumbing', 'Electrical', 'Cleaning', 'Carpentry'].map((service) => (
          <button
            key={service}
            type="button"
            onClick={() => {
              setQuery(service);
              router.push(`/gigs?q=${encodeURIComponent(service.toLowerCase())}`);
            }}
            style={{
              display: 'inline-block',
              padding: '6px 16px',
              margin: '4px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.full,
              fontSize: '14px',
              color: colors.textPrimary,
              textDecoration: 'none',
              backgroundColor: colors.white,
              cursor: 'pointer',
            }}
          >
            {service}
          </button>
        ))}
      </div>
    </form>
  );
}
