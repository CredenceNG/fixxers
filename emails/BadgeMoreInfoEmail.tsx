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

interface BadgeMoreInfoEmailProps {
    fixerName: string;
    badgeName: string;
    badgeIcon: string;
    adminNotes: string;
    requestUrl: string;
    supportUrl: string;
}

export const BadgeMoreInfoEmail = ({
    fixerName = 'John Doe',
    badgeName = 'Identity Verified',
    badgeIcon = '🆔',
    adminNotes = 'Please provide a clearer image of your government-issued ID. The current photo is too blurry to verify.',
    requestUrl = 'https://fixxers.ng/fixer/badges/requests/123',
    supportUrl = 'https://fixxers.ng/support',
}: BadgeMoreInfoEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Additional information needed for your {badgeName} badge request</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>📝</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            More Information Needed
                        </Heading>

                        <Text style={paragraph}>Hi {fixerName},</Text>

                        <Text style={paragraph}>
                            We're reviewing your request for the <strong>{badgeIcon} {badgeName}</strong> badge,
                            but we need some additional information before we can proceed.
                        </Text>

                        {/* Badge Card */}
                        <Section style={badgeCard}>
                            <Text style={badgeCardIcon}>{badgeIcon}</Text>
                            <Text style={badgeCardTitle}>{badgeName}</Text>
                            <Text style={badgeCardStatus}>⏳ Pending Additional Info</Text>
                        </Section>

                        {/* Admin Notes */}
                        <Section style={notesSection}>
                            <Text style={notesTitle}>What we need from you:</Text>
                            <Text style={notesText}>{adminNotes}</Text>
                        </Section>

                        {/* Action Items */}
                        <Section style={actionSection}>
                            <Text style={actionTitle}>Next Steps:</Text>
                            <Text style={actionItem}>
                                <strong>1. Review the request</strong> - Read the details carefully
                            </Text>
                            <Text style={actionItem}>
                                <strong>2. Prepare the information</strong> - Gather the requested documents or details
                            </Text>
                            <Text style={actionItem}>
                                <strong>3. Update your request</strong> - Click the button below to add the information
                            </Text>
                            <Text style={actionItem}>
                                <strong>4. Resubmit for review</strong> - Once updated, we'll review it promptly
                            </Text>
                        </Section>

                        {/* CTA Button */}
                        <Section style={buttonSection}>
                            <Button style={button} href={requestUrl}>
                                View & Update Request
                            </Button>
                        </Section>

                        {/* Important Info */}
                        <Section style={infoSection}>
                            <Text style={infoTitle}>⏰ Important</Text>
                            <Text style={infoText}>
                                Please respond within <strong>7 days</strong> to avoid your request being cancelled.
                                Your payment will remain on hold until the review is complete.
                            </Text>
                        </Section>

                        <Text style={paragraph}>
                            We're here to help! If you have any questions about what's needed, don't hesitate to contact our support team.
                        </Text>

                        {/* Support Link */}
                        <Section style={supportSection}>
                            <Text style={supportText}>
                                Need help? <Link href={supportUrl} style={supportLink}>Contact Support</Link>
                            </Text>
                        </Section>

                        <Text style={footerText}>
                            Thank you for your patience as we work to verify your badge!
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerLink}>
                            <Link href="https://fixxers.ng/fixer/badges" style={link}>
                                My Badges
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

export default BadgeMoreInfoEmail;

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
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
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
    color: '#d97706',
    fontWeight: '600',
    margin: '0',
};

const notesSection = {
    backgroundColor: '#fef9e7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const notesTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 12px',
};

const notesText = {
    fontSize: '15px',
    color: '#78350f',
    lineHeight: '22px',
    margin: '0',
    whiteSpace: 'pre-wrap' as const,
};

const actionSection = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const actionTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 16px',
};

const actionItem = {
    fontSize: '14px',
    color: '#1e3a8a',
    margin: '0 0 12px',
    lineHeight: '20px',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#f59e0b',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
};

const infoSection = {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
};

const infoTitle = {
    fontSize: '14px',
    fontWeight: '600',
    color: '#991b1b',
    margin: '0 0 8px',
};

const infoText = {
    fontSize: '14px',
    color: '#7f1d1d',
    lineHeight: '20px',
    margin: '0',
};

const supportSection = {
    textAlign: 'center' as const,
    margin: '24px 0',
};

const supportText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
};

const supportLink = {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '600',
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
