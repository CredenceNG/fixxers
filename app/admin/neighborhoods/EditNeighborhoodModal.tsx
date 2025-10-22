'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface EditNeighborhoodModalProps {
  neighborhood: {
    id: string;
    name: string;
    legacyCity: string | null;
    legacyState: string | null;
    legacyCountry: string | null;
  };
  onClose: () => void;
}

export function EditNeighborhoodModal({ neighborhood, onClose }: EditNeighborhoodModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: neighborhood.name,
    legacyCity: neighborhood.legacyCity || '',
    legacyState: neighborhood.legacyState || '',
    legacyCountry: neighborhood.legacyCountry || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/neighborhoods/${neighborhood.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update neighborhood');
      }

      router.refresh();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update neighborhood');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
          padding: '32px',
          width: '90%',
          maxWidth: '500px',
          zIndex: 9999,
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
          Edit Neighborhood
        </h2>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: colors.errorLight,
              border: `1px solid ${colors.error}`,
              borderRadius: borderRadius.md,
              marginBottom: '16px',
            }}
          >
            <p style={{ fontSize: '14px', color: colors.errorDark, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px',
              }}
            >
              Neighborhood Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
              }}
            />
          </div>

          {/* City Field */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="city"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px',
              }}
            >
              City *
            </label>
            <input
              type="text"
              id="city"
              value={formData.legacyCity}
              onChange={(e) => setFormData({ ...formData, legacyCity: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
              }}
            />
          </div>

          {/* State Field */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="state"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px',
              }}
            >
              State *
            </label>
            <input
              type="text"
              id="state"
              value={formData.legacyState}
              onChange={(e) => setFormData({ ...formData, legacyState: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
              }}
            />
          </div>

          {/* Country Field */}
          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="country"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: '8px',
              }}
            >
              Country *
            </label>
            <input
              type="text"
              id="country"
              value={formData.legacyCountry}
              onChange={(e) => setFormData({ ...formData, legacyCountry: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.white,
                backgroundColor: loading ? colors.textSecondary : colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
