# Frontend-Backend Compatibility Check

## Issue: Backend and Frontend Not Compatible

Let me trace through the entire data flow to find the incompatibility.

---

## Frontend → Backend Data Flow

### 1. Frontend Creates Operations (EnhancedProductEntry.jsx)

**Operation Structure in Frontend State:**
```javascript
// SHATAF operation
{
  id: "unique-id",
  type: "SHATAF",           // ⚠️ String value
  shatafType: "KHARAZAN",   // ⚠️ String value
  farmaType: "NORMAL_SHATAF", // ⚠️ String value
  diameter: null,
  manualCuttingPrice: null
}

// FARMA operation
{
  id: "unique-id",
  type: "FARMA",           // ⚠️ String value
  farmaType: "WHEEL_CUT",  // ⚠️ String value
  diameter: 50,
  manualPrice: 100.0
}

// LASER operation
{
  id: "unique-id",
  type: "LASER",           // ⚠️ String value
  laserType: "NORMAL",     // ⚠️ String value
  manualPrice: 150.0,
  notes: ""
}
```

### 2. Frontend Sends to Backend (CashierInvoicePage.jsx:504-513)

```javascript
operations: item.operations?.map(op => ({
    type: op.type,                    // "SHATAF" | "FARMA" | "LASER"
    shatafType: op.shatafType || null,   // "KHARAZAN" | etc.
    farmaType: op.farmaType || null,     // "NORMAL_SHATAF" | etc.
    laserType: op.laserType || null,     // "NORMAL" | etc.
    diameter: op.diameter ? parseFloat(op.diameter) : null,
    manualPrice: op.manualPrice ? parseFloat(op.manualPrice) : null,
    manualCuttingPrice: op.manualCuttingPrice ? parseFloat(op.manualCuttingPrice) : null,
    notes: op.notes || null
}))
```

**Actual JSON Sent:**
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
          "laserType": null,
          "diameter": null,
          "manualPrice": null,
          "manualCuttingPrice": null,
          "notes": null
        }
      ]
    }
  ]
}
```

---

## Backend Expects

### 1. CreateInvoiceLineRequest.java

```java
public class CreateInvoiceLineRequest {
    private Long glassTypeId;
    private Double width;
    private Double height;
    private DimensionUnit dimensionUnit;  // Enum: MM, CM, M

    @Valid
    @Builder.Default
    private List<OperationRequest> operations = new ArrayList<>();
}
```

### 2. OperationRequest.java

```java
public class OperationRequest {
    @NotNull(message = "Operation type is required")
    private OperationType type;  // ✅ Enum: SHATAF, FARMA, LASER

    // SHATAF fields
    private ShatafType shatafType;  // ✅ Enum
    private FarmaType farmaType;    // ✅ Enum
    private Double diameter;
    private Double manualCuttingPrice;

    // LASER fields
    private String laserType;       // ✅ String (not enum)
    private Double manualPrice;
    private String notes;
}
```

---

## Potential Incompatibilities

### ✅ COMPATIBLE: Enum String Mapping

Spring Boot automatically converts JSON strings to Java enums if the names match exactly.

Frontend sends:
```json
"type": "SHATAF"
```

Backend receives:
```java
OperationType.SHATAF  // ✅ Works!
```

### ✅ COMPATIBLE: Field Names

All field names match exactly between frontend and backend.

### ⚠️ POTENTIAL ISSUE: Missing Backend Enum Values

**Check if all frontend enum values exist in backend:**

#### Operation Types
- Frontend: `"SHATAF"`, `"FARMA"`, `"LASER"`
- Backend: `SHATAF`, `FARMA`, `LASER` ✅

#### Shataf Types
Frontend uses (from constants/shatafTypes.js):
- Need to verify these match backend `ShatafType` enum

#### Farma Types
Frontend uses (from constants/farmaTypes.js):
- Need to verify these match backend `FarmaType` enum

---

## Diagnostic Steps

### Step 1: Check Backend Enum Values

```bash
# Check ShatafType enum
grep -A 50 "public enum ShatafType" backend/src/main/java/com/example/backend/models/enums/ShatafType.java

# Check FarmaType enum
grep -A 50 "public enum FarmaType" backend/src/main/java/com/example/backend/models/enums/FarmaType.java
```

### Step 2: Check Frontend Constants

```bash
# Check frontend shataf types
cat frontend/src/constants/shatafTypes.js

# Check frontend farma types
cat frontend/src/constants/farmaTypes.js
```

### Step 3: Enable Backend Debug Logging

Add to `application.properties`:
```properties
logging.level.com.example.backend.dto=DEBUG
logging.level.org.springframework.web.servlet.mvc.method.annotation.RequestResponseBodyMethodProcessor=DEBUG
```

### Step 4: Check Browser Network Tab

1. Open browser DevTools → Network tab
2. Add operation to cart
3. Look at request payload sent to backend
4. Check response for any error messages

---

## Common Incompatibility Issues

### Issue 1: Enum Value Mismatch

**Problem:** Frontend sends `"KHARAZAN"` but backend expects `"KHARAZAN"` (different casing or spelling)

**Solution:** Ensure exact match between frontend constants and backend enum values.

### Issue 2: Missing @JsonProperty Annotation

**Problem:** Jackson can't deserialize enum

**Solution:** Add to backend enum:
```java
@JsonValue  // For serialization
public String getValue() {
    return this.name();
}
```

### Issue 3: Null Validation on Optional Fields

**Problem:** Backend validates fields that should be optional

**Solution:** Remove `@NotNull` from optional fields in `OperationRequest`

### Issue 4: Frontend Not Sending Required Fields

**Problem:** Frontend omits required fields like `type`

**Solution:** Ensure all required fields are included in the request mapping

---

## Next Steps

1. **Verify enum values match** between frontend constants and backend enums
2. **Check backend logs** for deserialization errors
3. **Test with Postman/curl** to isolate frontend vs backend issues
4. **Add logging** to see exactly what backend receives

---

## Test Request (Copy-paste to Postman)

```json
POST http://localhost:8080/api/invoices
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

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
          "laserType": null,
          "notes": null
        }
      ]
    }
  ],
  "amountPaidNow": 0,
  "notes": ""
}
```

Expected Response: Invoice created with operations saved to database.

If this works in Postman but not from frontend, the issue is in the frontend request formatting.
If this fails in Postman, the issue is in the backend validation or deserialization.
