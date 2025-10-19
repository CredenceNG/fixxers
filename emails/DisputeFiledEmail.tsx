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

interface DisputeFiledEmailProps {
    recipientName: string;
    isInitiator: boolean;
    orderNumber: string;
    disputeReason: string;
    disputeDescription: string;
    initiatorName: string;
    disputeUrl: string;
    orderUrl: string;
}

export const DisputeFiledEmail = ({
    recipientName = 'John Doe',
    isInitiator = false,
    orderNumber = 'ORD-12345',
    disputeReason = 'Quality Issues',
    disputeDescription = 'The work delivered does not meet the agreed upon standards.',
    initiatorName = 'Jane Smith',
    disputeUrl = 'https://fixxers.ng/disputes/123',
    orderUrl = 'https://fixxers.ng/orders/123',
}: DisputeFiledEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>
                {isInitiator
                    ? `Your dispute for order ${orderNumber} has been filed`
                    : `A dispute has been filed for order ${orderNumber}`
                }
            </Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>⚠️</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            {isInitiator ? 'Dispute Filed' : 'Dispute Notification'}
                        </Heading>

                        <Text style={paragraph}>Hi {recipientName},</Text>

                        {isInitiator ? (
                            <Text style={paragraph}>
                                Your dispute for order <strong>{orderNumber}</strong> has been successfully filed and is now under review by our team.
                            </Text>
                        ) : (
                            <Text style={paragraph}>
                                {initiatorName} has filed a dispute for order <strong>{orderNumber}</strong>. Our team will review this matter and facilitate a fair resolution.
                            </Text>
                        )}

                        {/* Dispute Details Card */}
                        <Section style={disputeCard}>
                            <Text style={disputeCardLabel}>Order Number</Text>
                            <Text style={disputeCardValue}>{orderNumber}</Text>

                            <Text style={disputeCardLabel}>Reason</Text>
                            <Text style={disputeCardValue}>{disputeReason}</Text>

                            <Text style={disputeCardLabel}>Description</Text>
                            <Text style={disputeCardDescription}>{disputeDescription}</Text>
                        </Section>

                        {/* Next Steps */}
                        <Section style={infoBox}>
                            <Text style={infoBoxTitle}>What happens next?</Text>
                            <Text style={infoBoxItem}>1. Our team will review the dispute details</Text>
                            <Text style={infoBoxItem}>2. Both parties will be contacted for additional information if needed</Text>
                            <Text style={infoBoxItem}>3. You can communicate through the dispute messaging system</Text>
                            <Text style={infoBoxItem}>4. A resolution will be provided within 5-7 business days</Text>
                        </Section>

                        {!isInitiator && (
                            <Text style={paragraph}>
                                You can view the dispute details and respond through the messaging system. Please provide any relevant information or evidence to help resolve this matter.
                            </Text>
                        )}

                        {/* CTA Button */}
                        <Section style={buttonSection}>
                            <Button style={button} href={disputeUrl}>
                                View Dispute Details
                            </Button>
                        </Section>

                        <Section style={buttonSection}>
                            <Button style={buttonSecondary} href={orderUrl}>
                                View Order
                            </Button>
                        </Section>

                        <Text style={footerText}>
                            If you have any questions, please contact our support team.
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerLink}>
                            <Link href="https://fixxers.ng/help" style={link}>
                                Help Center
                            </Link>
                            {' · '}
                            <Link href="https://fixxers.ng/support" style={link}>
                                Contact Support
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

export default DisputeFiledEmail;

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

const disputeCard = {
    backgroundColor: '#fef2f2',
    border: '2px solid #ef4444',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
};

const disputeCardLabel = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#991b1b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '16px 0 4px 0',
};

const disputeCardValue = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px',
};

const disputeCardDescription = {
    fontSize: '15px',
    color: '#374151',
    lineHeight: '22px',
    margin: '0',
};

const infoBox = {
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
};

const infoBoxTitle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
    margin: '0 0 12px',
};

const infoBoxItem = {
    fontSize: '14px',
    color: '#1e40af',
    margin: '0 0 8px',
    lineHeight: '20px',
};

const buttonSection = {
    textAlign: 'center' as const,
    margin: '16px 0',
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

const buttonSecondary = {
    backgroundColor: '#ffffff',
    border: '2px solid #2563eb',
    borderRadius: '8px',
    color: '#2563eb',
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
