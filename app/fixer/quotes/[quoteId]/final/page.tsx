'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { styles, colors } from '@/lib/theme';

interface Quote {
  id: string;
  type: string;
  inspectionFee: number | null;
  inspectionFeePaid: boolean;
  request: {
    id: string;
    title: string;
    description: string;
    subcategory: {
      name: string;
      category: {
        name: string;
      };
    };
  };
}

export default function SubmitFinalQuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
  const router = useRouter();
  const [quoteId, setQuoteId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);

  const [formData, setFormData] = useState({
    laborCost: '',
    materialCost: '',
    otherCosts: '0',
    description: '',
    estimatedDuration: '',
    startDate: '',
    requiresDownPayment: false,
    downPaymentPercentage: '30',
    downPaymentReason: '',
  });

  useEffect(() => {
    params.then(({ quoteId: id }) => {
      setQuoteId(id);
      fetchQuote(id);
    });
  }, []);

  const fetchQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/fixer/quotes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setQuote(data);
      } else {
        setError('Failed to load quote details');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const totalAmount = parseFloat(formData.laborCost || '0') + parseFloat(formData.materialCost || '0') + parseFloat(formData.otherCosts || '0');
  const downPaymentAmount = formData.requiresDownPayment
    ? Math.round((totalAmount * parseFloat(formData.downPaymentPercentage || '0')) / 100)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!formData.laborCost || !formData.materialCost || !formData.description) {
      setError('Please fill in all required fields');
      setSubmitting(false);
      return;
    }

    if (totalAmount < (quote?.inspectionFee || 0)) {
      setError(`Total amount must be at least ₦${quote?.inspectionFee?.toLocaleString()} (the inspection fee already paid)`);
      setSubmitting(false);
      return;
    }

    if (formData.requiresDownPayment && (!formData.downPaymentReason || formData.downPaymentReason.trim().length < 10)) {
      setError('Please provide a reason for down payment (min 10 characters)');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/fixer/quotes/${quoteId}/submit-final`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          laborCost: parseFloat(formData.laborCost),
          materialCost: parseFloat(formData.materialCost),
          otherCosts: parseFloat(formData.otherCosts || '0'),
          downPaymentPercentage: formData.requiresDownPayment ? parseFloat(formData.downPaymentPercentage) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit final quote');
      }

      router.push('/fixer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: colors.error }}>{error || 'Quote not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <div>
            <h1 style={styles.headerTitle}>Submit Final Quote</h1>
            <p style={styles.headerSubtitle}>After Inspection</p>
          </div>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Inspection Info Banner */}
          <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: '#DBEAFE', borderRadius: '12px', border: '2px solid #3B82F6' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🔍</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E40AF', margin: '0 0 8px 0' }}>
                  Inspection Completed
                </h3>
                <p style={{ fontSize: '14px', color: '#1E40AF', margin: '0 0 12px 0' }}>
                  Client paid ₦{quote.inspectionFee?.toLocaleString()} inspection fee. This amount will be credited toward the final job cost.
                </p>
                <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    {quote.request.title}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {quote.request.subcategory.category.name} → {quote.request.subcategory.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Form */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
              Final Quote Details
            </h2>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>
                  <p style={{ fontSize: '14px', color: '#DC2626', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Cost Fields */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Labor Cost (₦) <span style={{ color: colors.error }}>*</span>
                </label>
                <input
                  type="number"
                  name="laborCost"
                  value={formData.laborCost}
                  onChange={handleInputChange}
                  required
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
                  name="materialCost"
                  value={formData.materialCost}
                  onChange={handleInputChange}
                  required
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
                  name="otherCosts"
                  value={formData.otherCosts}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                  placeholder="Enter other costs"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>

              {/* Total Display */}
              <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Total Amount:</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                    ₦{totalAmount.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                  Includes inspection fee of ₦{quote.inspectionFee?.toLocaleString()} (already paid)
                </p>
              </div>

              {/* Down Payment Section */}
              <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="requiresDownPayment"
                    checked={formData.requiresDownPayment}
                    onChange={handleInputChange}
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <input
                        type="number"
                        name="downPaymentPercentage"
                        value={formData.downPaymentPercentage}
                        onChange={handleInputChange}
                        required={formData.requiresDownPayment}
                        min="10"
                        max="50"
                        step="5"
                        style={{ width: '80px', padding: '8px 12px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '8px', outline: 'none', textAlign: 'center' }}
                      />
                      <span style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>%</span>
                      <span style={{ fontSize: '14px', color: colors.textSecondary, marginLeft: '8px' }}>
                        = ₦{downPaymentAmount.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '16px', marginTop: '0' }}>
                      Range: 10-50% in increments of 5% (e.g., 10, 15, 20, 25, 30, 35, 40, 45, 50)
                    </p>

                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      Reason for Down Payment <span style={{ color: colors.error }}>*</span>
                    </label>
                    <textarea
                      name="downPaymentReason"
                      value={formData.downPaymentReason}
                      onChange={handleInputChange}
                      required={formData.requiresDownPayment}
                      rows={2}
                      placeholder="e.g., Need to purchase materials upfront"
                      style={{ width: '100%', padding: '12px 16px', fontSize: '14px', border: '2px solid #E4E6EB', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px', marginBottom: '4px' }}>
                      Minimum 10 characters. Explain why you need payment upfront.
                    </p>
                    <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                      Client will pay ₦{downPaymentAmount.toLocaleString()} upfront and ₦{(totalAmount - downPaymentAmount).toLocaleString()} on completion.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Quote Description <span style={{ color: colors.error }}>*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe what you found during inspection and what work needs to be done..."
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              {/* Additional Fields */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Estimated Duration
                </label>
                <input
                  type="text"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-3 days"
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Earliest Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
                />
              </div>

              {/* Submit Button */}
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
                {submitting ? 'Submitting Final Quote...' : 'Submit Final Quote'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
