'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { styles, colors } from '@/lib/theme';
import { TwoColumnLayout, FormGrid, ResponsiveFlex } from '@/components/ResponsiveLayout';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  address?: string;
  urgency?: string;
  preferredDate?: string;
  status: string;
  createdAt: string;
  subcategory: {
    name: string;
    category: {
      name: string;
    };
  };
  neighborhood: {
    name: string;
    city: string;
    state: string;
  };
  client: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export default function FixerRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [requestId, setRequestId] = useState<string>('');

  const [quoteType, setQuoteType] = useState<'DIRECT' | 'INSPECTION_REQUIRED'>('DIRECT');
  const [formData, setFormData] = useState({
    laborCost: '',
    materialCost: '',
    otherCosts: '0',
    inspectionFee: '',
    description: '',
    estimatedDuration: '',
    startDate: '',
    requiresDownPayment: false,
    downPaymentPercentage: '30',
    downPaymentReason: '',
  });

  useEffect(() => {
    // Unwrap the params promise
    params.then(({ id }) => {
      setRequestId(id);
      loadRequest(id);
    });
  }, []);

  const loadRequest = async (id: string) => {
    try {
      const response = await fetch(`/api/fixer/requests/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load request');
      }
      const data = await response.json();
      setRequest(data);
    } catch (err) {
      setError('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validation based on quote type
    if (quoteType === 'DIRECT') {
      if (!formData.laborCost || !formData.materialCost || !formData.description) {
        setError('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
    } else if (quoteType === 'INSPECTION_REQUIRED') {
      if (!formData.inspectionFee || !formData.description) {
        setError('Please provide inspection fee and description');
        setSubmitting(false);
        return;
      }
    }

    if (formData.requiresDownPayment && quoteType === 'DIRECT') {
      if (!formData.downPaymentReason || formData.downPaymentReason.trim().length < 10) {
        setError('Please provide a reason for down payment (min 10 characters)');
        setSubmitting(false);
        return;
      }
    }

    try {
      const payload: any = {
        requestId: requestId,
        type: quoteType,
        description: formData.description,
        estimatedDuration: formData.estimatedDuration || undefined,
        startDate: formData.startDate || undefined,
      };

      if (quoteType === 'DIRECT') {
        payload.laborCost = parseFloat(formData.laborCost);
        payload.materialCost = parseFloat(formData.materialCost);
        payload.otherCosts = parseFloat(formData.otherCosts || '0');
        payload.requiresDownPayment = formData.requiresDownPayment;
        if (formData.requiresDownPayment) {
          payload.downPaymentPercentage = parseFloat(formData.downPaymentPercentage);
          payload.downPaymentReason = formData.downPaymentReason;
        }
      } else if (quoteType === 'INSPECTION_REQUIRED') {
        payload.inspectionFee = parseFloat(formData.inspectionFee);
      }

      const response = await fetch('/api/fixer/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit quote');
      }

      // Redirect to dashboard
      router.push('/fixer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.error }}>Request not found</p>
          <Link href="/fixer/dashboard" style={{ ...styles.buttonPrimary, display: 'inline-block', marginTop: '16px' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = quoteType === 'DIRECT'
    ? (parseFloat(formData.laborCost || '0') + parseFloat(formData.materialCost || '0') + parseFloat(formData.otherCosts || '0')).toFixed(2)
    : '0';

  const downPaymentAmount = formData.requiresDownPayment && quoteType === 'DIRECT'
    ? Math.round((parseFloat(totalAmount) * parseFloat(formData.downPaymentPercentage || '0')) / 100)
    : 0;

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div>
            <h1 style={styles.headerTitle}>Service Request Details</h1>
            <p style={styles.headerSubtitle}>Review and submit your quote</p>
          </div>
          <div style={styles.buttonGroup}>
            <Link href="/fixer/dashboard" style={styles.buttonSecondary}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main style={styles.mainContent}>
        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
          </div>
        )}

        <TwoColumnLayout>
          {/* Request Details */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Request Information</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Title</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>{request.title}</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Category</div>
                <div style={{ fontSize: '16px', color: colors.textPrimary }}>
                  {request.subcategory.category.name} → {request.subcategory.name}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Description</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>
                  {request.description}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {request.neighborhood.name}, {request.neighborhood.city}, {request.neighborhood.state}
                </div>
                {request.address && (
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                    {request.address}
                  </div>
                )}
              </div>

              <FormGrid>
                <div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Urgency</div>
                  <div style={{ fontSize: '15px', color: colors.textPrimary, textTransform: 'capitalize' }}>
                    {request.urgency?.replace('_', ' ') || 'Flexible'}
                  </div>
                </div>
                {request.preferredDate && (
                  <div>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Preferred Date</div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                      {new Date(request.preferredDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </FormGrid>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E4E6EB' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Client</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {request.client.name || request.client.email || request.client.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Submit Your Quote</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSubmit}>
                {/* Quote Type Selection */}
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                    Quote Type <span style={{ color: colors.error }}>*</span>
                  </label>
                  <ResponsiveFlex>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, padding: '12px', backgroundColor: quoteType === 'DIRECT' ? colors.primary : 'white', color: quoteType === 'DIRECT' ? 'white' : colors.textPrimary, borderRadius: '8px', border: `2px solid ${quoteType === 'DIRECT' ? colors.primary : '#E4E6EB'}` }}>
                      <input
                        type="radio"
                        value="DIRECT"
                        checked={quoteType === 'DIRECT'}
                        onChange={(e) => setQuoteType(e.target.value as 'DIRECT')}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Direct Quote (I can quote now)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, padding: '12px', backgroundColor: quoteType === 'INSPECTION_REQUIRED' ? colors.primary : 'white', color: quoteType === 'INSPECTION_REQUIRED' ? 'white' : colors.textPrimary, borderRadius: '8px', border: `2px solid ${quoteType === 'INSPECTION_REQUIRED' ? colors.primary : '#E4E6EB'}` }}>
                      <input
                        type="radio"
                        value="INSPECTION_REQUIRED"
                        checked={quoteType === 'INSPECTION_REQUIRED'}
                        onChange={(e) => setQuoteType(e.target.value as 'INSPECTION_REQUIRED')}
                        style={{ marginRight: '8px' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Inspection Required</span>
                    </label>
                  </ResponsiveFlex>
                  {quoteType === 'INSPECTION_REQUIRED' && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
                        ℹ️ You'll inspect the site first, then provide a detailed quote after understanding the actual work required.
                      </p>
                    </div>
                  )}
                </div>

                {/* Inspection Fee (only for INSPECTION_REQUIRED) */}
                {quoteType === 'INSPECTION_REQUIRED' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Inspection Fee (₦) <span style={{ color: colors.error }}>*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.inspectionFee}
                      onChange={(e) => setFormData({ ...formData, inspectionFee: e.target.value })}
                      required={quoteType === 'INSPECTION_REQUIRED'}
                      min="500"
                      max="10000"
                      step="100"
                      placeholder="e.g., 2000"
                      style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                    />
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                      Minimum ₦500, Maximum ₦10,000. This fee will be credited toward the final job cost.
                    </p>
                  </div>
                )}

                {/* Cost Breakdown (only for DIRECT quotes) */}
                {quoteType === 'DIRECT' && (
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                        Labor Cost (₦) <span style={{ color: colors.error }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.laborCost}
                        onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                        required={quoteType === 'DIRECT'}
                        min="0"
                        step="100"
                        placeholder="Enter labor cost"
                        style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                        Material Cost (₦) <span style={{ color: colors.error }}>*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.materialCost}
                        onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                        required={quoteType === 'DIRECT'}
                        min="0"
                        step="100"
                        placeholder="Enter material cost"
                        style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                        Other Costs (₦) <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.otherCosts}
                        onChange={(e) => setFormData({ ...formData, otherCosts: e.target.value })}
                        min="0"
                        step="100"
                        placeholder="Enter other costs"
                        style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                      />
                    </div>

                    {/* Total */}
                    <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '12px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Total Amount:</span>
                        <span style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                          ₦{parseFloat(totalAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Down Payment Option */}
                    <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.requiresDownPayment}
                          onChange={(e) => setFormData({ ...formData, requiresDownPayment: e.target.checked })}
                          style={{ marginRight: '8px' }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                          This job requires down payment
                        </span>
                      </label>

                      {formData.requiresDownPayment && (
                        <div style={{ marginTop: '16px' }}>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                            Down Payment Percentage <span style={{ color: colors.error }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                            <input
                              type="number"
                              value={formData.downPaymentPercentage}
                              onChange={(e) => setFormData({ ...formData, downPaymentPercentage: e.target.value })}
                              required={formData.requiresDownPayment}
                              min="1"
                              max="50"
                              step="5"
                              style={{ width: '80px', padding: '8px 12px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                            />
                            <span style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>%</span>
                            <span style={{ fontSize: '14px', color: colors.textSecondary, marginLeft: '8px' }}>
                              = ₦{downPaymentAmount.toLocaleString()}
                            </span>
                          </div>

                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                            Reason for Down Payment <span style={{ color: colors.error }}>*</span>
                          </label>
                          <textarea
                            value={formData.downPaymentReason}
                            onChange={(e) => setFormData({ ...formData, downPaymentReason: e.target.value })}
                            required={formData.requiresDownPayment}
                            rows={2}
                            placeholder="e.g., Need to purchase materials upfront"
                            style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '2px solid #E4E6EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                          />
                          <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                            Client will pay ₦{downPaymentAmount.toLocaleString()} upfront and ₦{(parseFloat(totalAmount) - downPaymentAmount).toLocaleString()} on completion.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Quote Description */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    Quote Description <span style={{ color: colors.error }}>*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    placeholder="Describe what's included in your quote, your approach, and any important details..."
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Timeline */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    Estimated Duration <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    placeholder="e.g., 2-3 hours, 1 day, 3-5 days"
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    When Can You Start? <span style={{ fontSize: '13px', fontWeight: '400', color: colors.textSecondary }}>(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    ...styles.buttonPrimary,
                    width: '100%',
                    padding: '16px',
                    fontSize: '16px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting
                    ? 'Submitting Quote...'
                    : quoteType === 'INSPECTION_REQUIRED'
                      ? 'Submit Inspection Quote'
                      : 'Submit Quote'}
                </button>
              </form>
            </div>
          </div>
        </TwoColumnLayout>
      </main>
    </div>
  );
}
