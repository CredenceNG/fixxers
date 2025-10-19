'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import AgentStatusBadge from '@/components/agent/AgentStatusBadge';
import { AgentStatus } from '@prisma/client';

interface AgentApplication {
  id: string;
  businessName: string;
  status: AgentStatus;
  pendingChanges: boolean;
  commissionPercentage: number;
  requestedNeighborhoodIds: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  approvedNeighborhoods: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
  }>;
  _count: {
    managedFixers: number;
    managedClients: number;
  };
}

export default function AdminAgentsClient() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'PENDING',
    pendingChanges: '',
    search: '',
  });

  useEffect(() => {
    fetchAgents();
  }, [filters]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.pendingChanges) params.append('pendingChanges', filters.pendingChanges);
      if (filters.search) params.append('search', filters.search);

      const res = await fetch(`/api/admin/agents?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent) return;

    const commissionPercentage = prompt('Commission percentage (default 5):', agent.commissionPercentage?.toString() || '5');
    if (!commissionPercentage) return;

    if (!confirm('Approve this agent application?')) return;

    setProcessingId(agentId);

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionPercentage: parseFloat(commissionPercentage),
          approvedNeighborhoodIds: agent.requestedNeighborhoodIds || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      alert('Agent approved successfully!');
      fetchAgents();
    } catch (err: any) {
      alert(err.message || 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (agentId: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason || !reason.trim()) {
      alert('Rejection reason is required');
      return;
    }

    if (!confirm('Reject this agent application?')) return;

    setProcessingId(agentId);

    try {
      const response = await fetch(`/api/admin/agents/${agentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      alert('Agent rejected successfully!');
      fetchAgents();
    } catch (err: any) {
      alert(err.message || 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingAgents = agents.filter((a) => a.status === 'PENDING');
  const activeAgents = agents.filter((a) => a.status === 'ACTIVE');
  const pendingChangesAgents = agents.filter((a) => a.pendingChanges);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.textPrimary }}>Agent Management</h1>
        <p style={{ marginTop: '8px', color: colors.textSecondary }}>Review and manage agent applications</p>
      </div>

      {/* Filters */}
      <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Changes
            </label>
            <select
              value={filters.pendingChanges}
              onChange={(e) => setFilters({ ...filters, pendingChanges: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="">All</option>
              <option value="true">Pending Changes</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, business, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Total Agents</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.textPrimary }}>{agents.length}</div>
        </div>
        <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.success }}>
            {activeAgents.length}
          </div>
        </div>
        <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Pending</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.warning }}>
            {pendingAgents.length}
          </div>
        </div>
        <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Pending Changes</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: colors.warning }}>
            {pendingChangesAgents.length}
          </div>
        </div>
      </div>

      {/* Agents List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>Loading agents...</div>
      ) : agents.length === 0 ? (
        <div style={{ backgroundColor: colors.white, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '48px', textAlign: 'center' }}>
          <p style={{ color: colors.textSecondary }}>No agents found</p>
        </div>
      ) : (
        <div style={{ backgroundColor: colors.white, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {agents.map((agent) => (
              <div key={agent.id} style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, margin: 0 }}>{agent.businessName}</h3>
                      <AgentStatusBadge status={agent.status} />
                      {agent.pendingChanges && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: borderRadius.md, fontSize: '12px', fontWeight: 600, backgroundColor: '#FEF5E7', color: '#95620D' }}>
                          Has Changes
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                      <p style={{ margin: 0 }}>Applicant: {agent.user.name} ({agent.user.email})</p>
                      <p style={{ margin: '4px 0 0 0' }}>Applied: {new Date(agent.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Commission Rate</span>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: '4px 0 0 0' }}>{Number(agent.commissionPercentage)}%</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Managed Fixers</span>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: '4px 0 0 0' }}>{agent._count.managedFixers}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Managed Clients</span>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: '4px 0 0 0' }}>{agent._count.managedClients}</p>
                      </div>
                    </div>

                    {agent.status === 'ACTIVE' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '12px' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: colors.textSecondary }}>Managed Fixers</span>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: '4px 0 0 0' }}>{agent._count.managedFixers}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: colors.textSecondary }}>Managed Clients</span>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: colors.textPrimary, margin: '4px 0 0 0' }}>{agent._count.managedClients}</p>
                        </div>
                      </div>
                    )}

                    {agent.requestedNeighborhoodIds.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                          Requested {agent.requestedNeighborhoodIds.length} neighborhoods
                        </span>
                      </div>
                    )}

                    {agent.approvedNeighborhoods.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {agent.approvedNeighborhoods.map((n) => (
                          <span
                            key={n.id}
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: borderRadius.sm, fontSize: '12px', backgroundColor: colors.blueLight, color: '#2952A3' }}
                          >
                            {n.name}, {n.city}, {n.state}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {agent.status === 'PENDING' && (
                    <div style={{ marginLeft: '24px', display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApprove(agent.id)}
                        disabled={processingId === agent.id}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: colors.white,
                          backgroundColor: colors.success,
                          border: 'none',
                          borderRadius: borderRadius.md,
                          cursor: processingId === agent.id ? 'not-allowed' : 'pointer',
                          opacity: processingId === agent.id ? 0.5 : 1,
                        }}
                      >
                        {processingId === agent.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(agent.id)}
                        disabled={processingId === agent.id}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: colors.white,
                          backgroundColor: colors.error,
                          border: 'none',
                          borderRadius: borderRadius.md,
                          cursor: processingId === agent.id ? 'not-allowed' : 'pointer',
                          opacity: processingId === agent.id ? 0.5 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {agent.status !== 'PENDING' && (
                    <button
                      onClick={() => router.push(`/admin/agents/${agent.id}`)}
                      style={{
                        marginLeft: '24px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: colors.textPrimary,
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                      }}
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
