import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOrCreateUserPurse, getPlatformPurse, getPurseBalance } from '@/lib/purse';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin gets platform purse balance
    if (user.role === 'ADMIN') {
      const platformPurse = await getPlatformPurse();
      const balance = await getPurseBalance(platformPurse.id);

      return NextResponse.json({
        purseId: platformPurse.id,
        role: 'ADMIN',
        ...balance,
      });
    }

    // Clients and Fixers get their own purse balance
    const userPurse = await getOrCreateUserPurse(user.id);
    const balance = await getPurseBalance(userPurse.id);

    return NextResponse.json({
      purseId: userPurse.id,
      role: user.role,
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
