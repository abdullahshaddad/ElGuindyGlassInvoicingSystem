# Testing Multi-Operations Per Invoice Line

## Backend-Frontend Integration Verification

### Expected Request Format

The frontend should send invoice requests with this structure:

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
          "farmaType": "NORMAL_SHATAF",
          "diameter": null,
          "manualCuttingPrice": null,
          "manualPrice": null,
          "notes": null
        },
        {
          "type": "LASER",
          "shatafType": null,
          "farmaType": null,
          "laserType": "NORMAL",
          "diameter": null,
          "manualCuttingPrice": null,
          "manualPrice": 150.0,
          "notes": "عميق"
        }
      ]
    }
  ],
  "amountPaidNow": 500.0,
  "notes": ""
}
```

### Operation Types & Required Fields

#### SHATAF Operation
**Required:**
- `type`: "SHATAF"
- `shatafType`: One of the ShatafType enum values (e.g., "KHARAZAN", "SHAMBORLEH", "JULIA")
- `farmaType`: One of the FarmaType enum values (e.g., "NORMAL_SHATAF", "WHEEL_CUT")

**Optional:**
- `diameter`: Required only if farmaType requires it (e.g., "WHEEL_CUT")
- `manualCuttingPrice`: Required only if shatafType is manual (e.g., "LASER", "ROTATION")

#### FARMA Operation
**Required:**
- `type`: "FARMA"
- `farmaType`: One of the FarmaType enum values

**Optional:**
- `diameter`: Required if farmaType requires it
- `manualPrice`: Required if farmaType is manual (e.g., "MANUAL_FARMA")

#### LASER Operation
**Required:**
- `type`: "LASER"
- `laserType`: String (e.g., "NORMAL", "DEEP", "ENGRAVE", "POLISH")
- `manualPrice`: Number (the price for this laser operation)

**Optional:**
- `notes`: String

### Frontend Status: ✅ ALREADY CORRECT

The frontend (`CashierInvoicePage.jsx`) is already sending requests in the correct format:
- Line 504-513: Operations array mapped correctly
- Line 487-502: Legacy fields for backward compatibility
- All enum values match backend expectations

### Backend Status: ✅ READY

Backend has been updated with:
- `OperationType` enum (SHATAF, FARMA, LASER)
- `InvoiceLineOperation` entity for database storage
- `OperationRequest` DTO for API requests
- `OperationCalculationService` for price calculations
- Updated `InvoiceService` to process multiple operations

### Testing Steps

1. **Start the Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   - New table `invoice_line_operation` will be created automatically
   - Check logs for any migration errors

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Create Test Invoice**
   - Go to Cashier page
   - Select a customer
   - Add a product with multiple operations:
     - Add SHATAF operation (select type and farma)
     - Add LASER operation (enter price)
   - Add to cart
   - Check browser console for request log (line 520 in CashierInvoicePage.jsx)
   - Create invoice

4. **Verify Backend Processing**
   Check backend logs for:
   ```
   Creating operation: type=SHATAF, width=1.0m, height=0.8m, thickness=6.0mm
   Shataf calculation: shatafMeters=X.XX, rate=X.XX, price=X.XX
   Added operation: type=SHATAF, price=X.XX EGP
   Creating operation: type=LASER, width=1.0m, height=0.8m, thickness=6.0mm
   Laser operation: type=NORMAL, price=150.0
   Added operation: type=LASER, price=150.0 EGP
   ```

5. **Verify Database**
   ```sql
   -- Check invoice line
   SELECT * FROM invoice_line WHERE id = <new_line_id>;

   -- Check operations
   SELECT * FROM invoice_line_operation WHERE invoice_line_id = <new_line_id>;

   -- Should see multiple rows, one per operation
   ```

6. **Verify Response**
   - Invoice should be created successfully
   - Total price should equal: glass price + sum of all operation prices
   - Invoice lines should include operations array in response

### Common Issues & Solutions

**Issue:** Backend validation error "نوع العملية مطلوب"
**Solution:** Ensure `type` field is one of: "SHATAF", "FARMA", "LASER" (exact match)

**Issue:** Backend error "سماكة الزجاج مطلوبة"
**Solution:** Ensure glass type has thickness set in database

**Issue:** Operations not saving to database
**Solution:** Check cascade settings on InvoiceLine entity (should be `CascadeType.ALL`)

**Issue:** Frontend not sending operations
**Solution:** Verify EnhancedProductEntry component has operations in currentLine state

### Example Console Output

**Frontend Console (when adding to cart):**
```
🛒 Adding to cart: {
  glassType: "زجاج شفاف 6 مم",
  dimensions: "1000x800",
  operationsCount: 2,
  glassPrice: 48,
  operationsPrice: 180,
  lineTotal: 228
}
```

**Frontend Console (when creating invoice):**
```
📤 Sending Invoice Request: {
  "customerId": 1,
  "invoiceLines": [{
    "glassTypeId": 1,
    "width": 1000,
    "height": 800,
    "dimensionUnit": "MM",
    "operations": [
      {"type": "SHATAF", "shatafType": "KHARAZAN", ...},
      {"type": "LASER", "laserType": "NORMAL", "manualPrice": 150, ...}
    ]
  }]
}
```

**Backend Console:**
```
Creating operation: type=SHATAF, width=1.0m, height=0.8m, thickness=6.0mm
Shataf calculation: shatafMeters=3.6, rate=12.0, price=43.2
Added operation: type=SHATAF, price=43.2 EGP
Creating operation: type=LASER, width=1.0m, height=0.8m, thickness=6.0mm
Laser operation: type=NORMAL, price=150.0
Added operation: type=LASER, price=150.0 EGP
Invoice created successfully with 1 lines, total: 228.0 EGP
```

### Enum Values Reference

**OperationType:**
- SHATAF
- FARMA
- LASER

**ShatafType:** (check backend enum for complete list)
- KHARAZAN
- SHAMBORLEH
- ONE_CM
- TWO_CM
- THREE_CM
- JULIA
- SANDING
- LASER (manual)
- ROTATION (manual)
- TABLEAUX (manual)

**FarmaType:** (check backend enum for complete list)
- NORMAL_SHATAF
- WHEEL_CUT
- MANUAL_FARMA

### Success Criteria

✅ Frontend sends operations array with correct structure
✅ Backend validates each operation type
✅ Backend calculates prices for formula-based operations
✅ Backend saves operations to database
✅ Invoice total = glass price + sum(all operation prices)
✅ Operations appear in invoice response
