'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { styles, colors } from '@/lib/theme';
import { RequestMessages } from '@/app/client/requests/RequestMessages';
import MobileHeader from '@/components/MobileHeader';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  request: {
    id: string;
    title: string;
    description: string;
    address?: string;
    urgency?: string;
    preferredDate?: string;
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
        state: {
          name: string;
        };
      };
    };
    client: {
      id: string;
      name?: string;
      email?: string;
      phone?: string;
      profileImage?: string;
    };
  };
  quote: {
    id: string;
    type: string;
    laborCost?: number;
    materialCost?: number;
    otherCosts?: number;
    inspectionFee?: number;
    inspectionFeePaid?: boolean;
    description: string;
    estimatedDuration?: string;
    startDate?: string;
    requiresDownPayment?: boolean;
    downPaymentAmount?: number;
    downPaymentPercentage?: number;
    downPaymentReason?: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
    createdAt: string;
  };
}

export default function FixerOrderViewPage({ params }: { params: Promise<{ orderId: string }> }) {
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [completing, setCompleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  useEffect(() => {
    // Fetch current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setCurrentUser(data.user))
      .catch(err => console.error('Failed to fetch user:', err));

    params.then(({ orderId: id }) => {
      setOrderId(id);
      fetchOrder(id);
    });
  }, []);

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/fixer/orders/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load order');
      }
      const data = await response.json();

      // Redirect gig orders to the main order page (without /view)
      if (data.gigId) {
        window.location.href = `/fixer/orders/${id}`;
        return;
      }

      setOrder(data);
      setCurrentUserId(data.fixerId);
    } catch (err) {
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (!completionMessage.trim()) {
      setError('Please provide a completion message');
      return;
    }

    setCompleting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/fixer/orders/${orderId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionMessage: completionMessage.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete job');
      }

      setSuccessMessage('Job marked as completed successfully! Client has been notified.');
      setShowCompletionForm(false);
      setCompletionMessage('');
      // Refresh the order data
      fetchOrder(orderId);
    } catch (err: any) {
      setError(err.message || 'Failed to complete job');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <MobileHeader user={currentUser} />
        <div style={styles.pageContainer}>
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading order details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <MobileHeader user={currentUser} />
        <div style={styles.pageContainer}>
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: colors.error }}>{error || 'Order not found'}</p>
            <Link href="/fixer/dashboard" style={{ ...styles.buttonPrimary, display: 'inline-block', marginTop: '16px' }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string; text: string }> = {
      PENDING: { bg: '#FEF3C7', text: '#92400E' },
      IN_PROGRESS: { bg: '#DBEAFE', text: '#1E40AF' },
      COMPLETED: { bg: '#D1FAE5', text: '#065F46' },
      CANCELLED: { bg: '#FEE2E2', text: '#991B1B' },
    };

    const style = statusColors[status] || statusColors.PENDING;

    return (
      <span style={{
        padding: '6px 12px',
        backgroundColor: style.bg,
        color: style.text,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
      }}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <>
      <MobileHeader user={currentUser} />
      <div style={styles.pageContainer}>
        {/* Page Header */}
        <header style={styles.header}>
          <div style={styles.headerContainer}>
            <div>
              <h1 style={styles.headerTitle}>Order Details</h1>
              <p style={styles.headerSubtitle}>{order.request?.title || (order as any).gig?.title || 'Order'}</p>
            </div>
            <div style={styles.buttonGroup}>
              <Link href="/fixer/dashboard" style={styles.buttonSecondary}>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </header>

        <main style={styles.mainContent}>
          {/* Success/Error Messages */}
          {successMessage && (
            <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #059669', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#065F46', margin: 0 }}>{successMessage}</p>
            </div>
          )}
          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#991B1B', margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '75% 25%', gap: '24px', alignItems: 'start' }}>
            {/* Left Column - 75% */}
            <div>
              {/* Order Status Card */}
              <div style={{ ...styles.section, marginBottom: '24px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                      Order Status
                    </h2>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Order ID</div>
                      <div style={{ fontSize: '15px', fontWeight: '500', color: colors.textPrimary, fontFamily: 'monospace' }}>
                        {order.id}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Total Amount</div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>
                        ₦{order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Created</div>
                      <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {order.payment && (
                      <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Payment Status</div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: colors.textPrimary }}>
                          {order.payment.status.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Complete - Awaiting Admin Settlement */}
                  {order.status === 'PAID' && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E4E6EB' }}>
                      <div style={{ padding: '20px', backgroundColor: colors.primaryLight, border: `2px solid ${colors.primary}`, borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px', color: colors.primary }}>✓</div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                          Payment Received!
                        </div>
                        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                          The client has paid ₦{order.totalAmount.toLocaleString()}. Payment is held securely in escrow and will be released to you once the admin approves the settlement.
                        </p>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.primary}` }}>
                          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
                            💰 You will receive a notification when the payment is released
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete Job Button */}
                  {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && order.status !== 'PAID' && order.status !== 'SETTLED' && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E4E6EB' }}>
                      {!showCompletionForm ? (
                        <>
                          <button
                            onClick={() => setShowCompletionForm(true)}
                            style={{
                              width: '100%',
                              padding: '14px 24px',
                              backgroundColor: colors.success,
                              color: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              fontSize: '16px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#059669';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.success;
                            }}
                          >
                            Mark Job as Completed
                          </button>
                          <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px', textAlign: 'center' }}>
                            This will notify the client that the work is finished
                          </p>
                        </>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                            Completion Summary
                          </label>
                          <textarea
                            value={completionMessage}
                            onChange={(e) => setCompletionMessage(e.target.value)}
                            placeholder="Describe what was completed and any important details for the client..."
                            rows={4}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: `2px solid ${colors.border}`,
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none',
                              marginBottom: '12px',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={handleCompleteJob}
                              disabled={completing || !completionMessage.trim()}
                              style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: completing || !completionMessage.trim() ? '#9CA3AF' : colors.success,
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: completing || !completionMessage.trim() ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {completing ? 'Submitting...' : 'Submit & Complete'}
                            </button>
                            <button
                              onClick={() => {
                                setShowCompletionForm(false);
                                setCompletionMessage('');
                                setError('');
                              }}
                              disabled={completing}
                              style={{
                                padding: '12px 24px',
                                backgroundColor: 'white',
                                color: colors.textPrimary,
                                border: `2px solid ${colors.border}`,
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: completing ? 'not-allowed' : 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Request Details */}
              <div style={{ ...styles.section, marginBottom: '24px' }}>
                <h2 style={styles.sectionTitle}>Request Details</h2>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Category</div>
                    <div style={{ fontSize: '16px', color: colors.textPrimary }}>
                      {order.request.subcategory.category.name} → {order.request.subcategory.name}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Description</div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>
                      {order.request.description}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Location</div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                      {order.request.neighborhood.name}, {order.request.neighborhood.city.name}, {order.request.neighborhood.city.state.name}
                    </div>
                    {order.request.address && (
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                        {order.request.address}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {order.request.urgency && (
                      <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Urgency</div>
                        <div style={{ fontSize: '15px', color: colors.textPrimary, textTransform: 'capitalize' }}>
                          {order.request.urgency.replace('_', ' ')}
                        </div>
                      </div>
                    )}
                    {order.request.preferredDate && (
                      <div>
                        <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Preferred Date</div>
                        <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                          {new Date(order.request.preferredDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E4E6EB' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Client</div>
                    <div style={{ fontSize: '15px', fontWeight: '500', color: colors.textPrimary }}>
                      {order.request.client.name || order.request.client.email || order.request.client.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Your Quote</h2>
                <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  {order.quote.type === 'INSPECTION_REQUIRED' && order.quote.inspectionFee && (
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#DBEAFE', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', marginBottom: '4px' }}>
                        Inspection Quote
                      </div>
                      <div style={{ fontSize: '13px', color: '#1E40AF' }}>
                        Inspection Fee: ₦{order.quote.inspectionFee.toLocaleString()} {order.quote.inspectionFeePaid ? '(Paid)' : '(Pending)'}
                      </div>
                    </div>
                  )}

                  {order.quote.laborCost !== null && order.quote.laborCost !== undefined && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Cost Breakdown</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', color: colors.textPrimary }}>Labor Cost:</span>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                          ₦{order.quote.laborCost.toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '15px', color: colors.textPrimary }}>Material Cost:</span>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                          ₦{(order.quote.materialCost || 0).toLocaleString()}
                        </span>
                      </div>
                      {order.quote.otherCosts && order.quote.otherCosts > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '15px', color: colors.textPrimary }}>Other Costs:</span>
                          <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                            ₦{order.quote.otherCosts.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Description</div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>
                      {order.quote.description}
                    </div>
                  </div>

                  {order.quote.estimatedDuration && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Estimated Duration</div>
                      <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                        {order.quote.estimatedDuration}
                      </div>
                    </div>
                  )}

                  {order.quote.startDate && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Start Date</div>
                      <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                        {new Date(order.quote.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {order.quote.requiresDownPayment && order.quote.downPaymentAmount && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400E', marginBottom: '4px' }}>
                        Down Payment Required
                      </div>
                      <div style={{ fontSize: '15px', color: '#92400E', marginBottom: '4px' }}>
                        ₦{order.quote.downPaymentAmount.toLocaleString()} ({order.quote.downPaymentPercentage}%)
                      </div>
                      {order.quote.downPaymentReason && (
                        <div style={{ fontSize: '13px', color: '#92400E', marginTop: '8px' }}>
                          Reason: {order.quote.downPaymentReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - 25% (Messages) */}
            <div style={{ position: 'sticky', top: '80px', minWidth: 0 }}>
              <h2 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Messages</h2>
              <div style={{ minHeight: '600px' }}>
                <RequestMessages requestId={order.request.id} currentUserId={currentUserId} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
