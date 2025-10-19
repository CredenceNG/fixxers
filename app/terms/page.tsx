import Link from 'next/link';
import { colors, borderRadius, spacing } from '@/lib/theme';

export const metadata = {
  title: 'Terms of Service - Fixers',
  description: 'Terms of Service for Fixers marketplace platform.',
};

export default function TermsPage() {
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

      {/* Hero */}
      <section style={{ backgroundColor: colors.primary, color: colors.white, padding: `${spacing['3xl']} ${spacing.xl}`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: spacing.md }}>Terms of Service</h1>
          <p style={{ fontSize: '16px', opacity: 0.9 }}>Last Updated: October 19, 2025</p>
        </div>
      </section>

      {/* Content */}
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: `${spacing['3xl']} ${spacing.xl}` }}>
        <div style={{ backgroundColor: colors.white, padding: spacing['2xl'], borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

          {/* Introduction */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              1. Introduction
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              Welcome to Fixers. These Terms of Service ("Terms") govern your access to and use of the Fixers platform, website, and services (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>

          {/* Definitions */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              2. Definitions
            </h2>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl }}>
              <li style={{ marginBottom: spacing.sm }}><strong>"Platform"</strong> refers to the Fixers website and mobile applications.</li>
              <li style={{ marginBottom: spacing.sm }}><strong>"Customer"</strong> refers to users who request services through the Platform.</li>
              <li style={{ marginBottom: spacing.sm }}><strong>"Service Provider"</strong> or <strong>"Fixer"</strong> refers to professionals who offer services through the Platform.</li>
              <li style={{ marginBottom: spacing.sm }}><strong>"User"</strong> refers to any person using the Platform, whether as a Customer or Service Provider.</li>
              <li style={{ marginBottom: spacing.sm }}><strong>"Service Request"</strong> refers to a request for services posted by a Customer.</li>
              <li style={{ marginBottom: spacing.sm }}><strong>"Order"</strong> refers to an accepted quote or gig purchase between a Customer and Service Provider.</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              3. Eligibility
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              To use our Services, you must:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl }}>
              <li style={{ marginBottom: spacing.sm }}>Be at least 18 years of age</li>
              <li style={{ marginBottom: spacing.sm }}>Have the legal capacity to enter into binding contracts</li>
              <li style={{ marginBottom: spacing.sm }}>Provide accurate and complete registration information</li>
              <li style={{ marginBottom: spacing.sm }}>Not have been previously suspended or banned from the Platform</li>
            </ul>
          </section>

          {/* User Accounts */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              4. User Accounts
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>4.1 Account Creation:</strong> You must create an account to use most features of our Platform. You agree to provide accurate, current, and complete information.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>4.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              <strong>4.3 Account Termination:</strong> We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent or illegal activities.
            </p>
          </section>

          {/* Service Provider Terms */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              5. Service Provider Terms
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>5.1 Qualifications:</strong> Service Providers represent that they have the necessary skills, licenses, and insurance required to perform the services they offer.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>5.2 Service Quality:</strong> Service Providers agree to perform services with reasonable care and skill, in accordance with industry standards.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              <strong>5.3 Compliance:</strong> Service Providers must comply with all applicable laws, regulations, and professional standards in performing services.
            </p>
          </section>

          {/* Payments and Fees */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              6. Payments and Fees
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>6.1 Platform Fees:</strong> Fixers charges a service fee on completed transactions. The current platform fee is 10% of the transaction value.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>6.2 Payment Processing:</strong> All payments are processed through our secure payment partners (Stripe and Paystack).
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>6.3 Escrow System:</strong> Customer payments are held in escrow until the service is completed and approved.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              <strong>6.4 Refunds:</strong> Refund requests are handled on a case-by-case basis. See our Refund Policy for details.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              7. Prohibited Activities
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              Users are prohibited from:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl }}>
              <li style={{ marginBottom: spacing.sm }}>Posting false, misleading, or fraudulent information</li>
              <li style={{ marginBottom: spacing.sm }}>Circumventing the Platform to avoid fees</li>
              <li style={{ marginBottom: spacing.sm }}>Harassing, threatening, or abusing other users</li>
              <li style={{ marginBottom: spacing.sm }}>Violating any applicable laws or regulations</li>
              <li style={{ marginBottom: spacing.sm }}>Using automated systems to scrape or access the Platform</li>
              <li style={{ marginBottom: spacing.sm }}>Attempting to gain unauthorized access to the Platform</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              8. Intellectual Property
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              All content on the Platform, including text, graphics, logos, and software, is the property of Fixers or its licensors and is protected by copyright and other intellectual property laws.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              You may not copy, modify, distribute, or create derivative works from our content without explicit permission.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              9. Limitation of Liability
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>9.1 Platform Role:</strong> Fixers is a marketplace platform that connects Customers with Service Providers. We are not responsible for the quality, safety, or legality of services provided.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>9.2 Disclaimer:</strong> The Services are provided "as is" without warranties of any kind, either express or implied.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              <strong>9.3 Damages:</strong> To the maximum extent permitted by law, Fixers shall not be liable for any indirect, incidental, special, or consequential damages.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              10. Dispute Resolution
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              <strong>10.1 Platform Disputes:</strong> Disputes between users should first be reported through our dispute resolution system.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              <strong>10.2 Governing Law:</strong> These Terms are governed by the laws of the Federal Republic of Nigeria.
            </p>
          </section>

          {/* Changes to Terms */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              11. Changes to Terms
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              We reserve the right to modify these Terms at any time. We will notify users of significant changes via email or through the Platform. Continued use of the Services after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              12. Contact Information
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              If you have questions about these Terms, please contact us at:
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginTop: spacing.md }}>
              <strong>Email:</strong> legal@fixers.com<br />
              <strong>Address:</strong> Lagos, Nigeria
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.border}`, padding: `${spacing.xl} ${spacing.lg}`, marginTop: spacing['4xl'] }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
          <p>© {new Date().getFullYear()} Fixers. All rights reserved.</p>
          <div style={{ marginTop: spacing.md, display: 'flex', gap: spacing.lg, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ color: colors.textSecondary, textDecoration: 'none' }}>About</Link>
            <Link href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/faq" style={{ color: colors.textSecondary, textDecoration: 'none' }}>FAQ</Link>
            <Link href="/how-it-works" style={{ color: colors.textSecondary, textDecoration: 'none' }}>How It Works</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
