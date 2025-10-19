# Badge Components Showcase

This demo page showcases all the badge display components created in Phase 4.

## Component Library

### 1. **BadgeDisplay** - Individual Badge Display

- Shows a single badge with icon
- Three sizes: small, medium, large
- Status indicators (active, expiring soon, expired)
- Optional tooltip on hover
- Optional expiry date display

**Usage:**
\`\`\`tsx
import { BadgeDisplay } from '@/components/badges';

<BadgeDisplay
badge={{
    id: '1',
    name: 'Identity Verified',
    icon: '🆔',
    type: 'IDENTITY_VERIFIED',
    expiresAt: new Date('2026-01-01'),
  }}
size="medium"
showTooltip={true}
showExpiry={false}
/>
\`\`\`

---

### 2. **BadgeGroup** - Multiple Badge Display

- Displays multiple badges in a row
- Shows "+X more" indicator when there are many badges
- Supports horizontal and grid layouts
- Filters to show only active badges

**Usage:**
\`\`\`tsx
import { BadgeGroup } from '@/components/badges';

<BadgeGroup
  badges={userBadges}
  maxVisible={5}
  size="medium"
  showTooltip={true}
  layout="horizontal"
/>
\`\`\`

---

### 3. **TierBadge** - Badge Tier Display

- Shows Bronze 🥉, Silver 🥈, Gold 🥇, or Platinum 💎 tier
- Three sizes with tier colors
- Optional label display
- Tooltip with tier description

**Usage:**
\`\`\`tsx
import { TierBadge } from '@/components/badges';

<TierBadge
  tier="GOLD"
  size="medium"
  showLabel={true}
/>
\`\`\`

**TierProgress Component:**
Shows progress toward next tier with progress bar.

\`\`\`tsx
import { TierProgress } from '@/components/badges';

<TierProgress
  currentTier="SILVER"
  badgeCount={3}
/>
\`\`\`

---

### 4. **VerifiedIndicator** - Verified Status

- Blue checkmark badge for verified users
- Optional "Verified" label
- Simple checkmark variant available

**Usage:**
\`\`\`tsx
import { VerifiedIndicator, VerifiedCheckmark } from '@/components/badges';

<VerifiedIndicator
  isVerified={true}
  size="medium"
  showLabel={true}
/>

<VerifiedCheckmark size="small" />
\`\`\`

---

### 5. **BadgeCard** - Detailed Badge Card

- Full badge information in card format
- Three variants: available, active, expired
- Shows cost, validity period, expiry date
- Action button support
- Compact version for lists

**Usage:**
\`\`\`tsx
import { BadgeCard, BadgeCardCompact } from '@/components/badges';

<BadgeCard
badge={{
    id: '1',
    name: 'Identity Verified',
    icon: '🆔',
    type: 'IDENTITY_VERIFIED',
    description: 'Government-issued ID verification',
    cost: 2000,
    expiryMonths: 12,
  }}
variant="available"
showAction={true}
actionLabel="Request Badge"
onAction={() => handleRequest()}
/>
\`\`\`

---

### 6. **UserBadgeShowcase** - Complete User Badge Display

- Combines name, verified status, tier, and badges
- Three variants: full, compact, minimal
- Responsive layout
- Special variants for profiles and search results

**Variants:**

**Full Variant:**
\`\`\`tsx
import { UserBadgeShowcase } from '@/components/badges';

<UserBadgeShowcase
  userName="John Doe"
  tier="GOLD"
  badges={userBadges}
  badgeCount={5}
  variant="full"
  showTier={true}
  showVerified={true}
  maxVisibleBadges={5}
/>
\`\`\`

**Compact Variant:**
\`\`\`tsx
<UserBadgeShowcase
  userName="John Doe"
  tier="GOLD"
  badges={userBadges}
  badgeCount={5}
  variant="compact"
/>
\`\`\`

**Minimal Variant:**
\`\`\`tsx
<UserBadgeShowcase
  userName="John Doe"
  tier="GOLD"
  badges={userBadges}
  badgeCount={5}
  variant="minimal"
/>
\`\`\`

**Profile Header Variant:**
\`\`\`tsx
import { ProfileBadgeHeader } from '@/components/badges';

<ProfileBadgeHeader
  userName="John Doe"
  tier="GOLD"
  badges={userBadges}
  badgeCount={5}
/>
\`\`\`

**Search Result Variant:**
\`\`\`tsx
import { SearchResultBadgeDisplay } from '@/components/badges';

<SearchResultBadgeDisplay
  tier="GOLD"
  badges={userBadges}
/>
\`\`\`

---

## Badge Tier System

### Tier Levels

| Tier         | Emoji | Active Badges | Color Scheme  |
| ------------ | ----- | ------------- | ------------- |
| **Bronze**   | 🥉    | 1-2           | Amber/Brown   |
| **Silver**   | 🥈    | 3-4           | Gray/Silver   |
| **Gold**     | 🥇    | 5+            | Yellow/Gold   |
| **Platinum** | 💎    | 5+ & Top 5%   | Purple/Indigo |

### Tier Colors

**Bronze:**

- Border: `border-amber-600`
- Background: `bg-gradient-to-br from-amber-600 to-amber-800`
- Text: `text-amber-600`

**Silver:**

- Border: `border-gray-600`
- Background: `bg-gradient-to-br from-gray-400 to-gray-600`
- Text: `text-gray-600`

**Gold:**

- Border: `border-yellow-600`
- Background: `bg-gradient-to-br from-yellow-400 to-yellow-600`
- Text: `text-yellow-600`

**Platinum:**

- Border: `border-purple-600`
- Background: `bg-gradient-to-br from-purple-500 to-indigo-600`
- Text: `text-purple-600`

---

## Size Variants

All badge components support three size variants:

### Small

- Icon: 16-24px
- Container: 24px (w-6 h-6)
- Text: text-xs
- **Use case:** Search results, compact lists, navigation

### Medium (Default)

- Icon: 24-32px
- Container: 32px (w-8 h-8)
- Text: text-sm
- **Use case:** Profile cards, gig cards, general display

### Large

- Icon: 32-48px
- Container: 48px (w-12 h-12)
- Text: text-base
- **Use case:** Profile headers, featured displays, landing pages

---

## Common Usage Patterns

### 1. Profile Page Header

\`\`\`tsx
<ProfileBadgeHeader
  userName={user.name}
  tier={user.badgeTier}
  badges={activeBadges}
  badgeCount={activeBadges.length}
/>
\`\`\`

### 2. Gig Card Display

\`\`\`tsx

<div className="flex items-center gap-2">
  <span className="font-semibold">{fixer.name}</span>
  <VerifiedIndicator isVerified={fixer.hasActiveBadges} size="small" />
  <SearchResultBadgeDisplay
    tier={fixer.badgeTier}
    badges={fixer.badges}
  />
</div>
\`\`\`

### 3. Search Results

\`\`\`tsx
<UserBadgeShowcase
  userName={fixer.name}
  tier={fixer.badgeTier}
  badges={fixer.badges}
  badgeCount={fixer.badgeCount}
  variant="compact"
/>
\`\`\`

### 4. Fixer Dashboard

\`\`\`tsx

<div className="space-y-4">
  <TierBadge tier={user.badgeTier} size="large" showLabel={true} />
  
  <TierProgress
    currentTier={user.badgeTier}
    badgeCount={activeBadges.length}
  />
  
  <div className="grid grid-cols-2 gap-4">
    {activeBadges.map(badge => (
      <BadgeCard
        key={badge.id}
        badge={badge}
        variant="active"
      />
    ))}
  </div>
</div>
\`\`\`

---

## Styling Guidelines

### Colors

- **Primary (Blue):** Verified indicators, active states
- **Green:** Active badges, approvals
- **Yellow:** Expiring soon warnings
- **Red:** Expired badges, errors
- **Gray:** Inactive states, neutral elements

### Spacing

- Use consistent gap spacing: `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- Card padding: `p-4` (16px) for medium, `p-6` (24px) for large
- Icon containers: rounded-full with padding

### Transitions

All interactive components include:

- `transition-all` for smooth state changes
- `hover:scale-110` for badge icons
- `hover:shadow-lg` for cards

---

## Accessibility

All badge components include:

- ✅ Semantic HTML
- ✅ ARIA labels where appropriate
- ✅ Keyboard navigation support
- ✅ Title attributes for tooltips
- ✅ Color contrast compliance (WCAG AA)
- ✅ Screen reader friendly text

---

## Performance

Badge components are optimized for:

- ✅ Server-side rendering (all components)
- ✅ Client-side only when needed (modals, interactions)
- ✅ Minimal re-renders
- ✅ Tree-shakable exports
- ✅ No external dependencies (except React)

---

## Integration Checklist

When adding badges to a page:

- [ ] Import required badge components
- [ ] Fetch user's active badges (filter by expiresAt > now)
- [ ] Get user's badge tier from database
- [ ] Choose appropriate variant (full, compact, minimal)
- [ ] Add proper spacing and layout
- [ ] Test with 0 badges, 1 badge, many badges
- [ ] Test with different tiers
- [ ] Test expired badge handling
- [ ] Verify responsive design
- [ ] Check accessibility

---

_Badge Components - Phase 4: Badge Display Components_  
_Created: October 17, 2025_
