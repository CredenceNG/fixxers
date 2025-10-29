# Claude AI Development Guidelines for Fixxers Platform

## Project Overview
Fixxers is a Next.js-based service marketplace platform connecting clients with service providers (fixers). The platform includes client-facing pages, fixer dashboards, and admin management tools.

## Mobile-First UX Requirements

### Core Principle
**ALL pages must be mobile-responsive by default.** Desktop layout is the starting point, but mobile experience is equally important.

### Mobile Breakpoint
- Primary mobile breakpoint: **≤768px**
- Use CSS media queries: `@media (max-width: 768px)`

### Mobile Layout Patterns

#### 1. Grid to Vertical Stack
When desktop uses multi-column grids, stack vertically on mobile:

```css
/* Desktop: 2-column grid */
.container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .container {
    display: flex !important;
    flex-direction: column !important;
  }
}
```

#### 2. Sidebar Content Reordering
Sidebar content should be moved beneath main content on mobile using CSS order property:

```css
@media (max-width: 768px) {
  .main-content {
    order: 1;
  }

  .sidebar-content {
    order: 2;
  }
}
```

#### 3. Action Columns in Tables
- **Always place Action columns on the LEFT** for better mobile accessibility
- Actions should be the first column users see when scrolling horizontally

#### 4. Filter Controls
Desktop button groups should become select dropdowns on mobile:

```tsx
// Desktop: Button groups
<div className="desktop-filters">
  <button>Option 1</button>
  <button>Option 2</button>
</div>

// Mobile: Select dropdowns
<div className="mobile-filters">
  <select>
    <option>Option 1</option>
    <option>Option 2</option>
  </select>
</div>
```

#### 5. Stat Cards
Reduce stat card columns and padding on mobile:

```css
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr) !important; /* Instead of 4 or 6 */
    gap: 12px !important;
  }

  .stat-card {
    padding: 12px !important; /* Instead of 20px+ */
  }

  .stat-label {
    font-size: 11px !important;
  }

  .stat-value {
    font-size: 24px !important;
  }
}
```

### Implementation Checklist

When creating or modifying pages:

- [ ] Add semantic CSS classes to major sections
- [ ] Create corresponding mobile CSS in `app/globals.css`
- [ ] Test layout at 768px and below
- [ ] Ensure proper content ordering on mobile
- [ ] Verify touch targets are adequate (min 44x44px)
- [ ] Check table horizontal scroll behavior
- [ ] Confirm forms are easy to fill on mobile

### File Structure

- **Page Components**: Add className props to major sections
- **Styles**: Add all mobile responsive CSS to `app/globals.css`
- **Pattern**: Use descriptive class names like `admin-[page]-[section]`

Example class naming:
```tsx
<div className="admin-request-detail-grid">
  <div className="admin-request-status">...</div>
  <div className="admin-request-details">...</div>
  <div className="admin-request-client">...</div>
</div>
```

### Common Mobile Issues to Avoid

1. ❌ Hidden navigation elements (hamburger menu should always be visible)
2. ❌ Tiny text (minimum 14px for body, 11px for labels)
3. ❌ Buttons that don't wrap properly
4. ❌ Wide stat cards that waste screen space
5. ❌ Action buttons on the right side of tables
6. ❌ Filter buttons that take up too much space
7. ❌ Horizontal scrolling that could be avoided

### Admin Pages Layout Pattern

For admin detail pages with 2-column layouts:
1. Convert grid to flex column on mobile
2. Order sections logically: Status → Details → Related Info → Actions
3. Move sidebar content beneath main content
4. Maintain card styling and spacing

### Testing

Always verify mobile responsiveness by:
1. Using browser DevTools responsive mode
2. Testing at 375px (mobile), 768px (tablet), 1024px (desktop)
3. Checking that no horizontal scroll occurs (except tables)
4. Ensuring all interactive elements are easily tappable

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **ORM**: Prisma
- **Validation**: Zod (use `.issues` not `.errors` for error messages)
- **Styling**: Inline styles + global CSS (no CSS-in-JS libraries)
- **Admin Template**: AdminLTE-inspired layout

## Code Style

- Use Server Components by default, Client Components only when needed
- Keep API routes in `app/api/` with proper HTTP methods
- Always check admin authentication: `roles.includes('ADMIN')`
- Use `getCurrentUser()` from `@/lib/auth` for authentication
- Import theme constants from `@/lib/theme`: `colors`, `borderRadius`, `shadows`

## Git Commit Guidelines

- **DO NOT** include Claude Code or Anthropic branding in commit messages
- **DO NOT** add "Co-Authored-By: Claude" signatures
- **DO NOT** add emoji or marketing links in commit messages
- Write clear, professional commit messages following conventional commits format
- Example: `feat: Add user authentication` NOT `feat: Add user authentication 🤖 Generated with Claude Code`

## Recent Implementations

Examples of mobile-responsive pages:
- `/admin/users` - Compact stats, select dropdowns
- `/admin/orders/[orderId]` - Vertical stacking
- `/admin/agents/[agentId]` - Vertical stacking
- `/admin/requests/[requestId]` - Content reordering
- `/admin/neighborhoods` - Action column on left

Refer to these implementations as examples when creating new pages.
