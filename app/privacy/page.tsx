import Link from 'next/link';
import { colors, borderRadius, spacing } from '@/lib/theme';

export const metadata = {
  title: 'Privacy Policy - Fixers',
  description: 'Learn how Fixers collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
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
          <h1 style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: spacing.md }}>Privacy Policy</h1>
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
              At Fixers, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              By using Fixers, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our Services.
            </p>
          </section>

          {/* Information We Collect */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              2. Information We Collect
            </h2>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              2.1 Personal Information
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              When you register on Fixers, we collect:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl, marginBottom: spacing.md }}>
              <li style={{ marginBottom: spacing.sm }}>Full name and contact information (email address, phone number)</li>
              <li style={{ marginBottom: spacing.sm }}>Account credentials (username and password)</li>
              <li style={{ marginBottom: spacing.sm }}>Profile information (bio, profile photo, service categories)</li>
              <li style={{ marginBottom: spacing.sm }}>Location data (city, state, country)</li>
              <li style={{ marginBottom: spacing.sm }}>Verification documents (for service providers)</li>
            </ul>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              2.2 Usage Information
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We automatically collect information about how you interact with our platform:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl, marginBottom: spacing.md }}>
              <li style={{ marginBottom: spacing.sm }}>Device information (IP address, browser type, operating system)</li>
              <li style={{ marginBottom: spacing.sm }}>Log data (access times, pages viewed, clicks)</li>
              <li style={{ marginBottom: spacing.sm }}>Service requests and quotes submitted</li>
              <li style={{ marginBottom: spacing.sm }}>Messages and communications on the platform</li>
              <li style={{ marginBottom: spacing.sm }}>Reviews and ratings given or received</li>
            </ul>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              2.3 Payment Information
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              Payment processing is handled by our third-party payment processors (Stripe and Paystack). We do not store your complete credit card information. We may collect and store transaction history, payment amounts, and payment status for record-keeping purposes.
            </p>
          </section>

          {/* How We Use Information */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              3. How We Use Your Information
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We use the information we collect to:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl }}>
              <li style={{ marginBottom: spacing.sm }}>Provide, maintain, and improve our Services</li>
              <li style={{ marginBottom: spacing.sm }}>Process transactions and send related information</li>
              <li style={{ marginBottom: spacing.sm }}>Send you technical notices, updates, and support messages</li>
              <li style={{ marginBottom: spacing.sm }}>Respond to your comments, questions, and customer service requests</li>
              <li style={{ marginBottom: spacing.sm }}>Communicate about services, offers, and promotions</li>
              <li style={{ marginBottom: spacing.sm }}>Monitor and analyze usage patterns and trends</li>
              <li style={{ marginBottom: spacing.sm }}>Detect, prevent, and address fraud, security, or technical issues</li>
              <li style={{ marginBottom: spacing.sm }}>Verify service provider credentials and qualifications</li>
              <li style={{ marginBottom: spacing.sm }}>Facilitate communication between customers and service providers</li>
              <li style={{ marginBottom: spacing.sm }}>Personalize your experience and show relevant content</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              4. Data Sharing and Disclosure
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We may share your information in the following circumstances:
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              4.1 With Other Users
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              Your profile information, including name, photo, ratings, and reviews, may be visible to other users. When you submit a service request or accept a job, relevant information is shared with the other party to facilitate the transaction.
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              4.2 With Service Providers
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We share information with third-party service providers who perform services on our behalf, including:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl, marginBottom: spacing.md }}>
              <li style={{ marginBottom: spacing.sm }}>Payment processors (Stripe, Paystack)</li>
              <li style={{ marginBottom: spacing.sm }}>Cloud hosting providers</li>
              <li style={{ marginBottom: spacing.sm }}>Email service providers</li>
              <li style={{ marginBottom: spacing.sm }}>Analytics providers</li>
              <li style={{ marginBottom: spacing.sm }}>Customer support tools</li>
            </ul>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              4.3 Legal Requirements
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We may disclose your information if required by law or in response to valid legal requests, such as subpoenas, court orders, or government investigations.
            </p>

            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.lg }}>
              4.4 Business Transfers
            </h3>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              If Fixers is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your information is transferred and becomes subject to a different privacy policy.
            </p>
          </section>

          {/* Data Security */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              5. Data Security
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl, marginBottom: spacing.md }}>
              <li style={{ marginBottom: spacing.sm }}>Encryption of data in transit and at rest</li>
              <li style={{ marginBottom: spacing.sm }}>Secure password hashing</li>
              <li style={{ marginBottom: spacing.sm }}>Regular security audits and monitoring</li>
              <li style={{ marginBottom: spacing.sm }}>Access controls and authentication</li>
              <li style={{ marginBottom: spacing.sm }}>Secure payment processing through PCI-compliant providers</li>
            </ul>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          {/* User Rights */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              6. Your Rights
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              You have the following rights regarding your personal information:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl }}>
              <li style={{ marginBottom: spacing.sm }}><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li style={{ marginBottom: spacing.sm }}><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li style={{ marginBottom: spacing.sm }}><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
              <li style={{ marginBottom: spacing.sm }}><strong>Data Portability:</strong> Request your data in a structured, machine-readable format</li>
              <li style={{ marginBottom: spacing.sm }}><strong>Objection:</strong> Object to processing of your information for certain purposes</li>
              <li style={{ marginBottom: spacing.sm }}><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing where we rely on consent</li>
            </ul>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginTop: spacing.md }}>
              To exercise these rights, please contact us at privacy@fixers.com.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              7. Cookies and Tracking Technologies
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              We use cookies and similar tracking technologies to:
            </p>
            <ul style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: spacing.xl, marginBottom: spacing.md }}>
              <li style={{ marginBottom: spacing.sm }}>Remember your preferences and settings</li>
              <li style={{ marginBottom: spacing.sm }}>Keep you logged in to your account</li>
              <li style={{ marginBottom: spacing.sm }}>Analyze how our Services are used</li>
              <li style={{ marginBottom: spacing.sm }}>Deliver personalized content and advertisements</li>
              <li style={{ marginBottom: spacing.sm }}>Improve our Services and user experience</li>
            </ul>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of our platform.
            </p>
          </section>

          {/* Data Retention */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              8. Data Retention
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              We retain your personal information for as long as necessary to provide our Services and comply with legal obligations. When you delete your account, we will delete or anonymize your information within 30 days, except where we need to retain it for legal, tax, or regulatory purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              9. Children's Privacy
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will delete it promptly.
            </p>
          </section>

          {/* International Data Transfers */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              10. International Data Transfers
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              Your information may be transferred to and processed in countries other than Nigeria. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section style={{ marginBottom: spacing['2xl'] }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              11. Changes to This Privacy Policy
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary }}>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
              12. Contact Us
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginBottom: spacing.md }}>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, marginTop: spacing.md }}>
              <strong>Email:</strong> privacy@fixers.com<br />
              <strong>Data Protection Officer:</strong> dpo@fixers.com<br />
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
            <Link href="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/faq" style={{ color: colors.textSecondary, textDecoration: 'none' }}>FAQ</Link>
            <Link href="/how-it-works" style={{ color: colors.textSecondary, textDecoration: 'none' }}>How It Works</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
