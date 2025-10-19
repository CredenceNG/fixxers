import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Fixers <noreply@fixxers.ng>";

/**
 * Send payment confirmation email to fixer
 */
export async function sendPaymentConfirmationEmail({
  to,
  fixerName,
  badgeName,
  amount,
  requestId,
}: {
  to: string;
  fixerName: string;
  badgeName: string;
  amount: number;
  requestId: string;
}) {
  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString("en-NG")}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Payment Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${fixerName},</p>

              <p>We've successfully received your payment for the <strong>${badgeName}</strong> badge.</p>

              <p><strong>Payment Details:</strong></p>
              <ul>
                <li>Badge: ${badgeName}</li>
                <li>Amount: ${formattedAmount}</li>
                <li>Status: Paid</li>
              </ul>

              <p>Your badge request is now queued for admin review. We'll review your documents within 24-48 hours and notify you of the outcome.</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/fixer/badges/requests/${requestId}" class="button">
                View Request Status
              </a>

              <p>Thank you for choosing Fixers!</p>
            </div>
            <div class="footer">
              <p>Fixers - Building Trust in Nigerian Services</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Confirmed - ${badgeName} Badge Request`,
      html,
    });

    console.log("Payment confirmation email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    throw error;
  }
}

/**
 * Send payment failure email to fixer
 */
export async function sendPaymentFailureEmail({
  to,
  fixerName,
  badgeName,
  errorMessage,
  requestId,
}: {
  to: string;
  fixerName: string;
  badgeName: string;
  errorMessage?: string;
  requestId: string;
}) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Payment Failed</h1>
            </div>
            <div class="content">
              <p>Hi ${fixerName},</p>

              <p>Unfortunately, your payment for the <strong>${badgeName}</strong> badge was unsuccessful.</p>

              ${errorMessage ? `<p><strong>Reason:</strong> ${errorMessage}</p>` : ""}

              <p>Please try again with a different payment method or contact your bank if the issue persists.</p>

              <a href="${process.env.NEXT_PUBLIC_APP_URL}/fixer/badges/payment/${requestId}" class="button">
                Retry Payment
              </a>

              <p>Need help? Contact our support team at support@fixxers.ng</p>
            </div>
            <div class="footer">
              <p>Fixers - Building Trust in Nigerian Services</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Failed - ${badgeName} Badge Request`,
      html,
    });

    console.log("Payment failure email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending payment failure email:", error);
    throw error;
  }
}

/**
 * Send refund notification email to fixer
 */
export async function sendRefundNotificationEmail({
  to,
  fixerName,
  badgeName,
  amount,
  reason,
}: {
  to: string;
  fixerName: string;
  badgeName: string;
  amount: number;
  reason?: string;
}) {
  try {
    const formattedAmount = `₦${(amount / 100).toLocaleString("en-NG")}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Refund Processed</h1>
            </div>
            <div class="content">
              <p>Hi ${fixerName},</p>

              <p>A refund of <strong>${formattedAmount}</strong> has been processed for your <strong>${badgeName}</strong> badge request.</p>

              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}

              <p>The refund will appear in your account within 5-10 business days, depending on your bank.</p>

              <p>If you have any questions, please contact support@fixxers.ng</p>
            </div>
            <div class="footer">
              <p>Fixers - Building Trust in Nigerian Services</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Refund Processed - ${badgeName} Badge Request`,
      html,
    });

    console.log("Refund notification email sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending refund notification email:", error);
    throw error;
  }
}
