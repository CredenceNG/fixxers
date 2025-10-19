const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupAgentData() {
  console.log('Starting cleanup...');

  // Delete all agent-related records (order matters due to foreign keys)
  const deletedCommissions = await prisma.agentCommission.deleteMany({});
  console.log(`Deleted ${deletedCommissions.count} agent commissions`);

  const deletedServiceRequests = await prisma.agentServiceRequest.deleteMany({});
  console.log(`Deleted ${deletedServiceRequests.count} agent service requests`);

  const deletedQuotes = await prisma.agentQuote.deleteMany({});
  console.log(`Deleted ${deletedQuotes.count} agent quotes`);

  const deletedGigs = await prisma.agentGig.deleteMany({});
  console.log(`Deleted ${deletedGigs.count} agent gigs`);

  const deletedAgentClients = await prisma.agentClient.deleteMany({});
  console.log(`Deleted ${deletedAgentClients.count} agent-client relationships`);

  const deletedAgentFixers = await prisma.agentFixer.deleteMany({});
  console.log(`Deleted ${deletedAgentFixers.count} agent-fixer relationships`);

  const deletedAgents = await prisma.agent.deleteMany({});
  console.log(`Deleted ${deletedAgents.count} agents`);

  console.log('Cleanup complete!');
  await prisma.$disconnect();
}

cleanupAgentData().catch((error) => {
  console.error('Error during cleanup:', error);
  process.exit(1);
});
