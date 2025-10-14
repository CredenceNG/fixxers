'use client';

import { useState } from 'react';
import { styles, colors } from '@/lib/theme';

interface UnifiedDashboardProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    roles: string[];
  };
}

export default function UnifiedDashboard({ user }: UnifiedDashboardProps) {
  const [activeTab, setActiveTab] = useState<'CLIENT' | 'FIXER'>(
    user.roles.includes('CLIENT') ? 'CLIENT' : 'FIXER'
  );

  const hasClientRole = user.roles.includes('CLIENT');
  const hasFixerRole = user.roles.includes('FIXER');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <div style={{ padding: '24px' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ ...styles.headerTitle, marginBottom: '8px' }}>
            Welcome back, {user.name || 'User'}!
          </h1>
          <p style={{ fontSize: '15px', color: colors.textSecondary }}>
            You have access to both client and service provider features.
          </p>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            borderBottom: `2px solid ${colors.border}`,
            marginBottom: '32px',
          }}
        >
          {hasClientRole && (
            <button
              onClick={() => setActiveTab('CLIENT')}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: activeTab === 'CLIENT' ? colors.primary : colors.textSecondary,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `3px solid ${activeTab === 'CLIENT' ? colors.primary : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px',
              }}
            >
              My Requests
            </button>
          )}
          {hasFixerRole && (
            <button
              onClick={() => setActiveTab('FIXER')}
              style={{
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: activeTab === 'FIXER' ? colors.primary : colors.textSecondary,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: `3px solid ${activeTab === 'FIXER' ? colors.primary : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '-2px',
              }}
            >
              My Jobs
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'CLIENT' && (
            <div>
              <iframe
                src="/client/dashboard"
                style={{
                  width: '100%',
                  height: 'calc(100vh - 300px)',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                }}
                title="Client Dashboard"
              />
            </div>
          )}
          {activeTab === 'FIXER' && (
            <div>
              <iframe
                src="/fixer/dashboard"
                style={{
                  width: '100%',
                  height: 'calc(100vh - 300px)',
                  border: 'none',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                }}
                title="Fixer Dashboard"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
