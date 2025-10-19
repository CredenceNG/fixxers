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

interface DisputeResolvedEmailProps {
    recipientName: string;
    orderNumber: string;
    disputeReason: string;
    resolution: string;
    finalStatus: string;
    refundAmount?: number;
    disputeUrl: string;
    orderUrl: string;
}

export const DisputeResolvedEmail = ({
    recipientName = 'John Doe',
    orderNumber = 'ORD-12345',
    disputeReason = 'Quality Issues',
    resolution = 'After reviewing all evidence and communications, we have determined...',
    finalStatus = 'RESOLVED',
    refundAmount,
    disputeUrl = 'https://fixxers.ng/disputes/123',
    orderUrl = 'https://fixxers.ng/orders/123',
}: DisputeResolvedEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Your dispute for order {orderNumber} has been resolved</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>✅</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            Dispute Resolved
                        </Heading>

                        <Text style={paragraph}>Hi {recipientName},</Text>

                        <Text style={paragraph}>
                            The dispute for order <strong>{orderNumber}</strong> has been reviewed and resolved by our team.
                        </Text>

                        {/* Resolution Card */}
                        <Section style={resolutionCard}>
                            <Text style={resolutionCardLabel}>Order Number</Text>
                            <Text style={resolutionCardValue}>{orderNumber}</Text>

                            <Text style={resolutionCardLabel}>Original Issue</Text>
                            <Text style={resolutionCardValue}>{disputeReason}</Text>

                            <Text style={resolutionCardLabel}>Resolution</Text>
                            <Text style={resolutionCardText}>{resolution}</Text>

                            <Text style={resolutionCardLabel}>Final Status</Text>
                            <Text style={statusBadge}>{finalStatus}</Text>
                        </Section>

                        {/* Payment Adjustment Info */}
                        {refundAmount && refundAmount > 0 && (
                            <Section style={paymentBox}>
                                <Text style={paymentBoxTitle}>💰 Payment Adjustment</Text>
                                <Text style={paymentBoxAmount}>₦{refundAmount.toLocaleString()}</Text>
                                <Text style={paymentBoxDescription}>
                                    This amount will be processed according to the resolution and reflected in your account within 3-5 business days.
                                </Text>
                            </Section>
                        )}

                        {/* Next Steps */}
                        <Section style={infoBox}>
                            <Text style={infoBoxTitle}>What happens next?</Text>
                            <Text style={infoBoxItem}>✓ The order status has been updated</Text>
                            {refundAmount && refundAmount > 0 && (
                                <Text style={infoBoxItem}>✓ Payment adjustment will be processed within 3-5 business days</Text>
                            )}
                            <Text style={infoBoxItem}>✓ You can view the complete dispute history and resolution details</Text>
                            <Text style={infoBoxItem}>✓ If you have concerns about this resolution, contact our support team</Text>
                        </Section>

                        {/* CTA Buttons */}
                        <Section style={buttonSection}>
                            <Button style={button} href={disputeUrl}>
                                View Resolution Details
                            </Button>
                        </Section>

                        <Section style={buttonSection}>
                            <Button style={buttonSecondary} href={orderUrl}>
                                View Order
                            </Button>
                        </Section>

                        <Text style={paragraph}>
                            We appreciate your patience during the dispute resolution process. Our goal is to ensure fair outcomes for all parties.
                        </Text>

                        <Text style={footerText}>
                            If you have any questions about this resolution, please contact our support team.
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

export default DisputeResolvedEmail;

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

const resolutionCard = {
    backgroundColor: '#f0fdf4',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
};

const resolutionCardLabel = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#065f46',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '16px 0 4px 0',
};

const resolutionCardValue = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px',
};

const resolutionCardText = {
    fontSize: '15px',
    color: '#374151',
    lineHeight: '22px',
    margin: '0 0 8px',
};

const statusBadge = {
    display: 'inline-block',
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0',
};

const paymentBox = {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const paymentBoxTitle = {
    fontSize: '18px',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 12px',
};

const paymentBoxAmount = {
    fontSize: '32px',
    fontWeight: '700',
    color: '#92400e',
    margin: '0 0 12px',
};

const paymentBoxDescription = {
    fontSize: '14px',
    color: '#92400e',
    lineHeight: '20px',
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
