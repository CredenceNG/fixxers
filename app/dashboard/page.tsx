import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardButton } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import UnifiedDashboard from './UnifiedDashboard';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user roles
  const roles = user.roles || [];

  // Keep admin dashboard separate
  if (roles.includes('ADMIN') && roles.length === 1) {
    redirect('/admin/dashboard');
  }

  // If user only has one role (not admin), redirect to specific dashboard
  if (roles.length === 1) {
    if (roles[0] === 'CLIENT') {
      redirect('/client/dashboard');
    } else if (roles[0] === 'FIXER') {
      redirect('/fixer/dashboard');
    }
  }

  // User has multiple roles - show unified dashboard
  const hasClientRole = roles.includes('CLIENT');
  const hasFixerRole = roles.includes('FIXER');

  // Fetch client data if user has CLIENT role
  let clientData = null;
  if (hasClientRole) {
    const requests = await prisma.serviceRequest.findMany({
      where: { clientId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhood: true,
        quotes: {
          include: {
            fixer: true,
          },
        },
        order: {
          include: {
            payment: true,
            review: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeOrders = await prisma.order.findMany({
      where: {
        clientId: user.id,
        status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
      },
      include: {
        fixer: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        gig: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        package: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedOrders = await prisma.order.findMany({
      where: {
        clientId: user.id,
        status: 'COMPLETED',
      },
      include: {
        fixer: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        gig: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        package: true,
        review: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    const activeGigOrders = activeOrders.filter((o) => o.gigId);

    clientData = {
      requests,
      activeOrders,
      completedOrders,
      stats: {
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => ['PENDING', 'APPROVED'].includes(r.status)).length,
        activeOrders: activeOrders.length + activeGigOrders.length,
        completedOrders: await prisma.order.count({
          where: { clientId: user.id, status: 'COMPLETED' },
        }),
      },
    };
  }

  // Fetch fixer data if user has FIXER role
  let fixerData = null;
  if (hasFixerRole) {
    const fixerProfile = await prisma.fixerProfile.findUnique({
      where: { fixerId: user.id },
    });

    // If no profile, redirect to profile page
    if (!fixerProfile) {
      redirect('/fixer/profile');
    }

    const isApproved = user.status === 'ACTIVE';

    const services = await prisma.fixerService.findMany({
      where: { fixerId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhoods: true,
      },
    });

    const availableRequests = isApproved
      ? await prisma.serviceRequest.findMany({
        where: {
          status: 'APPROVED',
        },
        include: {
          client: true,
          subcategory: {
            include: {
              category: true,
            },
          },
          neighborhood: true,
          quotes: {
            where: { fixerId: user.id },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      : [];

    const inspectionQuotes = await prisma.quote.findMany({
      where: {
        fixerId: user.id,
        type: 'INSPECTION_REQUIRED',
        inspectionFeePaid: true,
        isRevised: false,
        isAccepted: false,
      },
      include: {
        request: {
          include: {
            client: true,
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const quotes = await prisma.quote.findMany({
      where: { fixerId: user.id },
      include: {
        request: {
          include: {
            client: true,
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const activeOrders = await prisma.order.findMany({
      where: {
        fixerId: user.id,
        status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
      },
      include: {
        client: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        gig: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completedOrders = await prisma.order.findMany({
      where: {
        fixerId: user.id,
        status: 'COMPLETED',
      },
      include: {
        client: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        gig: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        review: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    const reviews = await prisma.review.findMany({
      where: { revieweeId: user.id },
      select: { rating: true },
    });
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 'N/A';

    fixerData = {
      services,
      quotes,
      inspectionQuotes,
      availableRequests,
      activeOrders,
      completedOrders,
      isApproved,
      stats: {
        totalServices: services.length,
        pendingQuotes: quotes.filter((q) => !q.isAccepted).length,
        activeOrders: activeOrders.length,
        completedOrders: await prisma.order.count({
          where: { fixerId: user.id, status: 'COMPLETED' },
        }),
      },
      avgRating,
    };
  }

  return (
    <DashboardLayoutWithHeader
      title="Dashboard"
      subtitle={`Welcome back, ${user.name || user.email || user.phone}`}
      actions={
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <PurseBalanceInline />
          {hasClientRole && (
            <>
              <DashboardButton variant="outline" href="/client/profile">
                Edit Profile
              </DashboardButton>
              <DashboardButton href="/client/requests/new">
                + New Request
              </DashboardButton>
            </>
          )}
          {hasFixerRole && (
            <>
              <DashboardButton variant="outline" href="/fixer/gigs">
                📋 My Service Offers
              </DashboardButton>
              <DashboardButton variant="outline" href="/fixer/profile">
                Edit Fixer Profile
              </DashboardButton>
              <DashboardButton href="/fixer/services">
                My Services
              </DashboardButton>
            </>
          )}
          <DashboardButton variant="outline" href="/settings">
            ⚙️ Settings
          </DashboardButton>
          <DashboardButton variant="outline" href="/settings/referral">
            🎁 Referrals
          </DashboardButton>
        </div>
      }
    >
      <UnifiedDashboard
        user={{ id: user.id, name: user.name, email: user.email, phone: user.phone, roles }}
        clientData={clientData}
        fixerData={fixerData}
      />
    </DashboardLayoutWithHeader>
  );
}
