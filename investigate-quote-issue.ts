import { prisma } from './lib/prisma';

async function investigate() {
  // Find Adoza Fixer
  const adoza = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Adoza', mode: 'insensitive' } },
        { email: { contains: 'adoza', mode: 'insensitive' } }
      ]
    },
    include: {
      fixerServices: {
        include: {
          subcategory: {
            include: { category: true }
          },
          neighborhoods: true
        }
      }
    }
  });

  console.log('=== ADOZA FIXER ===');
  console.log('Name:', adoza?.name);
  console.log('Email:', adoza?.email);
  console.log('Status:', adoza?.status);
  console.log('\nServices:');
  adoza?.fixerServices.forEach(service => {
    console.log('- Category:', service.subcategory.category.name, '(ID:', service.subcategory.categoryId + ')');
    console.log('  Subcategory:', service.subcategory.name);
    console.log('  Neighborhoods:', service.neighborhoods.map(n => `${n.name}, ${n.city} (ID: ${n.id})`).join('; '));
  });

  // Find Guadalipe's request
  const guadalipe = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Guadalipe', mode: 'insensitive' } },
        { email: { contains: 'guadalipe', mode: 'insensitive' } }
      ]
    }
  });

  console.log('\n=== GUADALIPE ===');
  console.log('Name:', guadalipe?.name);
  console.log('Email:', guadalipe?.email);

  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: guadalipe?.id },
    include: {
      subcategory: {
        include: { category: true }
      },
      neighborhood: true
    }
  });

  console.log('\nService Requests:');
  requests.forEach(req => {
    console.log('- Title:', req.title);
    console.log('  Status:', req.status);
    console.log('  Category:', req.subcategory.category.name, '(ID:', req.subcategory.categoryId + ')');
    console.log('  Subcategory:', req.subcategory.name);
    console.log('  Neighborhood:', `${req.neighborhood.name}, ${req.neighborhood.city} (ID: ${req.neighborhoodId})`);
  });

  // Check matching logic
  if (adoza && requests.length > 0) {
    console.log('\n=== MATCHING ANALYSIS ===');
    const fixerNeighborhoodIds = adoza.fixerServices.flatMap(s => s.neighborhoods.map(n => n.id));
    const fixerCategoryIds = adoza.fixerServices.map(s => s.subcategory.categoryId);

    console.log('Fixer Neighborhood IDs:', fixerNeighborhoodIds);
    console.log('Fixer Category IDs:', fixerCategoryIds);

    requests.forEach(req => {
      const hasNeighborhood = fixerNeighborhoodIds.includes(req.neighborhoodId);
      const hasCategory = fixerCategoryIds.includes(req.subcategory.categoryId);
      const canQuote = hasNeighborhood && hasCategory;

      console.log(`\nRequest: ${req.title}`);
      console.log('  Has Neighborhood Match:', hasNeighborhood);
      console.log('  Has Category Match:', hasCategory);
      console.log('  Can Quote:', canQuote);
    });
  }
}

investigate()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
