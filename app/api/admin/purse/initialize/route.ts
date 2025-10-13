import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformPurse } from '@/lib/purse';

/**
 * Initialize platform purse and financial settings
 * Admin only - run once during setup
 */
export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create or get platform purse
    const platformPurse = await getPlatformPurse();

    // 2. Ensure financial settings exist
    const settings = [
      {
        key: 'platformCommissionPercentage',
        value: '0.20',
        description: 'Platform commission percentage (0.20 = 20%)',
        dataType: 'number',
        category: 'financial',
      },
      {
        key: 'commissionRefundPercentage',
        value: '0.50',
        description: 'Percentage of commission refundable on cancellation (0-1)',
        dataType: 'number',
        category: 'financial',
      },
      {
        key: 'autoReleaseEscrowDays',
        value: '7',
        description: 'Days after delivery to auto-release payment to fixer',
        dataType: 'number',
        category: 'financial',
      },
    ];

    const createdSettings = [];

    for (const setting of settings) {
      const existing = await prisma.platformSettings.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        const created = await prisma.platformSettings.create({
          data: setting,
        });
        createdSettings.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      platformPurse: {
        id: platformPurse.id,
        availableBalance: Number(platformPurse.availableBalance),
        pendingBalance: Number(platformPurse.pendingBalance),
        commissionBalance: Number(platformPurse.commissionBalance),
        totalRevenue: Number(platformPurse.totalRevenue),
      },
      settingsCreated: createdSettings.length,
      settings: createdSettings,
    });
  } catch (error) {
    console.error('Error initializing platform purse:', error);
    return NextResponse.json(
      { error: 'Failed to initialize platform purse' },
      { status: 500 }
    );
  }
}
