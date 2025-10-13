const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getQuote() {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: 'cmgobzcqj0001kp4x6qfqa8ok' },
      include: {
        request: {
          include: {
            client: true,
            subcategory: {
              include: {
                category: true,
              },
            },
            neighborhood: true,
          },
        },
        fixer: true,
      },
    });

    console.log(JSON.stringify(quote, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getQuote();
