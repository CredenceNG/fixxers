import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import { colors, borderRadius } from '@/lib/theme';
import { OrderForm } from './OrderForm';

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { package?: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/auth/login?redirect=/gigs/${params.slug}/order?package=${searchParams.package || 'standard'}`);
  }

  if (user.role !== 'CLIENT') {
    redirect('/');
  }

  const gig = await prisma.gig.findUnique({
    where: { slug: params.slug },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
      packages: {
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!gig) {
    notFound();
  }

  // Determine which package to show
  const packageParam = searchParams.package?.toLowerCase();
  let selectedPackage = gig.packages[1]; // Default to Standard (middle)

  if (packageParam === 'basic') {
    selectedPackage = gig.packages[0];
  } else if (packageParam === 'premium') {
    selectedPackage = gig.packages[2];
  }

  if (!selectedPackage) {
    notFound();
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary }}>
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '32px' }}>
          Order Details
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
          {/* Left - Order Form */}
          <div>
            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.border}`,
                padding: '32px',
              }}
            >
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
                Requirements
              </h2>

              {gig.requirements.length > 0 ? (
                <>
                  <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px', lineHeight: '1.6' }}>
                    Please provide the following information to help the seller deliver exactly what you need.
                  </p>
                  <OrderForm
                    gigId={gig.id}
                    packageId={selectedPackage.id}
                    requirements={gig.requirements}
                  />
                </>
              ) : (
                <>
                  <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px', lineHeight: '1.6' }}>
                    No specific requirements needed. You can proceed with your order.
                  </p>
                  <OrderForm
                    gigId={gig.id}
                    packageId={selectedPackage.id}
                    requirements={[]}
                  />
                </>
              )}
            </div>
          </div>

          {/* Right - Order Summary */}
          <div>
            <div style={{ position: 'sticky', top: '24px' }}>
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.border}`,
                  padding: '24px',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
                  Order Summary
                </h2>

                {/* Gig Info */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    {gig.title}
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                    by {gig.seller.name}
                  </div>
                </div>

                {/* Package Details */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                    {selectedPackage.name} Package
                  </div>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                    {selectedPackage.description}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⏱️</span>
                      <span style={{ color: colors.textSecondary }}>
                        {selectedPackage.deliveryDays} days delivery
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🔄</span>
                      <span style={{ color: colors.textSecondary }}>
                        {selectedPackage.revisions === -1 ? 'Unlimited' : selectedPackage.revisions} revisions
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ marginTop: '16px' }}>
                    {selectedPackage.features.map((feature, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          color: colors.textPrimary,
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ color: colors.success }}>✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '15px', color: colors.textSecondary }}>Service Price</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                      ₦{selectedPackage.price.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '15px', color: colors.textSecondary }}>Platform Fee (5%)</span>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                      ₦{(selectedPackage.price * 0.05).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>You Pay</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                    ₦{selectedPackage.price.toLocaleString()}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: colors.textSecondary, textAlign: 'right', marginBottom: '8px' }}>
                  Seller receives: ₦{(selectedPackage.price * 0.95).toLocaleString()}
                </div>

                <div style={{ fontSize: '12px', color: colors.textSecondary, textAlign: 'right' }}>
                  Delivery by {new Date(Date.now() + selectedPackage.deliveryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
