import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { colors, spacing, borderRadius, shadows, typography } from "@/lib/theme";
import Header from "@/components/Header";
import AgentApplicationForm from "./AgentApplicationForm";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function AgentApplicationPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { step } = await searchParams;
  const showForm = step === "form";

  // Check if user already has an agent profile
  const existingAgent = await prisma.agent.findUnique({
    where: { userId: user.id },
    include: {
      approvedNeighborhoods: {
        select: {
          id: true,
          name: true,
          city: {
            select: {
              name: true,
              state: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <>
      <Header />
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: `${spacing.xxl} 0` }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: `0 ${spacing.lg}` }}>
          <div style={{
            backgroundColor: colors.white,
            padding: spacing.xl,
            borderRadius: borderRadius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: shadows.card,
          }}>
            <div style={{ marginBottom: spacing.xl }}>
              <h1 style={{
                ...typography.h2,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}>
                {existingAgent ? "Agent Application Status" : "Apply to Become an Agent"}
              </h1>
              <p style={{
                fontSize: '16px',
                color: colors.textSecondary,
                lineHeight: '1.6',
              }}>
                {existingAgent
                  ? "View your agent application details and status"
                  : "Help connect fixers and clients in your local area"}
              </p>
            </div>

          {existingAgent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {/* Status Banner */}
              <div
                style={{
                  borderRadius: borderRadius.md,
                  padding: spacing.lg,
                  border: `1px solid ${
                    existingAgent.status === "ACTIVE" ? colors.primary :
                    existingAgent.status === "PENDING" ? colors.warning :
                    existingAgent.status === "REJECTED" ? colors.error :
                    colors.border
                  }`,
                  backgroundColor:
                    existingAgent.status === "ACTIVE" ? colors.primaryLight :
                    existingAgent.status === "PENDING" ? colors.warningLight :
                    existingAgent.status === "REJECTED" ? colors.errorLight :
                    colors.bgSecondary,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0 }}>
                    {existingAgent.status === "ACTIVE" && (
                      <svg style={{ height: '20px', width: '20px', color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {existingAgent.status === "PENDING" && (
                      <svg style={{ height: '20px', width: '20px', color: colors.warningDark }} fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {existingAgent.status === "REJECTED" && (
                      <svg style={{ height: '20px', width: '20px', color: colors.error }} fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div style={{ marginLeft: spacing.md, flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color:
                          existingAgent.status === "ACTIVE" ? colors.primaryDark :
                          existingAgent.status === "PENDING" ? colors.warningDark :
                          colors.errorDark,
                        marginBottom: spacing.sm,
                      }}
                    >
                      Status: {existingAgent.status}
                    </h3>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                      {existingAgent.status === "ACTIVE" && (
                        <p style={{ color: colors.primaryDark }}>
                          Your agent account is active. You can now manage fixers and clients.{" "}
                          <a href="/agent/dashboard" style={{ fontWeight: '600', textDecoration: 'underline', color: colors.primary }}>
                            Go to Dashboard
                          </a>
                        </p>
                      )}
                      {existingAgent.status === "PENDING" && (
                        <p style={{ color: colors.warningDark }}>
                          Your application is pending review. We'll notify you once it's been processed.
                        </p>
                      )}
                      {existingAgent.status === "REJECTED" && (
                        <p style={{ color: colors.errorDark }}>
                          {existingAgent.rejectionReason || "Your application was rejected."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h2 style={{
                  ...typography.h5,
                  color: colors.textPrimary,
                  marginBottom: spacing.lg,
                }}>Application Details</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.lg,
                }}>
                  <div>
                    <dt style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                    }}>Business Name</dt>
                    <dd style={{
                      fontSize: '14px',
                      color: colors.textPrimary,
                      fontWeight: '500',
                    }}>{existingAgent.businessName}</dd>
                  </div>
                  <div>
                    <dt style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                    }}>Commission Rate</dt>
                    <dd style={{
                      fontSize: '14px',
                      color: colors.textPrimary,
                      fontWeight: '500',
                    }}>{Number(existingAgent.commissionPercentage)}%</dd>
                  </div>
                  <div>
                    <dt style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                    }}>Max Fixers</dt>
                    <dd style={{
                      fontSize: '14px',
                      color: colors.textPrimary,
                      fontWeight: '500',
                    }}>{existingAgent.maxFixers}</dd>
                  </div>
                  <div>
                    <dt style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginBottom: spacing.xs,
                    }}>Max Clients</dt>
                    <dd style={{
                      fontSize: '14px',
                      color: colors.textPrimary,
                      fontWeight: '500',
                    }}>{existingAgent.maxClients}</dd>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <dt style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: colors.textSecondary,
                      marginBottom: spacing.sm,
                    }}>
                      Approved Neighborhoods ({existingAgent.approvedNeighborhoods.length})
                    </dt>
                    <dd>
                      {existingAgent.approvedNeighborhoods.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
                          {existingAgent.approvedNeighborhoods.map((neighborhood) => (
                            <span
                              key={neighborhood.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: `${spacing.xs} ${spacing.md}`,
                                borderRadius: borderRadius.full,
                                fontSize: '13px',
                                backgroundColor: colors.blueLight,
                                color: '#2952A3',
                                fontWeight: '500',
                                border: `1px solid ${colors.blue}`,
                              }}
                            >
                              {neighborhood.name}, {neighborhood.city.name}, {neighborhood.city.state.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '14px', color: colors.textSecondary }}>No neighborhoods approved yet</p>
                      )}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          ) : !showForm ? (
            // Introduction Page
            <div>
              <div style={{ marginBottom: spacing.xl }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: spacing.lg,
                }}>
                  What is a Fixers Agent?
                </h2>
                <p style={{
                  fontSize: '15px',
                  color: colors.textSecondary,
                  lineHeight: '1.6',
                  marginBottom: spacing.md,
                }}>
                  As a Fixers Agent, you'll play a crucial role in growing our community by connecting skilled fixers and clients in your local area. You'll earn commissions on every successful transaction facilitated through your network.
                </p>
              </div>

              {/* Benefits Section */}
              <div style={{ marginBottom: spacing.xl }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: spacing.lg,
                }}>
                  Benefits
                </h2>
                <div style={{ display: 'grid', gap: spacing.lg }}>
                  {[
                    {
                      icon: '💰',
                      title: 'Earn Commissions',
                      description: 'Receive a percentage of every transaction completed by fixers and clients you bring to the platform.'
                    },
                    {
                      icon: '🎯',
                      title: 'Flexible Targets',
                      description: 'Set your own pace with manageable monthly targets for onboarding fixers and clients.'
                    },
                    {
                      icon: '🌍',
                      title: 'Local Territory',
                      description: 'Manage your own territory and build relationships within your community.'
                    },
                    {
                      icon: '📊',
                      title: 'Track Performance',
                      description: 'Access a dedicated dashboard to monitor your earnings, fixers, and clients.'
                    },
                    {
                      icon: '🤝',
                      title: 'Support Network',
                      description: 'Get support from our team and collaborate with other agents across Nigeria.'
                    },
                    {
                      icon: '⚡',
                      title: 'Bonus Opportunities',
                      description: 'Earn bonuses for bringing in quality fixers who complete their first jobs.'
                    }
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        gap: spacing.md,
                        padding: spacing.lg,
                        backgroundColor: colors.bgSecondary,
                        borderRadius: borderRadius.md,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div style={{
                        fontSize: '32px',
                        flexShrink: 0,
                      }}>
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.textPrimary,
                          marginBottom: spacing.xs,
                        }}>
                          {benefit.title}
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: colors.textSecondary,
                          lineHeight: '1.5',
                        }}>
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div style={{ marginBottom: spacing.xxl }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: spacing.lg,
                }}>
                  Requirements
                </h2>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gap: spacing.md,
                }}>
                  {[
                    'Strong communication and networking skills',
                    'Knowledge of your local area and community',
                    'Ability to vet and onboard quality service providers',
                    'Basic understanding of home services and repairs',
                    'Commitment to maintaining quality standards'
                  ].map((req, index) => (
                    <li
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: spacing.sm,
                        fontSize: '15px',
                        color: colors.textSecondary,
                      }}
                    >
                      <svg
                        style={{
                          width: '20px',
                          height: '20px',
                          color: colors.primary,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: spacing.md,
                justifyContent: 'flex-end',
                paddingTop: spacing.lg,
                borderTop: `1px solid ${colors.border}`,
              }}>
                <Link
                  href={user.roles?.includes('FIXER') ? '/fixer/dashboard' : user.roles?.includes('CLIENT') ? '/client/dashboard' : '/dashboard'}
                  style={{
                    padding: `${spacing.md} ${spacing.xl}`,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'all 0.2s',
                  }}
                >
                  Not Now
                </Link>
                <Link
                  href="/agent/application?step=form"
                  style={{
                    padding: `${spacing.md} ${spacing.xl}`,
                    fontSize: '15px',
                    fontWeight: '600',
                    color: colors.white,
                    backgroundColor: colors.primary,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'all 0.2s',
                  }}
                >
                  Continue to Application
                </Link>
              </div>
            </div>
          ) : (
            <AgentApplicationForm />
          )}
        </div>
      </div>
    </div>
    </>
  );
}
