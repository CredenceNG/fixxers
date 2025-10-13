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
    const type = formData.get('type') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    if (!type || !name) {
      return NextResponse.redirect(new URL('/admin/categories?error=invalid_request', request.url));
    }

    if (type === 'category') {
      // Check if category already exists
      const existing = await prisma.serviceCategory.findUnique({
        where: { name },
      });

      if (existing) {
        return NextResponse.redirect(new URL('/admin/categories?error=duplicate', request.url));
      }

      // Create new category
      await prisma.serviceCategory.create({
        data: {
          name,
          description: description || null,
        },
      });

      return NextResponse.redirect(new URL('/admin/categories?success=category_added', request.url));
    } else if (type === 'subcategory') {
      const categoryId = formData.get('categoryId') as string;

      if (!categoryId) {
        return NextResponse.redirect(new URL('/admin/categories?error=invalid_request', request.url));
      }

      // Check if subcategory already exists in this category
      const existing = await prisma.serviceSubcategory.findUnique({
        where: {
          name_categoryId: {
            name,
            categoryId,
          },
        },
      });

      if (existing) {
        return NextResponse.redirect(new URL('/admin/categories?error=duplicate', request.url));
      }

      // Create new subcategory
      await prisma.serviceSubcategory.create({
        data: {
          name,
          description: description || null,
          categoryId,
        },
      });

      return NextResponse.redirect(new URL('/admin/categories?success=subcategory_added', request.url));
    }

    return NextResponse.redirect(new URL('/admin/categories?error=invalid_type', request.url));
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.redirect(
      new URL('/admin/categories?error=creation_failed', request.url)
    );
  }
}
