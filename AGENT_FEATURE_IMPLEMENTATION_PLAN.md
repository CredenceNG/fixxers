# Agent Feature - Complete Implementation Plan

## 📋 Overview
Implement Agent functionality as a **separate table with 1-to-1 relationship to User**, allowing existing users (who are already Client/Fixer) to register as Agents with independent approval workflows and commission tracking.

---

## 🎯 Phase 1: Database Schema & Migrations

### 1.1 Update Prisma Schema

**Add New Enums:**
```prisma
enum AgentStatus {
  PENDING
  ACTIVE
  SUSPENDED
  REJECTED
  BANNED
}

enum VetStatus {
  PENDING
  APPROVED
  REJECTED
}
```

**Add to NotificationType:**
```prisma
enum NotificationType {
  // ... existing
  AGENT_APPLICATION_SUBMITTED
  AGENT_APPROVED
  AGENT_REJECTED
  AGENT_FIXER_NEEDS_VETTING
  AGENT_COMMISSION_EARNED
}
```

**Create Agent Model:**
```prisma
model Agent {
  id                    String          @id @default(cuid())
  userId                String          @unique
  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Business Info
  businessName          String?
  businessAddress       String?
  taxId                 String?

  // Status & Approval
  status                AgentStatus     @default(PENDING)
  approvedAt            DateTime?
  approvedById          String?
  approver              User?           @relation("AgentApprovals", fields: [approvedById], references: [id])
  rejectedAt            DateTime?
  rejectionReason       String?
  suspendedAt           DateTime?
  suspensionReason      String?
  bannedAt              DateTime?
  banReason             String?

  // Territory
  approvedNeighborhoods Neighborhood[]
  requestedNeighborhoodIds String[]      @default([])
  pendingChanges        Boolean         @default(true)

  // Commission (admin-configurable per agent)
  commissionPercentage  Decimal         @default(5.00) @db.Decimal(5, 2)
  fixerBonusEnabled     Boolean         @default(true)

  // Metrics
  totalFixersManaged    Int             @default(0)
  activeFixersCount     Int             @default(0)
  totalClientsManaged   Int             @default(0)
  totalCommissions      Decimal         @default(0) @db.Decimal(10, 2)

  // Relationships
  managedFixers         AgentFixer[]
  managedClients        AgentClient[]
  agentGigs             AgentGig[]
  agentQuotes           AgentQuote[]
  agentRequests         AgentServiceRequest[]
  commissions           AgentCommission[]

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  @@index([userId])
  @@index([status])
  @@index([approvedAt])
}

model AgentFixer {
  id                  String      @id @default(cuid())
  agentId             String
  agent               Agent       @relation(fields: [agentId], references: [id], onDelete: Cascade)
  fixerId             String
  fixer               User        @relation("AgentManagedFixers", fields: [fixerId], references: [id], onDelete: Cascade)

  // Vetting
  vetStatus           VetStatus   @default(PENDING)
  vetNotes            String?
  vettedAt            DateTime?
  vettedById          String?     // Agent user who vetted

  // Registration bonus tracking
  bonusPaid           Boolean     @default(false)
  bonusAmount         Decimal?    @db.Decimal(10, 2)
  bonusPaidAt         DateTime?
  firstOrderId        String?     // Order that triggered bonus

  registeredAt        DateTime    @default(now())

  @@unique([agentId, fixerId])
  @@index([agentId])
  @@index([fixerId])
  @@index([vetStatus])
}

model AgentClient {
  id          String    @id @default(cuid())
  agentId     String
  agent       Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  clientId    String
  client      User      @relation("AgentManagedClients", fields: [clientId], references: [id], onDelete: Cascade)

  addedAt     DateTime  @default(now())
  notes       String?

  @@unique([agentId, clientId])
  @@index([agentId])
  @@index([clientId])
}

model AgentGig {
  id          String    @id @default(cuid())
  agentId     String
  agent       Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  gigId       String
  gig         Gig       @relation(fields: [gigId], references: [id], onDelete: Cascade)
  fixerId     String    // The actual fixer

  createdAt   DateTime  @default(now())

  @@unique([gigId])
  @@index([agentId])
  @@index([fixerId])
}

model AgentQuote {
  id          String    @id @default(cuid())
  agentId     String
  agent       Agent     @relation(fields: [agentId], references: [id], onDelete: Cascade)
  quoteId     String
  quote       Quote     @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  fixerId     String    // The actual fixer

  createdAt   DateTime  @default(now())

  @@unique([quoteId])
  @@index([agentId])
  @@index([fixerId])
}

model AgentServiceRequest {
  id          String          @id @default(cuid())
  agentId     String
  agent       Agent           @relation(fields: [agentId], references: [id], onDelete: Cascade)
  requestId   String
  request     ServiceRequest  @relation(fields: [requestId], references: [id], onDelete: Cascade)
  clientId    String          // The actual client

  createdAt   DateTime        @default(now())

  @@unique([requestId])
  @@index([agentId])
  @@index([clientId])
}

model AgentCommission {
  id              String              @id @default(cuid())
  agentId         String
  agent           Agent               @relation(fields: [agentId], references: [id], onDelete: Cascade)

  type            String              // "ORDER_COMMISSION" or "FIXER_BONUS"
  amount          Decimal             @db.Decimal(10, 2)

  // Order commission
  orderId         String?
  order           Order?              @relation(fields: [orderId], references: [id])

  // Fixer bonus
  agentFixerId    String?
  agentFixer      AgentFixer?         @relation(fields: [agentFixerId], references: [id])

  isPaid          Boolean             @default(false)
  paidAt          DateTime?
  purseTransactionId String?

  createdAt       DateTime            @default(now())

  @@index([agentId])
  @@index([orderId])
  @@index([isPaid])
  @@index([createdAt])
}
```

**Update User Model:**
```prisma
model User {
  // ... existing fields

  agentProfile        Agent?
  managedAsFixerBy    AgentFixer[]    @relation("AgentManagedFixers")
  managedAsClientBy   AgentClient[]   @relation("AgentManagedClients")
  approvedAgents      Agent[]         @relation("AgentApprovals")
}
```

**Update Related Models:**
```prisma
model Gig {
  // ... existing
  agentGig      AgentGig?
}

model Quote {
  // ... existing
  agentQuote    AgentQuote?
}

model ServiceRequest {
  // ... existing
  agentRequest  AgentServiceRequest?
}

model Order {
  // ... existing
  agentCommissions AgentCommission[]
}

model AgentFixer {
  // ... existing
  commissions   AgentCommission[]
}
```

**Add Platform Settings:**
```prisma
// New settings keys:
- AGENT_ENABLED: "true"
- AGENT_DEFAULT_COMMISSION: "5.00"
- AGENT_FIXER_BONUS_TIER_1: "50"  // 1-10 fixers
- AGENT_FIXER_BONUS_TIER_2: "75"  // 11-25
- AGENT_FIXER_BONUS_TIER_3: "100" // 26-50
- AGENT_FIXER_BONUS_TIER_4: "150" // 51+
```

### 1.2 Run Migration
```bash
npx prisma migrate dev --name add_agent_feature
npx prisma generate
```

---

## 🎯 Phase 2: Core Agent Library Functions

### 2.1 Create `/lib/agent/permissions.ts`
```typescript
// Check if user can become agent (must be CLIENT or FIXER)
export async function canBecomeAgent(userId: string): Promise<boolean>

// Check if agent is active
export async function isAgentActive(agentId: string): Promise<boolean>

// Check if agent can operate in neighborhood
export async function canOperateInNeighborhood(agentId: string, neighborhoodId: string): Promise<boolean>

// Check if fixer is managed by agent
export async function isFixerManagedByAgent(agentId: string, fixerId: string): Promise<boolean>

// Check if client is managed by agent
export async function isClientManagedByAgent(agentId: string, clientId: string): Promise<boolean>

// Validate agent can post gig (agent active, fixer active, fixer managed)
export async function validateAgentGigPermission(agentId: string, fixerId: string): Promise<void>

// Validate agent can submit quote (same + neighborhood check)
export async function validateAgentQuotePermission(agentId: string, fixerId: string, neighborhoodId: string): Promise<void>
```

### 2.2 Create `/lib/agent/commissions.ts`
```typescript
// Calculate commission for order
export async function calculateAgentCommission(orderId: string, agentId: string): Promise<number>

// Get fixer registration bonus tier
export async function getFixerBonusTier(fixerCount: number): Promise<number>

// Record order commission
export async function recordOrderCommission(orderId: string, agentId: string, amount: number): Promise<void>

// Record fixer registration bonus
export async function recordFixerBonus(agentFixerId: string, orderId: string): Promise<void>

// Pay agent commissions (add to purse)
export async function payAgentCommission(commissionId: string): Promise<void>
```

### 2.3 Create `/lib/agent/vetting.ts`
```typescript
// Get fixers pending vetting for agent
export async function getPendingFixersForVetting(agentId: string)

// Vet fixer (approve/reject)
export async function vetFixer(agentFixerId: string, approved: boolean, notes?: string)

// Notify admin of vetted fixer
async function notifyAdminFixerVetted(fixerId: string, agentId: string)
```

### 2.4 Update `/lib/purse.ts`
Add agent purse support (agents get their own purse for commission withdrawals)

---

## 🎯 Phase 3: API Routes - Agent Operations

### 3.1 Agent Registration & Profile
**`/api/agent/register/route.ts`** (POST)
- Validate user is CLIENT or FIXER
- Create Agent record with PENDING status
- Notify admins of new application
- Return success

**`/api/agent/profile/route.ts`** (GET/PUT)
- GET: Fetch agent profile
- PUT: Update profile (sets pendingChanges=true if already approved)

**`/api/agent/territory/route.ts`** (POST)
- Request neighborhood expansion
- Sets pendingChanges=true
- Notifies admins

### 3.2 Fixer Management
**`/api/agent/fixers/route.ts`** (GET/POST)
- GET: List managed fixers
- POST: Register new fixer on behalf of agent
  - Creates User + FixerProfile + AgentFixer
  - Sets vetStatus=PENDING

**`/api/agent/fixers/[id]/vet/route.ts`** (POST)
- Approve/reject fixer vetting
- Notify admin if approved
- Fixer still needs admin final approval

**`/api/agent/fixers/[id]/route.ts`** (GET)
- Get fixer details for agent

### 3.3 Client Management
**`/api/agent/clients/route.ts`** (GET/POST)
- GET: List managed clients
- POST: Add existing client or register new client

### 3.4 Gig & Quote Management
**`/api/agent/gigs/route.ts`** (POST)
- Validate permissions (agent active, fixer active & managed)
- Create gig on behalf of fixer
- Record in AgentGig table

**`/api/agent/quotes/route.ts`** (POST)
- Validate permissions + neighborhood
- Submit quote on behalf of fixer
- Record in AgentQuote table

**`/api/agent/requests/route.ts`** (POST)
- Create service request on behalf of managed client
- Record in AgentServiceRequest table

### 3.5 Earnings
**`/api/agent/earnings/route.ts`** (GET)
- List all commissions (paid + unpaid)
- Show total earnings
- Filter by date range

**`/api/agent/earnings/withdraw/route.ts`** (POST)
- Withdraw available balance from agent purse

---

## 🎯 Phase 4: API Routes - Admin Management

**`/api/admin/agents/route.ts`** (GET)
- List all agents with filters (status, pendingChanges)

**`/api/admin/agents/[id]/route.ts`** (GET)
- Get agent details with full relationships

**`/api/admin/agents/[id]/approve/route.ts`** (POST)
- Approve agent application or changes
- Set status=ACTIVE, pendingChanges=false, approvedAt
- Set commission rate
- Notify agent

**`/api/admin/agents/[id]/reject/route.ts`** (POST)
- Reject agent application
- Set status=REJECTED
- Notify agent

**`/api/admin/agents/[id]/suspend/route.ts`** (POST)
- Suspend agent (temporary)
- Set status=SUSPENDED
- Prevent all agent operations

**`/api/admin/agents/[id]/ban/route.ts`** (POST)
- Permanently ban agent
- Set status=BANNED

**`/api/admin/agents/[id]/approve-changes/route.ts`** (POST)
- Approve neighborhood/profile changes
- Set pendingChanges=false

**`/api/admin/agents/[id]/commission/route.ts`** (PUT)
- Update agent commission rate

---

## 🎯 Phase 5: Frontend - Agent Dashboard

### 5.1 Registration
**`/agent/register/page.tsx`**
- Check prerequisite (must be CLIENT or FIXER)
- Form: business info, requested neighborhoods
- Submit application

### 5.2 Main Dashboard
**`/agent/dashboard/page.tsx`**
- Overview cards:
  - Total fixers (active/pending vetting/pending admin)
  - Total clients
  - Earnings this month
  - Pending actions
- Quick links to sections

### 5.3 Fixer Management
**`/agent/fixers/page.tsx`**
- List all managed fixers
- Tabs: All, Pending Vetting, Pending Admin, Active
- Actions: View, Vet

**`/agent/fixers/new/page.tsx`**
- Form to register new fixer
- Auto-creates AgentFixer link

**`/agent/fixers/[id]/page.tsx`**
- Fixer detail view
- Vetting form (if pending)
- View profile, services, gigs, quotes

**`/agent/fixers/[id]/gig/new/page.tsx`**
- Create gig on behalf of fixer

### 5.4 Client Management
**`/agent/clients/page.tsx`**
- List managed clients
- Add client button

**`/agent/clients/new/page.tsx`**
- Add existing client or register new

**`/agent/clients/[id]/request/new/page.tsx`**
- Post service request on behalf of client

### 5.5 Quotes & Requests
**`/agent/requests/page.tsx`**
- Browse service requests in agent's neighborhoods
- Filter by neighborhood, category
- "Submit Quote" button

**`/agent/requests/[id]/quote/page.tsx`**
- Submit quote on behalf of managed fixer
- Select fixer from dropdown

### 5.6 Earnings
**`/agent/earnings/page.tsx`**
- Purse balance display
- Commission history table
- Filter by type (order commission, fixer bonus)
- Withdraw button

### 5.7 Territory & Profile
**`/agent/territory/page.tsx`**
- List approved neighborhoods
- Request new neighborhoods (triggers re-approval)
- Show pending requests

**`/agent/profile/page.tsx`**
- Edit business info
- View approval history

---

## 🎯 Phase 6: Frontend - Admin Pages

**`/admin/agents/page.tsx`**
- List all agents
- Filters: status, pendingChanges
- Search by name, business name
- Quick actions: Approve, Reject, Suspend

**`/admin/agents/[id]/page.tsx`**
- Agent detail view
- Profile information
- Approved neighborhoods (map view?)
- Pending neighborhood requests
- Managed fixers/clients count
- Commission settings
- Earnings summary
- Action buttons:
  - Approve/Reject (if PENDING)
  - Approve Changes (if pendingChanges=true)
  - Suspend/Unsuspend
  - Ban
  - Edit Commission Rate

---

## 🎯 Phase 7: Middleware & Auth Updates

### 7.1 Update Middleware
**`/middleware.ts`**
- Add agent route protection:
```typescript
if (pathname.startsWith('/agent')) {
  // Check if user has agent profile
  // Redirect if no agent profile or agent not active
}
```

### 7.2 Update Auth Functions
**`/lib/auth.ts`**
- Add `getAgentProfile()` helper
- Add `hasActiveAgentProfile()` check

### 7.3 Update JWT Payload
**`/lib/auth-jwt.ts`**
```typescript
export interface JWTPayload {
  // ... existing
  hasAgentProfile?: boolean;
  agentStatus?: string;
}
```

---

## 🎯 Phase 8: Business Logic Hooks

### 8.1 Order Settlement Hook
**Update `/app/api/admin/orders/[orderId]/settle/route.ts`**
- After releasing payout to fixer, check if order involves agent-managed fixer
- Calculate and record agent commission
- If fixer's first completed order, pay registration bonus

### 8.2 Fixer Registration Hook
**Update `/app/api/fixer/profile/route.ts`**
- Check if fixer is agent-managed
- If yes, set status to trigger agent vetting first

### 8.3 Gig/Quote Creation Tracking
- Track agent involvement in AgentGig/AgentQuote tables
- Use for commission calculation

---

## 🎯 Phase 9: Notifications & Emails

### 9.1 Agent Notifications
- Application submitted
- Application approved
- Application rejected
- Commission earned
- Fixer needs vetting
- Territory change approved

### 9.2 Admin Notifications
- New agent application
- Agent profile changes pending
- Fixer vetted by agent (ready for final approval)

### 9.3 Email Templates
Create in `/lib/email.ts`:
- `sendAgentApplicationEmail()`
- `sendAgentApprovalEmail()`
- `sendAgentRejectionEmail()`
- `sendAgentCommissionEmail()`

---

## 🎯 Phase 10: Components

**`/components/agent/AgentStatusBadge.tsx`**
- Display agent status with colors

**`/components/agent/FixerVettingForm.tsx`**
- Form to approve/reject fixer vetting

**`/components/agent/CommissionCard.tsx`**
- Display commission details

**`/components/agent/TerritorySelector.tsx`**
- Multi-select neighborhoods with map

**`/components/agent/FixerSelectorDropdown.tsx`**
- Dropdown to select managed fixer

---

## 🎯 Phase 11: Testing & Validation

### 11.1 Unit Tests
- Permission checks
- Commission calculations
- Vetting workflow
- Territory validation

### 11.2 Integration Tests
- Agent registration flow
- Fixer registration via agent
- Quote submission via agent
- Commission payment on order settlement

### 11.3 Manual Testing Scenarios
1. User registers as agent → pending → admin approves
2. Agent registers fixer → vets fixer → admin approves
3. Agent posts gig for fixer → gig gets orders
4. Agent submits quote → quote accepted → order completed → commission paid
5. Agent requests new neighborhood → admin approves
6. Agent suspended → all operations blocked
7. Fixer completes first order → registration bonus paid

---

## 📂 File Structure Summary

```
/prisma
  schema.prisma (updated)

/lib
  /agent
    permissions.ts
    commissions.ts
    vetting.ts
    helpers.ts
  auth.ts (updated)
  auth-jwt.ts (updated)
  purse.ts (updated)
  purse-transactions.ts (updated)
  email.ts (updated)

/app
  /agent
    /register/page.tsx
    /dashboard/page.tsx
    /fixers/page.tsx
    /fixers/new/page.tsx
    /fixers/[id]/page.tsx
    /fixers/[id]/gig/new/page.tsx
    /clients/page.tsx
    /clients/new/page.tsx
    /clients/[id]/request/new/page.tsx
    /requests/page.tsx
    /requests/[id]/quote/page.tsx
    /earnings/page.tsx
    /territory/page.tsx
    /profile/page.tsx

  /admin
    /agents/page.tsx
    /agents/[id]/page.tsx

  /api
    /agent
      /register/route.ts
      /profile/route.ts
      /territory/route.ts
      /fixers/route.ts
      /fixers/[id]/route.ts
      /fixers/[id]/vet/route.ts
      /clients/route.ts
      /gigs/route.ts
      /quotes/route.ts
      /requests/route.ts
      /earnings/route.ts
      /earnings/withdraw/route.ts

    /admin
      /agents/route.ts
      /agents/[id]/route.ts
      /agents/[id]/approve/route.ts
      /agents/[id]/reject/route.ts
      /agents/[id]/suspend/route.ts
      /agents/[id]/ban/route.ts
      /agents/[id]/approve-changes/route.ts
      /agents/[id]/commission/route.ts

/components
  /agent
    AgentStatusBadge.tsx
    FixerVettingForm.tsx
    CommissionCard.tsx
    TerritorySelector.tsx
    FixerSelectorDropdown.tsx

middleware.ts (updated)
```

---

## 🚀 Implementation Order

**Week 1: Foundation**
- Phase 1: Database schema & migrations
- Phase 2: Core library functions
- Phase 7: Middleware & auth updates

**Week 2: Backend**
- Phase 3: Agent API routes
- Phase 4: Admin API routes
- Phase 8: Business logic hooks

**Week 3: Frontend - Agent**
- Phase 5: Agent dashboard & pages

**Week 4: Frontend - Admin & Polish**
- Phase 6: Admin agent management
- Phase 9: Notifications & emails
- Phase 10: Reusable components

**Week 5: Testing & Launch**
- Phase 11: Testing & validation
- Bug fixes
- Documentation
- Production deployment

---

## ✅ Success Criteria

1. ✅ User (CLIENT or FIXER) can register as agent
2. ✅ Admin can approve/reject agent applications
3. ✅ Agent can register new fixers
4. ✅ Agent can vet fixers before admin approval
5. ✅ Agent can post gigs on behalf of active fixers
6. ✅ Agent can submit quotes on behalf of active fixers
7. ✅ Agent can post service requests on behalf of clients
8. ✅ Commissions calculated and paid correctly
9. ✅ Fixer registration bonus paid on first order
10. ✅ Territory restrictions enforced
11. ✅ Suspended agents cannot perform operations
12. ✅ Profile changes trigger re-approval
13. ✅ All data properly tracked for reporting

---

## 📝 Notes

- Agent system is completely separate from existing Client/Fixer workflows
- No changes to existing User roles (CLIENT, FIXER, ADMIN remain unchanged)
- Agent profile is optional 1-to-1 relationship with User
- Commission calculations leverage existing Purse system
- All agent operations require ACTIVE status check
- Territory restrictions use existing Neighborhood model
- Approval workflow follows same pattern as Fixer approval

This plan maintains clean separation while enabling powerful agent functionality!
