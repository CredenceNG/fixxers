import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BadgeRejectionEmailProps {
    fixerName: string;
    badgeName: string;
    badgeIcon: string;
    rejectionReason: string;
    refundAmount?: number;
    supportUrl: string;
    badgesUrl: string;
}

export const BadgeRejectionEmail = ({
    fixerName = 'John Doe',
    badgeName = 'Identity Verified',
    badgeIcon = '🆔',
    rejectionReason = 'The submitted documents were not clear enough for verification.',
    refundAmount,
    supportUrl = 'https://fixxers.ng/support',
    badgesUrl = 'https://fixxers.ng/fixer/badges',
}: BadgeRejectionEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Update on your {badgeName} badge request</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>📋</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            Badge Request Update
                        </Heading>

                        <Text style={paragraph}>Hi {fixerName},</Text>

                        <Text style={paragraph}>
                            Thank you for your interest in the <strong>{badgeIcon} {badgeName}</strong> badge.
                            Unfortunately, we're unable to approve your request at this time.
                        </Text>

                        {/* Badge Card */}
                        <Section style={badgeCard}>
                            <Text style={badgeCardIcon}>{badgeIcon}</Text>
                            <Text style={badgeCardTitle}>{badgeName}</Text>
                            <Text style={badgeCardStatus}>Request Not Approved</Text>
                        </Section>

                        {/* Rejection Reason */}
                        <Section style={reasonSection}>
                            <Text style={reasonTitle}>Reason:</Text>
                            <Text style={reasonText}>{rejectionReason}</Text>
                        </Section>

                        {/* Refund Info */}
                        {refundAmount && refundAmount > 0 && (
                            <Section style={refundSection}>
                                <Text style={refundTitle}>💰 Refund Processing</Text>
                                <Text style={refundText}>
                                    A refund of <strong>₦{refundAmount.toLocaleString()}</strong> will be processed
                                    to your original payment method within 5-7 business days.
                                </Text>
                            </Section>
                        )}

                        {/* Next Steps */}
                        <Section style={nextStepsSection}>
                            <Text style={nextStepsTitle}>What you can do next:</Text>
                            <Text style={nextStepItem}>
                                <strong>1. Review the reason</strong> - Make sure you understand what needs to be improved
                            </Text>
                            <Text style={nextStepItem}>
                                <strong>2. Gather better documentation</strong> - Ensure documents are clear, legible, and up-to-date
                            </Text>
                            <Text style={nextStepItem}>
                                <strong>3. Submit a new request</strong> - You can apply again once you have the required documents
                            </Text>
                            <Text style={nextStepItem}>
                                <strong>4. Contact support</strong> - If you have questions or need clarification
                            </Text>
                        </Section>

                        {/* CTA Buttons */}
                        <Section style={buttonSection}>
                            <Button style={primaryButton} href={badgesUrl}>
                                View Available Badges
                            </Button>
                        </Section>

                        <Section style={buttonSection}>
                            <Button style={secondaryButton} href={supportUrl}>
                                Contact Support
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            We appreciate your commitment to building trust on our platform. Don't be discouraged –
                            many successful fixers had to reapply after improving their documentation.
                        </Text>

                        <Text style={footerText}>
                            If you believe this decision was made in error, please contact our support team.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerLink}>
                            <Link href="https://fixxers.ng/fixer/badges" style={link}>
                                Badge Requirements
                            </Link>
                            {' · '}
                            <Link href="https://fixxers.ng/support" style={link}>
                                Support Center
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

export default BadgeRejectionEmail;

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
    backgroundColor: '#fef2f2',
    border: '2px solid #ef4444',
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

const badgeCardStatus = {
    fontSize: '14px',
    color: '#dc2626',
    fontWeight: '600',
    margin: '0',
};

const reasonSection = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const reasonTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#991b1b',
    margin: '0 0 8px',
};

const reasonText = {
    fontSize: '15px',
    color: '#7f1d1d',
    lineHeight: '22px',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
};

const refundSection = {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const refundTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    margin: '0 0 8px',
};

const refundText = {
    fontSize: '15px',
    color: '#047857',
    lineHeight: '22px',
    margin: '0',
};

const nextStepsSection = {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const nextStepsTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 16px',
};

const nextStepItem = {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 12px',
    lineHeight: '20px',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '16px 0',
};

const primaryButton = {
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

const secondaryButton = {
    backgroundColor: '#ffffff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    color: '#2563eb',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '10px 32px',
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
