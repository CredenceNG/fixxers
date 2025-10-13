import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Admin-only endpoint to seed initial data (neighborhoods, categories, etc.)
 * POST /api/admin/seed
 */
export async function POST() {
  try {
    const user = await getCurrentUser();

    // Only allow admin users
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('[SEED] Starting database seed...');

    // Create Neighborhoods (if they don't exist)
    const neighborhoodsData = [
      { name: 'Downtown', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4541, longitude: 3.3947 },
      { name: 'Lekki Phase 1', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4432, longitude: 3.4745 },
      { name: 'Victoria Island', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4281, longitude: 3.4219 },
      { name: 'Ikeja GRA', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.5968, longitude: 3.3426 },
      { name: 'Surulere', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4969, longitude: 3.3578 },
      { name: 'Yaba', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.5092, longitude: 3.3767 },
      { name: 'Ikoyi', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4557, longitude: 3.4314 },
      { name: 'Ajah', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.4655, longitude: 3.5699 },
      { name: 'Gbagada', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.5447, longitude: 3.3869 },
      { name: 'Maryland', city: 'Lagos', state: 'Lagos State', country: 'Nigeria', latitude: 6.5794, longitude: 3.3674 },
    ];

    let neighborhoodsCreated = 0;
    for (const nData of neighborhoodsData) {
      const existing = await prisma.neighborhood.findUnique({
        where: {
          name_city_state: {
            name: nData.name,
            city: nData.city,
            state: nData.state,
          },
        },
      });

      if (!existing) {
        await prisma.neighborhood.create({ data: nData });
        neighborhoodsCreated++;
      }
    }

    // Create Service Categories (if they don't exist)
    const categoriesData = [
      {
        name: 'Home Repair & Maintenance',
        description: 'Professional home repair and maintenance services',
        icon: '🔧',
        subcategories: ['Plumbing', 'Electrical Work', 'HVAC Services', 'Carpentry', 'Painting & Decorating'],
      },
      {
        name: 'Technology & IT',
        description: 'Technology and IT professional services',
        icon: '💻',
        subcategories: ['Web Development', 'Mobile App Development', 'IT Support & Troubleshooting', 'Data Analysis', 'Cybersecurity Consulting'],
      },
      {
        name: 'Design & Creative',
        description: 'Design and creative professional services',
        icon: '🎨',
        subcategories: ['Graphic Design', 'UI/UX Design', 'Logo & Brand Design', 'Interior Design', '3D Modeling & Animation'],
      },
      {
        name: 'Writing & Content',
        description: 'Professional writing and content services',
        icon: '✍️',
        subcategories: ['Content Writing', 'Copywriting', 'Technical Writing', 'Translation Services', 'Proofreading & Editing'],
      },
      {
        name: 'Business Services',
        description: 'Professional business support services',
        icon: '💼',
        subcategories: ['Business Consulting', 'Digital Marketing', 'Bookkeeping & Accounting', 'Legal Consulting', 'Virtual Assistant'],
      },
    ];

    let categoriesCreated = 0;
    let subcategoriesCreated = 0;

    for (const catData of categoriesData) {
      let category = await prisma.serviceCategory.findUnique({
        where: { name: catData.name },
      });

      if (!category) {
        category = await prisma.serviceCategory.create({
          data: {
            name: catData.name,
            description: catData.description,
            icon: catData.icon,
          },
        });
        categoriesCreated++;
      }

      for (const subName of catData.subcategories) {
        const existing = await prisma.serviceSubcategory.findUnique({
          where: {
            name_categoryId: {
              name: subName,
              categoryId: category.id,
            },
          },
        });

        if (!existing) {
          await prisma.serviceSubcategory.create({
            data: {
              name: subName,
              categoryId: category.id,
            },
          });
          subcategoriesCreated++;
        }
      }
    }

    console.log('[SEED] Database seed completed');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      created: {
        neighborhoods: neighborhoodsCreated,
        categories: categoriesCreated,
        subcategories: subcategoriesCreated,
      },
    });
  } catch (error) {
    console.error('[SEED] Error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
