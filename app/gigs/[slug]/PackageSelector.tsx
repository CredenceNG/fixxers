'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  features: string[];
};

export function PackageSelector({
  packages,
  gigSlug,
  isLoggedIn,
  isOwnGig,
}: {
  packages: Package[];
  gigSlug: string;
  isLoggedIn: boolean;
  isOwnGig: boolean;
}) {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(1); // Default to Standard (middle)

  const selectedPackage = packages[selectedIndex];

  const handleOrder = () => {
    const packageName = selectedPackage.name.toLowerCase();
    router.push(`/gigs/${gigSlug}/order?package=${packageName}`);
  };

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Package Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${colors.border}` }}>
        {packages.map((pkg, index) => (
          <button
            key={pkg.id}
            onClick={() => setSelectedIndex(index)}
            style={{
              flex: 1,
              padding: '16px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              color: selectedIndex === index ? colors.primary : colors.textSecondary,
              backgroundColor: selectedIndex === index ? colors.primaryLight : colors.white,
              cursor: 'pointer',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: selectedIndex === index ? `2px solid ${colors.primary}` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {pkg.name}
          </button>
        ))}
      </div>

      {/* Selected Package Details */}
      {selectedPackage && (
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
              {selectedPackage.description}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
              ₦{selectedPackage.price.toLocaleString()}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '20px' }}>
            <div style={{ color: colors.textSecondary }}>
              ⏱️ {selectedPackage.deliveryDays} days delivery
            </div>
            <div style={{ color: colors.textSecondary }}>
              🔄 {selectedPackage.revisions === -1 ? 'Unlimited' : selectedPackage.revisions} revisions
            </div>
          </div>

          {/* Features */}
          <div style={{ marginBottom: '24px' }}>
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

          {/* Order Button */}
          {isOwnGig ? (
            <div
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: colors.bgSecondary,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '16px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              This is your own service
            </div>
          ) : isLoggedIn ? (
            <button
              onClick={handleOrder}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Continue (₦{selectedPackage.price.toLocaleString()})
            </button>
          ) : (
            <Link
              href={`/auth/login?redirect=/gigs/${gigSlug}`}
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Sign in to Order
            </Link>
          )}
        </div>
      )}

      {/* Compare Packages */}
      <div style={{ padding: '16px', borderTop: `1px solid ${colors.border}`, textAlign: 'center' }}>
        <button
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.primary,
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Compare Packages
        </button>
      </div>
    </div>
  );
}
