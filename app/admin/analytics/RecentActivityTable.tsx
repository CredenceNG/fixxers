'use client';

import { useState } from 'react';
import { colors } from '@/lib/theme';

interface Activity {
  id: string;
  action: string;
  page: string | null;
  createdAt: Date;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
}

interface RecentActivityTableProps {
  activities: Activity[];
}

export default function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const totalPages = Math.ceil(activities.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentActivities = activities.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>User</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Action</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Page</th>
              <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {currentActivities.length > 0 ? (
              currentActivities.map((activity) => (
                <tr key={activity.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                    {activity.user?.name || activity.user?.email || 'Anonymous'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: activity.action === 'LOGIN' ? '#E8F4FD' : activity.action === 'PAGE_VIEW' ? '#F0F0F0' : '#FEF5E7',
                      color: activity.action === 'LOGIN' ? '#1565C0' : activity.action === 'PAGE_VIEW' ? '#666' : '#95620D',
                    }}>
                      {activity.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: colors.textSecondary }}>
                    {activity.page || '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: colors.textLight, textAlign: 'right' }}>
                    {new Date(activity.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', fontSize: '14px', color: colors.textLight }}>
                  No recent activity data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="admin-analytics-pagination" style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '14px', color: colors.textLight }}>
            Showing {startIndex + 1} to {Math.min(endIndex, activities.length)} of {activities.length} activities
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                backgroundColor: currentPage === 1 ? '#f5f5f5' : colors.white,
                color: currentPage === 1 ? colors.textLight : colors.textPrimary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              Previous
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: currentPage === pageNumber ? colors.primary : colors.white,
                      color: currentPage === pageNumber ? colors.white : colors.textPrimary,
                      cursor: 'pointer',
                      fontWeight: currentPage === pageNumber ? '600' : '500',
                    }}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                borderRadius: '4px',
                border: `1px solid ${colors.border}`,
                backgroundColor: currentPage === totalPages ? '#f5f5f5' : colors.white,
                color: currentPage === totalPages ? colors.textLight : colors.textPrimary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
