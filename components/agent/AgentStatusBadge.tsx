'use client';

import { AgentStatus } from '@prisma/client';

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

const statusConfig = {
  PENDING: {
    label: 'Pending Approval',
    color: '#F59E0B', // Amber
  },
  ACTIVE: {
    label: 'Active',
    color: '#10B981', // Green
  },
  SUSPENDED: {
    label: 'Suspended',
    color: '#EF4444', // Red
  },
  REJECTED: {
    label: 'Rejected',
    color: '#6B7280', // Gray
  },
  BANNED: {
    label: 'Banned',
    color: '#991B1B', // Dark Red
  },
};

export default function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 500,
        display: 'inline-block',
      }}
    >
      {config.label}
    </span>
  );
}
