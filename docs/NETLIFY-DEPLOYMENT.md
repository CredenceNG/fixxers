# Netlify Deployment Guide

Complete guide for deploying Fixxers platform to Netlify with all environment variables and configurations.

## 📋 Prerequisites

- [x] GitHub repository: https://github.com/CredenceNG/fixxers.git
- [ ] Netlify account
- [ ] Neon database (already configured)
- [ ] Paystack account (for Nigerian payments)
- [ ] Resend account (for emails)
- [ ] Other third-party service accounts

---

## 🚀 Quick Deploy

### Step 1: Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize Netlify
4. Select repository: `CredenceNG/fixxers`
5. Configure build settings:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Framework**: Next.js

### Step 2: Configure Environment Variables

Go to: **Site settings** → **Environment variables** → **Add a variable**

#### Required Variables (Copy from your .env)

```bash
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=same-as-jwt-or-different-secret

# Email (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payments - Paystack (PRIMARY for Nigerian market)
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key

# Payments - Stripe (OPTIONAL for international)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI (OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key

# Real-time (Pusher)
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=mt1

# File Uploads (UploadThing)
UPLOADTHING_TOKEN=your_uploadthing_token

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.netlify.app
PLATFORM_FEE_PERCENTAGE=10

# Cron Jobs (for scheduled tasks)
CRON_SECRET=Tm2n2vVcJBsGHgx+/n1OYmaDaaukFwNLuzlXDGoMhD0=

# Optional: Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

### Step 3: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (5-10 minutes)
3. Your site will be live at: `https://[random-name].netlify.app`

---

## 🔧 Post-Deployment Configuration

### 1. Custom Domain Setup

1. **Go to**: Site settings → Domain management → Add custom domain
2. **Add domain**: `yourdomain.com`
3. **Configure DNS** (at your domain registrar):
   ```
   Type: A
   Name: @
   Value: 75.2.60.5

   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```
4. **Enable HTTPS**: Netlify auto-provisions SSL (Let's Encrypt)

### 2. Configure Webhooks

#### Paystack Webhook
1. Go to: [Paystack Dashboard](https://dashboard.paystack.com/) → Settings → Webhooks
2. **Webhook URL**: `https://yourdomain.com/api/webhooks/paystack`
3. **Events to listen to**:
   - `charge.success`
   - `transfer.success`
   - `transfer.failed`
4. Copy the **Webhook Secret** (update in Netlify env vars if needed)

#### Stripe Webhook (if using)
1. Go to: [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Events to listen to**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
4. Copy **Signing secret** → Add to Netlify as `STRIPE_WEBHOOK_SECRET`

### 3. Setup Scheduled Functions (Cron Jobs)

Netlify supports scheduled functions. Create `netlify.toml`:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

# Scheduled Functions
[[functions]]
  path = "/.netlify/functions/send-review-emails"
  schedule = "0 9 * * *"  # Daily at 9 AM UTC

[[functions]]
  path = "/.netlify/functions/update-response-times"
  schedule = "0 */6 * * *"  # Every 6 hours
```

### 4. Email Domain Verification (Resend)

1. Go to: [Resend Dashboard](https://resend.com/domains)
2. Add your domain: `yourdomain.com`
3. Add DNS records provided by Resend:
   ```
   Type: TXT
   Name: _resend
   Value: [verification-string]

   Type: MX
   Name: @
   Priority: 10
   Value: feedback-smtp.us-east-1.amazonses.com
   ```
4. Update `RESEND_FROM_EMAIL` to use your domain: `noreply@yourdomain.com`

---

## 🔒 Security Checklist

- [ ] All API keys are **production/live** keys (not test)
- [ ] `JWT_SECRET` and `NEXTAUTH_SECRET` are strong random strings
- [ ] `CRON_SECRET` is set and kept private
- [ ] Database connection uses SSL (`?sslmode=require`)
- [ ] Webhook secrets are configured
- [ ] CORS is properly configured (Next.js handles this)
- [ ] Rate limiting is enabled (Upstash Redis recommended)

---

## 📊 Database Management

### Running Migrations on Netlify

Netlify runs builds in ephemeral containers, so you need to run migrations during build:

**Option 1: Add to build command**
```json
// package.json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```

**Option 2: Use Netlify Build Plugin**
Create `.netlify/plugins/prisma-build/index.js`:
```javascript
module.exports = {
  onPreBuild: async ({ utils }) => {
    await utils.run.command("npx prisma generate");
    await utils.run.command("npx prisma db push");
  }
};
```

### Neon Database Branches

For staging/production separation:
1. Create production branch in [Neon Console](https://console.neon.tech/)
2. Use different `DATABASE_URL` for staging vs production
3. In Netlify: Set different env vars per environment

---

## 🧪 Testing Deployment

### 1. Health Check
Visit: `https://yourdomain.com/api/health` (create this endpoint)

### 2. Test Payment Webhooks
```bash
# Test Paystack webhook
curl -X POST https://yourdomain.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: test" \
  -d '{"event": "charge.success"}'
```

### 3. Test Cron Jobs
Visit: `https://yourdomain.com/api/cron/send-review-emails?secret=YOUR_CRON_SECRET`

---

## 🚨 Troubleshooting

### Build Failures

**Issue**: `Module not found` errors
```bash
# Solution: Clear cache and rebuild
netlify build --clear-cache
```

**Issue**: Database connection timeout
```bash
# Solution: Check DATABASE_URL has ?sslmode=require
# Verify Neon database is accessible
```

### Runtime Errors

**Issue**: Environment variables not loading
- Verify variables are set in Netlify UI (not just .env.local)
- Redeploy after adding new variables

**Issue**: Webhooks not working
- Check webhook URLs match exactly
- Verify webhook secrets are correct
- Check Netlify function logs

---

## 📈 Monitoring & Analytics

### 1. Netlify Analytics
- Go to: Site settings → Analytics
- Enable Netlify Analytics (paid feature)

### 2. Error Tracking
Consider adding:
- [Sentry](https://sentry.io/) for error tracking
- [LogRocket](https://logrocket.com/) for session replay

### 3. Performance Monitoring
- Netlify Edge Analytics
- [Next.js Analytics](https://nextjs.org/analytics)

---

## 🔄 Continuous Deployment

### Automatic Deployments
- **Main branch**: Auto-deploys to production
- **Pull requests**: Auto-creates preview deployments
- **Branch deployments**: Configure in Netlify settings

### Deploy Hooks
Create deploy hooks for manual triggers:
1. Go to: Site settings → Build & deploy → Build hooks
2. Create hook: "Production Deploy"
3. Use webhook URL to trigger deploys via API

---

## 📝 Environment-Specific Configuration

### Production
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
DATABASE_URL=[production-neon-url]
PAYSTACK_SECRET_KEY=sk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

### Staging (Deploy preview)
```bash
NEXT_PUBLIC_APP_URL=https://staging.yourdomain.com
DATABASE_URL=[staging-neon-url]
PAYSTACK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## ✅ Final Checklist

- [ ] All environment variables configured in Netlify
- [ ] Custom domain configured and SSL enabled
- [ ] Paystack webhook configured and tested
- [ ] Stripe webhook configured (if using)
- [ ] Email domain verified in Resend
- [ ] Cron jobs scheduled
- [ ] Database migrations run successfully
- [ ] Production site accessible
- [ ] Test payment flow end-to-end
- [ ] Test email sending
- [ ] Monitor error logs for first 24 hours

---

## 🆘 Support

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js on Netlify**: https://docs.netlify.com/integrations/frameworks/next-js/
- **Neon Database**: https://neon.tech/docs
- **Paystack API**: https://paystack.com/docs/api/

## 🎉 You're Live!

Your Fixxers platform is now deployed on Netlify with:
- ✅ Serverless Next.js
- ✅ Neon PostgreSQL database
- ✅ Paystack payments
- ✅ Email notifications
- ✅ File uploads
- ✅ Scheduled cron jobs
- ✅ SSL/HTTPS enabled
