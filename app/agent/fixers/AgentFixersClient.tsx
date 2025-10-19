"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout, DashboardButton } from "@/components/DashboardLayout";
import { colors, borderRadius, spacing } from "@/lib/theme";

interface FixerData {
  id: string;
  status: string;
  vetStatus: string;
  createdAt: string;
  fixer: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    fixerProfile: {
      businessName: string | null;
      yearsOfExperience: number | null;
      approvalStatus: string;
      services: Array<{
        subcategory: {
          id: string;
          name: string;
          category: {
            id: string;
            name: string;
          };
        };
      }>;
    } | null;
  };
}

export default function AgentFixersClient() {
  const [fixers, setFixers] = useState<FixerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFixers = async () => {
      try {
        const response = await fetch("/api/agent/fixers");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load fixers");
        }

        setFixers(data.fixers);
      } catch (err: any) {
        setError(err.message || "Failed to load fixers");
      } finally {
        setLoading(false);
      }
    };

    fetchFixers();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Managed Fixers" subtitle="Loading...">
        <div style={{ textAlign: 'center', padding: spacing.xxl }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>Loading fixers...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Managed Fixers"
      subtitle="Fixers you manage on the platform"
      actions={
        <>
          <DashboardButton variant="primary" href="/agent/fixers/new">
            + Add Fixer
          </DashboardButton>
          <DashboardButton variant="outline" href="/agent/dashboard">
            ← Back to Dashboard
          </DashboardButton>
        </>
      }
    >
      {error && (
        <div style={{
          backgroundColor: colors.errorLight,
          borderLeft: `4px solid ${colors.error}`,
          padding: spacing.lg,
          borderRadius: borderRadius.md,
          marginBottom: spacing.lg,
        }}>
          <p style={{ fontSize: '15px', color: colors.errorDark }}>{error}</p>
        </div>
      )}

      {/* Fixers List */}
      {fixers.length === 0 ? (
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
            No fixers yet
          </h3>
          <p style={{ marginTop: spacing.sm, fontSize: '14px', color: colors.textSecondary }}>
            Start by adding fixers to your management roster
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
            {fixers.map((item) => (
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
                    {item.fixer.profileImage ? (
                      <img
                        src={item.fixer.profileImage}
                        alt={item.fixer.name}
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
                          {item.fixer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                          {item.fixer.name}
                        </h3>

                        {/* Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: `4px ${spacing.sm}`,
                          borderRadius: borderRadius.full,
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: item.status === 'ACTIVE' ? colors.successLight : colors.bgSecondary,
                          color: item.status === 'ACTIVE' ? colors.successDark : colors.textSecondary,
                        }}>
                          {item.status}
                        </span>

                        {/* Vet Status Badge */}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: `4px ${spacing.sm}`,
                          borderRadius: borderRadius.full,
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: item.vetStatus === 'APPROVED' ? colors.blueLight :
                                         item.vetStatus === 'PENDING' ? colors.warningLight : colors.errorLight,
                          color: item.vetStatus === 'APPROVED' ? '#2952A3' :
                                 item.vetStatus === 'PENDING' ? colors.warningDark : colors.errorDark,
                        }}>
                          Vetting: {item.vetStatus}
                        </span>
                      </div>

                      <div style={{ marginTop: spacing.sm, display: 'flex', alignItems: 'center', fontSize: '14px', color: colors.textSecondary }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.fixer.email}
                        </span>
                        {item.fixer.fixerProfile?.businessName && (
                          <>
                            <span style={{ margin: `0 ${spacing.sm}` }}>•</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.fixer.fixerProfile.businessName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Services */}
                      {item.fixer.fixerProfile?.services && item.fixer.fixerProfile.services.length > 0 && (
                        <div style={{ marginTop: spacing.sm, display: 'flex', flexWrap: 'wrap', gap: spacing.xs }}>
                          {item.fixer.fixerProfile.services.slice(0, 3).map((service) => (
                            <span
                              key={service.subcategory.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: `4px ${spacing.sm}`,
                                borderRadius: borderRadius.md,
                                fontSize: '12px',
                                backgroundColor: colors.bgSecondary,
                                color: colors.textPrimary,
                              }}
                            >
                              {service.subcategory.category.name} - {service.subcategory.name}
                            </span>
                          ))}
                          {item.fixer.fixerProfile.services.length > 3 && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: `4px ${spacing.sm}`,
                              borderRadius: borderRadius.md,
                              fontSize: '12px',
                              backgroundColor: colors.bgSecondary,
                              color: colors.textPrimary,
                            }}>
                              +{item.fixer.fixerProfile.services.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/users/${item.fixer.id}`}
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.primary,
                      textDecoration: 'none',
                      flexShrink: 0,
                    }}
                  >
                    View Profile
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
