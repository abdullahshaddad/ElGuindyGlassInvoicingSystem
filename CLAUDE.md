# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ElGuindy Glass Invoicing System is a full-stack web application for managing glass cutting and invoicing operations. The system handles customer management, invoice generation, glass type configurations, cutting rate calculations, and print job management with real-time WebSocket notifications.

**Tech Stack:**
- **Backend:** Spring Boot 3.5.5 with Java 21, PostgreSQL, JWT authentication, Lombok
- **Frontend:** React 18 with Vite, TailwindCSS, React Router, React Query, i18next (Arabic RTL support)
- **Infrastructure:** Docker Compose (PostgreSQL, MinIO for S3-compatible storage)

## Development Commands

### Backend (Spring Boot + Maven Wrapper)

```bash
cd backend

# Run locally (requires PostgreSQL on localhost:5432)
./mvnw spring-boot:run

# Build
./mvnw clean package

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=InvoiceServiceTest

# Skip tests during build
./mvnw clean package -DskipTests
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npm test -- CustomerService.test.js

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### Docker Compose

```bash
# Start all services (backend, PostgreSQL, MinIO)
docker compose up -d

# Rebuild backend container
docker compose up --build backend

# Stop all services
docker compose down

# View backend logs
docker compose logs -f backend
```

## Architecture

### Backend Structure

Hybrid layered/DDD architecture with domain modules:

- **`controllers/`** - REST API endpoints
- **`services/`** - Business logic layer
  - `InvoiceService` - Invoice CRUD, validation, management
  - `InvoiceCreationService` - Invoice creation with line/operation processing
  - `OperationCalculationService` - Calculates operation pricing (cutting, polishing, etc.)
  - `PrintJobService` - PDF generation and print job management
  - `PdfGenerationService` - PDF document generation with iText
  - `ReadableIdGeneratorService` - Generates human-readable invoice IDs
  - `StorageService` - Abstraction for MinIO/S3 storage
  - `ExportService` - Data export functionality
  - `cutting/` - Cutting rate calculations (`CuttingRateService`, `ShatafRateService`, `CuttingContext`)
  - `storage/` - Storage provider implementations
- **`domain/`** - Domain-Driven Design modules (evolving)
  - `customer/`, `glass/`, `invoice/`, `payment/`, `shataf/`, `shared/`
  - Each module contains: `model/`, `repository/`, `service/`, `exception/`
- **`infrastructure/`** - Infrastructure concerns
  - `adapter/` - External service adapters
  - `mapper/` - Entity-DTO mappers
- **`repositories/`** - Spring Data JPA repositories
- **`models/`** - JPA entities
  - Core: `Invoice`, `InvoiceLine`, `InvoiceLineOperation`, `Customer`, `GlassType`, `PrintJob`, `Payment`
  - Supporting: `CuttingRate`, `ShatafRate`, `OperationPrice`, `CompanyProfile`
  - `enums/` - `InvoiceStatus`, `LineStatus`, `PrintStatus`, `PaymentMethod`, `CuttingType`, `ShatafType`, `OperationType`
  - `customer/` - Customer entity, `user/` - User/Role entities, `notification/` - Notification entity
- **`dto/`** - Data Transfer Objects (`invoice/` subdirectory for invoice-related DTOs)
- **`application/dto/`** - Application layer DTOs (being migrated)
- **`config/`** - Application configuration
  - `security/` - JWT authentication (`JwtAuthenticationFilter`, `JwtService`, `SecurityConfiguration`)
  - `WebSocket/` - WebSocket configuration and handlers
- **`authentication/`** - Authentication-related components
- **`monitoring/`** - `PrintJobMonitor` and health monitoring
- **`exceptions/`** - Custom exception hierarchy (`customer/`, `invoice/`, `printjob/`, `websocket/`)

**Key Backend Concepts:**

1. **Invoice Creation Flow:** `InvoiceService.createInvoice()` validates dimensions, calculates pricing via `OperationCalculationService`, and persists invoice with lines and operations.

2. **Cutting Calculations:** Strategy pattern via `CuttingContext` for cutting type (SHATF, LASER). Rates configurable per dimension range via `CuttingRate` and `ShatafRate` entities.

3. **Operations:** Each invoice line can have multiple operations (cutting, polishing, etc.) tracked via `InvoiceLineOperation`. Prices managed in `OperationPrice` table.

4. **Authentication:** JWT-based with roles (OWNER, ADMIN, CASHIER, WORKER). Config in `SecurityConfiguration.java`.

5. **WebSocket:** Real-time notifications for invoice/print job updates via `/ws/**` endpoints.

6. **Storage:** Configurable via `storage.type` property (minio, s3, or disabled) for PDF storage.

### Frontend Structure

React SPA with role-based routing and Arabic (RTL) internationalization:

- **`pages/`** - Page components organized by role
  - `auth/` - Login page
  - `admin/` - Admin pages (`GlassTypesPage`, `UserManagementPage`, `CuttingPricesConfigPage`, `OperationPricesPage`, `CompanyProfilePage`)
  - `cashier/` - Cashier interface (`CashierInvoicePage`, `components/` with invoice creation UI)
  - Root-level: `DashboardPage`, `CustomersPage`, `InvoicesPage`, `FactoryWorkerPage`
  - `errors/` - `NotFoundPage`, `UnauthorizedPage`
- **`components/`** - Reusable UI components
  - `layout/` - Layout wrappers (`Layout`, `CashierLayout`)
  - `ui/` - UI primitives
  - `AppRouter.jsx` - Main routing with role-based protection
- **`contexts/`** - React contexts (`AuthContext`, `ThemeContext`, `SnackbarContext`)
- **`services/`** - API service modules (axios-based): `invoiceService`, `customerService`, `glassTypeService`, `paymentService`, `printJobService`, `operationPriceService`, etc.
- **`api/`** - Axios configuration and interceptors
- **`hooks/`** - Custom React hooks
- **`constants/`** - Application constants and enums
- **`i18n/`** - Internationalization (Arabic translations)
- **`styles/`** - Global styles and SCSS variables
- **`tests/`** - Test files and mocks
- **`types/`** - TypeScript type definitions
- **`utils/`** - Utility functions (`dimensionUtils`, `invoiceUtils`, etc.)

**Key Frontend Concepts:**

1. **Routing & Roles:** `AppRouter.jsx` defines role-based routes via `RoleRoute` component. Roles: `OWNER`, `ADMIN`, `CASHIER`, `WORKER`.

2. **Authentication:** `AuthContext` manages auth state. Login redirects to role-appropriate pages (dashboard for OWNER/ADMIN, /cashier for CASHIER, /factory for WORKER).

3. **Path Aliases:** Use Vite aliases (`@/`, `@components`, `@pages`, `@services`, `@hooks`, `@utils`, `@contexts`, `@styles`, `@i18n`, `@types`) instead of relative imports.

4. **State Management:** React Query for server state, React Context for global UI state.

5. **Styling:** TailwindCSS with dark mode via `ThemeContext`. RTL support for Arabic.

6. **API Proxy:** Dev server proxies `/api` to backend (localhost:8080, configurable via `VITE_API_URL`). **Note:** The proxy rewrites paths, stripping the `/api` prefix (e.g., `/api/invoices` → `/invoices` on backend).

### Database Schema

Main entities:
- **Invoice** - Header with customer, total, status, readable ID, timestamps
- **InvoiceLine** - Line items with glass dimensions, quantity, unit price, status
- **InvoiceLineOperation** - Operations per line (cutting, polishing, etc.) with calculated costs
- **Customer** - Customer records with type (INDIVIDUAL, COMPANY, GOVERNMENT)
- **GlassType** - Glass types with base price per square meter
- **OperationPrice** - Configurable prices for operations (by operation type)
- **CuttingRate** - Laser cutting rates by dimension ranges
- **ShatafRate** - Shataf cutting rates by dimension ranges
- **PrintJob** - PDF generation jobs linked to invoices with status tracking
- **Payment** - Payment records with method and amount
- **User** - User accounts with roles and JWT authentication
- **CompanyProfile** - Company information for invoices/receipts

Database auto-managed via JPA (`spring.jpa.hibernate.ddl-auto=update`).

## Configuration

### Backend (`application.properties`)

Key configuration sections:
- **Database:** PostgreSQL (localhost:5432 for local dev, overridden by compose.yaml in Docker)
- **JWT:** `jwt.secret`, `jwt.expiration` (env vars: `JWT_SECRET`, `JWT_EXPIRATION`)
- **Storage:** `storage.type` (minio/s3/disabled), MinIO config (`minio.*`), AWS S3 config (`aws.s3.*`)
- **Print Jobs:** `app.print-jobs.*` (retries, timeout, PDF storage)
- **Cutting Rates:** `app.cutting-rates.*` (defaults, overlap detection)
- **WebSocket:** `app.websocket.*` (heartbeat, timeout)
- **Logging:** File logging to `logs/elguindy-backend.log` (rolling, 10MB max, 30 days retention)

Docker deployment uses `compose.yaml` environment variables to override database and MinIO settings.

### Frontend (`vite.config.js`)

- Path aliases for imports (see "Path Aliases" above)
- Dev server on port 3000 with proxy to backend
- Code splitting: vendor, router, i18n, utils chunks
- Environment variable `VITE_API_URL` to change backend URL

## Role-Based Access

| Role | Access |
|------|--------|
| OWNER | Full system access (all admin features, user management, pricing config) |
| ADMIN | Management features (dashboard, invoices, customers, glass types, users) |
| CASHIER | Sales only (invoice creation at `/cashier`) |
| WORKER | Factory operations (view invoices at `/factory`) |

Frontend enforces via `RoleRoute` component. Backend protects endpoints via JWT + Spring Security.

## Invoice Creation Flow

**Backend (`InvoiceService.createInvoice()`):**
1. Validate customer exists
2. Validate invoice lines (dimensions, glass types)
3. Calculate operations via `OperationCalculationService`
4. Calculate cutting costs via `CuttingContext` (SHATF or LASER strategy)
5. Generate readable ID via `ReadableIdGeneratorService`
6. Persist invoice, lines, and operations

**Frontend (Cashier UI):**
1. Customer selection/creation (`CustomerSelection.jsx`)
2. Product entry with dimensions, glass type, operations (`EnhancedProductEntry.jsx`)
3. Payment entry (`PaymentPanel.jsx`)
4. Preview and confirm (`InvoiceConfirmationDialog.jsx`)
5. Submit to backend, optionally create print job

## Internationalization

Arabic (RTL) support via i18next. Translations in `frontend/src/i18n/`. Use `useTranslation()` hook.
