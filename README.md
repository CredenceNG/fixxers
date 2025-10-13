# Fixxers - Local Services Marketplace

A Next.js application connecting clients with local service providers for home repairs, maintenance, and more. Think Fiverr, but for local services.

## Features

### ✅ Implemented
- 🔐 **Magic Link Authentication** - Passwordless login via email or phone (JWT-based)
- 👥 **Multi-Role System** - Client, Fixer, and Admin roles with separate dashboards
- 🛍️ **Gig Marketplace** - Browse and purchase service packages (Basic/Standard/Premium tiers)
- 🔍 **Advanced Search** - PostgreSQL full-text search with word stemming and relevance ranking
- 📦 **Order Management** - Complete order lifecycle (PENDING → IN_PROGRESS → DELIVERED → COMPLETED)
- ✅ **Admin Approval System** - Review and approve fixers and service offers before going live
- 🎨 **Fiverr-inspired Design** - Clean, modern UI with Fiverr green (#1DBF73) theme
- 📊 **Dashboards** - Role-specific dashboards for Clients, Fixers, and Admins
- 🔄 **Tab Reuse** - Magic links reuse existing browser tabs instead of opening new ones
- 📱 **Sticky Navigation** - Persistent header with logout across all pages

### 🚧 Planned
- 💰 **Secure Payments** - Stripe integration with escrow system
- 🤖 **AI-Powered** - Smart matching, fraud detection, and price suggestions
- 💬 **Real-time Chat** - Direct communication between clients and fixers
- ⭐ **Review System** - Bidirectional ratings and reviews
- 📸 **File Uploads** - Photos for service requests and certifications

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Neon (Serverless PostgreSQL) + Prisma ORM
- **Authentication:** JWT with magic links
- **Payments:** Stripe
- **Email:** Resend
- **SMS:** Twilio
- **AI:** OpenAI API
- **Real-time:** Pusher
- **File Upload:** UploadThing
- **UI:** Tailwind CSS
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Neon database account
- Stripe account
- Resend account
- Twilio account (for SMS)
- OpenAI API key
- Pusher account
- UploadThing account

### Installation

1. **Clone the repository** (if applicable) or use the current directory

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy the `.env.example` file to `.env` and fill in your credentials:

   ```bash
   cp .env.example .env
   ```

   Required environment variables:

   - `DATABASE_URL` - Your Neon database connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `RESEND_API_KEY` - Resend API key for emails
   - `RESEND_FROM_EMAIL` - Sender email address
   - `TWILIO_ACCOUNT_SID` - Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Twilio auth token
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number
   - `STRIPE_SECRET_KEY` - Stripe secret key
   - `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
   - `OPENAI_API_KEY` - OpenAI API key
   - `NEXT_PUBLIC_PUSHER_APP_KEY` - Pusher app key
   - `PUSHER_APP_ID` - Pusher app ID
   - `PUSHER_SECRET` - Pusher secret
   - `NEXT_PUBLIC_PUSHER_CLUSTER` - Pusher cluster
   - `UPLOADTHING_SECRET` - UploadThing secret
   - `UPLOADTHING_APP_ID` - UploadThing app ID
   - `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for local)
   - `PLATFORM_FEE_PERCENTAGE` - Platform fee percentage (default: 10)

4. **Set up the database:**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push the schema to your database
   npm run db:push

   # Seed the database with initial data
   npm run db:seed
   ```

   This will create:
   - An admin user with email: `admin@fixxers.com`
   - Sample neighborhoods (Lagos, Nigeria)
   - Service categories and subcategories
   - Platform settings

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── gigs/              # Gig CRUD operations
│   │   ├── admin/             # Admin operations (approve/reject)
│   │   └── fixer/             # Fixer operations (gigs, orders)
│   ├── auth/                  # Auth pages (login, register)
│   ├── client/                # Client dashboard
│   │   └── dashboard/         # Client dashboard page
│   ├── fixer/                 # Fixer dashboard
│   │   ├── dashboard/         # Fixer dashboard page
│   │   ├── gigs/              # Manage gigs (create, edit, pause)
│   │   └── orders/            # Manage orders (view, start, deliver)
│   ├── admin/                 # Admin dashboard
│   │   ├── dashboard/         # Admin overview with pending items
│   │   ├── gigs/              # Review and approve gigs
│   │   └── users/             # Review and approve fixers
│   ├── gigs/                  # Public gig browsing and search
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout with footer
│   └── page.tsx               # Homepage with hero, search, featured services
├── components/
│   ├── DashboardLayout.tsx             # Dashboard layout components
│   ├── DashboardLayoutWithHeader.tsx   # Layout with sticky header
│   ├── Header.tsx                      # Sticky navigation header
│   ├── LogoutButton.tsx                # Client-side logout
│   ├── SearchBar.tsx                   # Search functionality
│   ├── GigActions.tsx                  # Pause/activate gigs
│   ├── OrderActions.tsx                # Order management actions
│   └── GigApprovalActions.tsx          # Admin approval actions
├── lib/
│   ├── auth.ts                # Authentication utilities
│   ├── email.ts               # Email utilities (Resend)
│   ├── sms.ts                 # SMS utilities (Twilio)
│   ├── theme.ts               # Fiverr color scheme and styles
│   └── prisma.ts              # Prisma client
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── middleware.ts              # Auth & RBAC middleware
└── .env                       # Environment variables
```

## User Roles & Workflows

### Client
- Browse service marketplace with search and filters
- View gig details with pricing packages (Basic/Standard/Premium)
- Purchase gigs and place orders
- View order status and delivery
- Access dashboard to manage orders
- *(Planned: Make payments, chat with fixers, submit reviews)*

### Fixer (Service Provider)
**Application Process:**
1. Register as a fixer
2. Complete profile (bio, skills, location, years of service)
3. Wait for admin approval
4. Once approved (status: ACTIVE), can create gigs

**Gig Management:**
- Create service offers with 3 pricing tiers
- Set delivery time, revisions, and features per package
- Submit gigs for admin review (status: PENDING_REVIEW)
- Once approved, gigs go live (status: ACTIVE)
- Can pause/activate or edit existing gigs
- Edits require re-approval for active gigs

**Order Management:**
- View all orders in dashboard with stats
- Start working on pending orders (PENDING → IN_PROGRESS)
- Deliver completed work with notes (IN_PROGRESS → DELIVERED)
- Track order timeline and buyer information

### Admin
**Fixer Approval:**
- Review pending fixer applications
- View full profile, qualifications, location, and services
- Approve or reject applications with reasons

**Gig Approval:**
- Review pending service offers
- View complete gig details, packages, and fixer info
- Approve (makes gig live) or reject (returns to draft)

**Dashboard Overview:**
- Alert badges for pending items requiring action
- Stats: total users, active fixers, orders, platform earnings
- Quick access to pending fixers and gigs
- View recent users and service requests

## Key Workflows

### Authentication Flow
1. User enters email or phone number
2. System generates a magic link (JWT token, 15-minute expiry)
3. Link is sent via email (Resend) or SMS (Twilio)
4. User clicks link - **reuses existing browser tab** (via `window.name`)
5. System creates session (7-day expiry)
6. User is redirected to appropriate dashboard

### Gig Creation & Approval Flow
1. Fixer creates gig with title, description, category, tags
2. Sets up 3 packages (Basic/Standard/Premium) with price, delivery time, revisions, features
3. Submits for review (status: PENDING_REVIEW)
4. Admin receives alert on dashboard
5. Admin reviews gig details and fixer profile
6. Admin approves → status: ACTIVE (live on marketplace)
7. Admin rejects → status: DRAFT (fixer can revise)

### Order Flow
1. Client browses marketplace, finds a gig
2. Selects package and places order (status: PENDING)
3. Fixer receives order notification on dashboard
4. Fixer starts work (status: IN_PROGRESS)
5. Fixer delivers work with notes (status: DELIVERED)
6. *(Planned: Client accepts delivery → status: COMPLETED)*

### Search Flow
1. Client enters search query (e.g., "repairs", "plumbing")
2. PostgreSQL full-text search with `to_tsvector` and `plainto_tsquery`
3. Handles word variations (repairs → repair, leaked → leak)
4. Results ranked by `ts_rank` relevance, then orders, then date
5. Displays matching gigs with pagination

## Database Schema Highlights

### Key Models
- **User** - Multi-role (CLIENT, FIXER, ADMIN) with status (PENDING, ACTIVE, SUSPENDED)
- **FixerProfile** - Bio, skills, location, years of service, pendingChanges flag
- **Gig** - Service offers with status (DRAFT, PENDING_REVIEW, ACTIVE, PAUSED, DELETED)
- **GigPackage** - 3 tiers per gig with price, delivery time, revisions, features
- **GigOrder** - Orders with status (PENDING, IN_PROGRESS, DELIVERED, COMPLETED, CANCELLED)

### Status Transitions
**Fixer Status:**
- PENDING → ACTIVE (admin approval)
- PENDING → REJECTED (admin rejection)

**Gig Status:**
- PENDING_REVIEW → ACTIVE (admin approval)
- PENDING_REVIEW → DRAFT (admin rejection or fixer edit)
- ACTIVE ↔ PAUSED (fixer control)

**Order Status:**
- PENDING → IN_PROGRESS (fixer starts)
- IN_PROGRESS → DELIVERED (fixer delivers)
- DELIVERED → COMPLETED (client accepts)

## Next Steps

### High Priority
- [ ] Implement Stripe payment integration
- [ ] Add payment flow to gig purchase
- [ ] Client order acceptance and payment release
- [ ] Email notifications for status changes
- [ ] File upload for gig images and order deliverables

### Medium Priority
- [ ] Build real-time chat between clients and fixers
- [ ] Review and rating system
- [ ] Dispute resolution workflow
- [ ] Enhanced search filters (price range, delivery time, category)
- [ ] Fixer portfolio/showcase

### Low Priority
- [ ] AI matching algorithm
- [ ] Fraud detection
- [ ] Price suggestion AI
- [ ] Advanced analytics dashboard
- [ ] Mobile app

## Contributing

This is a custom-built application. For any questions or issues, please contact the development team.

## License

ISC
