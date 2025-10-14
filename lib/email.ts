import { Resend } from 'resend';

// Initialize Resend if we have a valid API key
// Can be forced in development with FORCE_SEND_EMAILS=true
const resend =
  process.env.RESEND_API_KEY && (process.env.NODE_ENV === 'production' || process.env.FORCE_SEND_EMAILS === 'true')
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendMagicLinkEmail(email: string, token: string, isRegistration = false, redirectUrl?: string) {
  const magicLink = redirectUrl
    ? `${APP_URL}/auth/verify?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`
    : `${APP_URL}/auth/verify?token=${token}`;
  const subject = isRegistration ? 'Complete Your Registration' : 'Login to Fixxers';

  // In development, log to console unless FORCE_SEND_EMAILS is set
  if (process.env.NODE_ENV === 'development' && process.env.FORCE_SEND_EMAILS !== 'true') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 MAGIC LINK EMAIL (Development Mode - Console Only)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Type: ${isRegistration ? 'Registration' : 'Login'}`);
    console.log('\n🔗 Magic Link:');
    console.log(`   ${magicLink}`);
    console.log('\n⏰ Expires in 15 minutes');
    console.log('💡 Tip: Set FORCE_SEND_EMAILS=true to send real emails in development');
    console.log('='.repeat(80) + '\n');
    return { success: true };
  }

  // In production, send actual email
  if (!resend) {
    console.error('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${isRegistration ? 'Welcome to Fixxers!' : 'Login to Fixxers'}</h2>
              <p>${isRegistration ? 'Click the button below to complete your registration:' : 'Click the button below to login to your account:'}</p>
              <a href="${magicLink}" class="button" target="fixxers-app">
                ${isRegistration ? 'Complete Registration' : 'Login Now'}
              </a>
              <p style="margin-top: 20px; font-size: 14px;">
                Or copy and paste this link into your browser (if you have the app open, paste it in the address bar of that tab):<br>
                <span style="color: #2563eb;">${magicLink}</span>
              </p>
              <p style="color: #dc2626; font-weight: bold;">
                This link will expire in 15 minutes.
              </p>
              <div class="footer">
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} Fixxers. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Generic email sending function
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('\n📄 HTML Content (truncated):');
    console.log(html.substring(0, 200) + '...');
    console.log('='.repeat(80) + '\n');
    return { success: true };
  }

  // In production, send actual email
  if (!resend) {
    console.error('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendInvitationEmail(email: string, invitedBy: string, role: 'CLIENT' | 'FIXER', token: string) {
  const magicLink = `${APP_URL}/auth/verify?token=${token}&invited=true`;
  const roleText = role === 'FIXER' ? 'service provider' : 'client';

  // In development or without API key, log to console
  if (!resend) {
    console.log('\n' + '='.repeat(80));
    console.log('INVITATION EMAIL (Not sent - Development Mode)');
    console.log('='.repeat(80));
    console.log('To:', email);
    console.log('Invited by:', invitedBy);
    console.log('Role:', roleText);
    console.log('Magic Link:', magicLink);
    console.log('='.repeat(80) + '\n');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You've been invited to join Fixxers as a ${roleText}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f9f9f9;
                border-radius: 10px;
                padding: 30px;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                padding: 12px 30px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>You've been invited to Fixxers!</h2>
              <p>${invitedBy} has invited you to join Fixxers as a ${roleText}.</p>
              <p>Click the button below to accept the invitation and set up your account:</p>
              <a href="${magicLink}" class="button">Accept Invitation</a>
              <p style="margin-top: 20px; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <span style="color: #2563eb;">${magicLink}</span>
              </p>
              <p style="color: #dc2626; font-weight: bold;">
                This link will expire in 15 minutes.
              </p>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Fixxers. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
}

// Fixer Profile Approval/Rejection Emails
export async function sendFixerApprovalEmail(email: string, fixerName: string) {
  const dashboardLink = `${APP_URL}/fixer/dashboard`;

  return sendEmail({
    to: email,
    subject: 'Congratulations! Your Fixer Profile is Approved',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Congratulations, ${fixerName}!</h2>
            <p>Great news! Your fixer profile has been approved and is now active on FIXI-NG.</p>
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Start browsing and responding to service requests</li>
              <li>Create service offers (gigs) to showcase your skills</li>
              <li>Build your reputation by delivering quality work</li>
              <li>Earn money by providing excellent services</li>
            </ul>
            <a href="${dashboardLink}" class="button">Go to Dashboard</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${dashboardLink}</span>
            </p>
            <div class="footer">
              <p>Welcome to the FIXI-NG community!</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendFixerRejectionEmail(email: string, fixerName: string, reason?: string) {
  const profileLink = `${APP_URL}/fixer/profile`;

  return sendEmail({
    to: email,
    subject: 'Update on Your Fixer Application',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .reason-box {
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Update on Your Fixer Application</h2>
            <p>Hello ${fixerName},</p>
            <p>Thank you for your interest in becoming a fixer on FIXI-NG. After reviewing your application, we need you to make some updates to your profile before we can approve it.</p>
            ${reason ? `
            <div class="reason-box">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            ` : ''}
            <p><strong>Next steps:</strong></p>
            <ul>
              <li>Review your profile information</li>
              <li>Make the necessary updates</li>
              <li>Resubmit for approval</li>
            </ul>
            <a href="${profileLink}" class="button">Update Profile</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${profileLink}</span>
            </p>
            <div class="footer">
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// Service Request Approval/Rejection Emails
export async function sendRequestApprovalEmail(email: string, clientName: string, requestTitle: string, requestId: string) {
  const requestLink = `${APP_URL}/client/requests/${requestId}`;

  return sendEmail({
    to: email,
    subject: 'Your Service Request is Now Live!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>✅ Your Service Request is Approved!</h2>
            <p>Hello ${clientName},</p>
            <p>Great news! Your service request "<strong>${requestTitle}</strong>" has been approved and is now visible to fixers on FIXI-NG.</p>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Qualified fixers will review your request</li>
              <li>You'll receive quotes from interested fixers</li>
              <li>Compare quotes and choose the best fixer for your job</li>
              <li>Chat with fixers to clarify details</li>
            </ul>
            <a href="${requestLink}" class="button">View Request & Quotes</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${requestLink}</span>
            </p>
            <div class="footer">
              <p>We'll notify you as soon as fixers start submitting quotes!</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendRequestRejectionEmail(email: string, clientName: string, requestTitle: string, reason?: string) {
  const requestsLink = `${APP_URL}/client/requests/new`;

  return sendEmail({
    to: email,
    subject: 'Update on Your Service Request',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .reason-box {
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Update on Your Service Request</h2>
            <p>Hello ${clientName},</p>
            <p>Thank you for submitting your service request "<strong>${requestTitle}</strong>" on FIXI-NG. Unfortunately, we're unable to approve this request at this time.</p>
            ${reason ? `
            <div class="reason-box">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            ` : ''}
            <p><strong>What you can do:</strong></p>
            <ul>
              <li>Review our service request guidelines</li>
              <li>Provide more details about your service needs</li>
              <li>Submit a new request with updated information</li>
            </ul>
            <a href="${requestsLink}" class="button">Create New Request</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${requestsLink}</span>
            </p>
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

// Gig (Service Offer) Approval/Rejection Emails
export async function sendGigApprovalEmail(email: string, fixerName: string, gigTitle: string, gigSlug: string) {
  const gigLink = `${APP_URL}/gigs/${gigSlug}`;

  return sendEmail({
    to: email,
    subject: 'Your Service Offer is Now Live!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>🎉 Your Service Offer is Live!</h2>
            <p>Hello ${fixerName},</p>
            <p>Excellent news! Your service offer "<strong>${gigTitle}</strong>" has been approved and is now visible to clients on FIXI-NG.</p>
            <p><strong>Start getting orders:</strong></p>
            <ul>
              <li>Your gig is now searchable by clients</li>
              <li>Clients can order your services directly</li>
              <li>You'll be notified when someone places an order</li>
              <li>Deliver great work to build your reputation</li>
            </ul>
            <a href="${gigLink}" class="button">View Your Gig</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${gigLink}</span>
            </p>
            <div class="footer">
              <p>💡 Tip: Share your gig link on social media to attract more clients!</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendGigRejectionEmail(email: string, fixerName: string, gigTitle: string, reason: string) {
  const gigsLink = `${APP_URL}/fixer/gigs`;

  return sendEmail({
    to: email,
    subject: 'Update on Your Service Offer',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .reason-box {
              background: #fef2f2;
              border-left: 4px solid #dc2626;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Update on Your Service Offer</h2>
            <p>Hello ${fixerName},</p>
            <p>Thank you for submitting your service offer "<strong>${gigTitle}</strong>". After review, we need you to make some updates before we can approve it.</p>
            <div class="reason-box">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            <p><strong>Next steps:</strong></p>
            <ul>
              <li>Review your gig details</li>
              <li>Make the necessary updates</li>
              <li>Resubmit for approval</li>
            </ul>
            <a href="${gigsLink}" class="button">Edit Your Gig</a>
            <p style="margin-top: 20px; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <span style="color: #2563eb;">${gigsLink}</span>
            </p>
            <div class="footer">
              <p>We're here to help! If you have questions, contact our support team.</p>
              <p>&copy; ${new Date().getFullYear()} FIXI-NG. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
