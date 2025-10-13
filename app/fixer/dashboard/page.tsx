import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import { colors, borderRadius } from '@/lib/theme';

export default async function FixerDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'FIXER') {
    redirect('/auth/login');
  }

  // Check if fixer has completed profile
  const fixerProfile = await prisma.fixerProfile.findUnique({
    where: { fixerId: user.id },
  });

  // If no profile, redirect to profile page
  if (!fixerProfile) {
    redirect('/fixer/profile');
  }

  // Check if fixer is approved
  const isApproved = user.status === 'ACTIVE';

  // Fetch fixer's services
  const services = await prisma.fixerService.findMany({
    where: { fixerId: user.id },
    include: {
      subcategory: {
        include: {
          category: true,
        },
      },
      neighborhoods: true,
    },
  });

  // Fetch all available service requests (only APPROVED requests)
  const availableRequests = isApproved
    ? await prisma.serviceRequest.findMany({
        where: {
          status: 'APPROVED',
        },
        include: {
          client: true,
          subcategory: {
            include: {
              category: true,
            },
          },
          neighborhood: true,
          quotes: {
            where: { fixerId: user.id },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    : [];

  // Get fixer's service neighborhood IDs and category IDs for checking if they can quote
  const fixerNeighborhoodIds = services.flatMap((s) => s.neighborhoods.map((n) => n.id));
  const fixerCategoryIds = services.map((s) => s.subcategory.categoryId);

  // Fetch inspection quotes awaiting final submission
  const inspectionQuotes = await prisma.quote.findMany({
    where: {
      fixerId: user.id,
      type: 'INSPECTION_REQUIRED',
      inspectionFeePaid: true,
      isRevised: false, // Not yet submitted final quote
      isAccepted: false,
    },
    include: {
      request: {
        include: {
          client: true,
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch fixer's quotes
  const quotes = await prisma.quote.findMany({
    where: { fixerId: user.id },
    include: {
      request: {
        include: {
          client: true,
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch active orders
  const activeOrders = await prisma.order.findMany({
    where: {
      fixerId: user.id,
      status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
    },
    include: {
      client: true,
      request: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      gig: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch completed orders
  const completedOrders = await prisma.order.findMany({
    where: {
      fixerId: user.id,
      status: 'COMPLETED',
    },
    include: {
      client: true,
      request: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      gig: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      review: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  // Calculate stats
  const stats = {
    totalServices: services.length,
    pendingQuotes: quotes.filter((q) => !q.isAccepted).length,
    activeOrders: activeOrders.length,
    completedOrders: await prisma.order.count({
      where: { fixerId: user.id, status: 'COMPLETED' },
    }),
  };

  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { revieweeId: user.id },
    select: { rating: true },
  });
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 'N/A';

  return (
    <DashboardLayoutWithHeader
      title="Fixer Dashboard"
      subtitle={`Welcome back, ${user.name || user.email || user.phone}${!isApproved ? ' (Pending Approval)' : ''}`}
      actions={
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <PurseBalanceInline />
          <DashboardButton variant="outline" href="/fixer/gigs">
            📋 My Service Offers
          </DashboardButton>
          <DashboardButton variant="outline" href="/fixer/orders">
            📦 My Orders
          </DashboardButton>
          <DashboardButton variant="outline" href="/fixer/profile">
            Edit Profile
          </DashboardButton>
          <DashboardButton href="/fixer/services">
            My Services
          </DashboardButton>
        </div>
      }
    >
      {/* Approval Status Banner */}
      {!isApproved && (
        <div style={{
          backgroundColor: colors.warningLight,
          borderLeft: `4px solid ${colors.warning}`,
          padding: '20px',
          marginBottom: '32px',
          borderRadius: borderRadius.lg,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.5' }}>
              Your account is pending admin approval. You'll be able to view and respond to service requests once approved.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <DashboardStat label="My Services" value={stats.totalServices} icon="🛠️" />
        <DashboardStat label="Pending Quotes" value={stats.pendingQuotes} icon="📝" color={colors.warning} />
        <DashboardStat label="Active Jobs" value={stats.activeOrders} icon="⚡" color={colors.primary} />
        <DashboardStat label="Completed" value={stats.completedOrders} icon="✅" color={colors.success} />
        <DashboardStat label="Avg Rating" value={avgRating} icon="⭐" color="#F59E0B" />
      </div>

      {/* Inspection Quotes Awaiting Final Submission */}
      {inspectionQuotes.length > 0 && (
        <DashboardCard title="🔍 Inspections Awaiting Final Quote" style={{ marginBottom: '32px' }}>
          <div style={{ padding: '16px', backgroundColor: '#FEF3C7', borderRadius: borderRadius.md, marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: '#92400E', margin: 0 }}>
              ⚠️ These clients have paid for inspections. Complete your site visit and submit final quotes with actual costs.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {inspectionQuotes.map((quote) => (
              <div
                key={quote.id}
                style={{
                  padding: '20px',
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  border: `2px solid #F59E0B`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🔍</span>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                      {quote.request.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                    {quote.request.subcategory.category.name} → {quote.request.subcategory.name}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: colors.textSecondary }}>
                    <span>💰 Inspection Fee: ₦{quote.inspectionFee?.toLocaleString()} (Paid)</span>
                    <span>📅 {new Date(quote.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  href={`/fixer/quotes/${quote.id}/final`}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Submit Final Quote
                </Link>
              </div>
            ))}
          </div>
        </DashboardCard>
      )}

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <DashboardCard title="Active Jobs" style={{ marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Client</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Your Earnings</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {order.request?.subcategory?.category?.name || order.gig?.subcategory?.category?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.request?.subcategory?.name || order.gig?.subcategory?.name || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.client.name || order.client.email || order.client.phone}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{order.fixerAmount.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: borderRadius.full,
                        backgroundColor: order.status === 'PAID' ? colors.primaryLight : order.status === 'IN_PROGRESS' ? colors.warningLight : colors.bgTertiary,
                        color: order.status === 'PAID' ? colors.primary : order.status === 'IN_PROGRESS' ? colors.warning : colors.textSecondary
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/fixer/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* Available Service Requests */}
      {isApproved && (
        <DashboardCard title="Available Service Requests" style={{ marginBottom: '32px' }}>
          {availableRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: colors.textSecondary }}>No new service requests available at the moment</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Request</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Client</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Posted</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRequests.map((request) => {
                    const hasQuoted = request.quotes.length > 0;
                    const hasNeighborhood = fixerNeighborhoodIds.includes(request.neighborhoodId);
                    const hasCategory = fixerCategoryIds.includes(request.subcategory.categoryId);
                    const canQuote = hasNeighborhood && hasCategory;
                    return (
                      <tr key={request.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>{request.title}</div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary }}>{request.subcategory.name}</div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {request.client.name || request.client.email || request.client.phone}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>{request.neighborhood.name}</td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {hasQuoted ? (
                            <span style={{ color: colors.success, fontWeight: '600', fontSize: '14px' }}>Quoted</span>
                          ) : canQuote ? (
                            <Link
                              href={`/fixer/requests/${request.id}`}
                              style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                            >
                              View & Quote
                            </Link>
                          ) : (
                            <span style={{ color: colors.textTertiary, fontSize: '14px' }}>View Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      )}

      {/* My Quotes */}
      {quotes.length > 0 && (
        <DashboardCard title="My Quotes" style={{ marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Request</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Client</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>{quote.request.subcategory.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {quote.request.client.name || quote.request.client.email || quote.request.client.phone}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{quote.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: borderRadius.full,
                        backgroundColor: quote.isAccepted ? colors.successLight : colors.warningLight,
                        color: quote.isAccepted ? colors.success : colors.warning
                      }}>
                        {quote.isAccepted ? 'Accepted' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* Recent Completed Jobs */}
      {completedOrders.length > 0 && (
        <DashboardCard title="Recently Completed">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Client</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Earned</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Completed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.request?.subcategory?.name || order.gig?.subcategory?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.client?.name || order.client?.email || order.client?.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{order.fixerAmount.toLocaleString()}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                      {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {order.review ? (
                        <span style={{ color: '#F59E0B', fontWeight: '600' }}>★ {order.review.rating}/5</span>
                      ) : (
                        <span style={{ color: colors.textTertiary }}>No review</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}
    </DashboardLayoutWithHeader>
  );
}
