import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BadgeApprovalEmailProps {
    fixerName: string;
    badgeName: string;
    badgeIcon: string;
    expiresAt: Date;
    newTier: string;
    activeBadges: number;
    profileUrl: string;
}

const tierEmojis: Record<string, string> = {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    PLATINUM: '💎',
};

export const BadgeApprovalEmail = ({
    fixerName = 'John Doe',
    badgeName = 'Identity Verified',
    badgeIcon = '🆔',
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    newTier = 'BRONZE',
    activeBadges = 1,
    profileUrl = 'https://fixxers.ng/profile',
}: BadgeApprovalEmailProps) => {
    const expiryDate = expiresAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Html>
            <Head />
            <Preview>🎉 Your {badgeName} badge has been approved!</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Success Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>✅</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            Badge Approved!
                        </Heading>

                        <Text style={paragraph}>Hi {fixerName},</Text>

                        <Text style={paragraph}>
                            Great news! Your request for the <strong>{badgeIcon} {badgeName}</strong> badge has been approved.
                        </Text>

                        {/* Badge Card */}
                        <Section style={badgeCard}>
                            <Text style={badgeCardIcon}>{badgeIcon}</Text>
                            <Text style={badgeCardTitle}>{badgeName}</Text>
                            <Text style={badgeCardSubtitle}>Active Badge</Text>
                            <Text style={badgeCardExpiry}>Valid until {expiryDate}</Text>
                        </Section>

                        {/* Tier Update */}
                        <Section style={tierSection}>
                            <Text style={tierTitle}>
                                {tierEmojis[newTier]} Your Badge Tier: {newTier}
                            </Text>
                            <Text style={tierSubtitle}>
                                You now have {activeBadges} active {activeBadges === 1 ? 'badge' : 'badges'}
                            </Text>
                        </Section>

                        <Text style={paragraph}>
                            This badge will be displayed on your profile, gigs, and quotes, helping you stand out to potential clients and build trust.
                        </Text>

                        <Section style={benefitsSection}>
                            <Text style={benefitsTitle}>What this means for you:</Text>
                            <Text style={benefitItem}>✓ Increased visibility in search results</Text>
                            <Text style={benefitItem}>✓ Higher trust from potential clients</Text>
                            <Text style={benefitItem}>✓ Priority in featured listings</Text>
                            <Text style={benefitItem}>✓ Better conversion rates on quotes</Text>
                        </Section>

                        {/* CTA Button */}
                        <Section style={buttonSection}>
                            <Button style={button} href={profileUrl}>
                                View Your Profile
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            Remember to renew your badge before it expires on <strong>{expiryDate}</strong> to maintain your verified status.
                        </Text>

                        <Text style={footerText}>
                            Thank you for being a trusted member of the Fixers community!
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerLink}>
                            <Link href="https://fixxers.ng/fixer/badges" style={link}>
                                Manage Badges
                            </Link>
                            {' · '}
                            <Link href="https://fixxers.ng/help" style={link}>
                                Help Center
                            </Link>
                            {' · '}
                            <Link href="https://fixxers.ng/settings" style={link}>
                                Settings
                            </Link>
                        </Text>
                        <Text style={footerCopyright}>
                            © 2025 Fixers. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default BadgeApprovalEmail;

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};

const header = {
    padding: '24px',
    backgroundColor: '#2563eb',
    textAlign: 'center' as const,
};

const heading = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '0',
};

const iconSection = {
    textAlign: 'center' as const,
    padding: '24px 0',
};

const largeIcon = {
    fontSize: '64px',
    margin: '0',
};

const content = {
    padding: '0 48px',
};

const title = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center' as const,
    margin: '0 0 24px',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    margin: '0 0 16px',
};

const badgeCard = {
    backgroundColor: '#f9fafb',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const badgeCardIcon = {
    fontSize: '48px',
    margin: '0 0 8px',
};

const badgeCardTitle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 4px',
};

const badgeCardSubtitle = {
    fontSize: '14px',
    color: '#10b981',
    fontWeight: '600',
    margin: '0 0 8px',
};

const badgeCardExpiry = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
};

const tierSection = {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const tierTitle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#92400e',
    margin: '0 0 4px',
};

const tierSubtitle = {
    fontSize: '14px',
    color: '#92400e',
    margin: '0',
};

const benefitsSection = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const benefitsTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 12px',
};

const benefitItem = {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0 0 8px',
    lineHeight: '20px',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#2563eb',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const footerText = {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '24px 0 0',
};

const footer = {
    padding: '24px 48px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '32px',
};

const footerLink = {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '0 0 8px',
};

const link = {
    color: '#2563eb',
    textDecoration: 'none',
};

const footerCopyright = {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center' as const,
    margin: '0',
};
