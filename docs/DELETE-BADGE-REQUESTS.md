# Delete Badge Requests Feature

## Overview

Added the ability for fixers to delete their own pending badge requests. This helps fixers manage their requests and start fresh if needed.

## Implementation

### 1. API Endpoint

**File**: `app/api/badge-requests/[requestId]/delete/route.ts`

- **Method**: DELETE
- **URL**: `/api/badge-requests/[requestId]/delete`
- **Authentication**: Required (must be the fixer who created the request)
- **Permissions**: Only the fixer who created the request can delete it
- **Restrictions**: Only PENDING requests with PENDING payment status can be deleted

**Response**:

```json
{
  "success": true,
  "message": "Badge request deleted successfully"
}
```

### 2. Delete Button Component

**File**: `components/badges/DeleteBadgeRequestButton.tsx`

Client-side component that:

- Shows a "Delete Request" button
- Displays confirmation dialog when clicked
- Calls the delete API endpoint
- Redirects to badges page on success
- Shows error message if deletion fails

### 3. UI Integration

**File**: `app/fixer/badges/requests/[requestId]/page.tsx`

The delete button appears on the badge request detail page when:

- Request status is PENDING
- Payment status is PENDING

Located next to the "Complete Payment" button in the "Next Steps" section.

## User Flow

1. **Navigate to Badge Request**
   - Fixer goes to `/fixer/badges/requests/[requestId]`
   - Or views the request from the badges list

2. **Click Delete Button**
   - Button visible only for pending requests
   - Shows red "Delete Request" button

3. **Confirm Deletion**
   - Confirmation dialog appears
   - Fixer confirms by clicking "Yes, Delete"
   - Or cancels to keep the request

4. **Redirect**
   - After successful deletion, redirects to `/fixer/badges`
   - Shows notification (optional enhancement)

## Use Cases

### Why Fixers Need This

1. **Duplicate Request Prevention**
   - System prevents multiple pending requests for same badge
   - If fixer wants to resubmit with different documents, must delete first

2. **Change of Mind**
   - Fixer decides not to pursue badge verification
   - Can delete pending request without admin intervention

3. **Wrong Badge Selected**
   - Fixer accidentally requested wrong badge
   - Can delete and request correct badge

4. **Document Issues**
   - Realizes documents are incorrect
   - Delete and resubmit with correct documents

## Security & Validation

✅ **Authentication Required**: User must be logged in
✅ **Ownership Check**: Only request creator can delete
✅ **Status Check**: Only PENDING requests can be deleted
✅ **Payment Check**: Only PENDING payment status allowed
❌ **Cannot Delete**: Paid, approved, rejected, or under-review requests

## API Security Rules

```typescript
// Only the fixer who created the request can delete it
if (badgeRequest.fixerId !== user.id) {
  return 403 Forbidden
}

// Only allow deletion of pending requests
if (badgeRequest.status !== 'PENDING' &&
    badgeRequest.paymentStatus !== 'PENDING') {
  return 400 Bad Request
}
```

## Testing

To test the delete feature:

1. **Create a badge request**:

   ```bash
   # Go to http://localhost:3010/fixer/badges
   # Click "Request Badge"
   # Upload documents and submit
   ```

2. **View the request**:

   ```bash
   # Note the request ID in the URL
   # You should see "Delete Request" button
   ```

3. **Delete the request**:

   ```bash
   # Click "Delete Request"
   # Confirm deletion
   # Verify redirect to badges page
   ```

4. **Verify deletion**:
   ```bash
   npx tsx scripts/list-badge-requests.ts
   # Should show 0 requests
   ```

## Files Modified/Created

### Created

- `app/api/badge-requests/[requestId]/delete/route.ts` - DELETE endpoint
- `components/badges/DeleteBadgeRequestButton.tsx` - Delete button component
- `docs/DELETE-BADGE-REQUESTS.md` - This documentation

### Modified

- `app/fixer/badges/requests/[requestId]/page.tsx` - Added delete button to detail page

## Future Enhancements

- [ ] Add success toast notification after deletion
- [ ] Add undo functionality (soft delete with expiry)
- [ ] Track deletion in audit log
- [ ] Send email notification on deletion
- [ ] Add delete option in badges list table (inline delete)
- [ ] Allow admin to delete any request

## Related Features

- Badge Request Creation: `/fixer/badges/request/[badgeId]`
- Badge Payment: `/fixer/badges/payment/[requestId]`
- Badge Request Detail: `/fixer/badges/requests/[requestId]`
- Badge Management: `/admin/badges`

## Status

✅ **COMPLETE** - Fixers can now delete their own pending badge requests
