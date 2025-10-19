import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  token: z.string().min(1),
  type: z.enum(['email', 'sms', 'all']).default('email'),
});

// GET - Unsubscribe via link (for email links)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const type = searchParams.get('type') || 'email';

    if (!token) {
      return NextResponse.redirect(new URL('/?message=invalid_unsubscribe_link', request.url));
    }

    // Decode the token (userId)
    const userId = token;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/?message=invalid_unsubscribe_link', request.url));
    }

    // Update notification preferences
    const updateData: any = {};
    if (type === 'all') {
      updateData.emailNotifications = false;
      updateData.smsNotifications = false;
    } else if (type === 'email') {
      updateData.emailNotifications = false;
    } else if (type === 'sms') {
      updateData.smsNotifications = false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Redirect to a success page
    return NextResponse.redirect(
      new URL(`/settings?message=unsubscribed&type=${type}`, request.url)
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(new URL('/?message=unsubscribe_error', request.url));
  }
}

// POST - Unsubscribe via API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = unsubscribeSchema.parse(body);

    // Decode the token (userId)
    const userId = validated.token;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token' },
        { status: 400 }
      );
    }

    // Update notification preferences
    const updateData: any = {};
    if (validated.type === 'all') {
      updateData.emailNotifications = false;
      updateData.smsNotifications = false;
    } else if (validated.type === 'email') {
      updateData.emailNotifications = false;
    } else if (validated.type === 'sms') {
      updateData.smsNotifications = false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
