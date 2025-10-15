'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardCard, DashboardStat } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { CancelButton } from '@/app/client/dashboard/CancelButton';

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  roles: string[];
};

type ClientData = {
  requests: any[];
  activeOrders: any[];
  completedOrders: any[];
  stats: {
    totalRequests: number;
    pendingRequests: number;
    activeOrders: number;
    completedOrders: number;
  };
};

type FixerData = {
  services: any[];
  quotes: any[];
  inspectionQuotes: any[];
  availableRequests: any[];
  activeOrders: any[];
  completedOrders: any[];
  isApproved: boolean;
  stats: {
    totalServices: number;
    pendingQuotes: number;
    activeOrders: number;
    completedOrders: number;
  };
  avgRating: string;
};

type UnifiedDashboardProps = {
  user: User;
  clientData?: ClientData | null;
  fixerData?: FixerData | null;
};

export default function UnifiedDashboard({ user, clientData, fixerData }: UnifiedDashboardProps) {
  const [activeSection, setActiveSection] = useState<'CLIENT' | 'FIXER'>(
    user.roles.includes('CLIENT') ? 'CLIENT' : 'FIXER'
  );

  const hasClientRole = user.roles.includes('CLIENT');
  const hasFixerRole = user.roles.includes('FIXER');

  return (
    <div>
      {/* Role Tabs - Only show if user has multiple roles */}
      {hasClientRole && hasFixerRole && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveSection('CLIENT')}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: activeSection === 'CLIENT' ? colors.white : 'transparent',
              color: activeSection === 'CLIENT' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeSection === 'CLIENT' ? `3px solid ${colors.primary}` : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            👤 My Requests (Client)
          </button>
          <button
            onClick={() => setActiveSection('FIXER')}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: activeSection === 'FIXER' ? colors.white : 'transparent',
              color: activeSection === 'FIXER' ? colors.primary : colors.textSecondary,
              border: 'none',
              borderBottom: activeSection === 'FIXER' ? `3px solid ${colors.primary}` : '3px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            🔧 My Jobs (Fixer)
          </button>
        </div>
      )}

      {/* Client Section */}
      {activeSection === 'CLIENT' && clientData && (
        <div>
          {/* Client Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <DashboardStat label="Total Requests" value={clientData.stats.totalRequests} icon="📋" />
            <DashboardStat label="Pending Requests" value={clientData.stats.pendingRequests} icon="⏳" color={colors.warning} />
            <DashboardStat label="Active Orders" value={clientData.stats.activeOrders} icon="🔧" color={colors.primary} />
            <DashboardStat label="Completed" value={clientData.stats.completedOrders} icon="✅" color={colors.success} />
          </div>

          {/* Active Gig Orders */}
          {clientData.activeOrders.filter(o => o.gigId).length > 0 && (
            <DashboardCard title="My Orders" style={{ marginBottom: '32px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Seller</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Package</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.activeOrders.filter(o => o.gigId).map((order) => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                            {order.gig?.title}
                          </div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                            Ordered {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {order.fixer?.name || order.fixer?.email || 'Anonymous'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {order.package?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                          ₦{order.totalAmount?.toLocaleString() || '0'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: borderRadius.full,
                            backgroundColor: order.status === 'COMPLETED' ? colors.successLight
                              : order.status === 'PAID' ? colors.primaryLight
                              : order.status === 'PAID_PARTIAL' ? colors.warningLight
                              : colors.errorLight,
                            color: order.status === 'COMPLETED' ? colors.success
                              : order.status === 'PAID' ? colors.primary
                              : order.status === 'PAID_PARTIAL' ? colors.warning
                              : colors.error
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
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

          {/* Active Service Request Orders */}
          {clientData.activeOrders.filter(o => o.requestId).length > 0 && (
            <DashboardCard title="Active Orders" style={{ marginBottom: '32px' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Fixer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.activeOrders.filter(o => o.requestId).map((order) => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                            {order.request?.subcategory?.category?.name || 'N/A'}
                          </div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                            {order.request?.subcategory?.name || 'N/A'}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {order.fixer.name || order.fixer.email || order.fixer.phone}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{order.totalAmount.toLocaleString()}</td>
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
                          <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
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

          {/* Service Requests */}
          <DashboardCard title="My Service Requests" style={{ marginBottom: '32px' }}>
            {clientData.requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>You haven't made any service requests yet</p>
                <Link
                  href="/client/requests/new"
                  style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                >
                  Create your first request
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Category</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Quotes</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Created</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.requests.map((request) => (
                      <tr key={request.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>{request.title}</div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary }}>{request.neighborhood.name}</div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {request.subcategory.category.name}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>{request.quotes.length}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            borderRadius: borderRadius.full,
                            backgroundColor: request.status === 'PENDING' ? colors.bgTertiary
                              : request.status === 'APPROVED' ? colors.successLight
                              : request.status === 'QUOTED' ? colors.primaryLight
                              : request.status === 'ACCEPTED' ? colors.primaryDark
                              : colors.errorLight,
                            color: request.status === 'PENDING' ? colors.textSecondary
                              : request.status === 'APPROVED' ? colors.success
                              : request.status === 'QUOTED' ? colors.primary
                              : request.status === 'ACCEPTED' ? colors.white
                              : colors.error
                          }}>
                            {request.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Link
                              href={`/client/requests/${request.id}`}
                              style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                            >
                              View
                            </Link>
                            {!['CANCELLED', 'ACCEPTED'].includes(request.status) && (
                              <CancelButton requestId={request.id} requestTitle={request.title} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>

          {/* Recent Completed Orders */}
          {clientData.completedOrders.length > 0 && (
            <DashboardCard title="Recently Completed">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Fixer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Completed</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Review</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientData.completedOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {order.request?.subcategory?.name || order.gig?.subcategory?.name || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                          {order.fixer?.name || order.fixer?.email || order.fixer?.phone || 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                          {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          {order.review ? (
                            <span style={{ color: colors.success, fontWeight: '600' }}>Reviewed</span>
                          ) : (
                            <Link
                              href={`/client/orders/${order.id}/review`}
                              style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                            >
                              Leave Review
                            </Link>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* Fixer Section */}
      {activeSection === 'FIXER' && fixerData && (
        <div>
          {/* Approval Status Banner */}
          {!fixerData.isApproved && (
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

          {/* Fixer Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <DashboardStat label="My Services" value={fixerData.stats.totalServices} icon="🛠️" />
            <DashboardStat label="Pending Quotes" value={fixerData.stats.pendingQuotes} icon="📝" color={colors.warning} />
            <DashboardStat label="Active Jobs" value={fixerData.stats.activeOrders} icon="⚡" color={colors.primary} />
            <DashboardStat label="Completed" value={fixerData.stats.completedOrders} icon="✅" color={colors.success} />
            <DashboardStat label="Avg Rating" value={fixerData.avgRating} icon="⭐" color="#F59E0B" />
          </div>

          {/* Inspection Quotes */}
          {fixerData.inspectionQuotes.length > 0 && (
            <DashboardCard title="🔍 Inspections Awaiting Final Quote" style={{ marginBottom: '32px' }}>
              <div style={{ padding: '16px', backgroundColor: '#FEF3C7', borderRadius: borderRadius.md, marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: '#92400E', margin: 0 }}>
                  ⚠️ These clients have paid for inspections. Complete your site visit and submit final quotes with actual costs.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {fixerData.inspectionQuotes.map((quote) => (
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
          {fixerData.activeOrders.length > 0 && (
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
                    {fixerData.activeOrders.map((order) => (
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
          {fixerData.isApproved && (
            <DashboardCard title="Available Service Requests" style={{ marginBottom: '32px' }}>
              {fixerData.availableRequests.length === 0 ? (
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
                      {fixerData.availableRequests.map((request) => {
                        const hasQuoted = request.quotes.length > 0;
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
                              ) : (
                                <Link
                                  href={`/fixer/requests/${request.id}`}
                                  style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                                >
                                  View & Quote
                                </Link>
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
          {fixerData.quotes.length > 0 && (
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
                    {fixerData.quotes.map((quote) => (
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
          {fixerData.completedOrders.length > 0 && (
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
                    {fixerData.completedOrders.map((order) => (
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
        </div>
      )}
    </div>
  );
}
