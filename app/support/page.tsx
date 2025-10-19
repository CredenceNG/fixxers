import Link from 'next/link';
import { colors, borderRadius, shadows } from '@/lib/theme';
import Header from '@/components/Header';

export default function SupportPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary }}>
      <Header />

      {/* Hero Section */}
      <div style={{ backgroundColor: colors.primary, color: colors.white, padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '42px', fontWeight: '700', marginBottom: '16px' }}>
            How can we help you?
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, lineHeight: '1.6' }}>
            Get answers to your questions or reach out to our support team
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Contact Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '60px' }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '32px',
            boxShadow: shadows.card,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
              Email Support
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '20px', lineHeight: '1.6' }}>
              Send us an email and we'll respond within 24 hours
            </p>
            <a
              href="mailto:support@fixxers.com"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              support@fixxers.com
            </a>
          </div>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '32px',
            boxShadow: shadows.card,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
              Help Center
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '20px', lineHeight: '1.6' }}>
              Browse our FAQ and common questions
            </p>
            <a
              href="#faq"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              View FAQs
            </a>
          </div>

          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '32px',
            boxShadow: shadows.card,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
              Trust & Safety
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '20px', lineHeight: '1.6' }}>
              Report issues or learn about our safety measures
            </p>
            <Link
              href="/safety"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Help Topics */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Browse by Topic
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {[
              { icon: '👤', title: 'Account & Profile', desc: 'Login, registration, and profile settings' },
              { icon: '💳', title: 'Payments & Billing', desc: 'Payment methods, invoices, and refunds' },
              { icon: '🛠️', title: 'Services & Orders', desc: 'Booking services, order management' },
              { icon: '🛡️', title: 'Trust Badges', desc: 'Verification, badge requests, and approval' },
              { icon: '⭐', title: 'Reviews & Ratings', desc: 'Leaving reviews and rating providers' },
              { icon: '🎁', title: 'Referrals', desc: 'Referral program and rewards' },
            ].map((topic) => (
              <div
                key={topic.title}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  padding: '24px',
                  border: `1px solid ${colors.border}`,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{topic.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                  {topic.title}
                </h3>
                <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.5' }}>
                  {topic.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {[
              {
                q: 'How do I create an account?',
                a: 'Click "Sign Up" in the top right corner, choose whether you\'re a client or service provider (fixer), and fill in your details. You\'ll receive a verification email to activate your account.'
              },
              {
                q: 'How do payments work?',
                a: 'Payments are processed securely through our platform. For services, you pay after accepting a quote. For gigs, you pay when booking. All payments are held securely until the service is completed.'
              },
              {
                q: 'What are Trust Badges?',
                a: 'Trust Badges are verification credentials that service providers can earn by submitting required documentation (ID, certifications, etc.). They help clients identify verified, trustworthy professionals.'
              },
              {
                q: 'How do I request a service?',
                a: 'Navigate to your client dashboard and click "New Service Request". Describe your needs, select a category, and submit. Service providers in your area will receive your request and send quotes.'
              },
              {
                q: 'Can I be both a client and a service provider?',
                a: 'Yes! You can register for both roles. Your dashboard will show options for both client and fixer activities, allowing you to request services and provide services from the same account.'
              },
              {
                q: 'How long does badge verification take?',
                a: 'After payment, our admin team reviews badge requests within 24-48 hours. You\'ll receive an email notification once your request is reviewed. If approved, the badge appears on your profile immediately.'
              },
              {
                q: 'What is the referral program?',
                a: 'Share your unique referral code with friends. When they sign up and complete their first transaction, both you and your friend receive rewards. View your referral code and earnings in Settings > Referrals.'
              },
              {
                q: 'How do I become an agent?',
                a: 'Agents help recruit and manage service providers in specific territories. Apply through the "Become an Agent" link in the navigation menu. Applications are reviewed by our team based on experience and territory availability.'
              },
            ].map((faq, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  padding: '24px',
                  marginBottom: '16px',
                  boxShadow: shadows.card
                }}
              >
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '12px'
                }}>
                  {faq.q}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: colors.textSecondary,
                  lineHeight: '1.7'
                }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          boxShadow: shadows.card
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Still Need Help?
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Send us a message and we'll get back to you as soon as possible
          </p>

          <form action="mailto:support@fixxers.com" method="GET">
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="name"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px'
                }}
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary
                }}
                placeholder="Your full name"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px'
                }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary
                }}
                placeholder="your.email@example.com"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="subject"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px'
                }}
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary
                }}
                placeholder="Brief description of your issue"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                htmlFor="message"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px'
                }}
              >
                Message
              </label>
              <textarea
                id="message"
                name="body"
                rows={6}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '15px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  color: colors.textPrimary,
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="Please provide as much detail as possible..."
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: colors.primary,
                color: colors.white,
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: borderRadius.md,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Send Message
            </button>
          </form>

          <p style={{
            marginTop: '24px',
            fontSize: '14px',
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            You can also email us directly at{' '}
            <a
              href="mailto:support@fixxers.com"
              style={{
                color: colors.primary,
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              support@fixxers.com
            </a>
          </p>
        </div>

        {/* Additional Resources */}
        <div style={{
          marginTop: '60px',
          padding: '32px',
          backgroundColor: colors.primaryLight,
          borderRadius: borderRadius.lg,
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '16px'
          }}>
            Looking for something else?
          </h3>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '24px'
          }}>
            <Link
              href="/about"
              style={{
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.primary,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                border: `1px solid ${colors.border}`
              }}
            >
              About Us
            </Link>
            <Link
              href="/categories"
              style={{
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.primary,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
                border: `1px solid ${colors.border}`
              }}
            >
              Browse Services
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
