'use client';

import { useState, useEffect } from 'react';
import { colors, borderRadius } from '@/lib/theme';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function DocumentTypesManager() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon: '📄',
  });

  // Fetch document types
  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/admin/document-types');
      const data = await res.json();
      setTypes(data.types || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load document types');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/document-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create document type');
        return;
      }

      setSuccess('Document type created successfully');
      setShowForm(false);
      setFormData({ id: '', name: '', description: '', icon: '📄' });
      fetchTypes();
    } catch (err) {
      setError('Failed to create document type');
    }
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/document-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update document type');
        return;
      }

      setSuccess('Document type updated successfully');
      setShowForm(false);
      setEditingId(null);
      setFormData({ id: '', name: '', description: '', icon: '📄' });
      fetchTypes();
    } catch (err) {
      setError('Failed to update document type');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/admin/document-types?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete document type');
        return;
      }

      setSuccess('Document type deleted successfully');
      fetchTypes();
    } catch (err) {
      setError('Failed to delete document type');
    }
  };

  // Handle edit
  const handleEdit = (type: DocumentType) => {
    setEditingId(type.id);
    setFormData(type);
    setShowForm(true);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ id: '', name: '', description: '', icon: '📄' });
    setError('');
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: colors.textPrimary,
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Document Types
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Manage document types required for badge verification
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            + Add Document Type
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: colors.errorLight,
          border: `1px solid ${colors.error}`,
          borderRadius: borderRadius.md,
          marginBottom: '24px',
          color: colors.error,
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '16px',
          backgroundColor: colors.successLight,
          border: `1px solid ${colors.success}`,
          borderRadius: borderRadius.md,
          marginBottom: '24px',
          color: colors.success,
        }}>
          {success}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: borderRadius.lg,
          marginBottom: '32px',
          border: `1px solid ${colors.border}`,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
            {editingId ? 'Edit Document Type' : 'New Document Type'}
          </h2>

          <form onSubmit={editingId ? handleUpdate : handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>ID (slug)</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g., govt_id"
                  required
                  disabled={!!editingId}
                />
              </div>

              <div>
                <label style={labelStyle}>Icon (emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  style={inputStyle}
                  placeholder="🆔"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Government-Issued ID"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ ...inputStyle, minHeight: '80px' }}
                placeholder="e.g., National ID, Driver's License, or International Passport"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }}>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Icon</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>ID</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Name</th>
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                  No document types found
                </td>
              </tr>
            ) : (
              types.map((type) => (
                <tr key={type.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px', fontSize: '24px' }}>{type.icon}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary, fontFamily: 'monospace' }}>{type.id}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>{type.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>{type.description}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(type)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colors.primary,
                          backgroundColor: colors.primaryLight,
                          border: 'none',
                          borderRadius: borderRadius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colors.error,
                          backgroundColor: colors.errorLight,
                          border: 'none',
                          borderRadius: borderRadius.sm,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
