/**
 * Agent Test Helpers
 * Mock data generators for agent-related tests
 */

export function createMockAgent(overrides: any = {}) {
  return {
    id: 'agent-1',
    userId: 'user-agent-1',
    businessName: 'ABC Fixers Agency',
    status: 'ACTIVE',
    commissionPercentage: 15.0,
    requestedNeighborhoodIds: ['neigh-1', 'neigh-2'],
    approvedById: 'admin-1',
    approvedAt: new Date(),
    pendingChanges: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockAgentFixer(overrides: any = {}) {
  return {
    id: 'agent-fixer-1',
    agentId: 'agent-1',
    fixerId: 'fixer-1',
    vetStatus: 'VETTED',
    vetNotes: 'Verified identity and credentials',
    vettedById: 'user-agent-1',
    vettedAt: new Date(),
    registeredAt: new Date(),
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createMockAgentClient(overrides: any = {}) {
  return {
    id: 'agent-client-1',
    agentId: 'agent-1',
    clientId: 'client-1',
    addedAt: new Date(),
    status: 'ACTIVE',
    ...overrides,
  };
}

export function createMockAgentGig(overrides: any = {}) {
  return {
    id: 'agent-gig-1',
    agentId: 'agent-1',
    gigId: 'gig-1',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockAgentQuote(overrides: any = {}) {
  return {
    id: 'agent-quote-1',
    agentId: 'agent-1',
    quoteId: 'quote-1',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockAgentServiceRequest(overrides: any = {}) {
  return {
    id: 'agent-request-1',
    agentId: 'agent-1',
    requestId: 'request-1',
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockAgentCommission(overrides: any = {}) {
  return {
    id: 'commission-1',
    agentId: 'agent-1',
    orderId: 'order-1',
    amount: 1125.0, // 15% of 7500
    percentage: 15.0,
    status: 'EARNED',
    agentFixerId: 'agent-fixer-1',
    earnedAt: new Date(),
    paidAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockNeighborhood(overrides: any = {}) {
  return {
    id: 'neigh-1',
    name: 'Lekki Phase 1',
    legacyCity: 'Lagos',
    legacyState: 'Lagos',
    legacyCountry: 'Nigeria',
    ...overrides,
  };
}

export function createMockUser(overrides: any = {}) {
  return {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+2341234567890',
    roles: ['CLIENT'],
    profileImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockGig(overrides: any = {}) {
  return {
    id: 'gig-1',
    sellerId: 'fixer-1',
    subcategoryId: 'subcat-1',
    title: 'Professional Plumbing Services',
    description: 'Expert plumbing work for residential and commercial properties',
    slug: 'professional-plumbing-services',
    images: [],
    tags: ['plumbing', 'repairs', 'installation'],
    faq: [],
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockGigPackage(overrides: any = {}) {
  return {
    id: 'package-1',
    gigId: 'gig-1',
    name: 'Basic',
    description: 'Basic plumbing service',
    price: 5000,
    deliveryDays: 2,
    revisions: 1,
    ...overrides,
  };
}

export function createMockNotification(overrides: any = {}) {
  return {
    id: 'notif-1',
    userId: 'user-1',
    type: 'GENERAL',
    title: 'Test Notification',
    message: 'This is a test notification',
    link: '/test',
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

export function createMockFixerProfile(overrides: any = {}) {
  return {
    id: 'fixer-1',
    userId: 'user-fixer-1',
    bio: 'Experienced professional fixer',
    skills: ['plumbing', 'electrical'],
    hourlyRate: 5000,
    verified: false,
    approvalStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockServiceRequest(overrides: any = {}) {
  return {
    id: 'request-1',
    clientId: 'client-1',
    subcategoryId: 'subcat-1',
    title: 'Need plumbing service',
    description: 'Fix leaking pipes in kitchen',
    budget: 10000,
    urgency: 'MEDIUM',
    status: 'OPEN',
    neighborhoodId: 'neigh-1',
    images: [],
    preferredDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockQuote(overrides: any = {}) {
  return {
    id: 'quote-1',
    requestId: 'request-1',
    fixerId: 'fixer-1',
    amount: 8500,
    description: 'I can fix the leaking pipes',
    estimatedDays: 2,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockOrder(overrides: any = {}) {
  return {
    id: 'order-1',
    requestId: 'request-1',
    clientId: 'client-1',
    fixerId: 'fixer-1',
    status: 'COMPLETED',
    totalAmount: 7500,
    paymentStatus: 'PAID',
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
