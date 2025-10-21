import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendFixerApprovalEmail, sendFixerRejectionEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('[Approve Fixer] Request received');
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      console.log('[Approve Fixer] Unauthorized access attempt');
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

    console.log(`[Approve Fixer] Processing request for fixerId: ${fixerId}, approved: ${approved}`);

    if (!fixerId) {
      console.log('[Approve Fixer] Missing fixerId in request');
      return NextResponse.json({ error: 'Fixer ID is required' }, { status: 400 });
    }

    // Fetch fixer details for email
    const fixer = await prisma.user.findUnique({
      where: { id: fixerId },
      select: { email: true, name: true },
    });

    if (!fixer) {
      console.log(`[Approve Fixer] Fixer not found with ID: ${fixerId}`);
      return NextResponse.json({ error: 'Fixer not found' }, { status: 404 });
    }

    console.log(`[Approve Fixer] Fixer found: ${fixer.name || fixer.email}`);

    // Check if fixer profile exists
    const fixerProfile = await prisma.fixerProfile.findUnique({
      where: { fixerId },
    });

    if (!fixerProfile) {
      console.log(`[Approve Fixer] ERROR: Fixer profile not found for user ${fixerId}. User has not completed Step 1.`);
      return NextResponse.json({
        error: 'Fixer profile not found. The user has not completed their fixer profile setup yet (Step 1).'
      }, { status: 400 });
    }

    console.log(`[Approve Fixer] Fixer profile found, proceeding with ${approved ? 'approval' : 'rejection'}`);

    if (approved) {
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
        console.log(`[Approve Fixer] Sending approval email to ${fixer.email}`);
        await sendFixerApprovalEmail(fixer.email, fixer.name || 'Fixer');
      }

      console.log(`[Approve Fixer] SUCCESS: Fixer ${fixerId} approved successfully`);

      // Return JSON response for AJAX or redirect for form submission
      if (contentType?.includes('application/json')) {
        return NextResponse.json({ success: true, message: 'Fixer approved successfully' });
      } else {
        return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=approved`, request.url));
      }
    } else {
      // Clear pending changes flag and remove approval
      await prisma.fixerProfile.update({
        where: { fixerId },
        data: {
          approvedAt: null,
          pendingChanges: false,
        },
      });

      // Send rejection notification email
      if (fixer.email) {
        console.log(`[Approve Fixer] Sending rejection email to ${fixer.email}`);
        await sendFixerRejectionEmail(fixer.email, fixer.name || 'Fixer', 'Your profile needs additional information or updates.');
      }

      console.log(`[Approve Fixer] SUCCESS: Fixer ${fixerId} rejected successfully`);

      // Return JSON response for AJAX or redirect for form submission
      if (contentType?.includes('application/json')) {
        return NextResponse.json({ success: true, message: 'Fixer rejected successfully' });
      } else {
        return NextResponse.redirect(new URL(`/admin/users/${fixerId}?success=rejected`, request.url));
      }
    }
  } catch (error: any) {
    console.error('[Approve Fixer] ERROR:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: 'Failed to process fixer approval',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
