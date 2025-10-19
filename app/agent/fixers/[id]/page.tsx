import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isActiveAgent } from '@/lib/agents/permissions';
import FixerDetailClient from './FixerDetailClient';

export default async function FixerDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = await paramsPromise;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isAgent = await isActiveAgent(user.id);

  if (!isAgent) {
    redirect('/agent/application');
  }

  return <FixerDetailClient fixerId={params.id} />;
}
