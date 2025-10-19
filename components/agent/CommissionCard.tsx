'use client';

import { colors } from '@/lib/theme';

interface CommissionCardProps {
  commission: {
    id: string;
    amount: number;
    percentage: number;
    orderAmount: number;
    status: string;
    createdAt: Date;
    order?: {
      id: string;
      gig?: {
        title: string;
      };
    };
    agentFixer?: {
      fixer: {
        name: string;
      };
    };
  };
}

export default function CommissionCard({ commission }: CommissionCardProps) {
  const statusColor = commission.status === 'PAID' ? '#10B981' : '#F59E0B';

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: colors.white,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px' }}>
            ₦{Number(commission.amount).toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: colors.textLight }}>
            {Number(commission.percentage)}% of ₦{Number(commission.orderAmount).toLocaleString()}
          </div>
        </div>
        <span
          style={{
            backgroundColor: `${statusColor}20`,
            color: statusColor,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          {commission.status}
        </span>
      </div>

      {commission.order?.gig?.title && (
        <div style={{ fontSize: '14px', color: colors.textPrimary, marginBottom: '4px' }}>
          <strong>Gig:</strong> {commission.order.gig.title}
        </div>
      )}

      {commission.agentFixer?.fixer && (
        <div style={{ fontSize: '14px', color: colors.textLight, marginBottom: '4px' }}>
          <strong>Fixer:</strong> {commission.agentFixer.fixer.name}
        </div>
      )}

      <div style={{ fontSize: '12px', color: colors.textLight, marginTop: '8px' }}>
        {new Date(commission.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
    </div>
  );
}
