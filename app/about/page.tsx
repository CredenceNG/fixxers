import Link from 'next/link';
import { colors, borderRadius, spacing } from '@/lib/theme';

export const metadata = {
  title: 'About Us - Fixers',
  description: 'Learn about Fixers, Nigeria\'s leading marketplace connecting skilled service providers with customers who need their expertise.',
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <header style={{ backgroundColor: colors.white, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: `${spacing.lg} ${spacing.xl}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, textDecoration: 'none' }}>
            Fixers
          </Link>
          <Link href="/" style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ backgroundColor: colors.primary, color: colors.white, padding: `${spacing.xxxl} ${spacing.xl}`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: spacing.lg }}>About Fixers</h1>
          <p style={{ fontSize: '20px', lineHeight: '1.6', opacity: 0.9 }}>
            Nigeria's trusted marketplace connecting skilled service providers with customers who need their expertise.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: `${spacing.xxxl} ${spacing.xl}` }}>
        {/* Our Story */}
        <section style={{ marginBottom: spacing.xxxl }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xl }}>
            Our Story
          </h2>
          <div style={{ fontSize: '16px', lineHeight: '1.8', color: colors.textSecondary }}>
            <p style={{ marginBottom: spacing.lg }}>
              Fixers was born from a simple observation: finding reliable, skilled service providers in Nigeria is often a challenge. Whether you need a plumber, electrician, carpenter, or any other professional service, the process of finding trustworthy experts can be time-consuming and uncertain.
            </p>
            <p style={{ marginBottom: spacing.lg }}>
              We set out to change that by creating a platform that makes it easy for customers to connect with verified service providers, while giving skilled professionals a platform to grow their businesses and reach more clients.
            </p>
            <p>
              Today, Fixers is helping thousands of Nigerians get quality services completed efficiently, while empowering service providers to build sustainable businesses.
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section style={{ marginBottom: spacing.xxxl, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.xl }}>
          <div style={{ backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', marginBottom: spacing.md }}>🎯</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              Our Mission
            </h3>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: colors.textSecondary }}>
              To make quality services accessible to everyone in Nigeria by connecting skilled professionals with customers through a trusted, transparent, and efficient platform.
            </p>
          </div>

          <div style={{ backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '36px', marginBottom: spacing.md }}>🚀</div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              Our Vision
            </h3>
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: colors.textSecondary }}>
              To become Nigeria's most trusted services marketplace, where every service provider has the opportunity to succeed, and every customer receives exceptional service.
            </p>
          </div>
        </section>

        {/* What We Do */}
        <section style={{ marginBottom: spacing.xxxl }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xl }}>
            What We Do
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing.lg }}>
            {[
              {
                icon: '👥',
                title: 'Connect People',
                description: 'We bridge the gap between customers who need services and skilled professionals ready to deliver quality work.'
              },
              {
                icon: '✅',
                title: 'Build Trust',
                description: 'Our verification system, reviews, and secure payment system ensure safe and reliable transactions for everyone.'
              },
              {
                icon: '💼',
                title: 'Empower Professionals',
                description: 'We provide service providers with tools to showcase their skills, manage jobs, and grow their businesses.'
              },
              {
                icon: '🔒',
                title: 'Ensure Quality',
                description: 'Our escrow payment system and review mechanism ensure customers get the quality service they deserve.'
              }
            ].map((item, index) => (
              <div key={index} style={{ backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.md, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '40px', marginBottom: spacing.md }}>{item.icon}</div>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: colors.textSecondary }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section style={{ marginBottom: spacing.xxxl, backgroundColor: colors.bgSecondary, padding: spacing.xl, borderRadius: borderRadius.lg }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xl, textAlign: 'center' }}>
            Why Choose Fixers?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.lg }}>
            {[
              { icon: '🛡️', title: 'Verified Professionals', description: 'All service providers are vetted and verified' },
              { icon: '⭐', title: 'Real Reviews', description: 'Honest ratings and reviews from real customers' },
              { icon: '💳', title: 'Secure Payments', description: 'Safe escrow system protects your money' },
              { icon: '⚡', title: 'Fast Matching', description: 'Get connected with experts quickly' },
              { icon: '💬', title: 'Direct Communication', description: 'Chat directly with service providers' },
              { icon: '📱', title: 'Easy to Use', description: 'Simple platform for everyone' }
            ].map((item, index) => (
              <div key={index} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: spacing.sm }}>{item.icon}</div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ textAlign: 'center', backgroundColor: colors.white, padding: spacing.xxl, borderRadius: borderRadius.lg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: spacing.xl }}>
            Join thousands of satisfied customers and service providers on Fixers today.
          </p>
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/auth/register"
              style={{
                display: 'inline-block',
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.primary,
                color: colors.white,
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: borderRadius.md,
                textDecoration: 'none',
                transition: 'opacity 0.2s'
              }}
            >
              Sign Up as Customer
            </Link>
            <Link
              href="/auth/register"
              style={{
                display: 'inline-block',
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.white,
                color: colors.primary,
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: borderRadius.md,
                textDecoration: 'none',
                border: `2px solid ${colors.primary}`,
                transition: 'opacity 0.2s'
              }}
            >
              Become a Service Provider
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.border}`, padding: `${spacing.xl} ${spacing.lg}`, marginTop: spacing.xxxl }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
          <p>© {new Date().getFullYear()} Fixers. All rights reserved.</p>
          <div style={{ marginTop: spacing.md, display: 'flex', gap: spacing.lg, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/faq" style={{ color: colors.textSecondary, textDecoration: 'none' }}>FAQ</Link>
            <Link href="/how-it-works" style={{ color: colors.textSecondary, textDecoration: 'none' }}>How It Works</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
