'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

export function ApproveRejectButtons({
  requestId,
  status,
  clientName,
  adminApproved,
}: {
  requestId: string;
  status: string;
  clientName: string;
  adminApproved: boolean;
}) {
  const router = useRouter();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show appropriate status based on approval and request status
  if (status === 'CANCELLED') {
    return (
      <span style={{ fontSize: '13px', color: colors.error, fontWeight: '600' }}>
        Rejected
      </span>
    );
  }

  if (status === 'APPROVED' || adminApproved) {
    return (
      <span style={{ fontSize: '13px', color: colors.success, fontWeight: '600' }}>
        ✓ Approved
      </span>
    );
  }

  if (status !== 'PENDING') {
    return (
      <span style={{ fontSize: '13px', color: colors.textSecondary }}>
        Processed
      </span>
    );
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Service request approved successfully!');
        setShowApproveModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve service request');
      }
    } catch (error) {
      alert('Failed to approve service request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Service request rejected successfully!');
        setShowRejectModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject service request');
      }
    } catch (error) {
      alert('Failed to reject service request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setShowApproveModal(true)}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: colors.success,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Approve
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            fontWeight: '600',
            backgroundColor: colors.error,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: 'pointer',
          }}
        >
          Reject
        </button>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowApproveModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Approve Service Request
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              Are you sure you want to approve this service request from <strong>{clientName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <DashboardButton
                variant="outline"
                onClick={() => setShowApproveModal(false)}
                disabled={loading}
              >
                Cancel
              </DashboardButton>
              <DashboardButton
                variant="primary"
                onClick={handleApprove}
                disabled={loading}
                style={{ backgroundColor: colors.success }}
              >
                {loading ? 'Approving...' : 'Approve'}
              </DashboardButton>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Reject Service Request
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              Are you sure you want to reject this service request from <strong>{clientName}</strong>? This action will cancel the request.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <DashboardButton
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
              >
                Cancel
              </DashboardButton>
              <DashboardButton
                variant="primary"
                onClick={handleReject}
                disabled={loading}
                style={{ backgroundColor: colors.error }}
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </DashboardButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
