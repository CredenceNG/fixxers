import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardButton } from '@/components/DashboardLayout';
import { colors, statusBadgeStyles, styles } from '@/lib/theme';
import { CancelRequestButton } from '../CancelRequestButton';
import { InspectionPaymentButton } from '../InspectionPaymentButton';
import { AcceptQuoteButton } from '../AcceptQuoteButton';
import { RequestMessages } from '../RequestMessages';
import { AcceptDeliveryButton } from '@/app/client/orders/[orderId]/AcceptDeliveryButton';

export default async function RequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('CLIENT')) {
    redirect('/auth/login');
  }

  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      subcategory: {
        include: {
          category: true,
        },
      },
      neighborhood: true,
      quotes: {
        include: {
          fixer: {
            include: {
              fixerProfile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      order: {
        include: {
          fixer: true,
          payment: true,
        },
      },
    },
  });

  if (!request || request.clientId !== user.id) {
    redirect('/client/dashboard');
  }

  // Check if request can be cancelled
  const canCancel = !['CANCELLED', 'ACCEPTED'].includes(request.status);

  return (
    <DashboardLayoutWithHeader
      title="Service Request Details"
      subtitle={`Request ID: ${request.id.slice(0, 8)}`}
      actions={
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canCancel && (
            <CancelRequestButton requestId={request.id} requestTitle={request.title} />
          )}
          <DashboardButton variant="outline" href="/client/dashboard">
            Back to Dashboard
          </DashboardButton>
        </div>
      }
    >
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Left Column - 75% */}
          <div style={{ flex: '0 0 75%' }}>
        {/* Request Info */}
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
              <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>{request.description}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {request.neighborhood.name}, {request.neighborhood.legacyCity}
                </div>
                {request.address && (
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>{request.address}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Urgency</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary, textTransform: 'capitalize' }}>
                  {request.urgency?.replace('_', ' ')}
                </div>
              </div>
            </div>
            {request.preferredDate && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Preferred Date</div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {new Date(request.preferredDate).toLocaleDateString()}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Status</div>
              <span style={statusBadgeStyles(request.status)}>{request.status}</span>
            </div>
          </div>
        </div>

        {/* Quotes Received */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Quotes Received ({request.quotes.length})</h2>
          {request.quotes.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '15px', color: colors.textSecondary }}>No quotes received yet. Fixers in your area will be notified.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {request.quotes.map((quote) => (
                <div
                  key={quote.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: quote.isAccepted ? `2px solid ${colors.success}` : '2px solid transparent',
                  }}
                >
                  {/* Quote Type Badge */}
                  {quote.type === 'INSPECTION_REQUIRED' && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '2px solid #F59E0B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🔍</span>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400E' }}>INSPECTION REQUIRED</div>
                          <div style={{ fontSize: '13px', color: '#92400E' }}>
                            Fixer needs to inspect site before providing final quote
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {quote.fixer.name || 'Fixer'}
                      </div>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                        {quote.fixer.fixerProfile?.yearsOfService} years experience
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {quote.type === 'INSPECTION_REQUIRED' && !quote.isRevised ? (
                        <>
                          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>Inspection Fee</div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                            ₦{quote.inspectionFee?.toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>Total Amount</div>
                          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                            ₦{quote.totalAmount.toLocaleString()}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Quote Details:</div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>{quote.description}</div>
                  </div>
                  {/* Cost Breakdown (for direct quotes and revised inspection quotes) */}
                  {(quote.type === 'DIRECT' || (quote.type === 'INSPECTION_REQUIRED' && quote.isRevised)) && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Labor</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{quote.laborCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Materials</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{quote.materialCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Other</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{quote.otherCosts.toLocaleString()}</div>
                        </div>
                      </div>

                      {/* Down Payment Warning */}
                      {quote.requiresDownPayment && quote.downPaymentAmount && (
                        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#FEF3C7', borderRadius: '8px', border: '1px solid #F59E0B' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>⚠️</span>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#92400E' }}>DOWN PAYMENT REQUIRED</div>
                          </div>
                          <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '12px' }}>
                            {quote.downPaymentReason}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Pay Now ({quote.downPaymentPercentage}%)</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
                                ₦{quote.downPaymentAmount.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Pay on Completion</div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>
                                ₦{(quote.totalAmount - quote.downPaymentAmount).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Inspection Flow Info */}
                  {quote.type === 'INSPECTION_REQUIRED' && !quote.inspectionFeePaid && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px' }}>
                        What happens next:
                      </div>
                      <ol style={{ fontSize: '13px', color: '#1E40AF', paddingLeft: '20px', margin: 0 }}>
                        <li>Pay ₦{quote.inspectionFee?.toLocaleString()} inspection fee</li>
                        <li>Fixer visits and inspects your site</li>
                        <li>Fixer provides final quote with exact costs</li>
                        <li>You decide whether to proceed</li>
                        <li>Inspection fee credited toward final job cost</li>
                      </ol>
                    </div>
                  )}

                  {quote.type === 'INSPECTION_REQUIRED' && quote.inspectionFeePaid && !quote.isRevised && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#D1FAE5', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#065F46' }}>
                        ✓ Inspection fee paid. Awaiting fixer's final quote after inspection.
                      </div>
                    </div>
                  )}

                  {quote.type === 'INSPECTION_REQUIRED' && quote.inspectionFeePaid && quote.isRevised && (
                    <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#DBEAFE', borderRadius: '8px', border: '2px solid #3B82F6' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px' }}>
                        ✅ Final Quote Received After Inspection
                      </div>
                      <p style={{ fontSize: '13px', color: '#1E40AF', margin: 0 }}>
                        Fixer has completed the inspection and provided final costs. The inspection fee of ₦{quote.inspectionFee?.toLocaleString()} is included in the total below.
                      </p>
                    </div>
                  )}
                  {quote.estimatedDuration && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Estimated Duration: {quote.estimatedDuration}</div>
                    </div>
                  )}
                  {quote.startDate && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                        Can Start: {new Date(quote.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {quote.isAccepted ? (
                    <div style={{ padding: '12px', backgroundColor: '#D1FAE5', borderRadius: '8px', color: '#065F46', fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                      ✓ Accepted
                    </div>
                  ) : request.status === 'PENDING' || request.status === 'QUOTED' ? (
                    <>
                      {quote.type === 'INSPECTION_REQUIRED' && !quote.inspectionFeePaid ? (
                        <InspectionPaymentButton
                          quoteId={quote.id}
                          inspectionFee={quote.inspectionFee || 0}
                        />
                      ) : quote.type === 'INSPECTION_REQUIRED' && quote.inspectionFeePaid && !quote.isRevised ? (
                        <div style={{ padding: '12px', backgroundColor: '#F3F4F6', borderRadius: '8px', color: colors.textSecondary, fontSize: '14px', fontWeight: '600', textAlign: 'center' }}>
                          Awaiting final quote from fixer
                        </div>
                      ) : quote.type === 'DIRECT' || (quote.type === 'INSPECTION_REQUIRED' && quote.isRevised) ? (
                        <AcceptQuoteButton
                          quoteId={quote.id}
                          requiresDownPayment={quote.requiresDownPayment}
                          downPaymentAmount={quote.downPaymentAmount}
                          requestId={request.id}
                        />
                      ) : null}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Order */}
        {request.order && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Order Information</h2>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              {/* Fixer Info */}
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Fixer</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {request.order.fixer.name || request.order.fixer.email || request.order.fixer.phone}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Summary</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Total Amount</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                    ₦{request.order.totalAmount.toLocaleString()}
                  </span>
                </div>

                {request.order.downPaymentPaid && request.order.downPaymentAmount && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: colors.success }}>✓ Down Payment Paid</span>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: colors.success }}>
                        -₦{request.order.downPaymentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.borderDark}` }}>
                      <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>Remaining Balance</span>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>
                        ₦{(request.order.totalAmount - request.order.downPaymentAmount).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Status Info */}
              <div style={{ display: 'grid', gridTemplateColumns: request.order.payment ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Order Status</div>
                  <span style={statusBadgeStyles(request.order.status)}>{request.order.status}</span>
                </div>
                {request.order.payment && (
                  <div>
                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Payment Status</div>
                    <span style={statusBadgeStyles(request.order.payment.status)}>{request.order.payment.status}</span>
                  </div>
                )}
              </div>

              {/* Completion Note */}
              {request.order.status === 'COMPLETED' && request.order.deliveryNote && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: colors.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>🎉</span>
                      Work Completed
                    </div>
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: colors.primaryLight,
                        border: `1px solid ${colors.primary}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: colors.textPrimary,
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {request.order.deliveryNote}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div style={{ ...styles.alertWarning, marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '6px' }}>
                      Ready to Complete Payment
                    </div>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0, lineHeight: '1.5' }}>
                      Please review the work and rate the fixer. Once you proceed, payment will be processed and held securely in escrow until the admin approves settlement.
                    </p>
                  </div>

                  {/* Accept & Pay Button */}
                  <AcceptDeliveryButton
                    orderId={request.order.id}
                    amount={
                      request.order.downPaymentPaid && request.order.downPaymentAmount
                        ? request.order.totalAmount - request.order.downPaymentAmount
                        : request.order.totalAmount
                    }
                    hasReview={!!request.order.rating}
                  />
                </div>
              )}

              {/* Payment Successful */}
              {(request.order.status === 'PAID' || request.order.status === 'SETTLED') && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ padding: '24px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}`, borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px', color: colors.primary }}>✓</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '12px' }}>
                      Payment Completed
                    </div>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, lineHeight: '1.6' }}>
                      {request.order.status === 'PAID'
                        ? 'Your payment has been received and is held securely in escrow. The admin will review and approve settlement with the fixer.'
                        : 'Payment has been successfully settled with the fixer. Thank you for using our service!'}
                    </p>
                    {request.order.status === 'SETTLED' && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.primary}` }}>
                        <p style={{ fontSize: '14px', color: colors.primaryDark, margin: 0, fontWeight: '600' }}>
                          🎊 Order Complete - Thank you for your business!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
          </div>

          {/* Right Column - 25% */}
          <div style={{ flex: '0 0 calc(25% - 24px)', position: 'sticky', top: '80px' }}>
            {/* Messages with Fixer */}
            {request.quotes.some((q) => q.isAccepted) && (
              <div>
                <h2 style={{ ...styles.sectionTitle, marginBottom: '16px' }}>Messages</h2>
                <RequestMessages requestId={request.id} currentUserId={user.id} />
              </div>
            )}
          </div>
        </div>
    </DashboardLayoutWithHeader>
  );
}
