'use client';

import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';
import { EditNeighborhoodModal } from './EditNeighborhoodModal';

interface Neighborhood {
  id: string;
  name: string;
  legacyCity: string | null;
  legacyState: string | null;
  legacyCountry: string | null;
  createdAt: Date;
  _count: {
    serviceRequests: number;
    fixerServices: number;
  };
}

interface NeighborhoodsTableProps {
  neighborhoods: Neighborhood[];
  searchQuery: string;
}

export function NeighborhoodsTable({ neighborhoods, searchQuery }: NeighborhoodsTableProps) {
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Name
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                City
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                State
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Country
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Service Requests
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Fixer Services
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Created
              </th>
              <th
                style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {neighborhoods.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: colors.textSecondary }}>
                  {searchQuery ? 'No neighborhoods found matching your search' : 'No neighborhoods found'}
                </td>
              </tr>
            ) : (
              neighborhoods.map((neighborhood) => (
                <tr key={neighborhood.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                    {neighborhood.name}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {neighborhood.legacyCity}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {neighborhood.legacyState}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {neighborhood.legacyCountry}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textPrimary }}>
                    {neighborhood._count.serviceRequests}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textPrimary }}>
                    {neighborhood._count.fixerServices}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {formatDate(neighborhood.createdAt)}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => setEditingNeighborhood(neighborhood)}
                      style={{
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.white,
                        backgroundColor: colors.primary,
                        border: 'none',
                        borderRadius: borderRadius.md,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingNeighborhood && (
        <EditNeighborhoodModal
          neighborhood={editingNeighborhood}
          onClose={() => setEditingNeighborhood(null)}
        />
      )}
    </>
  );
}
