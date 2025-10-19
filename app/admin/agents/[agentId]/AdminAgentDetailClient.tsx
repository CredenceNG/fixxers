'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import AgentStatusBadge from '@/components/agent/AgentStatusBadge';
import CommissionCard from '@/components/agent/CommissionCard';

interface AdminAgentDetailClientProps {
  agentId: string;
}

export default function AdminAgentDetailClient({ agentId }: AdminAgentDetailClientProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [reason, setReason] = useState('');
  const [newCommissionRate, setNewCommissionRate] = useState('');

  useEffect(() => {
    fetchAgentDetails();
  }, [agentId]);

  const fetchAgentDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}`);
      const data = await res.json();

      if (res.ok) {
        setAgent(data.agent);
        setNewCommissionRate(data.agent.commissionPercentage.toString());
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch agent details' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error fetching agent details' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (endpoint: string, body?: any) => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/agents/${agentId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
        await fetchAgentDetails();
        // Close any open modals
        setShowRejectModal(false);
        setShowSuspendModal(false);
        setShowBanModal(false);
        setReason('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Action failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error performing action' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommissionUpdate = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/agents/${agentId}/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionPercentage: parseFloat(newCommissionRate) }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Commission rate updated successfully' });
        await fetchAgentDetails();
        setShowCommissionModal(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update commission rate' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating commission rate' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', color: colors.textLight }}>Loading agent details...</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', color: colors.error }}>Agent not found</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/admin/agents')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ← Back to Agents
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
              {agent.user.name}
            </h1>
            <div style={{ fontSize: '16px', color: colors.textLight, marginBottom: '12px' }}>
              {agent.user.email}
            </div>
            <AgentStatusBadge status={agent.status} />
            {agent.pendingChanges && (
              <span
                style={{
                  marginLeft: '8px',
                  backgroundColor: '#FEF5E7',
                  color: '#F59E0B',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Pending Changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          style={{
            padding: '16px',
            backgroundColor: message.type === 'success' ? colors.primaryLight : colors.errorLight,
            border: `1px solid ${message.type === 'success' ? colors.primary : colors.error}`,
            borderRadius: '8px',
            marginBottom: '24px',
            color: message.type === 'success' ? colors.primaryDark : colors.errorDark,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {agent.status === 'PENDING' && (
          <>
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              Approve Agent
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.error,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              Reject Agent
            </button>
          </>
        )}

        {agent.pendingChanges && (
          <button
            onClick={() => handleAction('approve-changes')}
            disabled={actionLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.warning,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Approve Changes
          </button>
        )}

        {agent.status === 'ACTIVE' && (
          <button
            onClick={() => setShowSuspendModal(true)}
            disabled={actionLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.warning,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Suspend Agent
          </button>
        )}

        {agent.status === 'SUSPENDED' && (
          <button
            onClick={() => handleAction('approve')}
            disabled={actionLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Activate Agent
          </button>
        )}

        {agent.status !== 'BANNED' && (
          <button
            onClick={() => setShowBanModal(true)}
            disabled={actionLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#991B1B',
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: actionLoading ? 0.6 : 1,
            }}
          >
            Ban Agent
          </button>
        )}

        <button
          onClick={() => setShowCommissionModal(true)}
          disabled={actionLoading}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.white,
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            borderRadius: '8px',
            cursor: actionLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            opacity: actionLoading ? 0.6 : 1,
          }}
        >
          Edit Commission Rate
        </button>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Agent Profile */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Agent Profile</h2>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Business Name</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{agent.businessName || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Commission Rate</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{Number(agent.commissionPercentage)}%</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Phone</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>{agent.user.phone || 'Not provided'}</div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Registration Date</div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>
              {new Date(agent.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>

          {agent.notes && (
            <div>
              <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '14px', color: colors.textPrimary }}>{agent.notes}</div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Statistics</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '8px' }}>Managed Fixers</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>
                {agent._count?.managedFixers || 0}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '8px' }}>Managed Clients</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>
                {agent._count?.managedClients || 0}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '8px' }}>Total Gigs</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>
                {agent._count?.agentGigs || 0}
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: colors.textLight, marginBottom: '8px' }}>Total Commissions</div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: colors.primary }}>
                {agent._count?.commissions || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Neighborhoods */}
      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Approved Neighborhoods</h2>
        {agent.neighborhoods && agent.neighborhoods.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {agent.neighborhoods.map((n: any) => (
              <span
                key={n.id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: colors.primaryLight,
                  color: colors.primaryDark,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                {n.neighborhood.name}
              </span>
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textLight }}>No neighborhoods assigned</div>
        )}
      </div>

      {/* Pending Neighborhoods */}
      {agent.pendingNeighborhoods && agent.pendingNeighborhoods.length > 0 && (
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Pending Neighborhoods</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {agent.pendingNeighborhoods.map((n: any) => (
              <span
                key={n.id}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FEF5E7',
                  color: '#F59E0B',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                {n.neighborhood.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Managed Fixers */}
      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
          Managed Fixers ({agent.managedFixers.length})
        </h2>
        {agent.managedFixers.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {agent.managedFixers.map((af: any) => (
              <div
                key={af.id}
                style={{
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{af.fixer.name}</div>
                  <div style={{ fontSize: '12px', color: colors.textLight }}>{af.fixer.email}</div>
                </div>
                <button
                  onClick={() => router.push(`/admin/fixers/${af.fixer.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textLight }}>No fixers managed</div>
        )}
      </div>

      {/* Managed Clients */}
      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
          Managed Clients ({agent.managedClients.length})
        </h2>
        {agent.managedClients.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {agent.managedClients.map((ac: any) => (
              <div
                key={ac.id}
                style={{
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{ac.client.name}</div>
                  <div style={{ fontSize: '12px', color: colors.textLight }}>{ac.client.email}</div>
                </div>
                <button
                  onClick={() => router.push(`/admin/clients/${ac.client.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textLight }}>No clients managed</div>
        )}
      </div>

      {/* Recent Commissions */}
      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
          Recent Commissions (Last 10)
        </h2>
        {agent.commissions && agent.commissions.length > 0 ? (
          <div>
            {agent.commissions.map((commission: any) => (
              <CommissionCard key={commission.id} commission={commission} />
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textLight }}>No commissions earned yet</div>
        )}
      </div>

      {/* Recent Gigs */}
      <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
          Recent Gigs ({agent.agentGigs?.length || 0})
        </h2>
        {agent.agentGigs && agent.agentGigs.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {agent.agentGigs.slice(0, 10).map((agentGig: any) => (
              <div
                key={agentGig.gig.id}
                style={{
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{agentGig.gig.title}</div>
                  <div style={{ fontSize: '12px', color: colors.textLight }}>
                    Created {new Date(agentGig.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/admin/gigs/${agentGig.gig.id}`)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: colors.textLight }}>No gigs created yet</div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Reject Agent</h3>
            <p style={{ marginBottom: '16px', color: colors.textLight }}>
              Please provide a reason for rejecting this agent application.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '100px',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('reject', { reason })}
                disabled={!reason.trim() || actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.error,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !reason.trim() || actionLoading ? 'not-allowed' : 'pointer',
                  opacity: !reason.trim() || actionLoading ? 0.6 : 1,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSuspendModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Suspend Agent</h3>
            <p style={{ marginBottom: '16px', color: colors.textLight }}>
              Please provide a reason for suspending this agent.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter suspension reason..."
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '100px',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSuspendModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('suspend', { reason })}
                disabled={!reason.trim() || actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.warning,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !reason.trim() || actionLoading ? 'not-allowed' : 'pointer',
                  opacity: !reason.trim() || actionLoading ? 0.6 : 1,
                }}
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowBanModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: colors.error }}>
              Ban Agent
            </h3>
            <p style={{ marginBottom: '16px', color: colors.textLight }}>
              This is a serious action. Please provide a reason for banning this agent.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter ban reason..."
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '100px',
                marginBottom: '16px',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowBanModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('ban', { reason })}
                disabled={!reason.trim() || actionLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#991B1B',
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: !reason.trim() || actionLoading ? 'not-allowed' : 'pointer',
                  opacity: !reason.trim() || actionLoading ? 0.6 : 1,
                }}
              >
                Ban Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Modal */}
      {showCommissionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowCommissionModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
              Edit Commission Rate
            </h3>
            <p style={{ marginBottom: '16px', color: colors.textLight }}>
              Current rate: {Number(agent.commissionPercentage)}%
            </p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                New Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCommissionModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCommissionUpdate}
                disabled={
                  !newCommissionRate ||
                  parseFloat(newCommissionRate) < 0 ||
                  parseFloat(newCommissionRate) > 100 ||
                  actionLoading
                }
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor:
                    !newCommissionRate ||
                    parseFloat(newCommissionRate) < 0 ||
                    parseFloat(newCommissionRate) > 100 ||
                    actionLoading
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    !newCommissionRate ||
                    parseFloat(newCommissionRate) < 0 ||
                    parseFloat(newCommissionRate) > 100 ||
                    actionLoading
                      ? 0.6
                      : 1,
                }}
              >
                Update Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
