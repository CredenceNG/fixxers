import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import EmailTemplateEditor from './EmailTemplateEditor';

export default async function EditEmailTemplatePage({
  params: paramsPromise,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const params = await paramsPromise;
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { id: params.templateId },
  });

  if (!template) {
    redirect('/admin/email-templates');
  }

  return (
    <AdminDashboardWrapper userName={user.name || undefined} userAvatar={user.profileImage || undefined}>
      <EmailTemplateEditor template={template} />
    </AdminDashboardWrapper>
  );
}
