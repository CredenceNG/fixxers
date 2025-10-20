import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isActiveAgent } from '@/lib/agents/permissions';
import { submitFixerForVetting } from '@/lib/agents/vetting';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isAgent = await isActiveAgent(user.id);
    if (!isAgent) {
      return NextResponse.json(
        { error: 'User is not an active agent' },
        { status: 403 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    const params = await paramsPromise;
    const { notes } = await request.json();

    const result = await submitFixerForVetting(agent.id, params.id, notes);

    return NextResponse.json({
      message: 'Fixer submitted for admin approval',
      agentFixer: result,
    });
  } catch (error: any) {
    console.error('Error submitting fixer for vetting:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit fixer for vetting' },
      { status: 500 }
    );
  }
}
