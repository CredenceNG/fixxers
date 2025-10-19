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

interface DisputeMessageEmailProps {
    recipientName: string;
    orderNumber: string;
    senderName: string;
    messagePreview: string;
    disputeUrl: string;
}

export const DisputeMessageEmail = ({
    recipientName = 'John Doe',
    orderNumber = 'ORD-12345',
    senderName = 'Jane Smith',
    messagePreview = 'I have uploaded additional documentation...',
    disputeUrl = 'https://fixxers.ng/disputes/123',
}: DisputeMessageEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>New message in your dispute for order {orderNumber}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={heading}>Fixers</Heading>
                    </Section>

                    {/* Icon */}
                    <Section style={iconSection}>
                        <Text style={largeIcon}>💬</Text>
                    </Section>

                    {/* Main Content */}
                    <Section style={content}>
                        <Heading as="h1" style={title}>
                            New Dispute Message
                        </Heading>

                        <Text style={paragraph}>Hi {recipientName},</Text>

                        <Text style={paragraph}>
                            {senderName} has sent a new message in the dispute for order <strong>{orderNumber}</strong>.
                        </Text>

                        {/* Message Preview Card */}
                        <Section style={messageCard}>
                            <Text style={messageCardLabel}>Message Preview</Text>
                            <Text style={messageCardContent}>"{messagePreview}"</Text>
                            <Text style={messageCardFooter}>From: {senderName}</Text>
                        </Section>

                        <Text style={paragraph}>
                            Please log in to view the full message and respond to help resolve this dispute.
                        </Text>

                        {/* CTA Button */}
                        <Section style={buttonSection}>
                            <Button style={button} href={disputeUrl}>
                                View Message & Respond
                            </Button>
                        </Section>

                        <Text style={footerText}>
                            Timely communication helps resolve disputes faster.
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

export default DisputeMessageEmail;

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

const messageCard = {
    backgroundColor: '#f9fafb',
    border: '2px solid #3b82f6',
    borderRadius: '12px',
    padding: '24px',
    margin: '24px 0',
};

const messageCardLabel = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1e40af',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 8px',
};

const messageCardContent = {
    fontSize: '16px',
    color: '#1f2937',
    lineHeight: '24px',
    fontStyle: 'italic',
    margin: '0 0 16px',
};

const messageCardFooter = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
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
