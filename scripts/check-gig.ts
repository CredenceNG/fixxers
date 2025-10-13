import { prisma } from '../lib/prisma';

async function main() {
  const gig = await prisma.gig.findFirst({
    where: {
      slug: 'professional-leak-repair-1760290605995'
    },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      searchKeywords: true,
      status: true,
    }
  });

  console.log('Gig data:', JSON.stringify(gig, null, 2));

  // Test search with different terms
  const searchTerms = ['leaked repairs', 'leak repair', 'Leak'];

  for (const searchTerm of searchTerms) {
    console.log(`\n\n=== Testing search: "${searchTerm}" ===`);

    // Test title contains
    const titleResults = await prisma.gig.findMany({
      where: {
        status: 'ACTIVE',
        title: { contains: searchTerm, mode: 'insensitive' }
      },
      select: { id: true, title: true, slug: true }
    });
    console.log('Title contains results:', titleResults.length);

    // Test description contains
    const descResults = await prisma.gig.findMany({
      where: {
        status: 'ACTIVE',
        description: { contains: searchTerm, mode: 'insensitive' }
      },
      select: { id: true, title: true, slug: true }
    });
    console.log('Description contains results:', descResults.length);

    // Full OR search
    const searchResults = await prisma.gig.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ]
      },
      select: { id: true, title: true, slug: true }
    });
    console.log('Combined OR results:', searchResults.length);
    if (searchResults.length > 0) {
      console.log('Found:', JSON.stringify(searchResults, null, 2));
    }
  }

  await prisma.$disconnect();
}

main();
