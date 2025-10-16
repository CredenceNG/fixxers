'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

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
      <style jsx>{`
        .search-container {
          max-width: 900px;
          margin: 0 auto;
          background-color: ${colors.white};
          border-radius: ${borderRadius.lg};
          padding: 8px;
          display: flex;
          gap: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          border: 1px solid ${colors.border};
        }

        @media (max-width: 768px) {
          .search-container {
            flex-direction: column;
            gap: 12px;
            padding: 12px;
          }
        }

        .search-button {
          padding: 16px 48px;
          background-color: ${colors.primary};
          color: ${colors.white};
          border: none;
          border-radius: ${borderRadius.md};
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .search-button {
            width: 100%;
            padding: 14px 24px;
          }
        }
      `}</style>

      <div className="search-container">
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
        <button type="submit" className="search-button">
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
