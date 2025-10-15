import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting gig seeding...');

  // Get fixers
  const fixers = await prisma.user.findMany({
    where: { roles: { has: 'FIXER' }, status: 'ACTIVE' },
    include: {
      fixerProfile: true,
    },
  });

  console.log(`Found ${fixers.length} active fixers`);

  if (fixers.length === 0) {
    console.log('No active fixers found. Please ensure fixers are approved first.');
    return;
  }

  // Get all subcategories
  const subcategories = await prisma.serviceSubcategory.findMany({
    include: { category: true },
  });

  console.log(`Found ${subcategories.length} subcategories`);

  // Delete existing gigs to avoid duplicates
  await prisma.gig.deleteMany({});
  console.log('Cleared existing gigs');

  // Use first few subcategories that exist
  const subcat1 = subcategories[0]; // First available
  const subcat2 = subcategories[1]; // Second available
  const subcat3 = subcategories[2]; // Third available
  const subcat4 = subcategories[3]; // Fourth available

  // Create gigs for fixer 1
  const fixer1 = fixers[0];
  console.log(`Creating gigs for ${fixer1.name || fixer1.email}...`);

  if (subcat1) {
    const gig1 = await prisma.gig.create({
      data: {
        sellerId: fixer1.id,
        subcategoryId: subcat1.id,
        title: `Professional ${subcat1.name} services - Fast and reliable`,
        description: `Looking for reliable ${subcat1.name} services? I've got you covered!

With over 5 years of experience, I offer fast, efficient, and affordable solutions for all your ${subcat1.name} needs.

What I offer:
• Expert ${subcat1.name} service
• Quality workmanship
• Timely completion
• Professional approach
• Affordable pricing

Why choose me?
✓ Licensed and insured professional
✓ Same-day service available
✓ Quality workmanship guaranteed
✓ Transparent pricing - no hidden fees
✓ Clean and tidy work area

I use only high-quality materials and the latest tools. Customer satisfaction is my top priority!`,
        slug: `professional-${subcat1.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        tags: [subcat1.name.toLowerCase(), subcat1.category.name.toLowerCase(), 'professional', 'reliable', 'experienced'],
        requirements: [
          'Please provide photos or videos of the work area',
          'Describe the work needed in detail',
          'Let me know your preferred date and time',
          'Mention if this is urgent',
        ],
        searchKeywords: [subcat1.name.toLowerCase(), subcat1.category.name.toLowerCase(), 'professional', 'service'],
        status: 'ACTIVE',
        publishedAt: new Date(),
        packages: {
          create: [
            {
              name: 'Basic',
              description: 'Essential service package',
              price: 15000,
              deliveryDays: 2,
              revisions: 1,
              features: [
                'Basic service',
                'Quality materials',
                'Professional work',
                'Up to 2 hours',
              ],
            },
            {
              name: 'Standard',
              description: 'Complete service package',
              price: 35000,
              deliveryDays: 3,
              revisions: 2,
              features: [
                'Comprehensive service',
                'Premium materials',
                'Detailed work',
                'Up to 4 hours',
                '30-day warranty',
                'Follow-up included',
              ],
            },
            {
              name: 'Premium',
              description: 'Full professional package',
              price: 65000,
              deliveryDays: 5,
              revisions: 3,
              features: [
                'Complete solution',
                'Top-quality materials',
                'Expert craftsmanship',
                'Up to 8 hours',
                '90-day warranty',
                'Priority service',
                'Free consultation',
                'Maintenance tips',
              ],
            },
          ],
        },
      },
    });
    console.log(`✓ Created: ${gig1.title}`);
  }

  if (subcat2) {
    const gig2 = await prisma.gig.create({
      data: {
        sellerId: fixer1.id,
        subcategoryId: subcat2.id,
        title: `Expert ${subcat2.name} - Quality service guaranteed`,
        description: `Need reliable ${subcat2.name} services? I'm a certified professional with 7+ years of experience!

I specialize in ${subcat2.name} and provide top-quality service. Safety and customer satisfaction are my #1 priorities.

Services I provide:
• Professional ${subcat2.name}
• Emergency services
• Maintenance and repairs
• Quality installations
• Expert consultation

Why hire me?
✓ Certified and licensed professional
✓ Up-to-date with industry standards
✓ Safe and efficient work
✓ Competitive pricing
✓ 24/7 emergency service available

I ensure all work meets local standards and safety regulations. Your satisfaction is guaranteed!`,
        slug: `expert-${subcat2.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        tags: [subcat2.name.toLowerCase(), subcat2.category.name.toLowerCase(), 'expert', 'certified', 'quality'],
        requirements: [
          'Describe the work needed',
          'Provide photos of work area',
          'Mention your location and property type',
          'Specify if urgent/emergency',
        ],
        searchKeywords: [subcat2.name.toLowerCase(), subcat2.category.name.toLowerCase(), 'expert', 'professional'],
        status: 'ACTIVE',
        publishedAt: new Date(),
        packages: {
          create: [
            {
              name: 'Basic',
              description: 'Quick service',
              price: 12000,
              deliveryDays: 1,
              revisions: 1,
              features: [
                'Fast service',
                'Basic work',
                'Quality materials',
                'Up to 2 hours',
              ],
            },
            {
              name: 'Standard',
              description: 'Complete service',
              price: 30000,
              deliveryDays: 2,
              revisions: 2,
              features: [
                'Thorough work',
                'Premium materials',
                'Expert service',
                'Up to 4 hours',
                'Quality guarantee',
                'Safety inspection',
              ],
            },
            {
              name: 'Premium',
              description: 'Full solution',
              price: 60000,
              deliveryDays: 3,
              revisions: 3,
              features: [
                'Complete solution',
                'Best materials',
                'Expert craftsmanship',
                '8+ hours of work',
                '1-year warranty',
                'Priority support',
                'Free maintenance tips',
              ],
            },
          ],
        },
      },
    });
    console.log(`✓ Created: ${gig2.title}`);
  }

  // Create gigs for fixer 2 if exists
  if (fixers.length > 1) {
    const fixer2 = fixers[1];
    console.log(`Creating gigs for ${fixer2.name || fixer2.email}...`);

    if (subcat3) {
      const gig3 = await prisma.gig.create({
        data: {
          sellerId: fixer2.id,
          subcategoryId: subcat3.id,
          title: `Professional ${subcat3.name} service - Affordable and fast`,
          description: `Struggling with ${subcat3.name}? Let me handle it for you!

I'm an experienced professional specializing in ${subcat3.name}. I've completed hundreds of successful projects!

What I do:
• Professional ${subcat3.name}
• Quality workmanship
• Timely delivery
• Customer satisfaction
• Affordable pricing

Benefits of hiring me:
✓ Fast and efficient service
✓ All tools provided
✓ Neat and organized work
✓ Experienced professional
✓ Satisfaction guaranteed

Save your time and avoid frustration - I'll get the job done perfectly!`,
          slug: `professional-${subcat3.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          tags: [subcat3.name.toLowerCase(), subcat3.category.name.toLowerCase(), 'professional', 'affordable', 'fast'],
          requirements: [
            'Provide details about the work needed',
            'Upload photos if applicable',
            'Confirm all materials are available',
            'Specify your preferred date',
          ],
          searchKeywords: [subcat3.name.toLowerCase(), subcat3.category.name.toLowerCase(), 'professional', 'service'],
          status: 'ACTIVE',
          publishedAt: new Date(),
          packages: {
            create: [
              {
                name: 'Basic',
                description: 'Essential package',
                price: 8000,
                deliveryDays: 1,
                revisions: 1,
                features: [
                  'Basic service',
                  'Quick turnaround',
                  'Quality work',
                  'Up to 1 hour',
                ],
              },
              {
                name: 'Standard',
                description: 'Complete package',
                price: 18000,
                deliveryDays: 2,
                revisions: 2,
                features: [
                  'Comprehensive work',
                  'Quality materials',
                  'Professional finish',
                  'Up to 3 hours',
                  'Cleanup included',
                  'Satisfaction guarantee',
                ],
              },
              {
                name: 'Premium',
                description: 'Full service',
                price: 35000,
                deliveryDays: 3,
                revisions: 3,
                features: [
                  'Complete solution',
                  'Premium materials',
                  'Expert work',
                  'Full day service',
                  'Extended warranty',
                  'Priority scheduling',
                  'Free consultation',
                ],
              },
            ],
          },
        },
      });
      console.log(`✓ Created: ${gig3.title}`);
    }

    if (subcat4) {
      const gig4 = await prisma.gig.create({
        data: {
          sellerId: fixer2.id,
          subcategoryId: subcat4.id,
          title: `Top-rated ${subcat4.name} service - 5-star quality`,
          description: `Transform your space with professional ${subcat4.name}!

I'm a dedicated professional with 6+ years of experience providing top-quality ${subcat4.name} services. I take pride in every project!

My services:
• Professional ${subcat4.name}
• Quality materials
• Expert techniques
• Attention to detail
• Customer satisfaction

What makes me different:
✓ Top-quality work
✓ Attention to every detail
✓ Professional equipment
✓ Flexible scheduling
✓ Background checked
✓ Insured and bonded

I bring all necessary supplies and equipment. Just tell me what you need, and I'll deliver excellence!`,
          slug: `top-rated-${subcat4.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          tags: [subcat4.name.toLowerCase(), subcat4.category.name.toLowerCase(), 'top-rated', 'professional', '5-star'],
          requirements: [
            'Property details or work area size',
            'Specific requirements',
            'Any special needs or preferences',
            'Access information',
          ],
          searchKeywords: [subcat4.name.toLowerCase(), subcat4.category.name.toLowerCase(), 'professional', 'top-rated'],
          status: 'ACTIVE',
          publishedAt: new Date(),
          packages: {
            create: [
              {
                name: 'Basic',
                description: 'Essential service',
                price: 10000,
                deliveryDays: 1,
                revisions: 1,
                features: [
                  'Basic service',
                  'Quality work',
                  'Professional approach',
                  'Up to 2 hours',
                ],
              },
              {
                name: 'Standard',
                description: 'Complete service',
                price: 25000,
                deliveryDays: 2,
                revisions: 2,
                features: [
                  'Thorough service',
                  'Premium quality',
                  'Detailed work',
                  'Up to 4 hours',
                  'Satisfaction guarantee',
                  'Follow-up included',
                ],
              },
              {
                name: 'Premium',
                description: 'Full package',
                price: 45000,
                deliveryDays: 3,
                revisions: 3,
                features: [
                  'Comprehensive service',
                  'Top materials',
                  'Expert craftsmanship',
                  'Full day service',
                  'Extended warranty',
                  'Priority service',
                  'Maintenance included',
                ],
              },
            ],
          },
        },
      });
      console.log(`✓ Created: ${gig4.title}`);
    }
  }

  console.log('\n✅ Gig seeding completed successfully!');
  console.log('Visit http://localhost:3010/gigs to see your new service offers');
}

main()
  .catch((e) => {
    console.error('Error seeding gigs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
