import Link from 'next/link';
import { colors, borderRadius, spacing } from '@/lib/theme';

export const metadata = {
  title: 'Frequently Asked Questions - Fixers',
  description: 'Find answers to common questions about using Fixers marketplace.',
};

export default function FAQPage() {
  const faqs = [
    {
      category: 'General',
      questions: [
        {
          question: 'What is Fixers?',
          answer: 'Fixers is Nigeria\'s leading online marketplace connecting skilled service providers with customers who need their expertise. Whether you need a plumber, electrician, carpenter, or any other professional service, Fixers makes it easy to find, hire, and pay trusted professionals.'
        },
        {
          question: 'How does Fixers work?',
          answer: 'Customers post service requests or browse available service providers. Service providers submit quotes or offer pre-packaged gigs. Once a customer accepts a quote or purchases a gig, payment is held in escrow. After the service is completed and approved, payment is released to the service provider.'
        },
        {
          question: 'Is Fixers free to use?',
          answer: 'Yes, it\'s free to create an account and browse services. Customers don\'t pay any platform fees - they only pay the agreed service price. Service providers pay a 10% platform fee on completed transactions.'
        },
        {
          question: 'What areas does Fixers cover?',
          answer: 'Fixers currently operates across Nigeria, with service providers in major cities including Lagos, Abuja, Port Harcourt, and other urban areas. We\'re constantly expanding to reach more locations.'
        },
      ]
    },
    {
      category: 'For Customers',
      questions: [
        {
          question: 'How do I request a service?',
          answer: 'After creating an account, click "Request Service" from your dashboard. Describe the service you need, upload photos if relevant, set your budget, and submit. Service providers will send you quotes, which you can review and accept.'
        },
        {
          question: 'How do I pay for services?',
          answer: 'We accept payments via Stripe and Paystack, supporting credit/debit cards and mobile money. Payment is held securely in escrow until you confirm the service is completed satisfactorily.'
        },
        {
          question: 'What if I\'m not satisfied with the service?',
          answer: 'If you\'re unsatisfied, contact the service provider first to resolve the issue. If that doesn\'t work, open a dispute through our platform. Our support team will review the case and mediate a fair resolution. Payment is only released once you approve the work.'
        },
        {
          question: 'How do I know service providers are trustworthy?',
          answer: 'All service providers on Fixers are verified. You can check their profiles to see ratings, reviews from previous customers, completed jobs, response time, and any trust badges they\'ve earned. We also use an escrow payment system to protect your money.'
        },
        {
          question: 'Can I cancel a service request?',
          answer: 'Yes, you can cancel before a service provider starts work. Once work has begun, cancellation terms depend on the agreement with your service provider. Check our cancellation policy in your order details.'
        },
      ]
    },
    {
      category: 'For Service Providers',
      questions: [
        {
          question: 'How do I become a service provider on Fixers?',
          answer: 'Sign up for an account and select "Service Provider" as your account type. Complete your profile with details about your skills, experience, and services. Upload verification documents (ID, certifications, portfolio). Once approved, you can start receiving service requests and creating gigs.'
        },
        {
          question: 'What are the fees for service providers?',
          answer: 'Fixers charges a 10% service fee on completed transactions. For example, if you complete a job for ₦10,000, you\'ll receive ₦9,000 and Fixers keeps ₦1,000. There are no upfront fees or subscription charges.'
        },
        {
          question: 'How do I get paid?',
          answer: 'When a customer accepts your quote or purchases your gig, they pay upfront and the money is held in escrow. After you complete the work and the customer approves it, payment is released to your account. You can withdraw your earnings at any time.'
        },
        {
          question: 'How long does it take to get verified?',
          answer: 'Verification typically takes 1-3 business days. We review your profile, credentials, and any supporting documents you provide. You\'ll receive an email notification once your account is approved. Make sure to provide clear, valid documentation to speed up the process.'
        },
        {
          question: 'What are gigs and how do they work?',
          answer: 'Gigs are pre-packaged services you offer at fixed prices. Instead of waiting for customers to send requests, you create service packages that customers can purchase directly. For example: "Electrical Installation - Basic Package - ₦15,000". Gigs help you attract more customers and streamline your workflow.'
        },
        {
          question: 'Can I work on Fixers part-time?',
          answer: 'Absolutely! Many of our service providers use Fixers part-time to supplement their income. You have full control over which jobs you accept and when you work. Set your own schedule and availability in your profile settings.'
        },
      ]
    },
    {
      category: 'Trust & Safety',
      questions: [
        {
          question: 'What is the verification process?',
          answer: 'Service providers must submit valid government-issued ID, proof of skills (certifications, portfolio, references), and complete a profile review. We verify this information before approving accounts. Customers can also earn trust badges for verified phone numbers and emails.'
        },
        {
          question: 'How does the escrow system work?',
          answer: 'When a customer accepts your quote, they pay upfront. The money is held securely in escrow by Fixers. You complete the work, and once the customer approves it, payment is released to you. This protects both parties - customers get quality work, and service providers get guaranteed payment.'
        },
        {
          question: 'What happens if there\'s a dispute?',
          answer: 'Either party can open a dispute through the platform. Our support team reviews evidence from both sides (messages, photos, service details) and mediates a fair resolution. This might include partial refunds, extended timelines, or other solutions depending on the situation.'
        },
        {
          question: 'Are there refunds?',
          answer: 'Refund requests are handled case-by-case. If a service provider doesn\'t deliver as agreed, or if there\'s a valid reason the work can\'t be completed, refunds may be issued. The escrow system ensures money isn\'t released until work is satisfactorily completed.'
        },
        {
          question: 'How do I report suspicious activity?',
          answer: 'If you encounter fraud, harassment, or any suspicious behavior, report it immediately through the "Report" button on user profiles or in your messages. Our trust and safety team investigates all reports promptly and takes appropriate action, including account suspension if necessary.'
        },
        {
          question: 'What information is shared between users?',
          answer: 'Your public profile (name, photo, ratings, reviews) is visible to other users. When you engage in a transaction, contact information may be shared to facilitate service delivery. We never share your payment information or sensitive personal data. See our Privacy Policy for details.'
        },
      ]
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

      {/* Hero */}
      <section style={{ backgroundColor: colors.primary, color: colors.white, padding: `${spacing.xxxl} ${spacing.xl}`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: spacing.lg }}>Frequently Asked Questions</h1>
          <p style={{ fontSize: '20px', lineHeight: '1.6', opacity: 0.9 }}>
            Find answers to common questions about using Fixers
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: `${spacing.xxxl} ${spacing.xl}` }}>

        {faqs.map((section, sectionIndex) => (
          <section key={sectionIndex} style={{ marginBottom: spacing.xxxl }}>
            <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.xl, paddingBottom: spacing.md, borderBottom: `2px solid ${colors.primary}` }}>
              {section.category}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
              {section.questions.map((faq, faqIndex) => (
                <div key={faqIndex} style={{ backgroundColor: colors.white, padding: spacing.xl, borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.md, display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: colors.primary, marginRight: spacing.md, fontSize: '24px', flexShrink: 0 }}>Q:</span>
                    <span>{faq.question}</span>
                  </h3>
                  <p style={{ fontSize: '15px', lineHeight: '1.8', color: colors.textSecondary, paddingLeft: '40px' }}>
                    <span style={{ fontWeight: '600', color: colors.textPrimary }}>A:</span> {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Still Have Questions */}
        <section style={{ textAlign: 'center', backgroundColor: colors.bgSecondary, padding: spacing.xxl, borderRadius: borderRadius.lg, marginTop: spacing.xxxl }}>
          <div style={{ fontSize: '48px', marginBottom: spacing.md }}>💬</div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md }}>
            Still Have Questions?
          </h2>
          <p style={{ fontSize: '16px', color: colors.textSecondary, marginBottom: spacing.xl, maxWidth: '600px', margin: '0 auto' }}>
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap', marginTop: spacing.xl }}>
            <a
              href="mailto:support@fixers.com"
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
              Contact Support
            </a>
            <Link
              href="/how-it-works"
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
              How It Works
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: colors.bgSecondary, borderTop: `1px solid ${colors.border}`, padding: `${spacing.xl} ${spacing.lg}`, marginTop: spacing.xxxl }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: colors.textSecondary, fontSize: '14px' }}>
          <p>© {new Date().getFullYear()} Fixers. All rights reserved.</p>
          <div style={{ marginTop: spacing.md, display: 'flex', gap: spacing.lg, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/about" style={{ color: colors.textSecondary, textDecoration: 'none' }}>About</Link>
            <Link href="/terms" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Terms of Service</Link>
            <Link href="/privacy" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Privacy Policy</Link>
            <Link href="/how-it-works" style={{ color: colors.textSecondary, textDecoration: 'none' }}>How It Works</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
