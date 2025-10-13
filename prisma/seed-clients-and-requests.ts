import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedClientsAndRequests() {
  try {
    console.log('👥 Creating new clients...\n');

    // Get a neighborhood for the clients
    const neighborhood = await prisma.neighborhood.findFirst({
      where: { city: 'Abuja' }
    });

    if (!neighborhood) {
      console.log('❌ No neighborhoods found');
      return;
    }

    // Create two new clients
    const client1 = await prisma.user.upsert({
      where: { email: 'adamu@yopmail.com' },
      update: {},
      create: {
        email: 'adamu@yopmail.com',
        name: 'Adamu Mohammed',
        role: 'CLIENT',
        status: 'ACTIVE',
        clientProfile: {
          create: {
            neighbourhood: neighborhood.name,
            city: neighborhood.city,
            state: neighborhood.state,
            country: neighborhood.country,
            primaryPhone: '+234 803 123 4567',
          }
        }
      }
    });

    const client2 = await prisma.user.upsert({
      where: { email: 'miss-vero@yopmail.com' },
      update: {},
      create: {
        email: 'miss-vero@yopmail.com',
        name: 'Veronica Okeke',
        role: 'CLIENT',
        status: 'ACTIVE',
        clientProfile: {
          create: {
            neighbourhood: neighborhood.name,
            city: neighborhood.city,
            state: neighborhood.state,
            country: neighborhood.country,
            primaryPhone: '+234 805 765 4321',
          }
        }
      }
    });

    console.log(`✅ ${client1.email}`);
    console.log(`✅ ${client2.email}\n`);

    // Get subcategories
    console.log('🔍 Fetching subcategories...\n');
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

    // Nigeria-specific service requests
    console.log('📝 Creating Nigeria-specific service requests...\n');

    const nigerianRequests = [
      // Adamu's requests
      {
        clientId: client1.id,
        subcategoryId: getSubcatId('Plumbing'),
        neighborhoodId: neighborhood.id,
        title: 'Fix Leaking Pipe in Kitchen - Urgent',
        description: 'I have a leaking pipe under my kitchen sink that needs urgent attention. Water is dripping constantly and I\'m worried about water damage. The leak started 2 days ago. I live in a 3-bedroom flat in Gwarinpa. Need someone experienced who can come today or tomorrow.',
        address: 'Gwarinpa, Abuja'
      },
      {
        clientId: client1.id,
        subcategoryId: getSubcatId('Electrical Work'),
        neighborhoodId: neighborhood.id,
        title: 'Install Ceiling Fan and Fix Power Outlets',
        description: 'Need an electrician to install 2 ceiling fans in my bedrooms and fix 3 power outlets that stopped working. The outlets are in the living room and one bedroom. Also need to check why my PHCN meter is not displaying correctly. Property is in Kubwa.',
        address: 'Kubwa, Abuja'
      },
      {
        clientId: client1.id,
        subcategoryId: getSubcatId('HVAC Services'),
        neighborhoodId: neighborhood.id,
        title: 'AC Not Cooling - Gas Refill Needed',
        description: 'My 1.5HP split AC stopped cooling properly. I think it needs gas refilling. The AC is about 3 years old (LG brand). It\'s blowing air but not cold. Also want the unit cleaned and serviced while at it. Located in Maitama.',
        address: 'Maitama, Abuja'
      },
      {
        clientId: client1.id,
        subcategoryId: getSubcatId('Web Development'),
        neighborhoodId: neighborhood.id,
        title: 'Simple Website for My Fashion Business',
        description: 'I run a fashion boutique and need a website to showcase my products. Nothing too complex - just a clean design with photo gallery, contact form, and WhatsApp integration. Must be mobile-friendly as most of my customers use phones. Need someone who understands the Nigerian market.',
        address: 'Abuja (Remote work possible)'
      },
      {
        clientId: client1.id,
        subcategoryId: getSubcatId('IT Support & Troubleshooting'),
        neighborhoodId: neighborhood.id,
        title: 'Laptop Very Slow - Needs Upgrade',
        description: 'My HP laptop has become very slow. Takes forever to start and programs keep freezing. I think I need to upgrade the RAM and maybe add an SSD. Also want Windows reinstalled with all my files backed up. The laptop is about 4 years old. Can you come to my office in Wuse 2?',
        address: 'Wuse 2, Abuja'
      },

      // Veronica's requests
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Carpentry'),
        neighborhoodId: neighborhood.id,
        title: 'Build Custom Wardrobe for Master Bedroom',
        description: 'I need a carpenter to build a custom wardrobe for my master bedroom. The space is 2.5 meters wide and I want it floor-to-ceiling with sliding doors. Prefer Nigerian hardwood (mahogany or iroko). Need internal shelves and hanging space. My house is in Asokoro. Can provide exact measurements.',
        address: 'Asokoro, Abuja'
      },
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Painting & Decorating'),
        neighborhoodId: neighborhood.id,
        title: 'Paint 3-Bedroom Flat - Interior Only',
        description: 'Just moved into a new 3-bedroom flat in Lugbe and want to repaint the interior before moving in furniture. All rooms need screeding first as walls are rough. Want neutral colors (white/cream). Includes 3 bedrooms, living room, dining area, and kitchen. Total about 120 sqm. Need quality paint that will last.',
        address: 'Lugbe, Abuja'
      },
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Mobile App Development'),
        neighborhoodId: neighborhood.id,
        title: 'Simple Food Delivery App for Abuja',
        description: 'I want to create a food delivery app specifically for Abuja. Nothing as complex as Jumia Food - just a simple app where customers can order from selected restaurants, pay with card or cash, and track delivery. Need Android version first. Must integrate with Nigerian payment systems (Paystack or Flutterwave).',
        address: 'Abuja (Remote work possible)'
      },
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Business Consulting'),
        neighborhoodId: neighborhood.id,
        title: 'Register My Business with CAC',
        description: 'I want to register my small business (online retail store) with CAC. Need help with name search, documentation, and the entire registration process. Also need guidance on getting TIN and opening a business bank account. First time doing this so need someone patient who can explain everything.',
        address: 'Abuja (Can meet in person or online)'
      },
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Digital Marketing'),
        neighborhoodId: neighborhood.id,
        title: 'Grow My Instagram Business Page',
        description: 'I sell beauty products online and have about 500 followers on Instagram. Want to grow to at least 5,000 followers in 3 months and increase sales. Need someone to manage my page, create engaging content, run ads, and help with influencer partnerships. Must understand Nigerian beauty market and Lagos/Abuja audience.',
        address: 'Abuja (Remote work)'
      },
      {
        clientId: client2.id,
        subcategoryId: getSubcatId('Bookkeeping & Accounting'),
        neighborhoodId: neighborhood.id,
        title: 'Monthly Bookkeeping for Small Shop',
        description: 'I run a small boutique and need someone to handle my monthly bookkeeping. About 30-40 transactions per month. Need help with tracking expenses, income, bank reconciliation, and simple financial reports. Also need help filing my taxes properly with FIRS. Looking for ongoing monthly service.',
        address: 'Abuja'
      }
    ];

    let createdCount = 0;

    for (const requestData of nigerianRequests) {
      if (!requestData.subcategoryId) {
        console.log(`⚠️  Skipping: ${requestData.title}`);
        continue;
      }

      await prisma.serviceRequest.create({
        data: {
          ...requestData,
          status: 'PENDING',
        }
      });

      createdCount++;
      console.log(`✅ ${requestData.title}`);
    }

    console.log(`\n🎉 Successfully created:
    - 2 new clients
    - ${createdCount} Nigeria-specific service requests`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedClientsAndRequests();
