# Email Notification Flow - Visual Guide

## Timeline Overview

```
Order Completion → Review Request → Review Expiring → Window Closes
     (Day 0)         (Day 3)          (Day 27)         (Day 30)
```

## Detailed Email Flow

### 1. Review Request Email (Day 3)

**Trigger**: 3 days after order completion
**Recipient**: Client
**Purpose**: Encourage fresh review while experience is recent

```
┌─────────────────────────────────────┐
│   📧 REVIEW REQUEST EMAIL           │
├─────────────────────────────────────┤
│                                     │
│  Subject: Share your experience     │
│           with [Fixer Name]         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Fixxers                      │ │  (Blue Header)
│  └───────────────────────────────┘ │
│                                     │
│  Hi [Client Name],                  │
│                                     │
│  How was your experience with       │
│  [Fixer Name] for [Service]?        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Leave Your Review           │ │  (Blue CTA Button)
│  └───────────────────────────────┘ │
│                                     │
│  ⏰ 27 days remaining                │
│                                     │
│  💡 Tips for your review:           │
│  • Did they meet expectations?      │
│  • Were they professional?          │
│  • Would you recommend them?        │
│  • Upload photos of the work!       │
│                                     │
│  Order ID: #12345                   │
│  Support: help@fixxers.com          │
└─────────────────────────────────────┘
```

**Conversion Goal**: 40% review completion rate

---

### 2. Review Expiring Email (Day 27)

**Trigger**: 27 days after order completion
**Recipient**: Client
**Purpose**: Create urgency before window closes

```
┌─────────────────────────────────────┐
│   📧 REVIEW EXPIRING EMAIL          │
├─────────────────────────────────────┤
│                                     │
│  Subject: Last chance to review     │
│           [Fixer Name]              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Fixxers                      │ │  (Blue Header)
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⏰ Review Window Expiring Soon│ │  (Yellow Warning)
│  └───────────────────────────────┘ │
│                                     │
│  Hi [Client Name],                  │
│                                     │
│  Your review window for             │
│  [Fixer Name] is expiring soon!     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │     Only 3 days remaining     │ │  (Red Urgency Box)
│  │                               │ │
│  │  After that, you won't be     │ │
│  │  able to leave a review       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Leave Review Before It's Late │ │  (Red CTA Button)
│  └───────────────────────────────┘ │
│                                     │
│  ⭐ Quick Review (2 minutes):        │
│  • Rate 1-5 stars                   │
│  • Share what went well             │
│  • Add photos (optional)            │
│                                     │
│  Don't miss your chance!            │
│                                     │
│  Service: [Service Name]            │
│  Order ID: #12345                   │
└─────────────────────────────────────┘
```

**Conversion Goal**: 20% review completion rate (from non-responders)

---

### 3. Review Received Email (Immediate)

**Trigger**: When client submits review
**Recipient**: Fixer
**Purpose**: Notify and encourage response

```
┌─────────────────────────────────────┐
│   📧 REVIEW RECEIVED EMAIL          │
├─────────────────────────────────────┤
│                                     │
│  Subject: You received a new review │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Fixxers                      │ │  (Blue Header)
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🎉 You Received a New Review!│ │  (Green Success)
│  └───────────────────────────────┘ │
│                                     │
│  Hi [Fixer Name],                   │
│                                     │
│  Great news! A client just left     │
│  a review for your service.         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │       ⭐⭐⭐⭐⭐             │ │
│  │     5 out of 5 stars          │ │  (Rating Display)
│  │                               │ │
│  │  Review by: [Client Name]     │ │
│  │                               │ │
│  │  Comment:                     │ │
│  │  "Great service! Very         │ │
│  │   professional and..."        │ │  (Comment Preview)
│  │                               │ │
│  │  Service: [Service Name]      │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  View Full Review & Respond   │ │  (Blue CTA Button)
│  └───────────────────────────────┘ │
│                                     │
│  💡 Tips for Responding:            │
│  • Thank the client                 │
│  • Be professional                  │
│  • Address concerns                 │
│  • Keep it brief (2-3 sentences)    │
│                                     │
│  💼 Why responding matters:         │
│  Responses show you care about      │
│  feedback and help build trust.     │
│                                     │
│  Order ID: #12345                   │
└─────────────────────────────────────┘
```

**Conversion Goal**: 60% fixer response rate

---

## Email Sending Schedule

### Daily Cron Job (3 AM UTC)

```
┌──────────────────────────────────────────────┐
│  Cron Job: send-review-emails               │
│  Schedule: Daily at 3:00 AM UTC             │
│  Endpoint: /api/cron/send-review-emails     │
└──────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Query Database for:  │
        │  1. Orders @ Day 3    │
        │  2. Orders @ Day 27   │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐       ┌──────────────┐
│ Send Review  │       │ Send Expiring│
│ Requests     │       │ Reminders    │
└──────────────┘       └──────────────┘
        │                       │
        └───────────┬───────────┘
                    ▼
        ┌───────────────────────┐
        │  Log Results:         │
        │  • Sent: 8 emails     │
        │  • Failed: 1 email    │
        │  • Errors: [...]      │
        └───────────────────────┘
```

---

## User Experience Flow

### Client Perspective

```
Complete Order
    │
    │ (3 days later)
    ▼
Receive "Review Request" Email ─── Click CTA ──┐
    │                                           │
    │ (if ignored)                              │
    │ (24 days later)                           │
    ▼                                           │
Receive "Review Expiring" Email ─ Click CTA ───┤
    │                                           │
    │ (if ignored)                              │
    │ (3 days later)                            │
    ▼                                           │
Review Window Closes                            │
                                                │
    ┌───────────────────────────────────────────┘
    │
    ▼
Review Submission Page
    │
    ▼
Submit Review (rating + comment + photos)
    │
    ▼
Success Confirmation
```

### Fixer Perspective

```
Client Submits Review
    │
    │ (immediate)
    ▼
Receive "Review Received" Email
    │
    ▼
Click "View Full Review & Respond"
    │
    ▼
Dashboard Reviews Page
    │
    ▼
Read Full Review
    │
    ▼
Write Response (optional)
    │
    ▼
Response Visible to Public
```

---

## Email Design Patterns

### Color Coding

| Email Type      | Primary Color   | Purpose      |
| --------------- | --------------- | ------------ |
| Review Request  | Blue (#3b82f6)  | Professional |
| Review Expiring | Red (#dc2626)   | Urgency      |
| Review Received | Green (#22c55e) | Celebration  |

### Urgency Levels

```
Low Urgency (Day 3)
├─ Friendly tone
├─ Blue color scheme
├─ "27 days remaining"
└─ Tips for helpful review

High Urgency (Day 27)
├─ Urgent tone
├─ Red/Orange colors
├─ "Only 3 days remaining"
└─ Simplified quick action

Immediate (Review Received)
├─ Celebratory tone
├─ Green color scheme
├─ Encourages engagement
└─ Response tips
```

---

## Email Content Strategy

### Subject Lines

| Email Type      | Subject Line                              |
| --------------- | ----------------------------------------- |
| Review Request  | "Share your experience with [Fixer Name]" |
| Review Expiring | "Last chance to review [Fixer Name]"      |
| Review Received | "You received a new review"               |

### Call-to-Action Buttons

| Email Type      | CTA Text                            | Color |
| --------------- | ----------------------------------- | ----- |
| Review Request  | "Leave Your Review"                 | Blue  |
| Review Expiring | "Leave Review Before It's Too Late" | Red   |
| Review Received | "View Full Review & Respond"        | Blue  |

### Personalization Elements

- Client first name
- Fixer name
- Service name/title
- Days remaining
- Order ID
- Star rating (review received)
- Comment excerpt (review received)

---

## Success Metrics

### Email Performance KPIs

```
Open Rate Target: 60%
├─ Review Request: 50-60%
├─ Review Expiring: 70-80% (urgency)
└─ Review Received: 80-90% (immediate value)

Click-Through Rate Target: 25%
├─ Review Request: 20-25%
├─ Review Expiring: 30-40% (urgency)
└─ Review Received: 40-50% (high engagement)

Conversion Rate Target: 30%
├─ Review Request: 35-40% (fresh memory)
├─ Review Expiring: 15-20% (second chance)
└─ Fixer Response: 50-60% (reputation management)
```

### Review Completion Funnel

```
100 Completed Orders
    │
    │ Day 3: Review Request Email Sent
    ▼
80 Emails Opened (60% open rate)
    │
    │ 25% Click CTA
    ▼
20 Visit Review Page
    │
    │ 40% Submit Review
    ▼
8 Reviews Submitted (8% conversion)
    │
    │ Day 27: Review Expiring Email Sent
    │          (to 92 non-reviewers)
    ▼
73 Emails Opened (80% open rate)
    │
    │ 35% Click CTA
    ▼
26 Visit Review Page
    │
    │ 20% Submit Review
    ▼
5 Reviews Submitted (5% conversion)

Total: 13/100 Reviews = 13% Review Rate
Target: 15-20% Review Rate with Optimization
```

---

## Testing Scenarios

### Test Case 1: Review Request Email

```bash
# Create test order completed 3 days ago
1. Complete an order in staging
2. Manually update order.updatedAt to 3 days ago
3. Trigger cron job
4. Verify email received
5. Click CTA and verify redirect
6. Submit review and verify success
```

### Test Case 2: Review Expiring Email

```bash
# Create test order completed 27 days ago
1. Complete an order in staging
2. Manually update order.updatedAt to 27 days ago
3. Trigger cron job
4. Verify urgent email received
5. Check urgency indicators (red colors, countdown)
6. Click CTA and complete review
```

### Test Case 3: Review Received Email

```bash
# Test fixer notification
1. Submit a review as a client
2. Verify fixer receives email immediately
3. Check email contains:
   - Star rating display
   - Comment preview (truncated if long)
   - Reviewer name (or "Anonymous")
   - Service name
4. Click CTA and verify dashboard redirect
```

---

## Environment Configuration

### Required Variables

```bash
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Cron Job Security
CRON_SECRET=your-secure-random-string

# App URL for Links
NEXT_PUBLIC_APP_URL=https://fixxers.com
```

### Vercel Deployment

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-review-emails",
      "schedule": "0 3 * * *" // 3 AM UTC daily
    }
  ]
}
```

---

## Monitoring & Maintenance

### Daily Checks

- Review cron job logs for errors
- Monitor Resend dashboard for delivery rates
- Check bounce/complaint rates
- Track review completion rates

### Weekly Analysis

- Email open rates by type
- Click-through rates
- Review submission conversions
- Fixer response rates

### Monthly Optimization

- A/B test subject lines
- Adjust email timing
- Refine email content
- Update response tips

---

This completes the Email Notifications system for verified reviews! 🎉
