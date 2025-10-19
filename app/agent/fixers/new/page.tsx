import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { isActiveAgent } from '@/lib/agents/permissions';
import { prisma } from '@/lib/prisma';
import Header from '@/components/Header';
import RegisterFixerForm from './RegisterFixerForm';

export default async function RegisterFixerPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isAgent = await isActiveAgent(user.id);

  if (!isAgent) {
    redirect('/agent/application');
  }

  // Fetch neighborhoods for location dropdown
  const neighborhoods = await prisma.neighborhood.findMany({
    orderBy: [{ name: 'asc' }],
  });

  return (
    <>
      <Header />
      <RegisterFixerForm neighborhoods={neighborhoods} />
    </>
  );
}
