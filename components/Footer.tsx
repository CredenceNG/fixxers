import Link from 'next/link';
import { colors, spacing, borderRadius } from '@/lib/theme';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: colors.gray900,
        color: colors.gray300,
        padding: '64px 24px 32px',
        marginTop: 'auto',
        borderTop: `1px solid ${colors.gray800}`,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px',
            marginBottom: '48px',
          }}
        >
          {/* Company Info */}
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: colors.white }}>
              Fixers
            </h3>
            <p style={{ fontSize: '14px', color: colors.gray400, lineHeight: '1.6', marginBottom: '20px' }}>
              Connect with trusted, verified service professionals in your neighborhood.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colors.gray800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: colors.gray300,
                  fontSize: '18px',
                  transition: 'background-color 0.2s',
                }}
              >
                f
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colors.gray800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: colors.gray300,
                  fontSize: '16px',
                  transition: 'background-color 0.2s',
                }}
              >
                𝕏
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: colors.gray800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: colors.gray300,
                  fontSize: '18px',
                  transition: 'background-color 0.2s',
                }}
              >
                📷
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.white }}>
              Categories
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/services/plumbing" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Plumbing
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/services/electrical" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Electrical
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/services/carpentry" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Carpentry
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/services/cleaning" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Cleaning
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.white }}>
              About
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/about" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  About Us
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/how-it-works" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  How It Works
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/auth/register?role=fixer" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Become a Fixer
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/careers" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.white }}>
              Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <a href="mailto:support@fixxers.com" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Contact Support
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/help" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Help Center
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/safety" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Trust & Safety
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/community" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* More */}
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: colors.white }}>
              More
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/blog" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Blog
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/press" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Press & News
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/partners" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Partnerships
                </Link>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <Link href="/affiliates" style={{ fontSize: '14px', color: colors.gray400, textDecoration: 'none' }}>
                  Affiliate Program
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: `1px solid ${colors.gray800}`,
            paddingTop: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <p style={{ fontSize: '14px', color: colors.gray500, margin: 0 }}>
            © {currentYear} Fixers. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <Link href="/terms" style={{ fontSize: '14px', color: colors.gray500, textDecoration: 'none' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ fontSize: '14px', color: colors.gray500, textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/cookies" style={{ fontSize: '14px', color: colors.gray500, textDecoration: 'none' }}>
              Cookie Policy
            </Link>
            <Link href="/accessibility" style={{ fontSize: '14px', color: colors.gray500, textDecoration: 'none' }}>
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
