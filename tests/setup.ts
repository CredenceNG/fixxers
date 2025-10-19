import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3010';

// Helper to create model mocks
const createModelMock = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  upsert: vi.fn(),
});

// Mock Prisma Client
export const prismaMock = {
  user: createModelMock(),
  serviceRequest: createModelMock(),
  quote: createModelMock(),
  order: createModelMock(),
  payment: createModelMock(),
  review: createModelMock(),
  message: createModelMock(),
  dispute: createModelMock(),
  reviewHelpful: createModelMock(),
  reviewReport: createModelMock(),
  // Agent-related models
  agent: createModelMock(),
  agentFixer: createModelMock(),
  agentClient: createModelMock(),
  agentGig: createModelMock(),
  agentQuote: createModelMock(),
  agentServiceRequest: createModelMock(),
  agentCommission: createModelMock(),
  neighborhood: createModelMock(),
  notification: {
    ...createModelMock(),
    createMany: vi.fn(),
  },
  gig: createModelMock(),
  gigPackage: {
    ...createModelMock(),
    createMany: vi.fn(),
  },
  fixerService: createModelMock(),
  subcategory: createModelMock(),
  $transaction: vi.fn(),
};

vi.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}));

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(),
}));

// Mock email service
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// Mock payment providers
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
    },
  })),
}));

beforeAll(() => {
  console.log('Running tests...');
});

afterAll(() => {
  console.log('Tests complete!');
});
