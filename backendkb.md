# Backend Knowledge Base - ElGuindy Glass Invoicing System

This document provides comprehensive documentation for the Spring Boot backend codebase.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Controllers (REST API)](#controllers-rest-api)
3. [Services (Business Logic)](#services-business-logic)
4. [Models & Entities](#models--entities)
5. [Domain Layer (DDD)](#domain-layer-ddd)
6. [DTOs](#dtos)
7. [Repositories](#repositories)
8. [Configuration](#configuration)
9. [Exception Handling](#exception-handling)
10. [Key Business Flows](#key-business-flows)
11. [Enumerations](#enumerations)

---

## Architecture Overview

**Package Structure:** `com.example.backend`

```
backend/src/main/java/com/example/backend/
├── controllers/          # REST API endpoints (14 controllers)
├── services/             # Business logic (17+ services)
│   ├── cutting/          # Cutting rate calculations
│   └── storage/          # Storage providers (MinIO/S3)
├── domain/               # Domain-Driven Design modules
│   ├── customer/         # Customer aggregate
│   ├── glass/            # Glass type domain
│   ├── invoice/          # Invoice aggregate (most developed)
│   ├── payment/          # Payment domain
│   ├── shatf/            # Shatf rates domain
│   └── shared/           # Shared value objects
├── infrastructure/       # Infrastructure concerns
│   ├── adapter/          # External service adapters
│   └── mapper/           # Entity-DTO mappers
├── models/               # JPA entities (30+ entities)
│   ├── customer/         # Customer entity
│   ├── user/             # User/Role entities
│   ├── notification/     # Notification entity
│   └── enums/            # Status enums
├── dto/                  # Data Transfer Objects
│   ├── invoice/          # Invoice-related DTOs
│   └── notification/     # Notification DTOs
├── application/dto/      # Application layer DTOs
├── repositories/         # Spring Data JPA repositories
├── config/               # Application configuration
│   ├── security/         # JWT authentication
│   └── WebSocket/        # WebSocket config
├── authentication/       # Auth components
├── monitoring/           # Health & job monitoring
└── exceptions/           # Custom exception hierarchy
```

**Tech Stack:**
- Spring Boot 3.5.5, Java 21
- PostgreSQL with JPA/Hibernate
- JWT Authentication (jjwt 0.12.5)
- WebSocket (STOMP + SockJS)
- iText 5 for PDF generation
- MinIO/AWS S3 for file storage

---

## Operation Types

There are **only 2 operation types**:

### 1. SHATF (شطف) - Chamfering
Chamfering/beveling operations with various types and calculation formulas.

### 2. LASER (ليزر)
Laser cutting operations with manual price input.

---

## ShatfTypes (أنواع الشطف) - Chamfer Types

| English | Arabic | Category |
|---------|--------|----------|
| Kharzan | خرزان | Formula-based |
| Chamfered Edge (Chambré) | شمبورليه | Formula-based |
| 1 cm Chamfer | شطف 1 سم | Formula-based |
| 2 cm Chamfer | شطف 2 سم | Formula-based |
| 3 cm Chamfer | شطف 3 سم | Formula-based |
| Julia Profile | جوليا | Formula-based |
| Laser Chamfer | شطف ليزر | Manual input |
| Sanding Chamfer | شطف صنفرة | Area-based (per m²) |

---

## Chamfer Calculation Formulas (حساب الشطف)

These formulas calculate the **shatf meters** for pricing:

| Formula | Arabic Name | Calculation |
|---------|-------------|-------------|
| Straight | عدل | 2 × (Length + Width) |
| Molded head | رأس فارمة | (3 × 2) + (Width × Length) |
| Double molded head | 2 رأس فارمة | (4 × 2) + (Width × Length) |
| Molded side | جنب فارمة | (2 × 3) + (Width × Length) |
| Double molded side | 2 جنب فارمة | (2 × 4) + (Width × Length) |
| Head and side | رأس + جنب فارمة | 3 × (Length + Width) |
| Double head + molded side | 2 رأس + جنب فارمة | (4 × 3) + (Width × Length) |
| Double side + molded head | 2 جنب + رأس فارمة | (3 × 4) + (Width × Length) |
| Full molding | فارمة كاملة | 4 × (Length + Width) |
| Circle / Wheel | العجلة | 6 × Diameter |
| Rotation | الدوران | Manual input |
| Panels | التابلوهات | Manual input |

---

## Controllers (REST API)

### InvoiceController (`/api/v1/invoices`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create invoice with validation |
| GET | `/{id}` | Get invoice by ID |
| GET | `/` | List invoices (paginated, filterable) |
| PUT | `/{id}/pay` | Record payment on invoice |
| DELETE | `/{id}` | Delete invoice |
| GET | `/revenue` | Get revenue statistics |
| GET | `/export` | Export invoices (Excel/CSV) |
| POST | `/preview-line-total` | Preview line calculations |
| POST | `/preview-line` | Preview detailed line pricing |
| GET | `/{id}/pdf` | Get invoice PDF URL |
| GET | `/{id}/pdf/download` | Download invoice PDF |

### CustomerController (`/api/v1/customers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all customers |
| GET | `/search` | Search by name/phone |
| GET | `/{id}` | Get customer details |
| POST | `/` | Create customer (with duplicate phone validation) |

### PaymentController (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Record new payment |
| GET | `/{id}` | Get payment details |
| GET | `/customer/{customerId}` | Get customer payments |
| GET | `/invoice/{invoiceId}` | Get invoice payments |
| GET | `/range` | Get payments in date range |
| DELETE | `/{id}` | Delete payment |

### PrintJobController (`/api/v1/print-jobs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/invoice/{invoiceId}` | Create all print jobs |
| POST | `/invoice/{invoiceId}/{printType}` | Create specific print type |
| GET | `/invoice/{invoiceId}/status` | Check print status |
| POST | `/invoice/{invoiceId}/retry/{printType}` | Retry failed job |
| GET | `/queue` | Get print queue |
| PUT | `/{jobId}/printing` | Mark as printing |
| PUT | `/{jobId}/printed` | Mark as printed |
| PUT | `/{jobId}/failed` | Mark as failed |

### GlassTypeController (`/api/v1/glass-types`)
- CRUD operations for glass types
- `GET /calculation-methods` - Available calculation methods

### OperationPriceController (`/api/v1/operation-prices`)
- CRUD for operation prices
- `PATCH /{id}/toggle` - Toggle active status
- `POST /initialize` - Initialize defaults

### ShatfRateController (`/api/v1/shatf-rates`)
- CRUD for shatf rates by type/thickness
- `GET /rate` - Get rate for specific dimensions
- `POST /bulk-update` - Bulk update rates

### UserController (`/api/v1/users`)
- User CRUD, activation/deactivation
- `PUT /{userId}/role` - Update user role

### DashboardController (`/api/v1/dashboard`)
- `/stats`, `/revenue`, `/recent-invoices`
- `/top-customers`, `/monthly-revenue`
- `/sales-overview`, `/cashier-summary`

### FactoryController (`/api/v1/factory`)
- `GET /invoices/recent` - Recent invoices for workers
- `POST /print-sticker/{invoiceId}` - Print sticker

### CompanyProfileController (`/api/v1/company`)
- Get/update company profile
- Logo upload

### FileController (`/api/v1/files`)
- `GET /url` - Get file URL from storage
- `GET /urls` - Get multiple file URLs

---

## Services (Business Logic)

### Core Invoice Services

**InvoiceService** - Main invoice operations
```java
createInvoice(request)           // Full invoice creation with validation
findById(id)                     // Get by ID
getInvoices(pagination, filters) // Paginated list
updateInvoice(invoice)           // Update
deleteInvoice(id)                // Delete
```

**InvoiceCreationService** - Domain-integrated creation
```java
createInvoiceWithDomain(request, customer)
// Handles dimension conversion (cm/m)
// Calculates pricing via domain services
// Stores ShatfType
```

**InvoicePricingService** (Domain Service)
```java
calculateLinePrice(dimensions, glassType, shatfType, calculationType, diameter, manualPrice)
// Returns LineCalculation with:
// - Glass price (area × pricePerMeter)
// - Shatf meters (using chamfer calculation formulas)
// - Cutting price (shatfMeters × rate)
```

### Customer & Balance Management

**CustomerService**
```java
saveCustomer(customer)              // With phone deduplication
findById(id) / findByPhone(phone)   // Lookups
findOrCreateCustomer(name, phone, address)
updateCustomerBalance(customerId, amount)
```

**BalanceReconciliationService** - Reconciles customer balance with invoices/payments

### Payment Processing

**PaymentService**
```java
recordPayment(customerId, invoiceId, amount, method, reference, notes, username)
getCustomerPayments(customerId)
getInvoicePayments(invoiceId)
getPaymentsBetweenDates(startDate, endDate)
// Validates: CASH customers cannot have payments, amount validation
```

### Cutting & Operations

**OperationCalculationService**
```java
createAndCalculateOperation(request, widthM, heightM, thickness)
// Handles SHATF: formula-based with shatf meters calculation
// Handles LASER: manual price input
```

**CuttingContext** - Strategy pattern for operation types
```java
calculateCuttingPrice(invoiceLine)
// Dispatches to SHATF or LASER strategy
```

**ShatfRateService**
- Rate lookups by shatf type and thickness

### PDF & Print Management

**PdfGenerationService**
```java
generateInvoicePdf(invoice, printType)  // Generate and store in MinIO
generateInvoicePdfOnDemand(invoice)     // Generate byte[] without storage
// Creates Arabic RTL invoices with iText5
// Two-page layout: Company Copy + Customer Copy
```

**PrintJobService**
```java
createPrintJobs(invoice)                      // Create CLIENT, OWNER, STICKER
createSinglePrintJobByType(invoice, type)
checkPrintJobStatus(invoiceId)
retryFailedPrintJobs(invoiceId)
// WebSocket notifications for print events
```

### Utility Services

**ReadableIdGeneratorService** - Sequential IDs (INV-0001, INV-0002)
**WebSocketNotificationService** - Real-time notifications
**StorageService** - MinIO/S3 abstraction
**ExportService** - Excel/CSV export

---

## Models & Entities

### Core Entities

**Invoice**
```java
id (String), customer, issueDate, paymentDate
totalPrice, amountPaidNow, remainingBalance
status (PENDING/PAID/CANCELLED), notes, pdfUrl
// Relationships: 1-to-Many with InvoiceLine, PrintJob, Payment
// Methods: calculateRemainingBalance(), recordPayment(), isFullyPaid()
```

**InvoiceLine**
```java
id, invoice, glassType
width, height, dimensionUnit (CM default), quantity
diameter, areaM2, lengthM
shatfType, calculationType, shatfMeters
glassPrice, cuttingPrice, lineTotal, cuttingRate
// Relationships: Many-to-One Invoice
```

**Customer**
```java
id, name, phone (unique), address
customerType (CASH/REGULAR/COMPANY/GOVERNMENT)
balance, createdAt, updatedAt
// Methods: addToBalance(), subtractFromBalance(), canHaveBalance()
// Balance validation: CASH customers must have balance = 0
```

**GlassType**
```java
id, name, thickness, color
pricePerMeter, calculationMethod (AREA/LENGTH), active
```

**PrintJob**
```java
id, invoice, type (CLIENT/OWNER/STICKER)
status (QUEUED/PRINTING/PRINTED/FAILED)
pdfPath, errorMessage, createdAt, printedAt
```

**Payment**
```java
id, customer, invoice (optional), amount
paymentMethod (CASH/CHECK/TRANSFER/CREDIT_CARD/VODAFONE_CASH/OTHER)
paymentDate, referenceNumber, notes, createdBy
```

**ShatfRate**
```java
id, shatfType, thickness, ratePerMeter
// Composite unique: shatfType + thickness
```

**User**
```java
id, firstName, lastName, username (unique)
password (hashed), role (OWNER/ADMIN/CASHIER/WORKER), isActive
```

---

## Domain Layer (DDD)

The project is evolving towards Domain-Driven Design with separate domain modules.

### Module Structure
Each domain module contains:
- `model/` - Domain entities and value objects
- `repository/` - Domain repository interfaces
- `service/` - Domain services
- `exception/` - Domain-specific exceptions

### Shared Value Objects (`domain/shared/valueobject/`)
```java
EntityId      // Base for all ID value objects
Money         // BigDecimal-based for precision
Area          // Square meters
Dimensions    // Proper unit conversion (cm/m)
```

### Invoice Domain (Most Developed)
```java
Invoice          // Aggregate root
InvoiceId        // Value object
InvoiceLine      // Entity
InvoiceLineId    // Value object
LineCalculation  // Calculation results value object
```

**InvoicePricingService** - Core pricing calculations:
1. Calculate area from dimensions (in meters)
2. Calculate glass price: area × pricePerMeter
3. Calculate shatf meters using chamfer calculation formula
4. Lookup ShatfRate by type and thickness
5. Calculate cutting price: shatfMeters × rate

---

## DTOs

### Invoice DTOs
| DTO | Purpose |
|-----|---------|
| `CreateInvoiceRequest` | Invoice creation with lines, customer, payment |
| `InvoiceDTO` | Full invoice response |
| `InvoiceLineDTO` | Line item response |
| `LinePreviewDTO` | Preview calculations |
| `CreateInvoiceLineRequest` | Line creation with shatfType, calculationType |

### Payment DTOs
| DTO | Purpose |
|-----|---------|
| `PaymentDTO` | Payment response |
| `RecordPaymentRequest` | Payment creation |
| `PaymentRecordResponse` | Payment + balance info |

### Print Job DTOs
| DTO | Purpose |
|-----|---------|
| `PrintJobDTO` | Print job response |
| `PrintJobStatusDTO` | Status with completion info |

---

## Repositories

| Repository | Key Custom Queries |
|------------|-------------------|
| `InvoiceRepository` | findByCustomerId, findByStatus, findByIssueDateBetween, getTotalRevenueByStatusAndDateRange |
| `PaymentRepository` | findByCustomerId, findByInvoiceId, findPaymentsBetweenDates, getTotalPaymentsByCustomer |
| `CustomerRepository` | findByPhone, findByNameContainingIgnoreCase |
| `PrintJobRepository` | findByInvoiceId, findByStatus, findByInvoiceIdAndType |
| `ShatfRateRepository` | findByShatfTypeAndThickness, findByActive |

---

## Configuration

### Security (`config/security/`)
```java
// SecurityConfiguration.java
- JWT-based stateless authentication
- CORS: localhost:3000, localhost:5173, el-guindy.vercel.app
- Public: /api/v1/auth/**, /actuator/**, /ws/**
- Session: STATELESS, CSRF disabled
```

### WebSocket (`config/WebSocket/`)
```java
// WebSocketConfig.java
- Endpoints: /ws (SockJS), /ws-native
- Broker: /topic, /queue
- Prefixes: /app, /user
- Heartbeat: 10s STOMP, 25s SockJS
```

### Key Properties (`application.properties`)
```properties
# Storage
storage.type=minio  # or s3, disabled

# Print Jobs
app.print-jobs.max-retry-attempts=3
app.print-jobs.pdf-retention-days=30

# Cutting
app.cutting-rates.default-shatf-rate=10.0
app.cutting-rates.default-laser-rate=50.0

# JWT
jwt.secret=${JWT_SECRET:...}
jwt.expiration=${JWT_EXPIRATION:86400000}
```

---

## Exception Handling

### Hierarchy
```
DomainException (base)
├── Customer Exceptions
│   ├── CustomerNotFoundException
│   ├── DuplicatePhoneNumberException
│   ├── CustomerCreationException
│   └── InvalidCustomerTypeException
├── Invoice Exceptions
│   ├── InvoiceNotFoundException
│   ├── InvoiceCreationException
│   ├── InvalidDimensionsException
│   ├── GlassTypeNotFoundException
│   └── CuttingCalculationException
├── Print Job Exceptions
│   ├── PrintJobCreationException
│   ├── PdfGenerationException
│   └── PrintJobDatabaseException
└── PaymentException, UserNotFoundException, etc.
```

### Exception Handlers
- `InvoiceExceptionHandler.java` - REST responses for invoice errors
- `PrintJobExceptionHandler.java` - REST responses for print errors

---

## Key Business Flows

### Invoice Creation Flow
```
1. Validate customer exists
2. Validate dimensions (in centimeters, max 500cm × 300cm)
3. For each line:
   - Lookup glass type
   - Convert dimensions to meters for calculations
   - Calculate via InvoicePricingService:
     • area = (width/100) × (height/100) in m²
     • glassPrice = area × pricePerMeter
     • shatfMeters = chamfer formula(width, height, diameter)
     • rate = ShatfRate.lookup(shatfType, thickness)
     • cuttingPrice = shatfMeters × rate
4. Sum lines for total (considering quantity)
5. Calculate balance = total - amountPaidNow
6. If balance ≤ 0.01, mark PAID
7. Update customer balance (non-CASH)
8. Record initial payment if amountPaidNow > 0
9. Create print jobs (CLIENT, OWNER, STICKER)
10. WebSocket notify factory/dashboard
```

### Payment Processing
```
1. Validate amount > 0, customer exists
2. Verify CASH customers cannot have payments
3. If invoiceId: verify customer owns invoice
4. Validate amount ≤ remaining balance
5. Create Payment entity
6. invoice.recordPayment(amount)
7. customer.subtractFromBalance(amount)
8. Persist all changes
```

### Print Job Workflow
```
1. Load invoice with details
2. For each type (CLIENT, OWNER, STICKER):
   - Generate PDF via PdfGenerationService
   - Store in MinIO/S3
   - Create PrintJob entity
3. Handle partial failures (continue if some fail)
4. WebSocket notify:
   - /topic/factory/new-invoice
   - /topic/dashboard/invoice-created
5. PrintJobMonitor checks failures every 5 min
```

---

## Enumerations

### Status Enums
| Enum | Values |
|------|--------|
| InvoiceStatus | PENDING, PAID, CANCELLED |
| LineStatus | PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| PrintStatus | QUEUED, PRINTING, PRINTED, FAILED |
| PrintType | CLIENT, OWNER, STICKER |
| PaymentMethod | CASH, CHECK, TRANSFER, CREDIT_CARD, VODAFONE_CASH, OTHER |
| CustomerType | CASH, REGULAR, COMPANY, GOVERNMENT |

### Operation Enums
| Enum | Values |
|------|--------|
| OperationType | SHATF, LASER |
| DimensionUnit | CM (default), M |
| CalculationMethod | AREA, LENGTH |

### ShatfType (أنواع الشطف)
| Value | Arabic |
|-------|--------|
| KHARZAN | خرزان |
| CHAMBRE | شمبورليه |
| ONE_CM | شطف 1 سم |
| TWO_CM | شطف 2 سم |
| THREE_CM | شطف 3 سم |
| JULIA | جوليا |
| LASER_CHAMFER | شطف ليزر (manual input) |
| SANDING | شطف صنفرة (per m²) |

### Chamfer Calculation Types (حساب الشطف)
| Value | Arabic | Formula |
|-------|--------|---------|
| STRAIGHT | عدل | 2 × (L + W) |
| HEAD_MOLDED | رأس فارمة | (3×2) + (W×L) |
| DOUBLE_HEAD_MOLDED | 2 رأس فارمة | (4×2) + (W×L) |
| SIDE_MOLDED | جنب فارمة | (2×3) + (W×L) |
| DOUBLE_SIDE_MOLDED | 2 جنب فارمة | (2×4) + (W×L) |
| HEAD_SIDE_MOLDED | رأس + جنب فارمة | 3 × (L + W) |
| DOUBLE_HEAD_SIDE_MOLDED | 2 رأس + جنب فارمة | (4×3) + (W×L) |
| DOUBLE_SIDE_HEAD_MOLDED | 2 جنب + رأس فارمة | (3×4) + (W×L) |
| FULL_MOLDED | فارمة كاملة | 4 × (L + W) |
| WHEEL | العجلة | 6 × diameter |
| ROTATION | الدوران | Manual input |
| PANELS | التابلوهات | Manual input |

### Roles
| Role | Access |
|------|--------|
| OWNER | Full system access |
| ADMIN | Management features |
| CASHIER | Sales only |
| WORKER | Factory operations only |

---

## Quick Reference

### Important File Locations
- **Main Class**: `BackendApplication.java`
- **Security Config**: `config/security/SecurityConfiguration.java`
- **JWT Service**: `config/security/JwtService.java`
- **Invoice Service**: `services/InvoiceService.java`
- **Pricing Logic**: `domain/invoice/service/InvoicePricingService.java`
- **PDF Generation**: `services/PdfGenerationService.java`
- **WebSocket Notifications**: `services/WebSocketNotificationService.java`

### API Base URL
- Development: `http://localhost:8080/api/v1`
- All endpoints prefixed with `/api/v1`

### Database
- PostgreSQL on `localhost:5432`
- Database: `elguindyDB`
- Auto-schema via `spring.jpa.hibernate.ddl-auto=update`

### Default Dimension Unit
- **Centimeters (cm)** - All dimensions stored and displayed in cm
- Converted to meters internally for area/pricing calculations
