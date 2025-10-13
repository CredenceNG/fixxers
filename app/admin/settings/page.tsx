import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const { success, error } = await searchParams;

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

  return (
    <DashboardLayoutWithHeader
      title="Platform Settings"
      subtitle="Configure platform-wide settings and parameters"
      actions={
        <DashboardButton variant="outline" href="/admin/dashboard">
          ← Back to Dashboard
        </DashboardButton>
      }
    >
        <div style={{ maxWidth: '800px' }}>
          {/* Success/Error Messages */}
          {success === 'saved' && (
            <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}` }}>
              <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
                ✓ Settings saved successfully!
              </p>
            </DashboardCard>
          )}
          {error && (
            <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}` }}>
              <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
                ✗ Error: {error === 'invalid_request' ? 'Invalid request' : error === 'save_failed' ? 'Failed to save settings' : 'An error occurred'}
              </p>
            </DashboardCard>
          )}

          {/* Platform Fee Setting */}
          <DashboardCard>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Platform Fee
            </h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
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
                    style={{ flex: 1, padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none' }}
                  />
                  <span style={{ fontSize: '15px', color: colors.textSecondary }}>%</span>
                </div>
                <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                  Current: {platformFee}% of order total
                </p>
              </div>
              <DashboardButton
                variant="primary"
                type="submit"
                style={{ padding: '12px 32px' }}
              >
                Save Changes
              </DashboardButton>
            </form>
          </DashboardCard>

          {/* Withdrawal Limits */}
          <DashboardCard style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Withdrawal Limits
            </h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
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
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none' }}
                  />
                  <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
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
                    style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, outline: 'none' }}
                  />
                  <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                    Current: ₦{Number(maxWithdrawalAmount).toLocaleString()}
                  </p>
                </div>
              </div>
              <DashboardButton
                variant="primary"
                type="submit"
                style={{ padding: '12px 32px' }}
              >
                Save Withdrawal Limits
              </DashboardButton>
            </form>
          </DashboardCard>

          {/* Auto-Approval Settings */}
          <DashboardCard style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Auto-Approval Settings
            </h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
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
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
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
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      Automatically approve new service requests without manual review
                    </div>
                  </div>
                </label>
              </div>

              <DashboardButton
                variant="primary"
                type="submit"
                style={{ padding: '12px 32px' }}
              >
                Save Auto-Approval Settings
              </DashboardButton>
            </form>
          </DashboardCard>

          {/* Maintenance Mode */}
          <DashboardCard style={{ marginTop: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Maintenance Mode
            </h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '24px' }}>
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
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      When enabled, only admins can access the platform
                    </div>
                  </div>
                </label>
              </div>

              <DashboardButton
                variant={maintenanceMode === 'true' ? 'danger' : 'primary'}
                type="submit"
                style={{ padding: '12px 32px' }}
              >
                {maintenanceMode === 'true' ? 'Disable' : 'Enable'} Maintenance Mode
              </DashboardButton>
            </form>
          </DashboardCard>
        </div>
    </DashboardLayoutWithHeader>
  );
}
