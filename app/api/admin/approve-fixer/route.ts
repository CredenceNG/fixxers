import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendFixerApprovalEmail, sendFixerRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type');
    let fixerId: string;
    let approved: boolean;

    if (contentType?.includes('application/json')) {
      // Parse JSON data
      const body = await request.json();
      fixerId = body.fixerId;
      approved = body.approved;
    } else {
      // Parse form data
      const formData = await request.formData();
      fixerId = formData.get('fixerId') as string;
      approved = formData.get('approved') === 'true';
    }

    if (!fixerId) {
      return NextResponse.json({ error: 'Fixer ID is required' }, { status: 400 });
    }

    // Fetch fixer details for email
    const fixer = await prisma.user.findUnique({
      where: { id: fixerId },
      select: { email: true, name: true },
    });

    if (!fixer) {
      return NextResponse.json({ error: 'Fixer not found' }, { status: 404 });
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
      if (fixer.email) {
        await sendFixerApprovalEmail(fixer.email, fixer.name || 'Fixer');
      }

      // Return JSON response for AJAX or redirect for form submission
      if (contentType?.includes('application/json')) {
        return NextResponse.json({ success: true, message: 'Fixer approved successfully' });
      } else {
        return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=approved`, request.url));
      }
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
      if (fixer.email) {
        await sendFixerRejectionEmail(fixer.email, fixer.name || 'Fixer', 'Your profile needs additional information or updates.');
      }

      // Return JSON response for AJAX or redirect for form submission
      if (contentType?.includes('application/json')) {
        return NextResponse.json({ success: true, message: 'Fixer rejected successfully' });
      } else {
        return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=rejected`, request.url));
      }
    }
  } catch (error) {
    console.error('Fixer approval error:', error);
    return NextResponse.json(
      { error: 'Failed to process fixer approval' },
      { status: 500 }
    );
  }
}
