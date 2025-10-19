'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

interface RegisterFixerFormProps {
  neighborhoods?: any[]; // Legacy prop, no longer used
}

export default function RegisterFixerForm({ neighborhoods }: RegisterFixerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    streetAddress: '',
    vetNotes: '',
  });

  // Location state - using normalized neighborhood ID
  const [neighborhoodId, setNeighborhoodId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!neighborhoodId) {
      setError('Please select a location');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/fixers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighborhoodId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register fixer');
      }

      router.push(`/agent/fixers/${data.fixer.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Register New Fixer
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Register a new fixer with full profile information
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: borderRadius.lg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* Basic Information */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${colors.border}` }}>
            Basic Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="fixer@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
              <small style={{ color: colors.textSecondary, display: 'block', marginTop: '6px' }}>
                The fixer will receive a magic link via email to complete registration
              </small>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Primary Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 123 456 7890"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Secondary Phone
              </label>
              <input
                type="tel"
                value={formData.secondaryPhone}
                onChange={(e) => setFormData({ ...formData, secondaryPhone: e.target.value })}
                placeholder="+234 987 654 3210"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${colors.border}` }}>
            Location
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <LocationCascadeSelect
              value={neighborhoodId}
              onChange={setNeighborhoodId}
              required
              label=""
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
              Street Address
            </label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              placeholder="Enter street address"
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Vetting Information */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '12px', borderBottom: `2px solid ${colors.border}` }}>
            Vetting Information
          </h2>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
              Vetting Notes
            </label>
            <textarea
              value={formData.vetNotes}
              onChange={(e) => setFormData({ ...formData, vetNotes: e.target.value })}
              placeholder="Add any vetting information (background check, references, etc.)"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.md, marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: colors.white,
              color: colors.textPrimary,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: borderRadius.md,
              backgroundColor: colors.primary,
              color: colors.white,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {loading ? 'Registering...' : 'Register Fixer'}
          </button>
        </div>
      </div>
    </form>
      </div>
    </div>
  );
}
