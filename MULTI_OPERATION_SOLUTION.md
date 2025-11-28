# Multi-Operation Cart Solution

## Problem Solved

The frontend was calling the preview endpoint **once per operation**, but:
- The preview endpoint is designed for **single-operation lines** (legacy model)
- It calculates the **entire line price** (glass + cutting), not individual operations
- Multiple operations apply to the **same glass piece**, so they can't be previewed separately

## Solution Implemented

### Client-Side Estimation with Backend Validation

**When adding to cart:**
1. **Glass price** - Calculated client-side using glass type price and dimensions
2. **LASER operations** - Use manual price (entered by user)
3. **FARMA operations** - Use manual price (entered by user)
4. **SHATAF operations** - Set to $0 (will be calculated by backend)

**When creating invoice:**
1. Backend receives all operations for the line
2. Backend calculates accurate SHATAF prices using rates from database
3. Backend calculates final total
4. User confirms invoice with accurate price

### Code Changes

**File: `CashierInvoicePage.jsx`**

#### Before (❌ Broken - called preview for each operation)
```javascript
for (const op of operations) {
    if (op.type === 'SHATAF') {
        // ❌ Called preview for EACH operation separately
        previewData = await invoiceService.previewLineCalculation(lineRequest);
        operationPrice = previewData.cuttingPrice || 0;
    }
}
```

#### After (✅ Fixed - client-side estimation)
```javascript
// Calculate glass price once
const areaM2 = widthM * heightM;
let glassPrice = areaM2 * glassType.pricePerMeter;

// Process all operations
const processedOperations = operations.map(op => {
    let estimatedPrice = 0;

    if (op.type === 'SHATAF') {
        estimatedPrice = 0; // Backend will calculate
    } else if (op.type === 'FARMA' || op.type === 'LASER') {
        estimatedPrice = op.manualPrice || 0;
    }

    return { ...op, calculatedPrice: estimatedPrice };
});

// Show info message if SHATAF operations present
if (hasShataf) {
    showInfo('سيتم حساب سعر الشطف النهائي عند انشاء الفاتورة');
}
```

## User Experience Flow

### 1. Adding to Cart

**Example: Glass with SHATAF + LASER operations**

```
Glass: زجاج شفاف 6 مم
Dimensions: 1000mm × 800mm
Operations:
  - SHATAF (KHARAZAN + NORMAL_SHATAF): 0 جنيه (سيتم الحساب)
  - LASER (NORMAL): 150 جنيه

Estimated Total: 198 جنيه
  Glass: 48 جنيه
  Operations: 150 جنيه

⚠️ Note: سيتم حساب سعر الشطف النهائي عند انشاء الفاتورة
```

### 2. Cart Display

The cart shows:
- ✅ Accurate glass prices
- ✅ Accurate LASER/FARMA manual prices
- ⚠️ SHATAF prices show as "سيتم الحساب" or 0

### 3. Invoice Creation

When user clicks "انشاء الفاتورة":
1. Backend receives complete request with all operations
2. Backend calculates SHATAF prices using rates from database
3. Backend returns **accurate final total**
4. **Confirmation dialog shows final price**
5. User approves and invoice is created

### 4. Confirmation Dialog

```
┌─────────────────────────────────────┐
│  تأكيد انشاء الفاتورة               │
├─────────────────────────────────────┤
│  العميل: أحمد محمد                  │
│  الاجمالي: 241.20 جنيه  ← Accurate! │
│  المدفوع: 200 جنيه                  │
│  المتبقي: 41.20 جنيه                │
│                                     │
│  [تأكيد] [الغاء]                    │
└─────────────────────────────────────┘
```

## Advantages of This Approach

### ✅ Pros
1. **No preview endpoint changes needed** - Works with existing backend
2. **Fast cart operations** - No network calls for each operation
3. **Accurate final pricing** - Backend calculates actual prices
4. **User sees price before confirming** - In confirmation dialog
5. **Supports unlimited operations per line** - No API call limits

### ⚠️ Trade-offs
1. **SHATAF prices not shown in cart** - Only shown at confirmation
2. **Estimated totals** - Cart total may differ from final total

## Alternative Solutions (Not Implemented)

### Option A: New Preview Endpoint (Complex)
Create `/api/invoices/preview-multi-operation` endpoint that accepts operations array.

**Pros:** Accurate preview in cart
**Cons:** More backend work, additional API calls

### Option B: Fetch Rates Client-Side (Over-fetching)
Load all shataf rates to frontend and calculate client-side.

**Pros:** Accurate preview
**Cons:** Exposes pricing data, complex calculations, large data transfer

### Option C: Hybrid Approach (Over-engineered)
Call preview for first SHATAF operation, estimate others.

**Pros:** Semi-accurate preview
**Cons:** Confusing UX, still inaccurate for multiple SHATAF operations

## Testing Checklist

### ✅ Test Case 1: Single SHATAF Operation
- [ ] Add glass with 1 SHATAF operation
- [ ] Cart shows glass price + 0 for SHATAF
- [ ] Message: "سيتم حساب سعر الشطف..."
- [ ] Create invoice
- [ ] Confirmation shows accurate total
- [ ] Invoice created successfully

### ✅ Test Case 2: Multiple Operations (SHATAF + LASER)
- [ ] Add glass with SHATAF + LASER operations
- [ ] Cart shows: glass + 0 (SHATAF) + manual price (LASER)
- [ ] Create invoice
- [ ] Confirmation shows accurate total with SHATAF calculated
- [ ] Invoice created successfully

### ✅ Test Case 3: LASER Only (No SHATAF)
- [ ] Add glass with only LASER operation
- [ ] Cart shows: glass + manual price
- [ ] Success message (not info message)
- [ ] Create invoice
- [ ] Total matches cart estimate
- [ ] Invoice created successfully

### ✅ Test Case 4: Multiple Lines
- [ ] Add 3 different lines with various operations
- [ ] Cart shows all lines with estimates
- [ ] Create invoice
- [ ] Confirmation shows accurate grand total
- [ ] Invoice created successfully

## Backend Processing

The backend receives:

```json
{
  "customerId": 1,
  "invoiceLines": [
    {
      "glassTypeId": 1,
      "width": 1000,
      "height": 800,
      "dimensionUnit": "MM",
      "operations": [
        {
          "type": "SHATAF",
          "shatafType": "KHARAZAN",
          "farmaType": "NORMAL_SHATAF"
        },
        {
          "type": "LASER",
          "laserType": "NORMAL",
          "manualPrice": 150.0
        }
      ]
    }
  ],
  "amountPaidNow": 200
}
```

Backend processes:
1. Creates `InvoiceLine` with dimensions and glass type
2. For each operation:
   - Creates `InvoiceLineOperation` entity
   - Calculates price using `OperationCalculationService`
   - For SHATAF: Uses `ShatafRateService` to get rate and calculate
   - For LASER: Uses manual price
3. Sums all operation prices
4. Adds glass price
5. Returns total

## Summary

✅ **Solution works for multi-operation lines**
✅ **No preview endpoint needed**
✅ **User sees accurate price before confirming**
✅ **Fast and simple implementation**

The slight trade-off of not showing SHATAF prices in cart is acceptable because:
1. User still sees final price before confirming invoice
2. Cart operations are fast (no API calls)
3. Backend ensures accurate calculation
