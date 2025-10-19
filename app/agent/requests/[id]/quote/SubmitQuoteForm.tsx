'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import FixerSelectorDropdown from '@/components/agent/FixerSelectorDropdown';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: number;
  urgency: string;
  subcategory: {
    name: string;
    category: {
      name: string;
    };
  };
  neighborhood: {
    name: string;
    city: {
      name: string;
    };
  };
}

export default function SubmitQuoteForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingRequest, setFetchingRequest] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [formData, setFormData] = useState({
    fixerId: '',
    totalAmount: '',
    estimatedDuration: '',
    notes: '',
  });

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      const res = await fetch(`/api/service-requests/${requestId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch request');
      }

      setRequest(data.request);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetchingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.fixerId) {
      setError('Please select a fixer');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/agent/quotes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixerId: formData.fixerId,
          requestId,
          totalAmount: parseFloat(formData.totalAmount),
          estimatedDuration: formData.estimatedDuration,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }

      router.push('/agent/requests');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRequest) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: colors.textSecondary }}>Loading request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: colors.error }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Submit Quote
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Submit a quote on behalf of one of your fixers
          </p>
        </div>

        {/* Request Details */}
        {request && (
          <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: colors.textPrimary }}>
              Request Details
            </h2>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                {request.title}
              </h3>
              <p style={{ color: colors.textSecondary, lineHeight: '1.6', marginBottom: '12px' }}>
                {request.description}
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: colors.textSecondary }}>
                <div>
                  <strong>Category:</strong> {request.subcategory.category.name} → {request.subcategory.name}
                </div>
                <div>
                  <strong>Budget:</strong> ₦{Number(request.budget).toLocaleString()}
                </div>
                <div>
                  <strong>Location:</strong> {request.neighborhood.name}, {request.neighborhood.legacyCity}
                </div>
                <div>
                  <strong>Urgency:</strong> {request.urgency}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quote Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: colors.textPrimary }}>
              Quote Information
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Select Fixer *
              </label>
              <FixerSelectorDropdown
                value={formData.fixerId}
                onChange={(fixerId) => setFormData({ ...formData, fixerId })}
                onlyActive={true}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Quote Amount (₦) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="Enter quote amount"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
              {request && formData.totalAmount && (
                <small style={{ color: colors.textLight, display: 'block', marginTop: '6px' }}>
                  {parseFloat(formData.totalAmount) > request.budget ? (
                    <span style={{ color: colors.warningDark }}>
                      Above client budget by ₦{(parseFloat(formData.totalAmount) - request.budget).toLocaleString()}
                    </span>
                  ) : (
                    <span style={{ color: colors.success }}>
                      Within client budget
                    </span>
                  )}
                </small>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Estimated Duration *
              </label>
              <input
                type="text"
                required
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 2-3 hours, 1-2 days"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about the quote..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: '8px', marginBottom: '16px' }}>
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
                borderRadius: '8px',
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
                borderRadius: '8px',
                backgroundColor: colors.primary,
                color: colors.white,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
