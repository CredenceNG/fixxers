import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedNigerianGigs() {
  try {
    console.log('🇳🇬 Seeding Nigeria-specific service offers (Gigs)...\n');

    const fixers = await prisma.user.findMany({
      where: {
        role: 'FIXER',
        email: 'fixi-worker@yopmail.com'
      },
      select: { id: true, email: true }
    });

    if (fixers.length === 0) {
      console.log('❌ No fixers found.');
      return;
    }

    const fixerId = fixers[0].id;
    console.log(`Using fixer: ${fixers[0].email}\n`);

    const subcategories = await prisma.serviceSubcategory.findMany({
      where: {
        name: {
          in: [
            'Plumbing', 'Electrical Work', 'HVAC Services', 'Carpentry', 'Painting & Decorating',
            'Web Development', 'Mobile App Development', 'IT Support & Troubleshooting',
            'Business Consulting', 'Digital Marketing', 'Bookkeeping & Accounting'
          ]
        }
      },
      select: { id: true, name: true }
    });

    const getSubcatId = (name: string) => subcategories.find(s => s.name === name)?.id;

    const nigerianGigs = [
      {
        subcategoryId: getSubcatId('Plumbing'),
        title: 'Complete Plumbing Solutions - Lagos & Abuja',
        description: 'Professional plumbing services for residential and commercial properties. We handle pipe installations, leak repairs, water heater installation, bathroom/kitchen plumbing, and drainage systems. Available 24/7 for emergencies. Licensed and insured with 10+ years experience serving Nigerian homes and businesses.',
        packages: [
          { name: 'Basic Repair', price: 15000, description: 'Fix leaking taps, toilet repairs, minor pipe fixes. Includes basic materials and 1 follow-up visit.', deliveryDays: 1, revisions: 1 },
          { name: 'Standard Installation', price: 45000, description: 'Install new fixtures (sink, toilet, shower). Premium materials, 2 follow-up visits, 30-day warranty.', deliveryDays: 2, revisions: 2 },
          { name: 'Premium Package', price: 120000, description: 'Complete bathroom/kitchen plumbing overhaul. Top-grade materials, unlimited revisions, 90-day warranty, priority support.', deliveryDays: 5, revisions: -1 }
        ]
      },
      {
        subcategoryId: getSubcatId('Electrical Work'),
        title: 'Electrical Installation & Repairs - Licensed Electrician',
        description: 'Certified electrical services for homes and offices across Nigeria. Wiring installation, circuit breaker repairs, generator connection, solar panel installation, lighting fixtures, and electrical safety inspections. PHCN-compliant installations with proper earthing and safety measures.',
        packages: [
          { name: 'Minor Repairs', price: 12000, description: 'Fix switches, sockets, replace bulbs/fuses. Quick same-day service with basic materials.', deliveryDays: 1, revisions: 0 },
          { name: 'Wiring & Installation', price: 55000, description: 'New wiring, circuit installation, generator hookup. Quality materials, safety testing, 60-day warranty.', deliveryDays: 3, revisions: 1 },
          { name: 'Complete Electrical', price: 180000, description: 'Full house rewiring, distribution board, earthing system, solar integration. Premium materials, 1-year warranty.', deliveryDays: 7, revisions: 2 }
        ]
      },
      {
        subcategoryId: getSubcatId('HVAC Services'),
        title: 'AC Installation, Repair & Maintenance - Lagos',
        description: 'Expert air conditioning services for Nigerian climate. Split AC installation, servicing, gas refilling, duct cleaning, and maintenance. We work with all brands (LG, Samsung, Panasonic, Hisense). Emergency repair services available. Keep your home cool in Lagos heat!',
        packages: [
          { name: 'AC Servicing', price: 18000, description: 'Complete AC cleaning, gas check, filter replacement. Includes 1 unit servicing and basic troubleshooting.', deliveryDays: 1, revisions: 0 },
          { name: 'Gas Refilling', price: 35000, description: 'Full gas refill, leak test, pressure check. Suitable for 1-1.5HP units. Includes parts replacement if needed.', deliveryDays: 1, revisions: 1 },
          { name: 'New Installation', price: 85000, description: 'Complete split AC installation (excluding unit cost). Piping, mounting, electrical, gas charging. 6-month warranty.', deliveryDays: 2, revisions: 1 }
        ]
      },
      {
        subcategoryId: getSubcatId('Carpentry'),
        title: 'Custom Carpentry & Furniture - Nigerian Hardwood',
        description: 'Quality carpentry services using Nigerian mahogany and hardwood. Custom furniture, kitchen cabinets, wardrobes, doors, ceiling designs, and wooden partitions. Free designs and measurements. We deliver and install across Lagos and Abuja.',
        packages: [
          { name: 'Minor Repairs', price: 10000, description: 'Fix doors, hinges, drawer repairs, furniture assembly. Quick turnaround for small jobs.', deliveryDays: 2, revisions: 0 },
          { name: 'Custom Furniture', price: 65000, description: 'Single custom piece (table, chair, small cabinet). Quality wood, custom design, polish finish.', deliveryDays: 7, revisions: 1 },
          { name: 'Complete Project', price: 250000, description: 'Full kitchen/bedroom set (cabinets, wardrobes). Premium hardwood, custom designs, installation included.', deliveryDays: 14, revisions: 2 }
        ]
      },
      {
        subcategoryId: getSubcatId('Painting & Decorating'),
        title: 'Professional Painting - Interior & Exterior',
        description: 'Expert painting services for residential and commercial properties. Weather-resistant exterior paint, decorative interior finishes, screeding, POP ceiling, and wall textures. We use quality Nigerian brands (Berger, Dulux, Protek). Free color consultation included.',
        packages: [
          { name: 'Single Room', price: 35000, description: 'Paint one room (walls & ceiling). Includes screeding, primer, 2 coats, basic paint. Room up to 12x12ft.', deliveryDays: 2, revisions: 0 },
          { name: '3-Bedroom Flat', price: 180000, description: 'Complete 3-bedroom interior painting. Premium paint, screeding, color mixing, clean-up. Living areas included.', deliveryDays: 5, revisions: 1 },
          { name: 'Full House + Exterior', price: 450000, description: 'Duplex interior + exterior painting. Weather-resistant paint, POP repairs, color consultation, 1-year warranty.', deliveryDays: 10, revisions: 2 }
        ]
      },
      {
        subcategoryId: getSubcatId('Web Development'),
        title: 'Nigerian E-Commerce & Business Websites',
        description: 'Build modern, mobile-responsive websites for Nigerian businesses. Integration with Paystack, Flutterwave, and Nigerian payment gateways. SEO optimized for Google Nigeria. Hosting setup on Nigerian servers for fast loading. Perfect for online stores, corporate sites, and portfolios.',
        packages: [
          { name: 'Landing Page', price: 45000, description: 'Single-page business website with contact form. Mobile responsive, basic SEO, 3 revisions, 7-day delivery.', deliveryDays: 7, revisions: 3 },
          { name: 'Business Website', price: 120000, description: '5-page corporate website. Custom design, CMS, contact forms, Google Maps, social media integration, SEO.', deliveryDays: 14, revisions: 5 },
          { name: 'E-Commerce Store', price: 350000, description: 'Full online store with Paystack/Flutterwave. Product management, checkout, shipping, admin dashboard, training.', deliveryDays: 21, revisions: 10 }
        ]
      },
      {
        subcategoryId: getSubcatId('Mobile App Development'),
        title: 'Android & iOS Apps for Nigerian Market',
        description: 'Native and cross-platform mobile apps tailored for Nigerian users. Integrate MTN, Airtel, Glo APIs, mobile money, USSD, and local payment systems. Apps optimized for low-data environments. Post-launch support and Google Play/App Store publication included.',
        packages: [
          { name: 'Simple App', price: 250000, description: 'Basic mobile app (5-7 screens). Android/iOS, simple functionality, basic UI/UX, app store submission.', deliveryDays: 30, revisions: 3 },
          { name: 'Standard App', price: 550000, description: 'Feature-rich app with backend. User auth, API integration, push notifications, payment gateway, analytics.', deliveryDays: 45, revisions: 5 },
          { name: 'Enterprise App', price: 1200000, description: 'Complex app with advanced features. Real-time sync, offline mode, admin panel, scalable backend, 6-month support.', deliveryDays: 60, revisions: 10 }
        ]
      },
      {
        subcategoryId: getSubcatId('IT Support & Troubleshooting'),
        title: 'Computer Repair & IT Support - Lagos & Abuja',
        description: 'Professional IT support for homes and small businesses. Laptop/desktop repairs, virus removal, data recovery, network setup, software installation, and hardware upgrades. Remote support available. We come to your location with all necessary tools.',
        packages: [
          { name: 'Quick Fix', price: 8000, description: 'Software troubleshooting, virus removal, OS reinstall. Same-day service with basic maintenance.', deliveryDays: 1, revisions: 0 },
          { name: 'Hardware Repair', price: 25000, description: 'Component replacement, upgrade RAM/SSD, screen repair. Parts not included. Diagnostic + 30-day warranty.', deliveryDays: 3, revisions: 1 },
          { name: 'Office IT Setup', price: 85000, description: 'Complete office network setup (5 PCs). File sharing, printer sharing, backup system, security setup.', deliveryDays: 5, revisions: 2 }
        ]
      },
      {
        subcategoryId: getSubcatId('Business Consulting'),
        title: 'Nigerian Business Registration & Compliance',
        description: 'Complete business setup and advisory services. CAC registration, tax registration (TIN, VAT), business plans, compliance consulting. Expert guidance on Nigerian business regulations, FIRS requirements, and corporate governance. Fast-track registration available.',
        packages: [
          { name: 'CAC Registration', price: 35000, description: 'Company name search & reservation, CAC documents preparation, online submission. Excludes govt fees.', deliveryDays: 7, revisions: 2 },
          { name: 'Complete Setup', price: 85000, description: 'CAC + TIN + Bank account opening support. Business plan template, compliance checklist, tax advisory.', deliveryDays: 14, revisions: 3 },
          { name: 'Full Package', price: 180000, description: 'End-to-end business setup. CAC, TIN, VAT, FIRS, PENCOM. Comprehensive business plan, logo design, website.', deliveryDays: 21, revisions: 5 }
        ]
      },
      {
        subcategoryId: getSubcatId('Digital Marketing'),
        title: 'Social Media Marketing for Nigerian Businesses',
        description: 'Grow your Nigerian business online! Facebook, Instagram, Twitter, LinkedIn management. Content creation, sponsored ads, influencer marketing. Expert in Nigerian market trends and local audience engagement. Proven strategies for Lagos, Abuja, Port Harcourt markets.',
        packages: [
          { name: 'Basic Management', price: 40000, description: 'Manage 2 platforms for 1 month. 12 posts/month, basic graphics, engagement monitoring, monthly report.', deliveryDays: 30, revisions: 2 },
          { name: 'Growth Package', price: 95000, description: '3 platforms + paid ads. 20 posts/month, professional graphics, ₦30k ad spend, influencer outreach, analytics.', deliveryDays: 30, revisions: 4 },
          { name: 'Premium Marketing', price: 220000, description: 'Full digital strategy. All platforms, ₦80k ad spend, video content, weekly reports, competitor analysis, 3 months.', deliveryDays: 90, revisions: 10 }
        ]
      },
      {
        subcategoryId: getSubcatId('Bookkeeping & Accounting'),
        title: 'Bookkeeping & Tax Returns for Nigerian SMEs',
        description: 'Professional accounting services for Nigerian small and medium businesses. Monthly bookkeeping, financial statements, payroll processing, tax filing (FIRS), audit preparation. QuickBooks and Sage certified. Help your business stay compliant with Nigerian tax laws.',
        packages: [
          { name: 'Monthly Books', price: 30000, description: 'Monthly bookkeeping (up to 50 transactions). Bank reconciliation, expense tracking, basic financial statement.', deliveryDays: 5, revisions: 1 },
          { name: 'Quarterly Package', price: 120000, description: '3-month bookkeeping + VAT/WHT returns. Payroll for 10 staff, PAYE remittance, financial reports, tax advisory.', deliveryDays: 90, revisions: 3 },
          { name: 'Annual Package', price: 380000, description: 'Full-year accounting. Monthly books, quarterly taxes, annual returns, audit support, FIRS compliance, advisory.', deliveryDays: 365, revisions: 12 }
        ]
      }
    ];

    let createdCount = 0;

    for (const gigData of nigerianGigs) {
      if (!gigData.subcategoryId) {
        console.log(`⚠️  Skipping: ${gigData.title}`);
        continue;
      }

      const { packages, ...gig } = gigData;
      const slug = generateSlug(gig.title);

      const createdGig = await prisma.gig.create({
        data: {
          ...gig,
          slug,
          sellerId: fixerId,
          status: 'ACTIVE',
          images: [],
        }
      });

      for (const pkg of packages) {
        await prisma.gigPackage.create({
          data: {
            ...pkg,
            gigId: createdGig.id,
          }
        });
      }

      createdCount++;
      console.log(`✅ ${gigData.title}`);
    }

    console.log(`\n🎉 Created ${createdCount} Nigeria-specific gigs!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedNigerianGigs();
