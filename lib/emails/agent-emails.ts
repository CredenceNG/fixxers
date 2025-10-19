import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Fixers <noreply@fixxers.ng>';

interface AgentApprovalEmailData {
  to: string;
  agentName: string;
  businessName?: string;
  commissionRate: number;
  dashboardUrl: string;
}

interface AgentRejectionEmailData {
  to: string;
  agentName: string;
  rejectionReason: string;
  supportUrl: string;
}

interface AgentCommissionEmailData {
  to: string;
  agentName: string;
  amount: number;
  orderId: string;
  percentage: number;
  earningsUrl: string;
}

interface AgentTerritoryApprovedEmailData {
  to: string;
  agentName: string;
  neighborhoods: string[];
  dashboardUrl: string;
}

/**
 * Send agent approval email
 */
export async function sendAgentApprovalEmail(data: AgentApprovalEmailData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4F46E5; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Fixers Agent Program!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.agentName},</p>

              <p>Congratulations! Your agent application has been approved.</p>

              ${data.businessName ? `<p>Your business <strong>${data.businessName}</strong> is now an official Fixers agent.</p>` : ''}

              <div class="info-box">
                <h3>Your Commission Rate</h3>
                <p style="font-size: 24px; color: #4F46E5; margin: 10px 0;"><strong>${data.commissionRate}%</strong></p>
                <p style="font-size: 14px; color: #666;">You'll earn this percentage on all orders from fixers and clients you manage.</p>
              </div>

              <h3>Next Steps:</h3>
              <ol>
                <li>Register fixers and help them create professional profiles</li>
                <li>Add clients and submit service requests on their behalf</li>
                <li>Monitor your earnings and commission tracking</li>
                <li>Expand your territory by requesting new neighborhoods</li>
              </ol>

              <a href="${data.dashboardUrl}" class="button">Go to Agent Dashboard</a>

              <p>If you have any questions, feel free to reach out to our support team.</p>

              <p>Best regards,<br>The Fixers Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: '🎉 Your Fixers Agent Application is Approved!',
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending agent approval email:', error);
    return { success: false, error };
  }
}

/**
 * Send agent rejection email
 */
export async function sendAgentRejectionEmail(data: AgentRejectionEmailData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: #FEE2E2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #EF4444; }
            .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Agent Application Update</h1>
            </div>
            <div class="content">
              <p>Hi ${data.agentName},</p>

              <p>Thank you for your interest in becoming a Fixers agent. After careful review, we're unable to approve your application at this time.</p>

              <div class="info-box">
                <h3>Reason:</h3>
                <p>${data.rejectionReason}</p>
              </div>

              <p>If you believe this was an error or have additional information to share, please contact our support team.</p>

              <a href="${data.supportUrl}" class="button">Contact Support</a>

              <p>Thank you for your understanding.</p>

              <p>Best regards,<br>The Fixers Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: 'Fixers Agent Application Update',
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending agent rejection email:', error);
    return { success: false, error };
  }
}

/**
 * Send commission earned notification email
 */
export async function sendCommissionEarnedEmail(data: AgentCommissionEmailData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .amount { font-size: 36px; color: #10B981; font-weight: bold; text-align: center; margin: 20px 0; }
            .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Commission Earned!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.agentName},</p>

              <p>Great news! You've earned a commission from a completed order.</p>

              <div class="amount">₦${data.amount.toLocaleString()}</div>

              <div class="info-box">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Order ID:</td>
                    <td style="padding: 8px 0; text-align: right;"><strong>#${data.orderId.slice(0, 8)}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Commission Rate:</td>
                    <td style="padding: 8px 0; text-align: right;"><strong>${data.percentage}%</strong></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Status:</td>
                    <td style="padding: 8px 0; text-align: right;"><span style="background: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Pending</span></td>
                  </tr>
                </table>
              </div>

              <p>This commission has been added to your wallet balance and can be withdrawn at any time.</p>

              <a href="${data.earningsUrl}" class="button">View Earnings</a>

              <p>Keep up the great work!</p>

              <p>Best regards,<br>The Fixers Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: `💰 You earned ₦${data.amount.toLocaleString()} commission!`,
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending commission earned email:', error);
    return { success: false, error };
  }
}

/**
 * Send territory approved email
 */
export async function sendTerritoryApprovedEmail(data: AgentTerritoryApprovedEmailData) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .neighborhoods { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .neighborhood-tag { background: #E0E7FF; color: #4338CA; padding: 6px 12px; border-radius: 12px; display: inline-block; margin: 4px; font-size: 14px; }
            .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌍 Territory Expansion Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.agentName},</p>

              <p>Your request to expand your operating territory has been approved!</p>

              <h3>Newly Approved Neighborhoods:</h3>
              <div class="neighborhoods">
                ${data.neighborhoods.map(n => `<span class="neighborhood-tag">${n}</span>`).join('')}
              </div>

              <p>You can now:</p>
              <ul>
                <li>Submit quotes in these new areas</li>
                <li>Create service requests for clients in these neighborhoods</li>
                <li>Manage fixers operating in these locations</li>
              </ul>

              <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>

              <p>Best regards,<br>The Fixers Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.to,
      subject: '🌍 Your Territory Has Been Expanded!',
      html,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending territory approved email:', error);
    return { success: false, error };
  }
}
