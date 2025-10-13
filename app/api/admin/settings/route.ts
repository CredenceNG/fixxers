import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Parse form data
    const formData = await request.formData();
    const key = formData.get('key') as string;
    const value = formData.get('value') as string;

    if (!key || !value) {
      return NextResponse.redirect(new URL('/admin/settings?error=invalid_request', request.url));
    }

    // Upsert setting
    await prisma.platformSettings.upsert({
      where: { key },
      create: {
        key,
        value,
        description: getSettingDescription(key),
      },
      update: {
        value,
      },
    });

    return NextResponse.redirect(new URL('/admin/settings?success=saved', request.url));
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=save_failed', request.url)
    );
  }
}

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'PLATFORM_FEE_PERCENTAGE': 'Percentage fee charged on each completed order',
  };
  return descriptions[key] || '';
}
