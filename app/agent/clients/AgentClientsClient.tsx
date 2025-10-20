'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout, DashboardButton } from '@/components/DashboardLayout';
import { colors, spacing, borderRadius } from '@/lib/theme';

interface ClientData {
  id: string;
  client: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    createdAt: string;
  };
  addedAt: string;
}

export default function AgentClientsClient() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/agent/clients');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch clients');
      }

      setClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Managed Clients" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: spacing.xxl }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading clients...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Managed Clients" subtitle="Error">
        <div style={{
          backgroundColor: colors.errorLight,
          borderLeft: `4px solid ${colors.error}`,
          padding: spacing.lg,
          borderRadius: borderRadius.md,
        }}>
          <p style={{ fontSize: '15px', color: colors.errorDark }}>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Managed Clients"
      subtitle={`${clients.length} ${clients.length === 1 ? 'client' : 'clients'}`}
      actions={
        <>
          <DashboardButton variant="primary" href="/agent/clients/new">
            + Add Client
          </DashboardButton>
          <DashboardButton variant="outline" href="/agent/dashboard">
            ← Back to Dashboard
          </DashboardButton>
        </>
      }
    >

      {/* Clients List */}
      {clients.length === 0 ? (
        <div style={{
          backgroundColor: colors.white,
          padding: spacing.xxl,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          textAlign: 'center',
        }}>
          <svg
            style={{ margin: '0 auto', height: '48px', width: '48px', color: colors.textSecondary }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 style={{ marginTop: spacing.md, fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
            No clients yet
          </h3>
          <p style={{ marginTop: spacing.sm, fontSize: '14px', color: colors.textSecondary }}>
            Start by adding clients to your management roster
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {clients.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: spacing.lg,
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 }}>
                    {/* Avatar */}
                    {item.client.profileImage ? (
                      <img
                        src={item.client.profileImage}
                        alt={item.client.name}
                        style={{ height: '48px', width: '48px', borderRadius: '50%', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        height: '48px',
                        width: '48px',
                        borderRadius: '50%',
                        backgroundColor: colors.bgSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '20px', fontWeight: '600', color: colors.textSecondary }}>
                          {item.client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                        {item.client.name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.textSecondary }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.client.email}
                        </span>
                        <span style={{ margin: `0 ${spacing.sm}` }}>•</span>
                        <span>
                          Added {new Date(item.addedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/agent/clients/${item.client.id}/request/new`}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.primary,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    Create Request
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
}
