'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

interface UserFiltersProps {
  roleFilter: string;
  statusFilter: string;
  searchQuery: string;
}

export function UserFilters({ roleFilter, statusFilter, searchQuery }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (role) {
      params.set('role', role);
    } else {
      params.delete('role');
    }
    params.set('page', '1');

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1');

    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <>
      {/* Desktop: Button Groups */}
      <div className="desktop-filters">
        {/* Role Filter Buttons */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginRight: '8px' }}>
            Role:
          </span>
          <Link
            href={`/admin/users?${statusFilter ? `status=${statusFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=1`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: !roleFilter ? colors.white : colors.textPrimary,
              backgroundColor: !roleFilter ? colors.primary : colors.white,
              border: `2px solid ${!roleFilter ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            All Roles
          </Link>
          <Link
            href={`/admin/users?role=CLIENT${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: roleFilter === 'CLIENT' ? colors.white : colors.textPrimary,
              backgroundColor: roleFilter === 'CLIENT' ? colors.primary : colors.white,
              border: `2px solid ${roleFilter === 'CLIENT' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Client
          </Link>
          <Link
            href={`/admin/users?role=FIXER${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: roleFilter === 'FIXER' ? colors.white : colors.textPrimary,
              backgroundColor: roleFilter === 'FIXER' ? colors.primary : colors.white,
              border: `2px solid ${roleFilter === 'FIXER' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Fixer
          </Link>
          <Link
            href={`/admin/users?role=ADMIN${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: roleFilter === 'ADMIN' ? colors.white : colors.textPrimary,
              backgroundColor: roleFilter === 'ADMIN' ? colors.primary : colors.white,
              border: `2px solid ${roleFilter === 'ADMIN' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Admin
          </Link>
          <Link
            href={`/admin/users?role=BOTH${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: roleFilter === 'BOTH' ? colors.white : colors.textPrimary,
              backgroundColor: roleFilter === 'BOTH' ? colors.primary : colors.white,
              border: `2px solid ${roleFilter === 'BOTH' ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Both (Client + Fixer)
          </Link>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginRight: '8px' }}>
            Status:
          </span>
          <Link
            href={`/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=1`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: !statusFilter ? colors.white : colors.textPrimary,
              backgroundColor: !statusFilter ? colors.primary : colors.white,
              border: `2px solid ${!statusFilter ? colors.primary : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            All Status
          </Link>
          <Link
            href={`/admin/users?status=ACTIVE${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: statusFilter === 'ACTIVE' ? colors.white : colors.textPrimary,
              backgroundColor: statusFilter === 'ACTIVE' ? colors.success : colors.white,
              border: `2px solid ${statusFilter === 'ACTIVE' ? colors.success : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Active
          </Link>
          <Link
            href={`/admin/users?status=PENDING${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: statusFilter === 'PENDING' ? 'white' : colors.textPrimary,
              backgroundColor: statusFilter === 'PENDING' ? colors.warning : colors.white,
              border: `2px solid ${statusFilter === 'PENDING' ? colors.warning : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Pending
          </Link>
          <Link
            href={`/admin/users?status=REJECTED${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: statusFilter === 'REJECTED' ? colors.white : colors.textPrimary,
              backgroundColor: statusFilter === 'REJECTED' ? colors.error : colors.white,
              border: `2px solid ${statusFilter === 'REJECTED' ? colors.error : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Rejected
          </Link>
          <Link
            href={`/admin/users?status=SUSPENDED${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: statusFilter === 'SUSPENDED' ? colors.white : colors.textPrimary,
              backgroundColor: statusFilter === 'SUSPENDED' ? colors.error : colors.white,
              border: `2px solid ${statusFilter === 'SUSPENDED' ? colors.error : colors.border}`,
              borderRadius: borderRadius.md,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Suspended
          </Link>
        </div>
      </div>

      {/* Mobile: Select Dropdowns */}
      <div className="mobile-filters" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Role Select */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px' }}>
              Role
            </label>
            <select
              value={roleFilter}
              onChange={handleRoleChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
              }}
            >
              <option value="">All Roles</option>
              <option value="CLIENT">Client</option>
              <option value="FIXER">Fixer</option>
              <option value="ADMIN">Admin</option>
              <option value="BOTH">Both (Client + Fixer)</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '14px',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
              }}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-filters {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-filters {
            display: none !important;
          }

          .mobile-filters {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
