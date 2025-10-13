const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFixerProfiles() {
  try {
    const fixers = await prisma.user.findMany({
      where: { role: 'FIXER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        yearsOfService: true,
        qualifications: true,
        neighbourhood: true,
        city: true,
        state: true,
        country: true,
        primaryPhone: true,
        secondaryPhone: true,
        profileCompleted: true,
        status: true,
      },
    });

    console.log('\n=== FIXER PROFILES ===\n');
    fixers.forEach(fixer => {
      console.log(`ID: ${fixer.id}`);
      console.log(`Name: ${fixer.name || 'Not set'}`);
      console.log(`Contact: ${fixer.email || fixer.phone}`);
      console.log(`Years of Service: ${fixer.yearsOfService || 'Not set'}`);
      console.log(`Qualifications: ${fixer.qualifications?.join(', ') || 'Not set'}`);
      console.log(`Location: ${fixer.neighbourhood || 'N/A'}, ${fixer.city || 'N/A'}, ${fixer.state || 'N/A'}, ${fixer.country || 'N/A'}`);
      console.log(`Primary Phone: ${fixer.primaryPhone || 'Not set'}`);
      console.log(`Secondary Phone: ${fixer.secondaryPhone || 'Not set'}`);
      console.log(`Profile Completed: ${fixer.profileCompleted}`);
      console.log(`Status: ${fixer.status}`);
      console.log('---\n');
    });

    console.log(`Total fixers: ${fixers.length}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFixerProfiles();
