'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

// Helper to fix theme import inconsistencies
const text = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
};

interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  description: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  variables: any;
  isActive: boolean;
}

export default function EmailTemplateEditor({ template }: { template: EmailTemplate }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    subject: template.subject,
    htmlBody: template.htmlBody,
    textBody: template.textBody || '',
    isActive: template.isActive,
  });
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [preview, setPreview] = useState<{ subject: string; htmlBody: string; textBody?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveMessage('✓ Template saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
        router.refresh();
      } else {
        setSaveMessage(`Error: ${data.error || 'Failed to save'}`);
      }
    } catch (error) {
      setSaveMessage('Error: Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);

    try {
      // Generate sample data based on available variables
      const sampleData: Record<string, any> = {};
      const vars = template.variables as Record<string, string>;

      Object.keys(vars).forEach((key) => {
        // Generate sample values based on variable name
        if (key.includes('Name')) sampleData[key] = 'John Doe';
        else if (key.includes('Email')) sampleData[key] = 'john@example.com';
        else if (key.includes('Amount') || key.includes('Fee')) sampleData[key] = '₦15,000';
        else if (key.includes('Number') || key.includes('Id')) sampleData[key] = 'ORD-12345';
        else if (key.includes('Date')) sampleData[key] = new Date().toLocaleDateString();
        else if (key.includes('Url')) sampleData[key] = 'https://fixers.com/example';
        else if (key.includes('Duration')) sampleData[key] = '2-3 hours';
        else if (key === 'isClient') sampleData[key] = true;
        else if (key === 'isFixer') sampleData[key] = false;
        else sampleData[key] = 'Sample Value';
      });

      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sampleData }),
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(data);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={() => router.push('/admin/email-templates')}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              padding: '4px 0',
              fontSize: '14px',
              marginBottom: '8px',
            }}
          >
            ← Back to Templates
          </button>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: text.primary }}>
            {template.name}
          </h1>
          <p style={{ margin: '8px 0 0 0', color: text.secondary }}>
            Template Type: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>{template.type}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePreview}
            disabled={isPreviewing}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: colors.primary,
              border: `2px solid ${colors.primary}`,
              borderRadius: borderRadius.md,
              fontWeight: '500',
              cursor: isPreviewing ? 'not-allowed' : 'pointer',
              opacity: isPreviewing ? 0.6 : 1,
            }}
          >
            {isPreviewing ? 'Generating...' : '👁️ Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: borderRadius.md,
              fontWeight: '500',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: saveMessage.startsWith('✓') ? '#dcfce7' : '#fee2e2',
            color: saveMessage.startsWith('✓') ? '#166534' : '#991b1b',
            borderRadius: borderRadius.md,
            fontSize: '14px',
          }}
        >
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div style={{ marginBottom: '24px', borderBottom: `2px solid ${colors.border}` }}>
        <button
          onClick={() => setActiveTab('edit')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'edit' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: activeTab === 'edit' ? colors.primary : text.secondary,
            fontWeight: activeTab === 'edit' ? '600' : '400',
            cursor: 'pointer',
            marginBottom: '-2px',
          }}
        >
          Edit Template
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          disabled={!preview}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'preview' ? `3px solid ${colors.primary}` : '3px solid transparent',
            color: activeTab === 'preview' ? colors.primary : text.secondary,
            fontWeight: activeTab === 'preview' ? '600' : '400',
            cursor: preview ? 'pointer' : 'not-allowed',
            opacity: preview ? 1 : 0.5,
            marginBottom: '-2px',
          }}
        >
          Preview
        </button>
      </div>

      {/* Edit Tab */}
      {activeTab === 'edit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column - Form Fields */}
          <div>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg, marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: text.primary }}>
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg, marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: text.primary }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg, marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: text.primary }}>
                Email Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
                placeholder="Use {{variableName}} for dynamic content"
              />
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg, marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: text.primary }}>
                HTML Body
              </label>
              <textarea
                value={formData.htmlBody}
                onChange={(e) => handleChange('htmlBody', e.target.value)}
                rows={20}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg, marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: text.primary }}>
                Plain Text Body (Optional)
              </label>
              <textarea
                value={formData.textBody}
                onChange={(e) => handleChange('textBody', e.target.value)}
                rows={10}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '13px',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500', color: text.primary }}>Template is Active</span>
              </label>
              <p style={{ margin: '8px 0 0 26px', fontSize: '13px', color: text.secondary }}>
                Inactive templates won't be used for sending emails
              </p>
            </div>
          </div>

          {/* Right Column - Variables Guide */}
          <div>
            <div
              style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: borderRadius.lg,
                position: 'sticky',
                top: '24px',
              }}
            >
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: text.primary }}>
                Available Variables
              </h3>
              <div style={{ fontSize: '13px', color: text.secondary, lineHeight: '1.8' }}>
                {Object.entries(template.variables as Record<string, string>).map(([key, description]) => (
                  <div key={key} style={{ marginBottom: '12px' }}>
                    <code
                      style={{
                        backgroundColor: '#f3f4f6',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        color: colors.primary,
                        fontWeight: '500',
                      }}
                    >
                      {`{{${key}}}`}
                    </code>
                    <div style={{ marginTop: '2px', marginLeft: '4px', color: text.secondary }}>
                      {description}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '24px',
                  padding: '12px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: borderRadius.md,
                  fontSize: '13px',
                  color: '#075985',
                }}
              >
                <strong>Handlebars Syntax:</strong>
                <br />• Conditional: <code>{'{{#if var}}...{{/if}}'}</code>
                <br />• Loop: <code>{'{{#each items}}...{{/each}}'}</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && preview && (
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: borderRadius.lg }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: text.primary }}>
              Subject Line
            </h3>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: borderRadius.md,
                fontFamily: 'monospace',
                fontSize: '14px',
              }}
            >
              {preview.subject}
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: text.primary }}>
              HTML Preview
            </h3>
            <div
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                overflow: 'hidden',
              }}
            >
              <iframe
                srcDoc={preview.htmlBody}
                style={{
                  width: '100%',
                  minHeight: '600px',
                  border: 'none',
                }}
                title="Email Preview"
              />
            </div>
          </div>

          {preview.textBody && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: text.primary }}>
                Plain Text Version
              </h3>
              <pre
                style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: borderRadius.md,
                  fontSize: '13px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                }}
              >
                {preview.textBody}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
