# Adding Services to Unified Profile Form

## Current Status
- ✅ Basic unified profile working (Step 1 complete & committed)
- ⏳ Need to add service categories/subcategories and service neighborhoods

## What Needs to be Added

### 1. Form State (Already Added ✅)
```typescript
const [selectedCategories, setSelectedCategories] = useState<{ categoryId: string; subcategoryIds: string[] }[]>([]);
const [selectedServiceNeighborhoods, setSelectedServiceNeighborhoods] = useState<string[]>([]);
```

### 2. Helper Functions (Need to Add)
```typescript
// Add service category
const addService = () => {
  setSelectedCategories([...selectedCategories, { categoryId: '', subcategoryIds: [] }]);
};

// Remove service category
const removeService = (index: number) => {
  setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
};

// Update category selection
const handleCategoryChange = (index: number, categoryId: string) => {
  setSelectedCategories(prev =>
    prev.map((cat, i) => (i === index ? { categoryId, subcategoryIds: [] } : cat))
  );
};

// Update subcategory selection
const handleSubcategoryChange = (index: number, subcategoryIds: string[]) => {
  setSelectedCategories(prev =>
    prev.map((cat, i) => (i === index ? { ...cat, subcategoryIds } : cat))
  );
};

// Toggle service neighborhood
const toggleServiceNeighborhood = (neighborhoodId: string) => {
  setSelectedServiceNeighborhoods(prev =>
    prev.includes(neighborhoodId)
      ? prev.filter(id => id !== neighborhoodId)
      : [...prev, neighborhoodId]
  );
};
```

### 3. Validation (Update existing validation)
```typescript
// Add to existing validation
if (hasFixerRole) {
  if (selectedCategories.length === 0 || selectedCategories.every(c => c.subcategoryIds.length === 0)) {
    setError('Please select at least one service category and subcategory');
    setLoading(false);
    return;
  }

  if (selectedServiceNeighborhoods.length === 0) {
    setError('Please select at least one service neighborhood');
    setLoading(false);
    return;
  }
}
```

### 4. Form Submission (Update existing)
```typescript
// Add to existing form submission body
body: JSON.stringify({
  ...existingFields,
  selectedCategories: selectedCategories.filter(c => c.subcategoryIds.length > 0),
  serviceNeighborhoodIds: selectedServiceNeighborhoods,
}),
```

### 5. UI Sections (Add after Qualifications)

#### Service Categories Section
```typescript
{/* Service Categories */}
<div style={{ marginBottom: '32px' }}>
  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
    Service Categories <span style={{ color: colors.error }}>*</span>
  </label>
  <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>
    Select the categories and subcategories of services you offer.
  </p>

  {/* List of selected categories */}
  {selectedCategories.map((service, index) => (
    <div key={index} style={{ backgroundColor: '#F9FAFB', padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
      {/* Category dropdown */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '6px' }}>
          Category
        </label>
        <select
          value={service.categoryId}
          onChange={(e) => handleCategoryChange(index, e.target.value)}
          style={{ width: '100%', padding: '12px 16px', fontSize: '15px', border: '2px solid #E4E6EB', borderRadius: '12px', outline: 'none' }}
        >
          <option value="">Select category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Subcategories checkboxes */}
      {service.categoryId && (
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.textSecondary, marginBottom: '8px' }}>
            Subcategories
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {categories.find(c => c.id === service.categoryId)?.subcategories.map(sub => (
              <label
                key={sub.id}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={service.subcategoryIds.includes(sub.id)}
                  onChange={(e) => {
                    const newSubcatIds = e.target.checked
                      ? [...service.subcategoryIds, sub.id]
                      : service.subcategoryIds.filter(id => id !== sub.id);
                    handleSubcategoryChange(index, newSubcatIds);
                  }}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: colors.textPrimary }}>{sub.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={() => removeService(index)}
        style={{ marginTop: '12px', padding: '8px 16px', fontSize: '14px', color: '#DC2626', backgroundColor: 'transparent', border: '1px solid #DC2626', borderRadius: '8px', cursor: 'pointer' }}
      >
        Remove Service
      </button>
    </div>
  ))}

  {/* Add service button */}
  <button
    type="button"
    onClick={addService}
    style={{ padding: '12px 24px', fontSize: '14px', color: colors.textPrimary, backgroundColor: 'transparent', border: '2px dashed #E4E6EB', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
  >
    + Add Service Category
  </button>
</div>
```

#### Service Neighborhoods Section
```typescript
{/* Service Neighborhoods */}
<div style={{ marginBottom: '32px' }}>
  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
    Service Areas (Neighborhoods) <span style={{ color: colors.error }}>*</span>
  </label>
  <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>
    Select the neighborhoods where you offer your services.
  </p>

  {/* Group by state */}
  {Array.from(new Set(neighborhoods.map(n => n.state))).sort().map(state => {
    const stateNeighborhoods = neighborhoods.filter(n => n.state === state);
    return (
      <div key={state} style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
          {state}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
          {stateNeighborhoods.map(nb => (
            <label
              key={nb.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                backgroundColor: selectedServiceNeighborhoods.includes(nb.id) ? '#EFF6FF' : '#F9FAFB',
                border: selectedServiceNeighborhoods.includes(nb.id) ? '2px solid #3B82F6' : '2px solid #E4E6EB',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <input
                type="checkbox"
                checked={selectedServiceNeighborhoods.includes(nb.id)}
                onChange={() => toggleServiceNeighborhood(nb.id)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                  {nb.name}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {nb.city}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  })}
</div>
```

### 6. API Endpoint Updates

Need to update `/app/api/profile/route.ts` POST handler:

```typescript
// After creating FixerProfile, create FixerService entries
if (roles.includes('FIXER')) {
  const { selectedCategories, serviceNeighborhoodIds } = body;

  // Delete existing services
  await prisma.fixerService.deleteMany({
    where: { fixerId: user.id },
  });

  // Create new services
  for (const service of selectedCategories) {
    for (const subcategoryId of service.subcategoryIds) {
      await prisma.fixerService.create({
        data: {
          fixerId: user.id,
          subcategoryId,
          isActive: true,
          neighborhoods: {
            connect: serviceNeighborhoodIds.map((id: string) => ({ id })),
          },
        },
      });
    }
  }
}
```

## Estimated Lines of Code
- Helper functions: ~40 lines
- Validation updates: ~10 lines
- Service Categories UI: ~80 lines
- Service Neighborhoods UI: ~60 lines
- Form submission update: ~5 lines
- API update: ~25 lines

**Total: ~220 additional lines**

## Implementation Order
1. ✅ Add state variables
2. ⏳ Add helper functions
3. ⏳ Add UI sections after Qualifications
4. ⏳ Update validation
5. ⏳ Update form submission
6. ⏳ Update API endpoint
7. ⏳ Test with fixi-test2

## Testing Plan
1. Register new FIXER user
2. Complete unified profile with services
3. Verify FixerProfile created
4. Verify FixerService entries created
5. Verify service-neighborhood associations created
6. Edit existing fixer profile
7. Verify services update correctly
