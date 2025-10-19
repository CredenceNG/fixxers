import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Only initialize Twilio client if we have valid credentials and not in development
const client =
  process.env.NODE_ENV === 'production' &&
  accountSid &&
  authToken &&
  accountSid.startsWith('AC')
    ? twilio(accountSid, authToken)
    : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendMagicLinkSMS(phone: string, token: string, isRegistration = false) {
  const magicLink = `${APP_URL}/auth/verify?token=${token}`;
  const message = isRegistration
    ? `Welcome to Fixers! Click to complete registration: ${magicLink} (Expires in 15 min)`
    : `Your Fixers login link: ${magicLink} (Expires in 15 min)`;

  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📱 MAGIC LINK SMS (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${phone}`);
    console.log(`Type: ${isRegistration ? 'Registration' : 'Login'}`);
    console.log('\n💬 Message:');
    console.log(`   ${message}`);
    console.log('\n🔗 Magic Link:');
    console.log(`   ${magicLink}`);
    console.log('\n⏰ Expires in 15 minutes');
    console.log('='.repeat(80) + '\n');
    return { success: true };
  }

  // In production, send actual SMS
  if (!client || !fromPhone) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: phone,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}

export async function sendInvitationSMS(phone: string, invitedBy: string, role: 'CLIENT' | 'FIXER', token: string) {
  if (!client || !fromPhone) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  const magicLink = `${APP_URL}/auth/verify?token=${token}&invited=true`;
  const roleText = role === 'FIXER' ? 'service provider' : 'client';
  const message = `${invitedBy} invited you to join Fixers as a ${roleText}. Accept: ${magicLink} (Expires in 15 min)`;

  try {
    await client.messages.create({
      body: message,
      from: fromPhone,
      to: phone,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}
