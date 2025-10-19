'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

type FormMode = 'existing' | 'new';

interface AddClientFormProps {
  neighborhoods?: any[]; // Legacy prop, no longer used
}

export default function AddClientForm({ neighborhoods }: AddClientFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>('existing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For existing client
  const [existingClientData, setExistingClientData] = useState({
    email: '',
    name: '',
    phone: '',
  });

  // For new client
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    alternateEmail: '',
    streetAddress: '',
  });

  // Location state - using normalized neighborhood ID
  const [neighborhoodId, setNeighborhoodId] = useState('');

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/agent/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: existingClientData.email,
          notes: `Name: ${existingClientData.name}, Phone: ${existingClientData.phone}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add client');
      }

      router.push('/agent/clients');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!neighborhoodId) {
      setError('Please select a location');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          neighborhoodId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register client');
      }

      router.push('/agent/clients');
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
            Add Client
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Add an existing client or register a new one
          </p>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setMode('existing')}
            style={{
              flex: 1,
              padding: '12px',
              border: `2px solid ${mode === 'existing' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: mode === 'existing' ? `${colors.primary}10` : colors.white,
              color: mode === 'existing' ? colors.primary : colors.textPrimary,
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Add Existing Client
          </button>
          <button
            type="button"
            onClick={() => setMode('new')}
            style={{
              flex: 1,
              padding: '12px',
              border: `2px solid ${mode === 'new' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              backgroundColor: mode === 'new' ? `${colors.primary}10` : colors.white,
              color: mode === 'new' ? colors.primary : colors.textPrimary,
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Register New Client
          </button>
        </div>

        {/* Existing Client Form */}
        {mode === 'existing' && (
          <form onSubmit={handleSubmitExisting}>
            <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: borderRadius.lg }}>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '20px' }}>
                Add an existing user as your client. They must already have an account on the platform.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={existingClientData.name}
                    onChange={(e) => setExistingClientData({ ...existingClientData, name: e.target.value })}
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
                    value={existingClientData.email}
                    onChange={(e) => setExistingClientData({ ...existingClientData, email: e.target.value })}
                    placeholder="client@example.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                    }}
                  />
                  <small style={{ color: colors.textSecondary, display: 'block', marginTop: '6px' }}>
                    Must match their registered email
                  </small>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={existingClientData.phone}
                    onChange={(e) => setExistingClientData({ ...existingClientData, phone: e.target.value })}
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
              </div>

              {error && (
                <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: borderRadius.md, marginBottom: '16px' }}>
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
                  {loading ? 'Adding...' : 'Add Client'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* New Client Form */}
        {mode === 'new' && (
          <form onSubmit={handleSubmitNew}>
            <div style={{ backgroundColor: colors.white, padding: '32px', borderRadius: borderRadius.lg }}>
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
                      placeholder="john@example.com"
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

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                      Alternate Email
                    </label>
                    <input
                      type="email"
                      value={formData.alternateEmail}
                      onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
                      placeholder="alternate@example.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.md,
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md }}>
                    <small style={{ color: colors.textSecondary }}>
                      The client will receive a magic link via email to complete registration
                    </small>
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
                  {loading ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
