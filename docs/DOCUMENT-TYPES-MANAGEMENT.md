# Document Types Management - Complete Guide

## Overview

This document explains how required documents and document types are managed throughout the badge verification system, from database storage to UI display.

---

## 📊 Architecture Flow

```
Badge (DB)
  ↓ requiredDocuments: String[] = ["government_id", "selfie_with_id", ...]
  ↓
Badge Request Page
  ↓ Maps each documentType to BadgeDocumentUpload component
  ↓ getDocumentLabel() converts snake_case → "Human Readable Label"
  ↓
Fixer Uploads Documents
  ↓ Documents stored in state: { [docType]: { url, name, type } }
  ↓
Submit Request
  ↓ Converts to array: [{ type, url, name }, ...]
  ↓
BadgeRequest (DB)
  ↓ documents: Json = [{ type, url, name, uploadedAt }, ...]
  ↓
Admin Review
  ↓ Displays each document with preview
```

---

## 🗄️ Database Schema

### 1. Badge Model (Source of Truth)

**Location**: `prisma/schema.prisma` lines 835-867

```prisma
model Badge {
  id          String   @id @default(cuid())
  type        BadgeType
  name        String

  // Document requirements stored as string array
  requiredDocuments String[]  // e.g., ["government_id", "selfie_with_id", "address_proof"]

  // Relations
  requests    BadgeRequest[]
  assignments BadgeAssignment[]
}
```

**Document Type Format**: `snake_case` identifiers

- Examples: `government_id`, `selfie_with_id`, `insurance_certificate`
- Stored as PostgreSQL array
- Can be modified via admin UI or seed file

### 2. BadgeRequest Model (Submitted Documents)

**Location**: `prisma/schema.prisma` lines 870-905

```prisma
model BadgeRequest {
  id          String   @id @default(cuid())
  fixerId     String
  badgeId     String

  // Submitted documents stored as JSON array
  documents   Json?    // [{ type, url, name, uploadedAt }]

  // Relations
  fixer       User   @relation("FixerBadgeRequests", fields: [fixerId], references: [id])
  badge       Badge  @relation(fields: [badgeId], references: [id])
}
```

**Document Storage Format**: JSON array

```json
[
  {
    "type": "government_id",
    "url": "https://uploadthing.com/...",
    "name": "drivers_license.jpg",
    "uploadedAt": "2025-10-17T12:00:00Z"
  },
  {
    "type": "selfie_with_id",
    "url": "https://uploadthing.com/...",
    "name": "selfie.jpg",
    "uploadedAt": "2025-10-17T12:05:00Z"
  }
]
```

---

## 🏗️ How Document Types Are Defined

### Method 1: Seed File (Default/Initial Setup)

**Location**: `prisma/seeds/badges.ts`

```typescript
const badges = [
  {
    type: "IDENTITY_VERIFICATION",
    name: "Identity Verified",
    requiredDocuments: ["government_id", "selfie_with_id", "address_proof"],
    // ... other fields
  },
  {
    type: "INSURANCE_VERIFICATION",
    name: "Insurance Verified",
    requiredDocuments: ["insurance_certificate", "policy_document"],
  },
  // ... more badges
];
```

**Running Seeds**:

```bash
npx prisma db seed
# or
npm run seed
```

### Method 2: Admin UI (Runtime Management)

**Location**: `/admin/badges/[badgeId]/edit`

1. Navigate to badge management: `/admin/badges`
2. Click "Edit Badge Settings" on any badge
3. Modify "Required Documents" textarea:
   ```
   government_id
   selfie_with_id
   address_proof
   drivers_license
   passport
   ```
   (One document type per line)
4. Save changes

**Component**: `components/badges/BadgeEditForm.tsx`

- Converts string array to newline-separated text for editing
- Converts back to array on submit
- Updates database via API: `PATCH /api/admin/badges/[badgeId]`

### Method 3: Direct Database Update

```sql
UPDATE "Badge"
SET "requiredDocuments" = ARRAY[
  'government_id',
  'selfie_with_id',
  'address_proof',
  'utility_bill'
]
WHERE "type" = 'IDENTITY_VERIFICATION';
```

---

## 🎨 How Document Types Are Displayed

### Document Type to Label Mapping

**Location**: `app/fixer/badges/request/[badgeId]/client.tsx` lines 110-125

```typescript
function getDocumentLabel(docType: string): string {
  const labels: Record<string, string> = {
    // Identity documents
    government_id: "Government-issued ID",
    selfie_with_id: "Selfie with ID",
    address_proof: "Address Verification",

    // Insurance documents
    insurance_certificate: "Insurance Certificate",
    policy_document: "Policy Document",

    // Background check documents
    police_clearance: "Police Clearance Certificate",
    character_reference_1: "Character Reference 1",
    character_reference_2: "Character Reference 2",
    employment_history: "Employment History",

    // Skill certification documents
    trade_certification: "Trade Certification",
    training_certificate: "Training Certificate",
    professional_license: "Professional License",
  };

  // Fallback: convert snake_case to Title Case
  return labels[docType] || docType.replace(/_/g, " ");
}
```

**Usage Example**:

```typescript
// Input: "government_id"
// Output: "Government-issued ID"

// Input: "some_new_document"  // Not in mapping
// Output: "some new document"  // Fallback transformation
```

---

## 📤 Upload & Submission Flow

### 1. Component Initialization

**Location**: `app/fixer/badges/request/[badgeId]/client.tsx`

```typescript
// State: documents stored as key-value object
const [documents, setDocuments] = useState<
  Record<
    string,
    {
      url: string;
      name: string;
      type: string;
    }
  >
>({});

// Example state after uploads:
// {
//   "government_id": { url: "...", name: "id.jpg", type: "image/jpeg" },
//   "selfie_with_id": { url: "...", name: "selfie.jpg", type: "image/jpeg" }
// }
```

### 2. Render Upload Components

```typescript
{badge.requiredDocuments.map((docType) => (
    <BadgeDocumentUpload
        key={docType}
        documentType={docType}              // "government_id"
        label={getDocumentLabel(docType)}   // "Government-issued ID"
        onUpload={(file) => handleDocumentUpload(docType, file)}
        currentFile={documents[docType] || null}
        onRemove={() => handleDocumentRemove(docType)}
    />
))}
```

### 3. File Upload (UploadThing)

**Location**: `components/badges/BadgeDocumentUpload.tsx`

```typescript
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  // Upload to UploadThing
  const uploadedFiles = await uploadFiles("badgeDocumentUploader", {
    files: [file],
  });

  // Notify parent component
  onUpload({
    url: uploadedFiles[0].url,
    name: uploadedFiles[0].name,
    type: file.type,
  });
};
```

### 4. Store in State

```typescript
function handleDocumentUpload(
  docType: string,
  file: { url: string; name: string; type: string }
) {
  setDocuments((prev) => ({
    ...prev,
    [docType]: file, // Store by document type key
  }));
}
```

### 5. Validation Before Submit

```typescript
// Check all required documents are uploaded
const missingDocs = badge.requiredDocuments.filter(
  (docType) => !documents[docType]
);

if (missingDocs.length > 0) {
  setError(`Please upload: ${missingDocs.map(getDocumentLabel).join(", ")}`);
  return;
}
```

### 6. Convert to API Format

```typescript
// Convert object to array for API
const documentsArray = Object.entries(documents).map(([type, file]) => ({
  type, // "government_id"
  url: file.url, // "https://..."
  name: file.name, // "id.jpg"
}));

// Submit to API
await fetch("/api/badge-requests", {
  method: "POST",
  body: JSON.stringify({
    badgeId: badge.id,
    documents: documentsArray,
    notes,
  }),
});
```

### 7. API Processing

**Location**: `app/api/badge-requests/route.ts`

```typescript
// Validate each document has required type
const missingTypes = badge.requiredDocuments.filter(
  (reqType) => !documents.some((doc: any) => doc.type === reqType)
);

if (missingTypes.length > 0) {
  return NextResponse.json({
    error: `Missing required documents: ${missingTypes.join(", ")}`,
  });
}

// Store in database
await prisma.badgeRequest.create({
  data: {
    fixerId: user.id,
    badgeId,
    documents: documents as any, // Stored as JSON
    paymentAmount: badge.cost,
  },
});
```

---

## 🔍 Admin Review Display

### Loading Documents

**Location**: `app/admin/badges/requests/[requestId]/page.tsx`

```typescript
const badgeRequest = await prisma.badgeRequest.findUnique({
  where: { id: requestId },
  include: { badge: true, fixer: true },
});

// Parse documents from JSON
const documents = badgeRequest.documents
  ? typeof badgeRequest.documents === "string"
    ? JSON.parse(badgeRequest.documents)
    : badgeRequest.documents
  : [];
```

### Displaying Documents

```typescript
{documents.map((doc: any, index: number) => (
    <div key={index}>
        {/* Show image preview or PDF icon */}
        {doc.type.startsWith('image/') ? (
            <img src={doc.url} alt={doc.name} />
        ) : (
            <div>📄 {doc.name}</div>
        )}

        {/* Document type label */}
        <p>{doc.name}</p>
        <p>{doc.type}</p>

        {/* View document link */}
        <a href={doc.url} target="_blank">
            View Document →
        </a>
    </div>
))}
```

### Required Documents Checklist

```typescript
{/* Show what documents the badge requires */}
<div>
    <p>Required Documents:</p>
    <ul>
        {(badgeRequest.badge.requiredDocuments as string[]).map((doc, index) => (
            <li key={index}>
                • {doc.replace(/_/g, ' ')}
            </li>
        ))}
    </ul>
</div>
```

---

## 🎯 Adding New Document Types

### Step 1: Choose Document Type Identifier

Use `snake_case` format:

- ✅ Good: `utility_bill`, `bank_statement`, `tax_return`
- ❌ Bad: `Utility Bill`, `bank-statement`, `taxReturn`

### Step 2: Add to Badge (Choose Method)

#### Option A: Via Admin UI

1. Go to `/admin/badges`
2. Edit the relevant badge
3. Add new document type to textarea:
   ```
   government_id
   selfie_with_id
   address_proof
   utility_bill       ← NEW
   ```
4. Save

#### Option B: Via Seed File

```typescript
// prisma/seeds/badges.ts
requiredDocuments: [
    "government_id",
    "selfie_with_id",
    "address_proof",
    "utility_bill"  // NEW
],
```

Run: `npx prisma db seed`

### Step 3: Add Human-Readable Label (Optional but Recommended)

Edit `getDocumentLabel()` function:

```typescript
// app/fixer/badges/request/[badgeId]/client.tsx
// AND
// components/badges/BadgeRequestForm.tsx

function getDocumentLabel(docType: string): string {
  const labels: Record<string, string> = {
    // ... existing labels
    utility_bill: "Utility Bill", // NEW
    bank_statement: "Bank Statement", // NEW
    tax_return: "Tax Return Document", // NEW
  };
  return labels[docType] || docType.replace(/_/g, " ");
}
```

### Step 4: No Code Changes Needed!

The system automatically:

- ✅ Renders upload component for new document type
- ✅ Validates upload before submission
- ✅ Stores document with correct type
- ✅ Displays in admin review

---

## 📋 Standard Document Types

### Current Document Types in Use

**Identity Verification**:

- `government_id` → Government-issued ID
- `selfie_with_id` → Selfie with ID
- `address_proof` → Address Verification

**Insurance Verification**:

- `insurance_certificate` → Insurance Certificate
- `policy_document` → Policy Document

**Background Check**:

- `police_clearance` → Police Clearance Certificate
- `character_reference_1` → Character Reference 1
- `character_reference_2` → Character Reference 2
- `employment_history` → Employment History

**Skill Certification**:

- `trade_certification` → Trade Certification
- `training_certificate` → Training Certificate
- `professional_license` → Professional License

---

## 🔧 Document Type Best Practices

### Naming Conventions

1. **Use snake_case**: `government_id` not `governmentId`
2. **Be descriptive**: `utility_bill` not `bill`
3. **Be specific**: `character_reference_1` not `reference`
4. **Use singular**: `certificate` not `certificates`

### Validation

- All required document types MUST be uploaded before submission
- Document types are case-sensitive
- Extra documents (not in requiredDocuments) are ignored

### File Types Supported

- **Images**: JPG, PNG, WEBP (displays thumbnail preview)
- **PDFs**: PDF documents (displays PDF icon)
- **Max size**: 8MB per file
- **Upload service**: UploadThing

---

## 🛠️ Troubleshooting

### Problem: Document type not showing

**Check**:

1. Is it in `badge.requiredDocuments` array? (Check database or admin UI)
2. Is there a typo in document type name?
3. Did you refresh the page after updating badge?

### Problem: Document upload fails

**Check**:

1. File size < 8MB?
2. UploadThing configured correctly?
3. Console logs in `BadgeDocumentUpload.tsx`

### Problem: Validation says document missing

**Check**:

1. Exact match of document type (case-sensitive)
2. Document successfully uploaded (check state in React DevTools)
3. All required documents uploaded before submitting

### Problem: Admin can't see document

**Check**:

1. Document URL valid and accessible
2. JSON parsing working correctly
3. Document object has `type`, `url`, `name` fields

---

## 📊 Data Flow Summary

```
1. Badge Created/Edited
   ↓ requiredDocuments: ["doc_type_1", "doc_type_2"]

2. Fixer Views Badge Request Page
   ↓ Renders BadgeDocumentUpload for each required doc

3. Fixer Uploads Files
   ↓ Files uploaded to UploadThing
   ↓ URLs stored in component state

4. Fixer Submits Request
   ↓ Validates all required docs present
   ↓ Converts to array format
   ↓ POST to /api/badge-requests

5. API Validates & Stores
   ↓ Checks doc types match requirements
   ↓ Stores as JSON in BadgeRequest.documents

6. Admin Reviews
   ↓ Loads BadgeRequest with documents
   ↓ Parses JSON array
   ↓ Displays each document with preview
```

---

## 🔗 Related Files

**Database**:

- `prisma/schema.prisma` - Badge & BadgeRequest models
- `prisma/seeds/badges.ts` - Default badge configurations

**Admin UI**:

- `app/admin/badges/page.tsx` - Badge list
- `app/admin/badges/[badgeId]/edit/page.tsx` - Edit badge
- `app/admin/badges/requests/[requestId]/page.tsx` - Review request
- `components/badges/BadgeEditForm.tsx` - Edit form

**Fixer UI**:

- `app/fixer/badges/request/[badgeId]/client.tsx` - Upload documents
- `components/badges/BadgeDocumentUpload.tsx` - Upload component

**API**:

- `app/api/badge-requests/route.ts` - Create badge request
- `app/api/admin/badges/[badgeId]/route.ts` - Update badge settings

---

**Last Updated**: Current session  
**Status**: ✅ Fully documented and operational
