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
