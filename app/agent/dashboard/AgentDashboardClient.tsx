"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardCard, DashboardButton, DashboardStat } from "@/components/DashboardLayout";
import { colors, borderRadius } from "@/lib/theme";

interface DashboardData {
  agent: {
    id: string;
    businessName: string;
    status: string;
    walletBalance: number;
    commissionPercentage: number;
    approvedNeighborhoods: Array<{
      id: string;
      name: string;
      city: string;
      state: string;
    }>;
    counts: {
      fixers: number;
      clients: number;
      gigs: number;
      quotes: number;
      requests: number;
      maxFixers: number;
      maxClients: number;
      pendingVetting: number;
    };
  };
  commissions: {
    walletBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    commissionPercentage: number;
    pendingAmount: number;
    paidAmount: number;
  };
}

export default function AgentDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/agent/dashboard");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load dashboard");
        }

        setData(result);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Agent Dashboard" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Agent Dashboard" subtitle="Error">
        <div style={{
          backgroundColor: colors.errorLight,
          borderLeft: `4px solid ${colors.error}`,
          padding: '20px',
          borderRadius: borderRadius.lg,
        }}>
          <p style={{ fontSize: '15px', color: colors.errorDark }}>{error || "Failed to load dashboard"}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { agent, commissions } = data;

  return (
    <DashboardLayout
      title="Agent Dashboard"
      subtitle={`Welcome back, ${agent.businessName}`}
      actions={
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <DashboardButton variant="primary" href="/agent/fixers">
            👥 Manage Fixers
          </DashboardButton>
          <DashboardButton variant="primary" href="/agent/clients">
            🤝 Manage Clients
          </DashboardButton>
          <DashboardButton variant="outline" href="/agent/earnings">
            💰 Earnings
          </DashboardButton>
          <DashboardButton variant="outline" href="/agent/profile">
            ⚙️ Settings
          </DashboardButton>
        </div>
      }
    >
      {/* Quick Actions */}
      <DashboardCard style={{ marginBottom: '32px' }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: '20px'
        }}>
          Quick Actions
        </h2>
        <div className="quick-actions-grid">
          <Link href="/agent/fixers/new" className="quick-action-link">
            <span>➕</span>
            <span>Add New Fixer</span>
          </Link>
          <Link href="/agent/clients/new" className="quick-action-link">
            <span>👤</span>
            <span>Add New Client</span>
          </Link>
          <Link href="/agent/earnings" className="quick-action-link">
            <span>💵</span>
            <span>View Commissions</span>
          </Link>
          <Link href="/agent/territory" className="quick-action-link">
            <span>🗺️</span>
            <span>Manage Territory</span>
          </Link>
        </div>
      </DashboardCard>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid">
        <DashboardStat label="Wallet Balance" value={`₦${Number(commissions.walletBalance).toLocaleString()}`} icon="💰" color={colors.primary} />
        <DashboardStat label="Total Earned" value={`₦${Number(commissions.totalEarned).toLocaleString()}`} icon="📈" color={colors.success} />
        <DashboardStat label="Managed Fixers" value={`${agent.counts.fixers} / ${agent.counts.maxFixers}`} icon="🔧" color={colors.blue} />
        <DashboardStat label="Managed Clients" value={`${agent.counts.clients} / ${agent.counts.maxClients}`} icon="👥" color={colors.accent} />
        <DashboardStat label="Commission Rate" value={`${Number(agent.commissionPercentage)}%`} icon="💵" color={colors.warning} />
      </div>

      {/* Pending Vetting Alert */}
      {agent.counts.pendingVetting > 0 && (
        <div style={{
          backgroundColor: colors.warningLight,
          borderLeft: `4px solid ${colors.warning}`,
          padding: '20px',
          marginBottom: '32px',
          marginTop: '32px',
          borderRadius: borderRadius.lg,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
              Fixers Awaiting Vetting
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, lineHeight: '1.5' }}>
              You have {agent.counts.pendingVetting} fixer{agent.counts.pendingVetting !== 1 ? 's' : ''} waiting for your vetting approval.{' '}
              <Link href="/agent/fixers" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'underline' }}>
                Review now
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Activity Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '32px' }}>
        {/* Territories */}
        <DashboardCard title={`Approved Territories (${agent.approvedNeighborhoods.length})`}>
          {agent.approvedNeighborhoods.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {agent.approvedNeighborhoods.map((n) => (
                <div key={n.id} style={{
                  padding: '12px 16px',
                  backgroundColor: colors.bgSecondary,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  color: colors.textPrimary,
                }}>
                  {n.name}, {n.city}, {n.state}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '14px', color: colors.textSecondary, textAlign: 'center', padding: '20px' }}>
              No territories approved yet. Request territory expansion from your{' '}
              <Link href="/agent/territory" style={{ color: colors.primary, fontWeight: '600' }}>
                territory settings
              </Link>
              .
            </p>
          )}
        </DashboardCard>

        {/* Activity Stats */}
        <DashboardCard title="Activity Overview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${colors.borderLight}` }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Gigs Created</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{agent.counts.gigs}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${colors.borderLight}` }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Quotes Submitted</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{agent.counts.quotes}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: `1px solid ${colors.borderLight}` }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Service Requests</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{agent.counts.requests}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Pending Vetting</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: agent.counts.pendingVetting > 0 ? colors.warning : colors.textPrimary }}>
                {agent.counts.pendingVetting}
              </span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
