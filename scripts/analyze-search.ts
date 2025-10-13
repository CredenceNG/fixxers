import { prisma } from '../lib/prisma';

async function main() {
  // Get all active gigs
  const gigs = await prisma.gig.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      searchKeywords: true,
      slug: true,
    }
  });

  console.log('=== ALL ACTIVE GIGS ===\n');
  gigs.forEach((gig, idx) => {
    console.log(`${idx + 1}. ${gig.title}`);
    console.log(`   Slug: ${gig.slug}`);
    console.log(`   Tags: ${gig.tags.join(', ')}`);
    console.log(`   Keywords: ${gig.searchKeywords.join(', ')}`);
    console.log(`   Description preview: ${gig.description.substring(0, 100)}...`);
    console.log('');
  });

  // Test search with "repairs"
  const searchTerm = 'repairs';
  console.log(`\n=== TESTING SEARCH: "${searchTerm}" ===\n`);

  const searchWords = searchTerm.trim().split(/\s+/).filter(word => word.length > 0);
  console.log(`Search words: ${searchWords.join(', ')}`);

  const wordConditions = searchWords.flatMap(word => [
    { title: { contains: word, mode: 'insensitive' } },
    { description: { contains: word, mode: 'insensitive' } },
  ]);

  const whereConditions: any = {
    status: 'ACTIVE',
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      ...wordConditions,
    ]
  };

  const results = await prisma.gig.findMany({
    where: whereConditions,
    select: {
      id: true,
      title: true,
      slug: true,
    }
  });

  console.log(`\nResults found: ${results.length}`);
  results.forEach((result, idx) => {
    console.log(`${idx + 1}. ${result.title}`);
    console.log(`   ${result.slug}`);
  });

  // Check each gig manually for the word "repair"
  console.log('\n=== MANUAL CHECK: Does title/description contain "repair"? ===\n');
  gigs.forEach((gig) => {
    const inTitle = gig.title.toLowerCase().includes('repair');
    const inDesc = gig.description.toLowerCase().includes('repair');
    console.log(`${gig.title}`);
    console.log(`   Title has "repair": ${inTitle}`);
    console.log(`   Description has "repair": ${inDesc}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main();
