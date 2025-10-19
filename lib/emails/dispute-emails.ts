import { Resend } from "resend";
import { render } from "@react-email/render";
import DisputeFiledEmail from "@/emails/DisputeFiledEmail";
import DisputeMessageEmail from "@/emails/DisputeMessageEmail";
import DisputeResolvedEmail from "@/emails/DisputeResolvedEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Fixers <noreply@fixxers.ng>";

interface DisputeFiledEmailData {
  to: string;
  recipientName: string;
  isInitiator: boolean;
  orderNumber: string;
  disputeReason: string;
  disputeDescription: string;
  initiatorName: string;
  disputeUrl: string;
  orderUrl: string;
}

interface DisputeMessageEmailData {
  to: string;
  recipientName: string;
  orderNumber: string;
  senderName: string;
  messagePreview: string;
  disputeUrl: string;
}

interface DisputeResolvedEmailData {
  to: string;
  recipientName: string;
  orderNumber: string;
  disputeReason: string;
  resolution: string;
  finalStatus: string;
  refundAmount?: number;
  disputeUrl: string;
  orderUrl: string;
}

/**
 * Send dispute filed notification email
 */
export async function sendDisputeFiledEmail(data: DisputeFiledEmailData) {
  try {
    const emailHtml = await render(
      DisputeFiledEmail({
        recipientName: data.recipientName,
        isInitiator: data.isInitiator,
        orderNumber: data.orderNumber,
        disputeReason: data.disputeReason,
        disputeDescription: data.disputeDescription,
        initiatorName: data.initiatorName,
        disputeUrl: data.disputeUrl,
        orderUrl: data.orderUrl,
      })
    );

    const subject = data.isInitiator
      ? `Dispute filed for order ${data.orderNumber}`
      : `Dispute notification for order ${data.orderNumber}`;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject,
      html: emailHtml,
    });

    console.log("Dispute filed email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending dispute filed email:", error);
    throw error;
  }
}

/**
 * Send dispute message notification email
 */
export async function sendDisputeMessageEmail(data: DisputeMessageEmailData) {
  try {
    const emailHtml = await render(
      DisputeMessageEmail({
        recipientName: data.recipientName,
        orderNumber: data.orderNumber,
        senderName: data.senderName,
        messagePreview: data.messagePreview,
        disputeUrl: data.disputeUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `New message in dispute for order ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log("Dispute message email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending dispute message email:", error);
    throw error;
  }
}

/**
 * Send dispute resolved notification email
 */
export async function sendDisputeResolvedEmail(data: DisputeResolvedEmailData) {
  try {
    const emailHtml = await render(
      DisputeResolvedEmail({
        recipientName: data.recipientName,
        orderNumber: data.orderNumber,
        disputeReason: data.disputeReason,
        resolution: data.resolution,
        finalStatus: data.finalStatus,
        refundAmount: data.refundAmount,
        disputeUrl: data.disputeUrl,
        orderUrl: data.orderUrl,
      })
    );

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `Dispute resolved for order ${data.orderNumber}`,
      html: emailHtml,
    });

    console.log("Dispute resolved email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending dispute resolved email:", error);
    throw error;
  }
}

/**
 * Send dispute status update notification
 */
export async function sendDisputeStatusUpdateEmail(params: {
  to: string;
  recipientName: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  disputeUrl: string;
}) {
  try {
    // For status updates other than resolution, we can use a simplified version
    // or create a dedicated template if needed
    const statusMessages: Record<string, string> = {
      UNDER_REVIEW: "Your dispute is now under review by our team.",
      ESCALATED: "Your dispute has been escalated for further review.",
      CLOSED: "Your dispute has been closed.",
    };

    const message = statusMessages[params.newStatus] || `Your dispute status has been updated to ${params.newStatus}.`;

    // For now, we'll use the basic email format
    // In production, you might want to create a dedicated template for this
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Dispute Status Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2563eb; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Fixers</h1>
            </div>
            <div style="padding: 48px;">
              <h2 style="font-size: 24px; color: #1f2937; margin: 0 0 16px;">Dispute Status Update</h2>
              <p style="font-size: 16px; color: #374151; line-height: 24px;">Hi ${params.recipientName},</p>
              <p style="font-size: 16px; color: #374151; line-height: 24px;">
                The status of your dispute for order <strong>${params.orderNumber}</strong> has been updated.
              </p>
              <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="font-size: 14px; font-weight: 600; color: #1e40af; margin: 0 0 8px;">Status Update</p>
                <p style="font-size: 16px; color: #1f2937; margin: 0;">${message}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${params.disputeUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Dispute</a>
              </div>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding: 24px; text-align: center;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">© 2025 Fixers. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `Dispute status update for order ${params.orderNumber}`,
      html: htmlContent,
    });

    console.log("Dispute status update email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending dispute status update email:", error);
    throw error;
  }
}
