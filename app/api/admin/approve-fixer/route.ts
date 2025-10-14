import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendFixerApprovalEmail, sendFixerRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Parse form data
    const formData = await request.formData();
    const fixerId = formData.get('fixerId') as string;
    const approved = formData.get('approved') === 'true';

    if (!fixerId) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=invalid_request', request.url));
    }

    // Fetch fixer details for email
    const fixer = await prisma.user.findUnique({
      where: { id: fixerId },
      select: { email: true, name: true },
    });

    if (!fixer || !fixer.email) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=fixer_not_found', request.url));
    }

    if (approved) {
      // Approve the fixer
      await prisma.user.update({
        where: { id: fixerId },
        data: { status: 'ACTIVE' },
      });

      // Mark profile as approved and clear pending changes
      await prisma.fixerProfile.update({
        where: { fixerId },
        data: {
          approvedAt: new Date(),
          pendingChanges: false,
        },
      });

      // Send approval notification email
      await sendFixerApprovalEmail(fixer.email, fixer.name || 'Fixer');

      return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=approved`, request.url));
    } else {
      // Reject the fixer
      await prisma.user.update({
        where: { id: fixerId },
        data: { status: 'REJECTED' },
      });

      // Clear pending changes flag
      await prisma.fixerProfile.update({
        where: { fixerId },
        data: {
          pendingChanges: false,
        },
      });

      // Send rejection notification email
      await sendFixerRejectionEmail(fixer.email, fixer.name || 'Fixer', 'Your profile needs additional information or updates.');

      return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=rejected`, request.url));
    }
  } catch (error) {
    console.error('Fixer approval error:', error);
    return NextResponse.redirect(
      new URL('/admin/dashboard?error=processing_failed', request.url)
    );
  }
}
