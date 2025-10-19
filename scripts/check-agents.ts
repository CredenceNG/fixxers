import { prisma } from '../lib/prisma';

async function checkAgents() {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        userId: true,
        businessName: true,
        status: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      take: 10,
    });

    console.log('\n=== Agents in Database ===');
    console.log(JSON.stringify(agents, null, 2));
    console.log('\nTotal agents:', agents.length);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgents();
