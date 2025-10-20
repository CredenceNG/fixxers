import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { execSync } from 'child_process';

/**
 * Admin-only endpoint to seed location hierarchy (Country → State → City → Neighborhood)
 * POST /api/admin/seed-locations
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    // Only allow admin users
    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('[SEED-LOCATIONS] Starting location hierarchy seed...');

    // Run the seed script
    try {
      execSync('npx tsx prisma/seeds/normalized-lagos-locations.ts', {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      return NextResponse.json({
        message: 'Location hierarchy seeded successfully',
        success: true,
      });
    } catch (error: any) {
      console.error('[SEED-LOCATIONS] Error:', error);
      return NextResponse.json(
        { error: 'Failed to seed locations', details: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[SEED-LOCATIONS] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to seed locations' },
      { status: 500 }
    );
  }
}
