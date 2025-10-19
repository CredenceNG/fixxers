import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
} from '@react-email/components';

interface ReviewExpiringEmailProps {
    clientName: string;
    fixerName: string;
    serviceName: string;
    orderId: string;
    reviewUrl: string;
    daysRemaining: number;
}

export default function ReviewExpiringEmail({
    clientName = 'Valued Customer',
    fixerName = 'Your Service Provider',
    serviceName = 'your recent service',
    orderId = 'ORDER_ID',
    reviewUrl = 'http://localhost:3010/orders/ORDER_ID/review',
    daysRemaining = 3,
}: ReviewExpiringEmailProps) {
    return (
        <Html>
            <Head />
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={headerText}>Fixers</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        {/* Urgent Banner */}
                        <Section style={urgentBanner}>
                            <Text style={urgentText}>⏰ Review Window Expiring Soon</Text>
                        </Section>

                        <Text style={greeting}>Hi {clientName},</Text>

                        <Text style={paragraph}>
                            This is a friendly reminder that your review window for{' '}
                            <strong>{fixerName}</strong> is expiring soon!
                        </Text>

                        <Section style={expiryBox}>
                            <Text style={expiryText}>
                                Only <strong style={expiryDays}>{daysRemaining} days</strong> remaining
                            </Text>
                            <Text style={expirySubtext}>
                                After that, you won't be able to leave a review for this order
                            </Text>
                        </Section>

                        <Text style={paragraph}>
                            Your feedback is important! It helps other clients choose the right service
                            providers and helps {fixerName} improve their services.
                        </Text>

                        {/* CTA Button */}
                        <Section style={buttonContainer}>
                            <Button style={button} href={reviewUrl}>
                                Leave Your Review Now
                            </Button>
                        </Section>

                        <Hr style={divider} />

                        {/* Quick Review Points */}
                        <Text style={sectionTitle}>Quick Review (2 minutes):</Text>
                        <ul style={list}>
                            <li style={listItem}>⭐ Rate your experience (1-5 stars)</li>
                            <li style={listItem}>💬 Share what went well or could improve</li>
                            <li style={listItem}>📸 Add photos (optional)</li>
                        </ul>

                        <Hr style={divider} />

                        <Text style={footerText}>
                            Don't miss your chance to share your experience!
                        </Text>

                        <Text style={smallText}>
                            Service: {serviceName}
                            <br />
                            Order ID: {orderId}
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSmall}>
                            © 2025 Fixers. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0',
    maxWidth: '600px',
};

const header = {
    backgroundColor: '#3b82f6',
    padding: '20px',
    textAlign: 'center' as const,
};

const headerText = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
};

const content = {
    padding: '40px 30px',
};

const urgentBanner = {
    backgroundColor: '#fffbeb',
    border: '2px solid #fbbf24',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const urgentText = {
    color: '#92400e',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0',
};

const greeting = {
    fontSize: '18px',
    marginBottom: '16px',
    marginTop: '16px',
    color: '#1f2937',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    marginBottom: '16px',
};

const expiryBox = {
    backgroundColor: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center' as const,
    margin: '24px 0',
};

const expiryText = {
    fontSize: '20px',
    color: '#991b1b',
    margin: '0 0 8px 0',
};

const expiryDays = {
    fontSize: '28px',
    color: '#dc2626',
};

const expirySubtext = {
    fontSize: '14px',
    color: '#7f1d1d',
    margin: '0',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#dc2626',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 28px',
};

const sectionTitle = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '12px',
    marginTop: '24px',
};

const list = {
    paddingLeft: '20px',
    marginTop: '8px',
    marginBottom: '16px',
};

const listItem = {
    fontSize: '14px',
    lineHeight: '22px',
    color: '#4b5563',
    marginBottom: '8px',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
};

const smallText = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px',
    lineHeight: '20px',
};

const footerText = {
    fontSize: '16px',
    color: '#374151',
    marginTop: '24px',
    fontWeight: 'bold',
};

const footer = {
    backgroundColor: '#f9fafb',
    padding: '20px 30px',
    textAlign: 'center' as const,
    borderTop: '1px solid #e5e7eb',
};

const footerSmall = {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '4px 0',
};
