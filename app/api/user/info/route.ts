import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      email: user.email,
      phone: user.phone,
      pendingEmail: user.pendingEmail,
      pendingPhone: user.pendingPhone,
      emailChangeRequested: user.emailChangeRequested,
      phoneChangeRequested: user.phoneChangeRequested,
    });
  } catch (error) {
    console.error('User info fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch user info' }, { status: 500 });
  }
}
