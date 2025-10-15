import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateUserPurse, getPlatformPurse, getPurseBalance } from '@/lib/purse';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = user.roles || [];

    // Admin gets platform purse balance
    if (roles.includes('ADMIN')) {
      const platformPurse = await getPlatformPurse();
      const balance = await getPurseBalance(platformPurse.id);

      return NextResponse.json({
        purseId: platformPurse.id,
        ...balance,
      });
    }

    // Clients and Fixers get their own purse balance
    const userPurse = await getOrCreateUserPurse(user.id);
    const balance = await getPurseBalance(userPurse.id);

    return NextResponse.json({
      purseId: userPurse.id,
      ...balance,
    });
  } catch (error) {
    console.error('Failed to fetch purse balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
