import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const upgradeRequestSchema = z.object({
  skills: z.string().min(3, 'Skills must be at least 3 characters'),
  experience: z.string().min(1, 'Experience is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has CLIENT role
    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json(
        { error: 'Only clients can upgrade to service provider' },
        { status: 403 }
      );
    }

    // Check if user already has FIXER role
    if (user.roles?.includes('FIXER')) {
      return NextResponse.json(
        { error: 'You already have service provider access' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = upgradeRequestSchema.parse(body);

    // Add FIXER role to user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        roles: {
          push: 'FIXER',
        },
      },
    });

    // Create notification for admin team
    try {
      // Get all admin users
      const admins = await prisma.user.findMany({
        where: {
          roles: {
            has: 'ADMIN',
          },
        },
        select: { id: true },
      });

      // Create notification for each admin
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'GENERAL',
            title: 'New Service Provider Upgrade',
            message: `${user.name || 'A user'} has upgraded to service provider status.\n\nSkills: ${validated.skills}\nExperience: ${validated.experience}\nReason: ${validated.reason}`,
            link: `/admin/users?search=${user.email}`,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to create admin notifications:', error);
      // Don't fail the upgrade if notifications fail
    }

    // Send email notification to admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          roles: { has: 'ADMIN' },
          emailNotifications: true,
        },
        select: {
          email: true,
          name: true,
        },
      });

      if (admins.length > 0) {
        const { sendEmail } = await import('@/lib/email');

        for (const admin of admins) {
          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: 'New Service Provider Upgrade - Fixers',
              html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">New Service Provider Upgrade</h2>

  <p>Hello ${admin.name || 'Admin'},</p>

  <p>A new user has upgraded to service provider status on Fixers.</p>

  <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">User Details</h3>
    <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
    <p><strong>Email:</strong> ${user.email}</p>
  </div>

  <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Upgrade Request Details</h3>
    <p><strong>Skills:</strong> ${validated.skills}</p>
    <p><strong>Experience:</strong> ${validated.experience}</p>
    <p><strong>Reason:</strong> ${validated.reason}</p>
  </div>

  <p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/users?search=${user.email}"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View User Profile
    </a>
  </p>

  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    Best regards,<br>
    Fixers Team
  </p>
</div>
              `.trim(),
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to send admin email notifications:', error);
      // Don't fail the upgrade if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to service provider!',
      user: {
        id: updatedUser.id,
        roles: updatedUser.roles,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error processing upgrade request:', error);
    return NextResponse.json(
      { error: 'Failed to process upgrade request' },
      { status: 500 }
    );
  }
}
