import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates an in-app notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      },
    });

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true, phone: true, emailNotifications: true, smsNotifications: true },
    });

    // Send email if user has email notifications enabled
    if (user?.emailNotifications && user.email) {
      await sendEmailNotification(user.email, params.title, params.message, params.link);
    }

    // Send SMS if user has SMS notifications enabled
    if (user?.smsNotifications && user.phone) {
      await sendSMSNotification(user.phone, params.title, params.message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Sends an email notification
 * In production, integrate with email service (SendGrid, AWS SES, etc.)
 */
async function sendEmailNotification(email: string, title: string, message: string, link?: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[EMAIL] To: ${email}, Title: ${title}, Message: ${message}, Link: ${link}`);
    return;
  }

  // TODO: Implement email service integration
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({
  //   to: email,
  //   from: 'notifications@fixxers.com',
  //   subject: title,
  //   html: `<p>${message}</p>${link ? `<p><a href="${link}">View Details</a></p>` : ''}`,
  // });
}

/**
 * Sends an SMS notification
 * In production, integrate with SMS service (Twilio, AWS SNS, etc.)
 */
async function sendSMSNotification(phone: string, title: string, message: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SMS] To: ${phone}, Title: ${title}, Message: ${message}`);
    return;
  }

  // TODO: Implement SMS service integration
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: `${title}: ${message}`,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phone,
  // });
}

// Notification helper functions for common events

export async function notifyRequestApproved(clientId: string, requestId: string, requestTitle: string) {
  return createNotification({
    userId: clientId,
    type: 'NEW_REQUEST',
    title: 'Request Approved',
    message: `Your service request "${requestTitle}" has been approved and is now visible to fixers.`,
    link: `/client/requests/${requestId}`,
  });
}

export async function notifyQuoteSubmitted(clientId: string, requestId: string, fixerName: string, quoteAmount: number) {
  return createNotification({
    userId: clientId,
    type: 'NEW_QUOTE',
    title: 'New Quote Received',
    message: `${fixerName} has submitted a quote of ₦${quoteAmount.toLocaleString()} for your request.`,
    link: `/client/requests/${requestId}`,
  });
}

export async function notifyQuoteAccepted(fixerId: string, requestId: string, requestTitle: string) {
  return createNotification({
    userId: fixerId,
    type: 'QUOTE_ACCEPTED',
    title: 'Quote Accepted!',
    message: `Your quote for "${requestTitle}" has been accepted by the client.`,
    link: `/fixer/requests/${requestId}`,
  });
}

export async function notifyInspectionAccepted(fixerId: string, requestId: string, requestTitle: string, inspectionFee: number) {
  return createNotification({
    userId: fixerId,
    type: 'INSPECTION_ACCEPTED',
    title: 'Inspection Quote Accepted',
    message: `Your inspection quote of ₦${inspectionFee.toLocaleString()} for "${requestTitle}" has been accepted. You can now proceed with the inspection.`,
    link: `/fixer/requests/${requestId}`,
  });
}

export async function notifyFinalQuoteSubmitted(clientId: string, requestId: string, fixerName: string, quoteAmount: number) {
  return createNotification({
    userId: clientId,
    type: 'FINAL_QUOTE_SUBMITTED',
    title: 'Final Quote Submitted',
    message: `${fixerName} has submitted the final quote of ₦${quoteAmount.toLocaleString()} after inspection.`,
    link: `/client/requests/${requestId}`,
  });
}

export async function notifyPaymentReceived(fixerId: string, orderId: string, amount: number, isDownPayment: boolean = false) {
  return createNotification({
    userId: fixerId,
    type: isDownPayment ? 'DOWN_PAYMENT_RECEIVED' : 'PAYMENT_RECEIVED',
    title: isDownPayment ? 'Down Payment Received' : 'Payment Received',
    message: `You have received ${isDownPayment ? 'a down payment' : 'payment'} of ₦${amount.toLocaleString()}. ${isDownPayment ? 'You can now start the job.' : 'The funds are held in escrow.'}`,
    link: `/fixer/orders/${orderId}/view`,
  });
}

export async function notifyJobStarted(clientId: string, orderId: string, fixerName: string) {
  return createNotification({
    userId: clientId,
    type: 'JOB_STARTED',
    title: 'Job Started',
    message: `${fixerName} has started working on your job.`,
    link: `/client/orders/${orderId}`,
  });
}

export async function notifyJobCompleted(clientId: string, orderId: string, fixerName: string) {
  return createNotification({
    userId: clientId,
    type: 'JOB_COMPLETED',
    title: 'Job Completed',
    message: `${fixerName} has marked your job as completed. Please review the work.`,
    link: `/client/orders/${orderId}`,
  });
}

export async function notifyReviewReceived(fixerId: string, rating: number, reviewerName: string) {
  return createNotification({
    userId: fixerId,
    type: 'REVIEW_RECEIVED',
    title: 'New Review Received',
    message: `${reviewerName} left you a ${rating}-star review.`,
    link: `/fixer/dashboard`,
  });
}

export async function notifyFixerApproved(fixerId: string) {
  return createNotification({
    userId: fixerId,
    type: 'FIXER_APPROVED',
    title: 'Application Approved!',
    message: 'Congratulations! Your fixer application has been approved. You can now start accepting jobs.',
    link: '/fixer/dashboard',
  });
}

export async function notifyFixerRejected(fixerId: string, reason?: string) {
  return createNotification({
    userId: fixerId,
    type: 'FIXER_REJECTED',
    title: 'Application Status Update',
    message: reason || 'Your fixer application requires additional review. Please check your profile for details.',
    link: '/fixer/profile',
  });
}

export async function notifyNewMessage(userId: string, senderName: string, requestId: string) {
  return createNotification({
    userId,
    type: 'GENERAL',
    title: 'New Message',
    message: `${senderName} sent you a message.`,
    link: `/client/requests/${requestId}`,
  });
}

export async function notifyGigOrder(fixerId: string, gigTitle: string, orderId: string, amount: number) {
  return createNotification({
    userId: fixerId,
    type: 'GIG_ORDER',
    title: 'New Gig Order',
    message: `You have a new order for "${gigTitle}" - ₦${amount.toLocaleString()}`,
    link: `/fixer/orders/${orderId}`,
  });
}

// Admin notification helper functions

/**
 * Notifies all admins about an event
 */
async function notifyAllAdmins(type: NotificationType, title: string, message: string, link?: string) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { roles: { has: 'ADMIN' } },
      select: { id: true },
    });

    // Create notification for each admin
    const notifications = admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type,
        title,
        message,
        link,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

export async function notifyAdminNewServiceRequest(requestId: string, requestTitle: string, clientName: string, category: string) {
  return notifyAllAdmins(
    'NEW_REQUEST',
    'New Service Request',
    `${clientName} submitted a new ${category} request: "${requestTitle}"`,
    `/admin/requests/${requestId}`
  );
}

export async function notifyAdminNewGig(gigId: string, gigTitle: string, sellerName: string, category: string) {
  return notifyAllAdmins(
    'GENERAL',
    'New Service Offer (Gig)',
    `${sellerName} created a new ${category} service offer: "${gigTitle}" - Pending review`,
    `/admin/gigs/${gigId}`
  );
}

export async function notifyAdminNewFixerApplication(fixerId: string, fixerName: string, services: string[]) {
  return notifyAllAdmins(
    'GENERAL',
    'New Service Provider Application',
    `${fixerName} applied as a service provider for: ${services.join(', ')} - Pending approval`,
    `/admin/users/${fixerId}`
  );
}

export async function notifyAdminFixerProfileUpdate(fixerId: string, fixerName: string) {
  return notifyAllAdmins(
    'GENERAL',
    'Service Provider Profile Update',
    `${fixerName} updated their profile - Pending review`,
    `/admin/users/${fixerId}`
  );
}
