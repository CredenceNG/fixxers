'use client';

import { useEffect, useState } from 'react';
import { colors } from '@/lib/theme';

interface AgentProfile {
  businessName: string;
  businessAddress: string;
  taxId: string;
  phoneNumber: string;
  status: string;
  commissionPercentage: number;
  user: {
    name: string;
    email: string;
  };
}

export default function AgentProfileClient() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    taxId: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/agent/profile');
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      setProfile(result.agent);
      setFormData({
        businessName: result.agent.businessName,
        businessAddress: result.agent.businessAddress || '',
        taxId: result.agent.taxId || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      setProfile(result.agent);
      setSaveSuccess('Profile updated successfully');
      setEditing(false);
      // Refresh profile data
      fetchProfile();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        businessName: profile.businessName,
        businessAddress: profile.businessAddress || '',
        taxId: profile.taxId || '',
      });
    }
    setEditing(false);
    setSaveError('');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: colors.textSecondary }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: colors.error }}>{error || 'Failed to load profile'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Agent Profile
          </h1>
          <p style={{ color: colors.textSecondary }}>
            Manage your agent profile information
          </p>
        </div>

        {saveSuccess && !editing && (
          <div style={{ padding: '12px', backgroundColor: colors.successLight, color: colors.successDark, borderRadius: '8px', marginBottom: '16px' }}>
            {saveSuccess}
          </div>
        )}

        {/* Account Information */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Account Information
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                Name
              </div>
              <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                {profile.user.name}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                Email
              </div>
              <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                {profile.user.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                Phone Number
              </div>
              <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                {profile.phoneNumber}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                Status
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  backgroundColor: profile.status === 'ACTIVE' ? colors.successLight : colors.warningLight,
                  color: profile.status === 'ACTIVE' ? colors.successDark : colors.warningDark,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {profile.status}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                Commission Rate
              </div>
              <div style={{ fontSize: '16px', color: colors.primary, fontWeight: '600' }}>
                {Number(profile.commissionPercentage)}%
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
              Business Information
            </h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            )}
          </div>

          {saveError && (
            <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: '8px', marginBottom: '16px' }}>
              {saveError}
            </div>
          )}

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                  Business Address
                </label>
                <textarea
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  rows={3}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.textPrimary }}>
                  Tax ID / Business Registration Number
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    padding: '12px 24px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    backgroundColor: colors.white,
                    color: colors.textPrimary,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Business Name
                </div>
                <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                  {profile.businessName}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Business Address
                </div>
                <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                  {profile.businessAddress || 'Not provided'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Tax ID / Business Registration Number
                </div>
                <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                  {profile.taxId || 'Not provided'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
