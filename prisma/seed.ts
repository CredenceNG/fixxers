import { PrismaClient, UserRole, UserStatus, RequestStatus, OrderStatus, PaymentStatus, QuoteType, GigStatus } from '@prisma/client';
import { recordPaymentReceived, releasePayout, processFullRefund } from '../lib/purse-transactions';
import { getPlatformPurse } from '../lib/purse';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create Admin
  console.log('1️⃣  Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fixxers.com' },
    update: {},
    create: {
      email: 'admin@fixxers.com',
      name: 'Admin User',
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`   ✅ Admin: ${admin.email}\n`);

  // 2. Initialize platform purse and settings
  console.log('2️⃣  Initializing platform purse and settings...');
  await getPlatformPurse();

  await prisma.platformSettings.upsert({
    where: { key: 'platformCommissionPercentage' },
    update: {},
    create: {
      key: 'platformCommissionPercentage',
      value: '0.20',
      description: 'Platform commission percentage (0.20 = 20%)',
    },
  });

  await prisma.platformSettings.upsert({
    where: { key: 'commissionRefundPercentage' },
    update: {},
    create: {
      key: 'commissionRefundPercentage',
      value: '0.50',
      description: 'Percentage of commission refundable on cancellation (0-1)',
    },
  });
  console.log('   ✅ Platform purse and settings initialized\n');

  // 3. Create Service Categories and Subcategories
  console.log('3️⃣  Creating service categories and subcategories...');
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

  const categories = [];
  const subcategoriesMap: Record<string, any> = {};

  for (const catData of categoriesData) {
    const category = await prisma.serviceCategory.upsert({
      where: { name: catData.name },
      update: {},
      create: {
        name: catData.name,
        description: catData.description,
        icon: catData.icon,
      },
    });
    categories.push(category);

    for (const subName of catData.subcategories) {
      const subcategory = await prisma.serviceSubcategory.upsert({
        where: {
          name_categoryId: {
            categoryId: category.id,
            name: subName,
          },
        },
        update: {},
        create: {
          name: subName,
          categoryId: category.id,
          description: `Professional ${subName.toLowerCase()} services`,
        },
      });
      subcategoriesMap[subName] = subcategory;
    }
  }
  console.log(`   ✅ Created ${categories.length} categories with ${Object.keys(subcategoriesMap).length} subcategories\n`);

  // 4. Create Neighborhoods
  console.log('4️⃣  Creating neighborhoods...');

  // First, ensure we have Nigeria country
  const nigeria = await prisma.country.upsert({
    where: {
      name: 'Nigeria',
    },
    update: {},
    create: {
      name: 'Nigeria',
      code: 'NG',
    },
  });

  // Then ensure we have Lagos State
  const lagosState = await prisma.state.upsert({
    where: {
      name_countryId: {
        name: 'Lagos State',
        countryId: nigeria.id,
      },
    },
    update: {},
    create: {
      name: 'Lagos State',
      countryId: nigeria.id,
    },
  });

  // Then create Lagos city
  const lagosCity = await prisma.city.upsert({
    where: {
      name_stateId: {
        name: 'Lagos',
        stateId: lagosState.id,
      },
    },
    update: {},
    create: {
      name: 'Lagos',
      stateId: lagosState.id,
    },
  });

  const neighborhoodsData = [
    { name: 'Downtown', latitude: 6.4541, longitude: 3.3947 },
    { name: 'Lekki Phase 1', latitude: 6.4432, longitude: 3.4745 },
    { name: 'Victoria Island', latitude: 6.4281, longitude: 3.4219 },
    { name: 'Ikeja GRA', latitude: 6.5968, longitude: 3.3426 },
    { name: 'Surulere', latitude: 6.4969, longitude: 3.3578 },
  ];

  const neighborhoods = [];
  for (const nData of neighborhoodsData) {
    const neighborhood = await prisma.neighborhood.upsert({
      where: {
        name_cityId: {
          name: nData.name,
          cityId: lagosCity.id,
        },
      },
      update: {},
      create: {
        name: nData.name,
        latitude: nData.latitude,
        longitude: nData.longitude,
        cityId: lagosCity.id,
        legacyCity: 'Lagos',
        legacyState: 'Lagos State',
        legacyCountry: 'Nigeria',
      },
    });
    neighborhoods.push(neighborhood);
  }
  console.log(`   ✅ Created ${neighborhoods.length} neighborhoods\n`);

  // 5. Create Clients
  console.log('5️⃣  Creating clients...');
  const clients = [];
  for (let i = 1; i <= 10; i++) {
    const neighborhood = neighborhoods[i % neighborhoods.length];
    const client = await prisma.user.upsert({
      where: { email: `c${i}@f.com` },
      update: {},
      create: {
        email: `c${i}@f.com`,
        name: `Client ${i}`,
        roles: [UserRole.CLIENT],
        status: UserStatus.ACTIVE,
        phone: `+234${8000000000 + i}`,
        emailNotifications: true,
        smsNotifications: false,
      },
    });

    // Create client profile
    await prisma.clientProfile.upsert({
      where: { clientId: client.id },
      update: {},
      create: {
        clientId: client.id,
        neighbourhood: neighborhood.name,
        city: neighborhood.legacyCity || 'Lagos',
        state: neighborhood.legacyState || 'Lagos State',
        country: neighborhood.legacyCountry || 'Nigeria',
        primaryPhone: `+234${8000000000 + i}`,
        streetAddress: `${i} Client Street`,
      },
    });

    clients.push(client);
  }
  console.log(`   ✅ Created ${clients.length} clients with profiles\n`);

  // 6. Create Fixers
  console.log('6️⃣  Creating fixers...');
  const fixers = [];
  for (let i = 1; i <= 15; i++) {
    const neighborhood = neighborhoods[i % neighborhoods.length];
    const fixer = await prisma.user.upsert({
      where: { email: `f${i}@f.com` },
      update: {},
      create: {
        email: `f${i}@f.com`,
        name: `Fixer ${i}`,
        roles: [UserRole.FIXER],
        status: UserStatus.ACTIVE,
        phone: `+234${9000000000 + i}`,
        bio: `Experienced professional with ${i + 3} years in the industry. Dedicated to quality work and customer satisfaction.`,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    // Create fixer profile
    await prisma.fixerProfile.upsert({
      where: { fixerId: fixer.id },
      update: {},
      create: {
        fixerId: fixer.id,
        yearsOfService: i % 10 + 2,
        qualifications: ['Certified Professional', 'Licensed Expert', 'Quality Assured'].slice(0, (i % 3) + 1),
        neighbourhood: neighborhood.name,
        city: neighborhood.legacyCity || 'Lagos',
        state: neighborhood.legacyState || 'Lagos State',
        country: neighborhood.legacyCountry || 'Nigeria',
        primaryPhone: `+234${9000000000 + i}`,
        streetAddress: `${i} Fixer Avenue`,
        pendingChanges: false,
        approvedAt: new Date(),
      },
    });

    fixers.push(fixer);
  }
  console.log(`   ✅ Created ${fixers.length} fixers with profiles\n`);

  // 7. Create Fixer Services (link fixers to subcategories they serve)
  console.log('7️⃣  Creating fixer services...');
  let fixerServiceCount = 0;
  const allSubcategories = await prisma.serviceSubcategory.findMany();

  for (const fixer of fixers) {
    // Each fixer serves 2-4 subcategories
    const numServices = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...allSubcategories].sort(() => 0.5 - Math.random());
    const selectedSubcategories = shuffled.slice(0, numServices);

    for (const subcategory of selectedSubcategories) {
      const existing = await prisma.fixerService.findUnique({
        where: {
          fixerId_subcategoryId: {
            fixerId: fixer.id,
            subcategoryId: subcategory.id,
          },
        },
      });

      if (!existing) {
        await prisma.fixerService.create({
          data: {
            fixerId: fixer.id,
            subcategoryId: subcategory.id,
            description: `Expert ${subcategory.name} services with proven track record`,
            basePrice: Math.floor(Math.random() * 5000) + 1000,
            priceUnit: ['per hour', 'per job', 'per day'][Math.floor(Math.random() * 3)],
            isActive: true,
            neighborhoods: {
              connect: neighborhoods.slice(0, Math.floor(Math.random() * 3) + 2).map(n => ({ id: n.id })),
            },
          },
        });
        fixerServiceCount++;
      }
    }
  }
  console.log(`   ✅ Created ${fixerServiceCount} fixer services\n`);

  // 8. Create Gigs with Packages
  console.log('8️⃣  Creating gigs with packages...');
  let gigCount = 0;
  const gigSubcategories = [
    ...Object.values(subcategoriesMap).slice(0, 15)
  ];

  for (let i = 0; i < 20; i++) {
    const fixer = fixers[i % fixers.length];
    const subcategory = gigSubcategories[i % gigSubcategories.length];

    const gig = await prisma.gig.create({
      data: {
        sellerId: fixer.id,
        subcategoryId: subcategory.id,
        title: `Professional ${subcategory.name} Service`,
        description: `I will provide high-quality ${subcategory.name.toLowerCase()} services for your project. Years of experience and proven results. Fast turnaround and excellent communication.`,
        slug: `${subcategory.name.toLowerCase().replace(/\s+/g, '-')}-${i}-${Date.now()}`,
        images: [
          `https://picsum.photos/800/600?random=${i * 3}`,
          `https://picsum.photos/800/600?random=${i * 3 + 1}`,
          `https://picsum.photos/800/600?random=${i * 3 + 2}`,
        ],
        tags: ['professional', 'experienced', 'reliable', subcategory.name.toLowerCase()],
        requirements: [
          'Provide detailed project description',
          'Share any reference materials or examples',
          'Specify your preferred timeline',
        ],
        searchKeywords: [subcategory.name.toLowerCase(), 'professional', 'quality', 'fast'],
        status: GigStatus.ACTIVE,
        publishedAt: new Date(),
      },
    });

    // Create 3 packages: Basic, Standard, Premium
    await prisma.gigPackage.create({
      data: {
        gigId: gig.id,
        name: 'BASIC',
        description: 'Essential service package',
        price: Math.floor(Math.random() * 10000) + 5000,
        deliveryDays: 3,
        revisions: 1,
        features: ['Basic service delivery', '1 revision', 'Standard support'],
      },
    });

    await prisma.gigPackage.create({
      data: {
        gigId: gig.id,
        name: 'STANDARD',
        description: 'Most popular package with extra features',
        price: Math.floor(Math.random() * 15000) + 10000,
        deliveryDays: 5,
        revisions: 3,
        features: ['Standard service delivery', '3 revisions', 'Priority support', 'Additional features'],
      },
    });

    await prisma.gigPackage.create({
      data: {
        gigId: gig.id,
        name: 'PREMIUM',
        description: 'Complete package with all features',
        price: Math.floor(Math.random() * 25000) + 20000,
        deliveryDays: 7,
        revisions: -1, // Unlimited
        features: ['Premium service delivery', 'Unlimited revisions', '24/7 support', 'All features included', 'Fast delivery'],
      },
    });

    gigCount++;
  }
  console.log(`   ✅ Created ${gigCount} gigs with packages\n`);

  // 9. Create Service Requests
  console.log('9️⃣  Creating service requests...');
  const requests = [];
  const urgencyLevels = ['immediate', 'within_week', 'flexible'];

  for (let i = 0; i < 20; i++) {
    const client = clients[i % clients.length];
    const subcategory = Object.values(subcategoriesMap)[i % Object.keys(subcategoriesMap).length] as any;
    const neighborhood = neighborhoods[i % neighborhoods.length];

    const statuses: RequestStatus[] = ['PENDING', 'APPROVED', 'QUOTED', 'ACCEPTED'];
    const status = i < 15 ? RequestStatus.APPROVED : statuses[Math.floor(Math.random() * statuses.length)];

    const request = await prisma.serviceRequest.create({
      data: {
        clientId: client.id,
        subcategoryId: subcategory.id,
        neighborhoodId: neighborhood.id,
        title: `Need ${subcategory.name} Service`,
        description: `I need professional assistance with ${subcategory.name.toLowerCase()}. Please provide a detailed quote with timeline and cost breakdown.`,
        address: `${i + 1} Request Street, ${neighborhood.name}`,
        latitude: neighborhood.latitude ? neighborhood.latitude + (Math.random() - 0.5) * 0.01 : undefined,
        longitude: neighborhood.longitude ? neighborhood.longitude + (Math.random() - 0.5) * 0.01 : undefined,
        urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
        preferredDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        images: i % 3 === 0 ? [`https://picsum.photos/800/600?random=${i + 100}`] : [],
        status: status,
        adminApproved: status !== RequestStatus.PENDING,
        fraudScore: Math.random() * 0.3, // Low fraud scores
        aiMatchScore: Math.random() * 0.5 + 0.5, // 50-100% match
      },
    });
    requests.push(request);
  }
  console.log(`   ✅ Created ${requests.length} service requests\n`);

  // 10. Create Quotes for approved requests
  console.log('🔟 Creating quotes...');
  let quoteCount = 0;
  const approvedRequests = requests.filter(r => r.status === RequestStatus.APPROVED || r.status === RequestStatus.QUOTED || r.status === RequestStatus.ACCEPTED);

  for (const request of approvedRequests) {
    const numQuotes = Math.floor(Math.random() * 3) + 1; // 1-3 quotes per request

    for (let i = 0; i < numQuotes; i++) {
      const fixer = fixers[Math.floor(Math.random() * fixers.length)];

      // Check if this fixer already quoted this request
      const existingQuote = await prisma.quote.findFirst({
        where: {
          requestId: request.id,
          fixerId: fixer.id,
        },
      });

      if (existingQuote) continue;

      const isInspectionRequired = Math.random() > 0.8;
      const laborCost = Math.floor(Math.random() * 15000) + 5000;
      const materialCost = Math.floor(Math.random() * 10000) + 2000;
      const otherCosts = Math.floor(Math.random() * 3000);
      const totalAmount = laborCost + materialCost + otherCosts;

      await prisma.quote.create({
        data: {
          requestId: request.id,
          fixerId: fixer.id,
          type: isInspectionRequired ? QuoteType.INSPECTION_REQUIRED : QuoteType.DIRECT,
          inspectionFee: isInspectionRequired ? 2000 : null,
          inspectionFeePaid: false,
          totalAmount,
          laborCost,
          materialCost,
          otherCosts,
          description: `I can help with your ${request.title}. I have extensive experience in this area and can deliver quality results. The quote includes all materials and labor.`,
          estimatedDuration: `${Math.floor(Math.random() * 10) + 3} days`,
          startDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          requiresDownPayment: totalAmount > 20000,
          downPaymentAmount: totalAmount > 20000 ? totalAmount * 0.3 : null,
          downPaymentPercentage: totalAmount > 20000 ? 0.3 : null,
          downPaymentReason: totalAmount > 20000 ? 'Down payment required for material procurement' : null,
          isAccepted: false,
        },
      });
      quoteCount++;
    }

    // Accept one quote randomly for ACCEPTED requests
    if (request.status === RequestStatus.ACCEPTED || (request.status === RequestStatus.QUOTED && Math.random() > 0.5)) {
      const quotes = await prisma.quote.findMany({
        where: { requestId: request.id },
      });

      if (quotes.length > 0) {
        const acceptedQuote = quotes[Math.floor(Math.random() * quotes.length)];

        await prisma.quote.update({
          where: { id: acceptedQuote.id },
          data: { isAccepted: true },
        });

        await prisma.serviceRequest.update({
          where: { id: request.id },
          data: { status: RequestStatus.ACCEPTED },
        });
      }
    }
  }
  console.log(`   ✅ Created ${quoteCount} quotes\n`);

  // 11. Create Orders with various statuses
  console.log('1️⃣1️⃣  Creating orders with payments...');
  const gigs = await prisma.gig.findMany({
    where: { status: GigStatus.ACTIVE },
    include: { packages: true },
  });
  const acceptedQuotes = await prisma.quote.findMany({
    where: { isAccepted: true },
    include: { request: true },
  });

  const orderStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.IN_PROGRESS,
    OrderStatus.COMPLETED,
    OrderStatus.SETTLED,
    OrderStatus.CANCELLED,
  ];
  let orderCount = 0;

  // Create orders from gigs (15 orders)
  for (let i = 0; i < 15; i++) {
    const gig = gigs[i % gigs.length];
    if (!gig.packages || gig.packages.length === 0) continue;

    const client = clients[i % clients.length];
    const selectedPackage = gig.packages[Math.floor(Math.random() * gig.packages.length)];
    const status = orderStatuses[i % orderStatuses.length];

    const platformFee = Number(selectedPackage.price) * 0.20;
    const fixerAmount = Number(selectedPackage.price) - platformFee;

    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        fixerId: gig.sellerId,
        gigId: gig.id,
        packageId: selectedPackage.id,
        totalAmount: selectedPackage.price,
        platformFee,
        fixerAmount,
        status: status,
        deliveryDate: new Date(Date.now() + selectedPackage.deliveryDays * 24 * 60 * 60 * 1000),
        revisionsAllowed: selectedPackage.revisions,
        revisionsUsed: 0,
        requirementResponses: {
          description: 'Please deliver as per gig description',
          timeline: `${selectedPackage.deliveryDays} days`,
        },
        startedAt: ['IN_PROGRESS', 'COMPLETED', 'SETTLED'].includes(status) ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        completedAt: ['COMPLETED', 'SETTLED'].includes(status) ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
    orderCount++;

    // Create payment if order is paid or beyond
    if (['PAID', 'IN_PROGRESS', 'COMPLETED', 'SETTLED'].includes(status)) {
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentId: `pi_test_${Date.now()}_${i}`,
          amount: selectedPackage.price,
          status: status === OrderStatus.SETTLED ? PaymentStatus.RELEASED : PaymentStatus.HELD_IN_ESCROW,
          paidAt: new Date(),
        },
      });

      // Record payment in purse system
      try {
        await recordPaymentReceived(order.id, payment.id, Number(selectedPackage.price));
      } catch (error) {
        console.log(`   ⚠️  Purse transaction skipped for order ${order.id}: ${error}`);
      }

      // If settled, release payout
      if (status === OrderStatus.SETTLED) {
        try {
          await releasePayout(order.id, gig.sellerId);

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.RELEASED,
              releasedAt: new Date(),
            },
          });
        } catch (error) {
          console.log(`   ⚠️  Payout skipped for order ${order.id}: ${error}`);
        }
      }
    }

    // If cancelled and was paid, process refund
    if (status === OrderStatus.CANCELLED) {
      const payment = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (payment) {
        try {
          await processFullRefund(order.id, client.id);

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: new Date(),
            },
          });
        } catch (error) {
          console.log(`   ⚠️  Refund skipped for order ${order.id}: ${error}`);
        }
      }
    }

    // Create delivery for completed/settled orders
    if (['COMPLETED', 'SETTLED'].includes(status)) {
      order.deliveryFiles = [
        'https://example.com/deliverable1.pdf',
        'https://example.com/deliverable2.zip',
      ];
      order.deliveryNote = 'Work completed as requested. All files attached. Please review and let me know if you need any changes.';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryFiles: order.deliveryFiles,
          deliveryNote: order.deliveryNote,
          deliveredAt: new Date(),
        },
      });
    }
  }

  // Create orders from accepted quotes (10 orders)
  for (let idx = 0; idx < Math.min(10, acceptedQuotes.length); idx++) {
    const quote = acceptedQuotes[idx];

    // Check if order already exists for this request
    const existingOrder = await prisma.order.findUnique({
      where: { requestId: quote.requestId },
    });

    if (existingOrder) continue;

    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

    const platformFee = Number(quote.totalAmount) * 0.20;
    const fixerAmount = Number(quote.totalAmount) - platformFee;

    const order = await prisma.order.create({
      data: {
        clientId: quote.request.clientId,
        fixerId: quote.fixerId,
        requestId: quote.requestId,
        quoteId: quote.id,
        totalAmount: quote.totalAmount,
        platformFee,
        fixerAmount,
        status: status,
        downPaymentRequired: quote.requiresDownPayment,
        downPaymentAmount: quote.downPaymentAmount ? Number(quote.downPaymentAmount) : null,
        downPaymentPaid: quote.requiresDownPayment ? ['PAID', 'IN_PROGRESS', 'COMPLETED', 'SETTLED'].includes(status) : false,
        startedAt: ['IN_PROGRESS', 'COMPLETED', 'SETTLED'].includes(status) ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        completedAt: ['COMPLETED', 'SETTLED'].includes(status) ? new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
      },
    });
    orderCount++;

    // Create payment if order is paid or beyond
    if (['PAID', 'IN_PROGRESS', 'COMPLETED', 'SETTLED'].includes(status)) {
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentId: `pi_test_quote_${Date.now()}_${idx}`,
          amount: quote.totalAmount,
          status: status === OrderStatus.SETTLED ? PaymentStatus.RELEASED : PaymentStatus.HELD_IN_ESCROW,
          paidAt: new Date(),
        },
      });

      try {
        await recordPaymentReceived(order.id, payment.id, Number(quote.totalAmount));
      } catch (error) {
        console.log(`   ⚠️  Purse transaction skipped for order ${order.id}`);
      }

      if (status === OrderStatus.SETTLED) {
        try {
          await releasePayout(order.id, quote.fixerId);

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.RELEASED,
              releasedAt: new Date(),
            },
          });
        } catch (error) {
          console.log(`   ⚠️  Payout skipped for order ${order.id}`);
        }
      }
    }

    if (status === OrderStatus.CANCELLED) {
      const payment = await prisma.payment.findFirst({
        where: { orderId: order.id },
      });

      if (payment) {
        try {
          await processFullRefund(order.id, quote.request.clientId);

          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.REFUNDED,
              refundedAt: new Date(),
            },
          });
        } catch (error) {
          console.log(`   ⚠️  Refund skipped for order ${order.id}`);
        }
      }
    }

    // Create delivery for completed/settled orders
    if (['COMPLETED', 'SETTLED'].includes(status)) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryFiles: [
            'https://example.com/project_deliverable.pdf',
            'https://example.com/final_report.docx',
          ],
          deliveryNote: 'Project completed successfully. All requirements met. Documentation attached.',
          deliveredAt: new Date(),
        },
      });
    }
  }

  console.log(`   ✅ Created ${orderCount} orders with payments\n`);

  // 12. Create Reviews for completed/settled orders
  console.log('1️⃣2️⃣  Creating reviews...');
  const completedOrders = await prisma.order.findMany({
    where: { status: { in: [OrderStatus.COMPLETED, OrderStatus.SETTLED] } },
  });

  let reviewCount = 0;
  const reviewComments = [
    'Excellent work! Very professional and delivered on time.',
    'Great communication throughout the project. Highly recommended!',
    'Outstanding quality! Will definitely hire again.',
    'Perfect! Exceeded my expectations in every way.',
    'Very satisfied with the results. Professional and efficient.',
    'Fantastic service! Attention to detail was impressive.',
    'Highly skilled professional. Great experience working together.',
  ];

  for (const order of completedOrders) {
    // Create review from client to fixer
    await prisma.review.create({
      data: {
        orderId: order.id,
        reviewerId: order.clientId,
        revieweeId: order.fixerId,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      },
    });
    reviewCount++;
  }
  console.log(`   ✅ Created ${reviewCount} reviews\n`);

  // 13. Create Direct Messages
  console.log('1️⃣3️⃣  Creating direct messages...');
  let messageCount = 0;

  // Messages for orders
  const ordersWithMessages = await prisma.order.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
  });

  for (const order of ordersWithMessages) {
    // Client to Fixer
    await prisma.directMessage.create({
      data: {
        senderId: order.clientId,
        recipientId: order.fixerId,
        orderId: order.id,
        message: 'Hi! I have some questions about the order. When can we expect delivery?',
      },
    });

    // Fixer to Client
    await prisma.directMessage.create({
      data: {
        senderId: order.fixerId,
        recipientId: order.clientId,
        orderId: order.id,
        message: 'Hello! Happy to help. I am working on your order and will deliver as per the agreed timeline.',
        isRead: true,
      },
    });

    messageCount += 2;
  }

  // Messages for service requests
  const requestsWithMessages = await prisma.serviceRequest.findMany({
    where: { status: { in: [RequestStatus.QUOTED, RequestStatus.ACCEPTED] } },
    take: 10,
  });

  for (const request of requestsWithMessages) {
    const fixer = fixers[Math.floor(Math.random() * fixers.length)];

    await prisma.directMessage.create({
      data: {
        senderId: fixer.id,
        recipientId: request.clientId,
        requestId: request.id,
        message: 'I saw your service request and would love to help. I have submitted a quote for your review.',
      },
    });

    await prisma.directMessage.create({
      data: {
        senderId: request.clientId,
        recipientId: fixer.id,
        requestId: request.id,
        message: 'Thank you for the quote! I will review it and get back to you soon.',
        isRead: true,
      },
    });

    messageCount += 2;
  }

  // Messages for gigs
  const gigsWithMessages = await prisma.gig.findMany({
    where: { status: GigStatus.ACTIVE },
    take: 10,
  });

  for (const gig of gigsWithMessages) {
    const client = clients[Math.floor(Math.random() * clients.length)];

    await prisma.directMessage.create({
      data: {
        senderId: client.id,
        recipientId: gig.sellerId,
        gigId: gig.id,
        message: 'Hi! I am interested in your gig. Can you provide more details about the service?',
      },
    });

    await prisma.directMessage.create({
      data: {
        senderId: gig.sellerId,
        recipientId: client.id,
        gigId: gig.id,
        message: 'Absolutely! I would be happy to answer any questions. What would you like to know?',
        isRead: true,
      },
    });

    messageCount += 2;
  }

  console.log(`   ✅ Created ${messageCount} direct messages\n`);

  // Summary
  console.log('================================================================================');
  console.log('✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - Service Categories: ${categories.length}`);
  console.log(`   - Service Subcategories: ${Object.keys(subcategoriesMap).length}`);
  console.log(`   - Neighborhoods: ${neighborhoods.length}`);
  console.log(`   - Clients: ${clients.length} (c1@f.com - c${clients.length}@f.com)`);
  console.log(`   - Fixers: ${fixers.length} (f1@f.com - f${fixers.length}@f.com)`);
  console.log(`   - Fixer Services: ${fixerServiceCount}`);
  console.log(`   - Gigs: ${gigCount} (with 3 packages each)`);
  console.log(`   - Service Requests: ${requests.length}`);
  console.log(`   - Quotes: ${quoteCount}`);
  console.log(`   - Orders: ${orderCount}`);
  console.log(`   - Reviews: ${reviewCount}`);
  console.log(`   - Direct Messages: ${messageCount}`);
  console.log('\n🔐 Login Info:');
  console.log('   Admin: admin@fixxers.com (no password - uses magic links)');
  console.log('   Clients: c1@f.com - c10@f.com (no password - uses magic links)');
  console.log('   Fixers: f1@f.com - f15@f.com (no password - uses magic links)');
  console.log('\n💰 Platform Settings:');
  console.log('   Commission: 20%');
  console.log('   Refund Commission: 50%');
  console.log('================================================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
