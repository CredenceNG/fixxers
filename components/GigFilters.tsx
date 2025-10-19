'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import { useState, useEffect } from 'react';

interface GigFiltersProps {
  categories: {
    id: string;
    name: string;
    subcategories: {
      id: string;
      name: string;
    }[];
  }[];
}

export function GigFilters({ categories }: GigFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedSubcategory, setSelectedSubcategory] = useState(searchParams.get('subcategory') || '');
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '');
  const [selectedTier, setSelectedTier] = useState(searchParams.get('tier') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');

  const selectedCategoryObj = categories.find(cat => cat.id === selectedCategory);
  const subcategories = selectedCategoryObj?.subcategories || [];

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (minAmount) params.set('minAmount', minAmount);
    if (maxAmount) params.set('maxAmount', maxAmount);
    if (selectedTier) params.set('tier', selectedTier);
    if (verifiedOnly) params.set('verified', 'true');

    const queryString = params.toString();
    router.push(`/gigs${queryString ? `?${queryString}` : ''}`);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedTier('');
    setVerifiedOnly(false);
    router.push('/gigs');
  };

  return (
    <div style={{
      backgroundColor: colors.white,
      padding: '20px',
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border}`,
      marginBottom: '32px'
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        {/* Category Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubcategory(''); // Reset subcategory when category changes
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Subcategory
          </label>
          <select
            value={selectedSubcategory}
            onChange={(e) => setSelectedSubcategory(e.target.value)}
            disabled={!selectedCategory}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: selectedCategory ? colors.white : colors.bgSecondary,
              color: colors.textPrimary,
              cursor: selectedCategory ? 'pointer' : 'not-allowed',
            }}
          >
            <option value="">All Subcategories</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min Amount */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Min Amount (₦)
          </label>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Max Amount */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Max Amount (₦)
          </label>
          <input
            type="number"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="999999"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textPrimary,
            }}
          />
        </div>

        {/* Badge Tier Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Badge Tier
          </label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <option value="">All Tiers</option>
            <option value="PLATINUM">🥇 Platinum</option>
            <option value="GOLD">🥇 Gold</option>
            <option value="SILVER">🥈 Silver</option>
            <option value="BRONZE">🥉 Bronze</option>
          </select>
        </div>

        {/* Verified Badge Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Trust Level
          </label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                ✓ Verified Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={clearFilters}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textSecondary,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Clear Filters
        </button>
        <button
          onClick={applyFilters}
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.white,
            backgroundColor: colors.primary,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
