'use client';

import { useState } from 'react';
import { colors } from '@/lib/theme';

interface FixerVettingFormProps {
  fixerId: string;
  fixerName: string;
  onSubmit: (approved: boolean, notes: string) => Promise<void>;
  onCancel: () => void;
}

export default function FixerVettingForm({
  fixerId,
  fixerName,
  onSubmit,
  onCancel,
}: FixerVettingFormProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (approved: boolean) => {
    if (!notes.trim()) {
      setError('Please provide vetting notes');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(approved, notes);
    } catch (err: any) {
      setError(err.message || 'Failed to submit vetting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', backgroundColor: colors.white, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: colors.textPrimary }}>
        Vet Fixer: {fixerName}
      </h3>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: colors.textPrimary }}>
          Vetting Notes *
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Provide details about your vetting process (background check, interview notes, verification, etc.)"
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '10px 20px',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#EF4444',
            color: colors.white,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Rejecting...' : 'Reject'}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: colors.primary,
            color: colors.white,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Approving...' : 'Approve & Send to Admin'}
        </button>
      </div>
    </div>
  );
}
