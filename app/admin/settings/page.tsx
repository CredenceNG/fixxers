import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

const prismaAny = prisma as any;

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { success, error } = await searchParams;

  // Fetch pending counts for badges
  const pendingBadgeRequests = await prismaAny.badgeRequest.count({
    where: {
      status: {
        in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW']
      }
    },
  });

  const pendingAgentApplications = await prismaAny.agent.count({
    where: {
      status: 'PENDING'
    },
  });

  const pendingReports = await prisma.reviewReport.count({
    where: {
      status: {
        in: ['PENDING', 'REVIEWING']
      }
    },
  });

  // Fetch platform settings
  const settings = await prisma.platformSettings.findMany({
    orderBy: { key: 'asc' },
  });

  // Convert to key-value map
  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  const platformFee = settingsMap['PLATFORM_FEE_PERCENTAGE'] || '10';
  const minWithdrawalAmount = settingsMap['MIN_WITHDRAWAL_AMOUNT'] || '5000';
  const maxWithdrawalAmount = settingsMap['MAX_WITHDRAWAL_AMOUNT'] || '500000';
  const autoApproveGigs = settingsMap['AUTO_APPROVE_GIGS'] || 'false';
  const autoApproveRequests = settingsMap['AUTO_APPROVE_REQUESTS'] || 'false';
  const maintenanceMode = settingsMap['MAINTENANCE_MODE'] || 'false';

  // Agent Settings
  const agentCommissionPercentage = settingsMap['AGENT_COMMISSION_PERCENTAGE'] || '5';
  const agentTargetMonthlyFixers = settingsMap['AGENT_TARGET_MONTHLY_FIXERS'] || '10';
  const agentTargetMonthlyClients = settingsMap['AGENT_TARGET_MONTHLY_CLIENTS'] || '20';

  const cardStyle = {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const buttonStyle = {
    padding: '12px 32px',
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      <div style={{ maxWidth: '800px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Platform Settings
          </h1>
          <p style={{ fontSize: '16px', color: colors.textLight }}>
            Configure platform-wide settings and parameters
          </p>
        </div>

        {/* Success/Error Messages */}
        {success === 'saved' && (
          <div style={{
            ...cardStyle,
            marginBottom: '24px',
            backgroundColor: colors.primaryLight,
            border: `1px solid ${colors.primary}`
          }}>
            <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
              ✓ Settings saved successfully!
            </p>
          </div>
        )}
        {error && (
          <div style={{
            ...cardStyle,
            marginBottom: '24px',
            backgroundColor: '#FDEDEC',
            border: `1px solid #dc3545`
          }}>
            <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
              ✗ Error: {error === 'invalid_request' ? 'Invalid request' : error === 'save_failed' ? 'Failed to save settings' : 'An error occurred'}
            </p>
          </div>
        )}

        {/* Platform Fee Setting */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Platform Fee
          </h2>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '24px' }}>
            Set the percentage fee charged on each completed order
          </p>

          <form action="/api/admin/settings" method="POST">
            <input type="hidden" name="key" value="PLATFORM_FEE_PERCENTAGE" />
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Fee Percentage (%)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  name="value"
                  defaultValue={platformFee}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '15px', color: colors.textLight }}>%</span>
              </div>
              <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                Current: {platformFee}% of order total
              </p>
            </div>
            <button type="submit" style={buttonStyle}>
              Save Changes
            </button>
          </form>
        </div>

        {/* Withdrawal Limits */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Withdrawal Limits
          </h2>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '24px' }}>
            Set minimum and maximum withdrawal amounts for fixers
          </p>

          <form action="/api/admin/settings" method="POST">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Minimum Amount (₦)
                </label>
                <input type="hidden" name="settings[0][key]" value="MIN_WITHDRAWAL_AMOUNT" />
                <input
                  type="number"
                  name="settings[0][value]"
                  defaultValue={minWithdrawalAmount}
                  min="0"
                  step="100"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                  Current: ₦{Number(minWithdrawalAmount).toLocaleString()}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Maximum Amount (₦)
                </label>
                <input type="hidden" name="settings[1][key]" value="MAX_WITHDRAWAL_AMOUNT" />
                <input
                  type="number"
                  name="settings[1][value]"
                  defaultValue={maxWithdrawalAmount}
                  min="0"
                  step="100"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                  Current: ₦{Number(maxWithdrawalAmount).toLocaleString()}
                </p>
              </div>
            </div>
            <button type="submit" style={buttonStyle}>
              Save Withdrawal Limits
            </button>
          </form>
        </div>

        {/* Auto-Approval Settings */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Auto-Approval Settings
          </h2>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '24px' }}>
            Configure automatic approval for gigs and service requests
          </p>

          <form action="/api/admin/settings" method="POST">
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="hidden" name="settings[0][key]" value="AUTO_APPROVE_GIGS" />
                <input
                  type="checkbox"
                  name="settings[0][value]"
                  value="true"
                  defaultChecked={autoApproveGigs === 'true'}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                    Auto-approve Gigs
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textLight }}>
                    Automatically approve new gig submissions without manual review
                  </div>
                </div>
              </label>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input type="hidden" name="settings[1][key]" value="AUTO_APPROVE_REQUESTS" />
                <input
                  type="checkbox"
                  name="settings[1][value]"
                  value="true"
                  defaultChecked={autoApproveRequests === 'true'}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                    Auto-approve Service Requests
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textLight }}>
                    Automatically approve new service requests without manual review
                  </div>
                </div>
              </label>
            </div>

            <button type="submit" style={buttonStyle}>
              Save Auto-Approval Settings
            </button>
          </form>
        </div>

        {/* Agent Settings */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Agent Settings
          </h2>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '24px' }}>
            Configure default settings for agent commission and performance targets
          </p>

          <form action="/api/admin/settings" method="POST">
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                Default Commission Percentage (%)
              </label>
              <input type="hidden" name="settings[0][key]" value="AGENT_COMMISSION_PERCENTAGE" />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="number"
                  name="settings[0][value]"
                  defaultValue={agentCommissionPercentage}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '15px', color: colors.textLight }}>%</span>
              </div>
              <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                Default commission agents earn on completed orders: {agentCommissionPercentage}%
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Monthly Target: Fixers
                </label>
                <input type="hidden" name="settings[1][key]" value="AGENT_TARGET_MONTHLY_FIXERS" />
                <input
                  type="number"
                  name="settings[1][value]"
                  defaultValue={agentTargetMonthlyFixers}
                  min="0"
                  step="1"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                  Target number of fixers to onboard per month
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  Monthly Target: Clients
                </label>
                <input type="hidden" name="settings[2][key]" value="AGENT_TARGET_MONTHLY_CLIENTS" />
                <input
                  type="number"
                  name="settings[2][value]"
                  defaultValue={agentTargetMonthlyClients}
                  min="0"
                  step="1"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '13px', color: colors.textLight, marginTop: '8px' }}>
                  Target number of clients to onboard per month
                </p>
              </div>
            </div>
            <button type="submit" style={buttonStyle}>
              Save Agent Settings
            </button>
          </form>
        </div>

        {/* Maintenance Mode */}
        <div style={{ ...cardStyle, marginTop: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Maintenance Mode
          </h2>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '24px' }}>
            Enable maintenance mode to temporarily disable the platform for non-admin users
          </p>

          <form action="/api/admin/settings" method="POST">
            <input type="hidden" name="key" value="MAINTENANCE_MODE" />
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="value"
                  value="true"
                  defaultChecked={maintenanceMode === 'true'}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                    Enable Maintenance Mode
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textLight }}>
                    When enabled, only admins can access the platform
                  </div>
                </div>
              </label>
            </div>

            <button
              type="submit"
              style={maintenanceMode === 'true' ? dangerButtonStyle : buttonStyle}
            >
              {maintenanceMode === 'true' ? 'Disable' : 'Enable'} Maintenance Mode
            </button>
          </form>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
