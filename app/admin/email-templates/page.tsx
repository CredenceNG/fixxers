import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import Link from 'next/link';

// Helper to fix theme import inconsistencies
const text = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
};

export default async function EmailTemplatesPage() {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <AdminDashboardWrapper userName={user.name || undefined} userAvatar={user.profileImage || undefined}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: text.primary }}>
              Email Templates
            </h1>
            <p style={{ margin: '8px 0 0 0', color: text.secondary }}>
              Manage email templates sent to users. Edit content without changing code.
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: `1px solid ${colors.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Template Name
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Type
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Subject
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Last Updated
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: text.secondary, fontSize: '14px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px', fontWeight: '500', color: text.primary }}>
                    {template.name}
                    {template.description && (
                      <div style={{ fontSize: '13px', color: text.secondary, marginTop: '4px' }}>
                        {template.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: text.secondary, fontFamily: 'monospace' }}>
                    {template.type}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: text.secondary, maxWidth: '300px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {template.subject}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: borderRadius.full,
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: template.isActive ? '#dcfce7' : '#fee2e2',
                        color: template.isActive ? '#166534' : '#991b1b',
                      }}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '13px', color: text.secondary }}>
                    {new Date(template.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <Link
                      href={`/admin/email-templates/${template.id}`}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: colors.primary,
                        color: 'white',
                        borderRadius: borderRadius.md,
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-block',
                      }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {templates.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: text.secondary }}>
              <p>No email templates found</p>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: borderRadius.md,
            border: '1px solid #bae6fd',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#0c4a6e' }}>
            ℹ️ Template Variables
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#075985', lineHeight: '1.6' }}>
            Use Handlebars syntax in your templates:
            <br />
            • <code style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '3px' }}>{'{{variableName}}'}</code> - Insert a variable
            <br />
            • <code style={{ backgroundColor: 'white', padding: '2px 6px', borderRadius: '3px' }}>{'{{#if variable}}...{{/if}}'}</code> - Conditional block
            <br />
            • Click "Edit" on any template to see available variables for that template type
          </p>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
