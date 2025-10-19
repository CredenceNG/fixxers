'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

interface NeighborhoodFiltersProps {
  searchQuery: string;
  countryFilter: string;
  stateFilter: string;
  cityFilter: string;
  countries: Array<{ country: string }>;
  states: Array<{ state: string }>;
  cities: Array<{ city: string }>;
}

export default function NeighborhoodFilters({
  searchQuery,
  countryFilter,
  stateFilter,
  cityFilter,
  countries,
  states,
  cities,
}: NeighborhoodFiltersProps) {
  const router = useRouter();

  const buildUrl = (params: { search?: string; country?: string; state?: string; city?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.country) searchParams.set('country', params.country);
    if (params.state) searchParams.set('state', params.state);
    if (params.city) searchParams.set('city', params.city);
    const queryString = searchParams.toString();
    return `/admin/neighborhoods${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <form method="GET" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by neighborhood name..."
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              outline: 'none',
            }}
          />
          <input type="hidden" name="country" value={countryFilter} />
          <input type="hidden" name="state" value={stateFilter} />
          <input type="hidden" name="city" value={cityFilter} />
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Search
          </button>
          {(searchQuery || countryFilter || stateFilter || cityFilter) && (
            <Link
              href="/admin/neighborhoods"
              style={{
                padding: '10px 24px',
                backgroundColor: colors.white,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Clear All
            </Link>
          )}
        </div>

        {/* Filter dropdowns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px' }}>
              Country
            </label>
            <select
              value={countryFilter}
              onChange={(e) => {
                const newCountry = e.target.value;
                router.push(buildUrl({ search: searchQuery, country: newCountry }));
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '14px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                backgroundColor: 'white',
              }}
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px' }}>
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => {
                const newState = e.target.value;
                router.push(buildUrl({ search: searchQuery, country: countryFilter, state: newState }));
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '14px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                backgroundColor: 'white',
              }}
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px' }}>
              City
            </label>
            <select
              value={cityFilter}
              onChange={(e) => {
                const newCity = e.target.value;
                router.push(buildUrl({ search: searchQuery, country: countryFilter, state: stateFilter, city: newCity }));
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                fontSize: '14px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                backgroundColor: 'white',
              }}
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    </div>
  );
}
