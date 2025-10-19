'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/lib/theme';
import TerritorySelector from '@/components/agent/TerritorySelector';

interface Neighborhood {
  id: string;
  name: string;
  city: {
    name: string;
    state: string;
  };
}

interface TerritoryData {
  approvedNeighborhoods: Neighborhood[];
  pendingNeighborhoods: Neighborhood[];
}

export default function AgentTerritoryClient() {
  const [data, setData] = useState<TerritoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    fetchTerritories();
  }, []);

  const fetchTerritories = async () => {
    try {
      const res = await fetch('/api/agent/territory');
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch territories');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedNeighborhoods.length === 0) {
      setSubmitError('Please select at least one neighborhood');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const res = await fetch('/api/agent/territory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neighborhoodIds: selectedNeighborhoods }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to request territories');
      }

      setSubmitSuccess('Territory request submitted successfully');
      setSelectedNeighborhoods([]);
      // Refresh data
      fetchTerritories();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: colors.textSecondary }}>Loading territories...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: colors.error }}>{error || 'Failed to load territories'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Territory Management
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Manage your approved territories and request new ones
          </p>
        </div>

        {/* Approved Territories */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Approved Territories ({data.approvedNeighborhoods.length})
          </h2>

          {data.approvedNeighborhoods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: colors.textSecondary }}>
                No approved territories yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {data.approvedNeighborhoods.map((neighborhood) => (
                <div
                  key={neighborhood.id}
                  style={{
                    padding: '16px',
                    backgroundColor: colors.bgTertiary,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    {neighborhood.name}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                    {neighborhood.city.name}, {neighborhood.city.state}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Territories */}
        {data.pendingNeighborhoods.length > 0 && (
          <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
              Pending Approval ({data.pendingNeighborhoods.length})
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {data.pendingNeighborhoods.map((neighborhood) => (
                <div
                  key={neighborhood.id}
                  style={{
                    padding: '16px',
                    backgroundColor: colors.warningLight,
                    borderRadius: '8px',
                    border: `1px solid ${colors.warning}`,
                  }}
                >
                  <div style={{ fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    {neighborhood.name}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                    {neighborhood.city.name}, {neighborhood.city.state}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.warningDark, marginTop: '8px' }}>
                    Awaiting approval
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request New Territories */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Request New Territories
          </h2>

          {submitSuccess && (
            <div style={{ padding: '12px', backgroundColor: colors.successLight, color: colors.successDark, borderRadius: '8px', marginBottom: '16px' }}>
              {submitSuccess}
            </div>
          )}

          {submitError && (
            <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: '8px', marginBottom: '16px' }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: colors.textPrimary }}>
                Select Neighborhoods
              </label>
              <TerritorySelector
                selectedIds={selectedNeighborhoods}
                onChange={setSelectedNeighborhoods}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || selectedNeighborhoods.length === 0}
              style={{
                padding: '12px 24px',
                backgroundColor: selectedNeighborhoods.length > 0 ? colors.primary : colors.gray300,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: selectedNeighborhoods.length > 0 && !submitting ? 'pointer' : 'not-allowed',
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Request Territories'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
