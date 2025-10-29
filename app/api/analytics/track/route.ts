import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { trackActivity } from '@/lib/analytics';
import { ActivityAction } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, page, sessionId, metadata } = body;

    // Validate action
    if (!action || !Object.values(ActivityAction).includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Track the activity
    await trackActivity(
      user.id,
      action as ActivityAction,
      page,
      metadata,
      request,
      sessionId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
