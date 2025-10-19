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

interface ReviewReceivedEmailProps {
    fixerName: string;
    rating: number;
    commentExcerpt: string;
    reviewerName: string;
    isAnonymous: boolean;
    reviewUrl: string;
    orderId: string;
    serviceName: string;
}

export default function ReviewReceivedEmail({
    fixerName = 'Service Provider',
    rating = 5,
    commentExcerpt = 'Great service! Very professional and completed the job on time.',
    reviewerName = 'Anonymous',
    isAnonymous = false,
    reviewUrl = 'http://localhost:3010/dashboard/reviews',
    orderId = 'ORDER_ID',
    serviceName = 'Service',
}: ReviewReceivedEmailProps) {
    const stars = '⭐'.repeat(rating);
    const displayName = isAnonymous ? 'Anonymous' : reviewerName;

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
                        {/* Success Banner */}
                        <Section style={successBanner}>
                            <Text style={successIcon}>🎉</Text>
                            <Text style={successText}>You Received a New Review!</Text>
                        </Section>

                        <Text style={greeting}>Hi {fixerName},</Text>

                        <Text style={paragraph}>
                            Great news! A client just left a review for your service.
                        </Text>

                        {/* Review Preview Card */}
                        <Section style={reviewCard}>
                            {/* Rating */}
                            <Section style={ratingSection}>
                                <Text style={starsText}>{stars}</Text>
                                <Text style={ratingText}>
                                    {rating} out of 5 stars
                                </Text>
                            </Section>

                            {/* Reviewer Info */}
                            <Text style={reviewerInfo}>
                                Review by: <strong>{displayName}</strong>
                            </Text>

                            {/* Comment Preview */}
                            <Section style={commentSection}>
                                <Text style={commentLabel}>Comment:</Text>
                                <Text style={commentText}>"{commentExcerpt}"</Text>
                                {commentExcerpt.length >= 100 && (
                                    <Text style={readMoreText}>Read full review...</Text>
                                )}
                            </Section>

                            {/* Service Info */}
                            <Text style={serviceInfo}>
                                Service: {serviceName}
                            </Text>
                        </Section>

                        {/* CTA Button */}
                        <Section style={buttonContainer}>
                            <Button style={button} href={reviewUrl}>
                                View Full Review & Respond
                            </Button>
                        </Section>

                        <Hr style={divider} />

                        {/* Response Tips */}
                        <Text style={sectionTitle}>💡 Tips for Responding:</Text>
                        <ul style={list}>
                            <li style={listItem}>
                                <strong>Thank the client:</strong> Show appreciation for their feedback
                            </li>
                            <li style={listItem}>
                                <strong>Be professional:</strong> Even if the review is critical
                            </li>
                            <li style={listItem}>
                                <strong>Address concerns:</strong> If mentioned, explain how you'll improve
                            </li>
                            <li style={listItem}>
                                <strong>Keep it brief:</strong> 2-3 sentences is usually enough
                            </li>
                        </ul>

                        <Hr style={divider} />

                        <Text style={reminderText}>
                            💼 <strong>Why responding matters:</strong> Client responses show you care
                            about feedback and help build trust with future clients.
                        </Text>

                        <Text style={smallText}>
                            Order ID: {orderId}
                        </Text>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerSmall}>
                            © 2025 Fixers. All rights reserved.
                        </Text>
                        <Text style={footerSmall}>
                            You're receiving this because you completed an order on Fixers.
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

const successBanner = {
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center' as const,
    marginBottom: '24px',
};

const successIcon = {
    fontSize: '32px',
    margin: '0 0 8px 0',
};

const successText = {
    color: '#166534',
    fontSize: '18px',
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

const reviewCard = {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    margin: '24px 0',
};

const ratingSection = {
    textAlign: 'center' as const,
    marginBottom: '16px',
};

const starsText = {
    fontSize: '32px',
    margin: '0 0 8px 0',
    lineHeight: '1',
};

const ratingText = {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
};

const reviewerInfo = {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
};

const commentSection = {
    marginBottom: '16px',
};

const commentLabel = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
};

const commentText = {
    fontSize: '15px',
    color: '#1f2937',
    lineHeight: '22px',
    fontStyle: 'italic',
    margin: '0',
};

const readMoreText = {
    fontSize: '13px',
    color: '#3b82f6',
    marginTop: '8px',
};

const serviceInfo = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
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
    marginBottom: '12px',
};

const divider = {
    borderColor: '#e5e7eb',
    margin: '24px 0',
};

const reminderText = {
    fontSize: '14px',
    color: '#374151',
    backgroundColor: '#eff6ff',
    padding: '16px',
    borderRadius: '6px',
    borderLeft: '4px solid #3b82f6',
    marginTop: '16px',
};

const smallText = {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '16px',
    lineHeight: '20px',
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
