import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('id');

  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      fixerProfile: true,
    },
  });

  return NextResponse.json({
    id: user?.id,
    name: user?.name,
    status: user?.status,
    roles: user?.roles,
    fixerProfile: {
      approvedAt: user?.fixerProfile?.approvedAt,
      pendingChanges: user?.fixerProfile?.pendingChanges,
    },
  });
}
