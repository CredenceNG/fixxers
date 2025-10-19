import * as React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Button,
    Hr,
} from '@react-email/components';

interface ReviewRequestEmailProps {
    clientName: string;
    fixerName: string;
    serviceName: string;
    orderId: string;
    reviewUrl: string;
    daysRemaining: number;
}

export default function ReviewRequestEmail({
    clientName = 'Valued Customer',
    fixerName = 'Your Service Provider',
    serviceName = 'your recent service',
    orderId = 'ORDER_ID',
    reviewUrl = 'http://localhost:3010/orders/ORDER_ID/review',
    daysRemaining = 27,
}: ReviewRequestEmailProps) {
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
                        <Text style={greeting}>Hi {clientName},</Text>

                        <Text style={paragraph}>
                            We hope you enjoyed your recent experience with <strong>{fixerName}</strong> for{' '}
                            <strong>{serviceName}</strong>.
                        </Text>

                        <Text style={paragraph}>
                            Your feedback is incredibly valuable! It helps other clients make informed
                            decisions and helps service providers improve their work.
                        </Text>

                        <Text style={paragraph}>
                            <strong>Would you take 2 minutes to share your experience?</strong>
                        </Text>

                        {/* CTA Button */}
                        <Section style={buttonContainer}>
                            <Button style={button} href={reviewUrl}>
                                Leave Your Review
                            </Button>
                        </Section>

                        <Text style={smallText}>
                            You have <strong>{daysRemaining} days</strong> remaining to leave your review
                            for this order.
                        </Text>

                        <Hr style={divider} />

                        {/* What to Include */}
                        <Text style={sectionTitle}>What to include in your review:</Text>
                        <ul style={list}>
                            <li style={listItem}>How well did the work meet your expectations?</li>
                            <li style={listItem}>Was the provider professional and punctual?</li>
                            <li style={listItem}>Would you recommend them to others?</li>
                            <li style={listItem}>Any photos of the completed work (optional)</li>
                        </ul>

                        <Hr style={divider} />

                        <Text style={footerText}>
                            Thank you for being part of the Fixers community!
                        </Text>

                        <Text style={smallText}>
                            If you have any concerns, please{' '}
                            <Link href="mailto:support@fixxers.com" style={link}>
                                contact our support team
                            </Link>
                            .
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSmall}>
                            © 2025 Fixers. All rights reserved.
                        </Text>
                        <Text style={footerSmall}>
                            Order ID: {orderId}
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

const greeting = {
    fontSize: '18px',
    marginBottom: '16px',
    color: '#1f2937',
};

const paragraph = {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    marginBottom: '16px',
};

const buttonContainer = {
    textAlign: 'center' as const,
    margin: '32px 0',
};

const button = {
    backgroundColor: '#3b82f6',
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
};

const footerText = {
    fontSize: '16px',
    color: '#374151',
    marginTop: '24px',
};

const link = {
    color: '#3b82f6',
    textDecoration: 'underline',
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
