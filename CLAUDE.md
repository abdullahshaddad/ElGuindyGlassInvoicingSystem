# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ElGuindy Glass Invoicing System is a full-stack web application for managing glass cutting and invoicing operations. The system handles customer management, invoice generation, glass type configurations, cutting rate calculations, and print job management with real-time WebSocket notifications.

**Tech Stack:**
- **Backend:** Spring Boot 3.5.5 with Java 21, PostgreSQL, JWT authentication
- **Frontend:** React 18 with Vite, TailwindCSS, React Router, React Query, i18next (Arabic RTL support)
- **Infrastructure:** Docker Compose (PostgreSQL, MinIO for S3-compatible storage)

## Development Commands

### Backend (Spring Boot + Maven)

```bash
# Run backend locally (requires PostgreSQL on localhost:5432)
cd backend
mvn spring-boot:run

# Build backend
mvn clean package

# Run tests
mvn test

# Skip tests during build
mvn clean package -DskipTests
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage

# Lint code
npm run lint
```

### Docker Compose

```bash
# Start all services (backend, PostgreSQL, MinIO)
docker compose up

# Start in detached mode
docker compose up -d

# Rebuild backend container
docker compose up --build backend

# Stop all services
docker compose down

# View logs
docker compose logs -f backend
```

## Architecture

### Backend Structure

The backend follows a standard Spring Boot layered architecture:

- **`controllers/`** - REST API endpoints (e.g., `InvoiceController`, `CustomerController`, `GlassTypeController`)
- **`services/`** - Business logic layer
  - `InvoiceService` - Core invoice creation, validation, and management
  - `PrintJobService` - PDF generation and print job management
  - `WebSocketNotificationService` - Real-time notifications
  - `cutting/` - Cutting rate calculation services (`CuttingRateService`, `ShatafRateService`, `CuttingContext`)
- **`repositories/`** - Spring Data JPA repositories for database access
- **`models/`** - JPA entities
  - Core entities: `Invoice`, `InvoiceLine`, `Customer`, `GlassType`, `PrintJob`, `Payment`
  - `enums/` - Business enums (`InvoiceStatus`, `PrintStatus`, `PaymentMethod`, `CuttingType`, `FarmaType`, `ShatafType`)
  - `customer/`, `user/`, `notification/` - Domain-specific models
- **`dto/`** - Data Transfer Objects for API requests/responses
- **`config/`** - Application configuration
  - `security/` - JWT authentication (`JwtAuthenticationFilter`, `JwtService`, `SecurityConfiguration`)
  - `WebSocket/` - WebSocket configuration and event handlers
  - `ApplicationConfig`, `PrintJobConfig`, `StorageConfig`
- **`authentication/`** - Auth request/response DTOs
- **`exceptions/`** - Custom exception hierarchy (`customer/`, `invoice/`, `printjob/`, `websocket/`)
- **`monitoring/`** - Health check and metrics

**Key Backend Concepts:**

1. **Invoice Creation Flow:** Invoices are created via `InvoiceService.createInvoice()` which validates dimensions, calculates cutting costs using `CuttingContext`, and saves invoice lines. Print jobs are created separately through `PrintJobController`.

2. **Cutting Calculations:** The system uses a strategy pattern via `CuttingContext` to calculate costs based on cutting type (SHATF, LASER). Rates are configurable per dimension range via `CuttingRate` and `ShatafRate` entities.

3. **Authentication:** JWT-based authentication with role-based access control (OWNER, ADMIN, CASHIER, WORKER). Security configuration in `SecurityConfiguration.java`.

4. **WebSocket:** Real-time notifications for invoice updates and print job status changes via `/ws/**` endpoints.

5. **Storage:** Configurable storage (MinIO/S3 or disabled) for PDF storage. Configuration in `application.properties` via `storage.type`.

### Frontend Structure

The frontend is a React SPA with role-based routing and Arabic (RTL) internationalization:

- **`pages/`** - Page components organized by role
  - `auth/` - Login page
  - `admin/` - Admin-only pages (`GlassTypesPage`, `UserManagementPage`, `CuttingPricesConfigPage`)
  - `cashier/` - Cashier interface (`CashierInvoicePage`, components for invoice creation)
  - `FactoryWorkerPage`, `DashboardPage`, `CustomersPage`, `InvoicesPage`
  - `errors/` - Error pages (`NotFoundPage`, `UnauthorizedPage`)
- **`components/`** - Reusable UI components
  - `layout/` - Layout wrappers (`Layout` for main app, `CashierLayout` for cashier)
  - `ui/` - UI primitives
  - `AppRouter.jsx` - Main routing configuration with role-based route protection
  - `ErrorBoundary.jsx`
- **`contexts/`** - React contexts (`AuthContext`, `ThemeContext`, `SnackbarContext`)
- **`services/`** - API service modules (axios-based)
- **`api/`** - Axios configuration and interceptors
- **`hooks/`** - Custom React hooks
- **`utils/`** - Utility functions
- **`constants/`** - Constants and enums matching backend (e.g., `farmaTypes.js`)
- **`i18n/`** - Internationalization setup (Arabic translations)
- **`styles/`** - Global styles and SCSS variables
- **`tests/`** - Jest tests
- **`types/`** - TypeScript/PropTypes definitions

**Key Frontend Concepts:**

1. **Routing & Roles:** `AppRouter.jsx` defines role-based routes. The `RoleRoute` component protects routes based on user role. Roles: `OWNER`, `ADMIN`, `CASHIER`, `WORKER`.

2. **Authentication Flow:** `AuthContext` manages auth state. Login redirects users to role-appropriate landing pages (dashboard for OWNER/ADMIN, /cashier for CASHIER, /factory for WORKER).

3. **Path Aliases:** Vite configured with path aliases (`@/`, `@components`, `@pages`, `@services`, etc.) - use these instead of relative imports.

4. **State Management:** React Query (`@tanstack/react-query`) for server state, React Context for global UI state.

5. **Styling:** TailwindCSS with dark mode support via `ThemeContext`. RTL support for Arabic.

6. **API Proxy:** Vite dev server proxies `/api` requests to backend (localhost:8080 by default, configurable via `VITE_API_URL`).

### Database Schema

Main entities:
- **Invoice** - Header record with customer, total, status, timestamps
- **InvoiceLine** - Line items with glass dimensions, quantity, cutting details, unit price
- **Customer** - Customer records with type (INDIVIDUAL, COMPANY, GOVERNMENT)
- **GlassType** - Glass types with base price per square meter
- **CuttingRate** - Laser cutting rates by dimension ranges
- **ShatafRate** - Shataf cutting rates by dimension ranges
- **PrintJob** - PDF generation jobs linked to invoices with status tracking
- **Payment** - Payment records with method and amount
- **User** - User accounts with roles and JWT authentication
- **Notification** - System notifications

The database is auto-created and updated via JPA (`spring.jpa.hibernate.ddl-auto=update`).

## Configuration

### Backend Configuration

**`backend/src/main/resources/application.properties`** contains all backend configuration:

- **Database:** PostgreSQL connection (localhost:5432 for local dev, overridden by compose.yaml in Docker)
- **JWT:** Secret key and expiration (configurable via env vars `JWT_SECRET`, `JWT_EXPIRATION`)
- **Storage:** MinIO/S3 configuration (`storage.type`, `minio.*`, `aws.s3.*`)
- **CORS:** Allowed origins for frontend (localhost:3000, localhost:5173, Vercel deployment)
- **Print Jobs:** Max retries, timeout, PDF storage directory
- **Cutting Rates:** Default rates, overlap detection settings
- **WebSocket:** Heartbeat interval, session timeout
- **Logging:** File logging to `logs/elguindy-backend.log` with rolling policy

For Docker deployment, `compose.yaml` overrides database and MinIO settings via environment variables.

### Frontend Configuration

**`frontend/vite.config.js`** configures:
- Path aliases for imports
- Dev server port (3000) and proxy to backend
- Build optimizations with code splitting (vendor, router, i18n chunks)

**Environment Variables:** Use `.env` files for `VITE_API_URL` to change backend URL.

## Testing

### Backend Tests
- Tests located in `backend/src/test/java`
- Run with `mvn test`

### Frontend Tests
- Jest + React Testing Library
- Test files in `frontend/src/tests/`
- Run with `npm test`, `npm test:watch`, or `npm test:coverage`

## Common Patterns

### Adding a New Backend Endpoint

1. Create/update DTO in `dto/`
2. Add business logic method to appropriate service
3. Create/update controller method with `@RequestMapping`
4. Update security config if endpoint needs different auth
5. Consider adding WebSocket notification if real-time updates needed

### Adding a New Frontend Page

1. Create page component in `pages/` (appropriate subdirectory by role)
2. Add route in `AppRouter.jsx` with correct `RoleRoute` wrapper
3. Update navigation in layout component if needed
4. Create API service method in `services/` if calling new backend endpoint
5. Use React Query hooks for data fetching

### Invoice Creation Process

Backend creates invoices via `InvoiceService.createInvoice()`:
1. Validates customer exists
2. Validates all invoice lines (dimensions, glass types, cutting details)
3. Calculates cutting costs using `CuttingContext` (delegates to `CuttingRateService` or `ShatafRateService`)
4. Calculates totals (line item prices, cutting costs, invoice total)
5. Saves invoice and lines to database
6. Returns created invoice (print jobs created separately via `PrintJobController`)

Frontend (Cashier) creates invoices via multi-step form:
1. Customer selection/creation (`CustomerSelection.jsx`)
2. Product entry with glass type, dimensions, cutting details (`EnhancedProductEntry.jsx`)
3. Payment entry (`PaymentPanel.jsx`)
4. Preview and confirmation (`InvoiceConfirmationDialog.jsx`)
5. Submit to backend, optionally create print job

## Role-Based Access

- **OWNER:** Full system access (all admin features, user management, cutting prices config)
- **ADMIN:** Management and sales features (dashboard, invoices, customers, glass types, users)
- **CASHIER:** Sales only (invoice creation via dedicated cashier UI at `/cashier`)
- **WORKER:** Factory operations (view invoices for production at `/factory`)

Frontend enforces role-based routing. Backend endpoints protected via JWT + Spring Security role checks.

## Internationalization

The app supports Arabic (RTL layout) via i18next. Translation files in `frontend/src/i18n/`. Use `useTranslation()` hook for translated strings. Backend error messages also support Arabic.

## Logging

Backend logs to:
- Console (stdout)
- File: `logs/elguindy-backend.log` (rolling, max 10MB per file, 30 day retention)

Log levels configured per package in `application.properties`. Set to DEBUG for most services, INFO for invoice/print job services.
