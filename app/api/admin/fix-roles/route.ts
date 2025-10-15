import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Find admin users by email pattern (since we know their emails)
    const adminEmails = ['admin@fixxers.com', 'fixi-admin@yopmail.com'];

    const admins = await prisma.user.findMany({
      where: {
        email: {
          in: adminEmails
        }
      }
    });

    const results = [];

    for (const admin of admins) {
      const rolesArray = admin.roles || [];
      if (!rolesArray.includes('ADMIN')) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { roles: ['ADMIN'] }
        });
        results.push({
          email: admin.email,
          before: rolesArray,
          after: ['ADMIN'],
          fixed: true
        });
      } else {
        results.push({
          email: admin.email,
          roles: rolesArray,
          fixed: false,
          message: 'Already correct'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin roles fixed',
      results
    });
  } catch (error) {
    console.error('[Fix Admin Roles] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fix admin roles' },
      { status: 500 }
    );
  }
}
