import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
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

    const params = await paramsPromise;
    const { agentId, notes } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const result = await submitFixerForVetting(agentId, params.id, notes);

    return NextResponse.json({
      message: 'Fixer submitted for vetting approval',
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
