// Twilio SMS utility
// In development, we just log to console. In production, use Twilio API.

export async function sendSMS(to: string, message: string) {
  // In development, just log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📱 SMS (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(80) + '\n');
    return { success: true };
  }

  // In production, use Twilio
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    console.error('Twilio not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    // Import Twilio only in production to avoid unnecessary dependencies in dev
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error };
  }
}
