import { getAuthCookie, verifySessionToken } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MobileHeader from './MobileHeader';

export default async function Header() {
  const user = await getCurrentUser();

  // Check if user has active agent profile
  let isAgent = false;
  let agentStatus: string | null = null;

  if (user) {
    const agentProfile = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (agentProfile) {
      agentStatus = agentProfile.status;
      isAgent = agentProfile.status === 'ACTIVE';
    }
  }

  return <MobileHeader user={user} isAgent={isAgent} agentStatus={agentStatus} />;
}
