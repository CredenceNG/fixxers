# UploadThing Setup Guide

## 📝 Quick Setup (5 minutes)

### 1. Create UploadThing Account

1. Go to [uploadthing.com](https://uploadthing.com)
2. Click "Sign In" (supports GitHub, Google, Email)
3. Sign in or create account

### 2. Create New App

1. Click "Create a new app"
2. App name: **Fixxers Reviews**
3. Click "Create App"

### 3. Get API Keys

1. In your app dashboard, go to "API Keys"
2. Copy the credentials shown

### 4. Add to Environment Variables

Add this to your `.env` file:

```env
# UploadThing Configuration (Modern API)
UPLOADTHING_TOKEN="base64_encoded_json_token_from_uploadthing_dashboard"
```

**How to get your token:**

1. In your UploadThing dashboard, go to "API Keys"
2. Copy the "Token" (not the individual keys)
3. The token is a base64 encoded JSON object containing your API key, app ID, and regions

### 5. Restart Development Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 6. Test Upload

1. Navigate to review submission form (once created)
2. Try uploading a photo
3. Check UploadThing dashboard for uploaded files

---

## 🔧 Configuration Summary

**Current Settings:**

- Max file size: **4MB**
- Max files per review: **5**
- Allowed types: **JPG, PNG, WEBP**
- Authentication: **Required** (logged-in users only)

**To modify these settings:**
Edit `/app/api/uploadthing/core.ts`

---

## 🧪 Testing Uploads

### Local Testing (Development)

```bash
# Server must be running
npm run dev

# Upload test image
# Navigate to: http://localhost:3010/orders/[orderId]/review
# Drag-drop a photo or click to browse
```

### Check Upload Success

1. Go to [uploadthing.com](https://uploadthing.com)
2. Click on your app
3. Go to "Files" tab
4. See uploaded files with metadata

---

## 📊 UploadThing Dashboard Features

- **Files**: View all uploaded files
- **Analytics**: Upload stats and bandwidth usage
- **API Keys**: Manage credentials
- **Settings**: App configuration
- **Webhooks**: Upload event notifications (optional)

---

## 🔒 Security Notes

- **Never commit** `.env` file to git (already in `.gitignore`)
- **Use different keys** for development and production
- **Rotate keys** if compromised
- **Monitor usage** in UploadThing dashboard

---

## 💰 Pricing (Free Tier)

UploadThing free tier includes:

- **2 GB** storage
- **2 GB** bandwidth per month
- **Unlimited** uploads

Perfect for early development and testing!

---

## 🆘 Troubleshooting

### "Unauthorized" Error

- Check `.env` has correct `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID`
- Restart dev server after adding env vars
- Verify user is logged in

### Upload Fails

- Check file size (must be < 4MB)
- Check file type (JPG/PNG/WEBP only)
- Check internet connection
- Check UploadThing dashboard for errors

### Photos Not Displaying

- Verify URLs are saved to database
- Check browser console for CORS errors
- Verify UploadThing CDN is accessible

---

## ✅ Setup Complete When:

- [ ] UploadThing account created
- [ ] App created
- [ ] API keys in `.env` file
- [ ] Dev server restarted
- [ ] Test upload successful
- [ ] Photos visible in UploadThing dashboard

**Once complete, proceed to Review Submission Flow implementation!** 🚀
