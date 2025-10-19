import Link from 'next/link';
import { colors, borderRadius, spacing } from '@/lib/theme';

export const metadata = {
  title: 'How It Works - Fixers',
  description: 'Learn how to use Fixers to hire service providers or offer your services.',
};

export default function HowItWorksPage() {
  const customerSteps = [
    {
      icon: '📝',
      title: 'Post Your Request',
      description: 'Describe the service you need, upload photos, set your budget, and submit your request. It takes less than 2 minutes.'
    },
    {
      icon: '💼',
      title: 'Receive Quotes',
      description: 'Verified service providers review your request and send you quotes. Compare prices, ratings, and reviews to find the best fit.'
    },
    {
      icon: '✅',
      title: 'Choose & Pay',
      description: 'Select your preferred service provider and make a secure payment. Your money is held safely in escrow until the job is done.'
    },
    {
      icon: '🔧',
      title: 'Get It Done',
      description: 'The service provider completes the work. Communicate directly through our platform and track progress in real-time.'
    },
    {
      icon: '⭐',
      title: 'Approve & Review',
      description: 'Review the completed work. Once you approve it, payment is released to the service provider. Leave a rating to help others.'
    },
  ];

  const providerSteps = [
    {
      icon: '📋',
      title: 'Create Your Profile',
      description: 'Sign up and complete your professional profile. Upload your certifications, portfolio, and relevant experience.'
    },
    {
      icon: '✓',
      title: 'Get Verified',
      description: 'Submit your ID and credentials for verification. Our team reviews and approves qualified service providers within 1-3 days.'
    },
    {
      icon: '🔍',
      title: 'Browse Requests',
      description: 'View service requests in your area and categories. Filter by budget, location, and urgency to find jobs that match your skills.'
    },
    {
      icon: '💰',
      title: 'Send Quotes',
      description: 'Submit competitive quotes with detailed breakdowns. Highlight your experience and explain how you\'ll deliver quality work.'
    },
    {
      icon: '🛠️',
      title: 'Complete Jobs',
      description: 'Once hired, deliver excellent service. Update customers on progress and maintain clear communication throughout.'
    },
    {
      icon: '💸',
      title: 'Get Paid',
      description: 'When the customer approves your work, payment is released to your account. Withdraw your earnings anytime via bank transfer.'
    },
  ];

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
      <section style={{ backgroundColor: colors.primary, color: colors.white, padding: `${spacing['4xl']} ${spacing.xl}`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: spacing.lg }}>How Fixers Works</h1>
          <p style={{ fontSize: '20px', lineHeight: '1.6', opacity: 0.9 }}>
            Simple, secure, and efficient. Get quality services or grow your business in just a few steps.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: `${spacing['4xl']} ${spacing.xl}` }}>

        {/* For Customers */}
        <section style={{ marginBottom: spacing['4xl'] }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.md }}>👥</div>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              For Customers
            </h2>
            <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '700px', margin: '0 auto' }}>
              Need something fixed or built? Get connected with verified professionals in minutes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: spacing.xl }}>
            {customerSteps.map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{ backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', border: `2px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.lg }}>
                    <div style={{
                      backgroundColor: colors.primary,
                      color: colors.white,
                      width: '40px',
                      height: '40px',
                      borderRadius: borderRadius.full,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      marginRight: spacing.md
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: '48px' }}>{step.icon}</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: colors.textSecondary }}>
                    {step.description}
                  </p>
                </div>
                {index < customerSteps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '60px',
                      right: '-20px',
                      fontSize: '32px',
                      color: colors.primary,
                      display: 'none',
                    }}
                    className="hidden-mobile"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: spacing['3xl'] }}>
            <Link
              href="/auth/register"
              style={{
                display: 'inline-block',
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.primary,
                color: colors.white,
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: borderRadius.md,
                textDecoration: 'none',
                transition: 'opacity 0.2s'
              }}
            >
              Get Started as Customer
            </Link>
          </div>
        </section>

        {/* Divider */}
        <div style={{ borderTop: `2px solid ${colors.border}`, margin: `${spacing['4xl']} 0` }}></div>

        {/* For Service Providers */}
        <section style={{ marginBottom: spacing['4xl'] }}>
          <div style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
            <div style={{ fontSize: '64px', marginBottom: spacing.md }}>🛠️</div>
            <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              For Service Providers
            </h2>
            <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '700px', margin: '0 auto' }}>
              Grow your business and reach more customers with Fixers' trusted platform.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: spacing.xl }}>
            {providerSteps.map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div style={{ backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: '100%', border: `2px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.lg }}>
                    <div style={{
                      backgroundColor: colors.primary,
                      color: colors.white,
                      width: '40px',
                      height: '40px',
                      borderRadius: borderRadius.full,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      marginRight: spacing.md
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: '48px' }}>{step.icon}</div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: colors.textSecondary }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: spacing['3xl'] }}>
            <Link
              href="/auth/register"
              style={{
                display: 'inline-block',
                padding: `${spacing.md} ${spacing.xl}`,
                backgroundColor: colors.primary,
                color: colors.white,
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: borderRadius.md,
                textDecoration: 'none',
                transition: 'opacity 0.2s'
              }}
            >
              Become a Service Provider
            </Link>
          </div>
        </section>

        {/* Why Choose Fixers */}
        <section style={{ backgroundColor: colors.bgSecondary, padding: spacing['3xl'], borderRadius: borderRadius.lg, marginBottom: spacing['4xl'] }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xl, textAlign: 'center' }}>
            Why Choose Fixers?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.xl }}>
            {[
              { icon: '🔒', title: 'Secure Payments', description: 'Money held safely in escrow until work is approved' },
              { icon: '✓', title: 'Verified Professionals', description: 'All service providers are vetted and verified' },
              { icon: '⭐', title: 'Trusted Reviews', description: 'Real ratings and reviews from actual customers' },
              { icon: '💬', title: 'Direct Communication', description: 'Chat with service providers in real-time' },
              { icon: '⚡', title: 'Fast Matching', description: 'Get quotes from multiple providers quickly' },
              { icon: '🛡️', title: 'Dispute Protection', description: 'Fair resolution process for any issues' },
            ].map((feature, index) => (
              <div key={index} style={{ backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.md, textAlign: 'center' }}>
                <div style={{ fontSize: '56px', marginBottom: spacing.md }}>{feature.icon}</div>
                <h4 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm }}>
                  {feature.title}
                </h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: colors.textSecondary }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ textAlign: 'center', backgroundColor: colors.white, padding: spacing['3xl'], borderRadius: borderRadius.lg, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: spacing.xl }}>
            Join thousands of satisfied users on Fixers today
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
              Sign Up Now
            </Link>
            <Link
              href="/faq"
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
              View FAQs
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.border}`, padding: `${spacing.xl} ${spacing.lg}`, marginTop: spacing['4xl'] }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
          <p>© {new Date().getFullYear()} Fixers. All rights reserved.</p>
          <div style={{ marginTop: spacing.md, display: 'flex', gap: spacing.lg, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ color: colors.textSecondary, textDecoration: 'none' }}>About</Link>
            <Link href="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/faq" style={{ color: colors.textSecondary, textDecoration: 'none' }}>FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
