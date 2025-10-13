'use client';

import { useState } from 'react';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

interface Gig {
  id: string;
  title: string;
  slug: string;
  images: string[];
  seller: {
    name: string | null;
  };
  packages: {
    price: number;
  }[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  gigs: Gig[];
}

export function PopularCategories({ categories }: { categories: Category[] }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
      {categories.map((category) => (
        <div key={category.id}>
          <div
            onClick={() => toggleCategory(category.id)}
            style={{
              backgroundColor: category.color,
              borderRadius: borderRadius.lg,
              padding: '32px 20px',
              textAlign: 'center',
              border: `1px solid ${colors.borderLight}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              transform: expandedCategory === category.id ? 'scale(1.02)' : 'scale(1)',
              boxShadow: expandedCategory === category.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>{category.icon}</div>
            <div style={{ fontWeight: '600', color: colors.textPrimary, fontSize: '16px', marginBottom: '8px' }}>
              {category.name}
            </div>
            <div style={{ fontSize: '13px', color: colors.textSecondary }}>
              {category.gigs.length} service{category.gigs.length !== 1 ? 's' : ''}
            </div>
            {category.gigs.length > 0 && (
              <div style={{ fontSize: '12px', color: colors.primary, fontWeight: '600', marginTop: '8px' }}>
                {expandedCategory === category.id ? '▲ Hide' : '▼ View'}
              </div>
            )}
          </div>

          {/* Expanded Gigs Section */}
          {expandedCategory === category.id && category.gigs.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.lg,
                padding: '20px',
                animation: 'slideDown 0.3s ease-out',
              }}
            >
              <h4
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '16px',
                }}
              >
                Available Services
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {category.gigs.slice(0, 5).map((gig) => {
                  const startingPrice = gig.packages[0]?.price || 0;
                  return (
                    <Link
                      key={gig.id}
                      href={`/gigs/${gig.slug}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: colors.bgSecondary,
                        borderRadius: borderRadius.md,
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgTertiary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bgSecondary;
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            marginBottom: '4px',
                          }}
                        >
                          {gig.title}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          by {gig.seller.name || 'Anonymous'}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: colors.primary,
                        }}
                      >
                        ₦{startingPrice.toLocaleString()}
                      </div>
                    </Link>
                  );
                })}
              </div>
              {category.gigs.length > 5 && (
                <Link
                  href={`/gigs?category=${category.id}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    marginTop: '12px',
                    padding: '10px',
                    color: colors.primary,
                    fontWeight: '600',
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  View all {category.gigs.length} services →
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
