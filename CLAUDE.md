# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ElGuindy Glass Invoicing System is a full-stack web application for managing glass cutting and invoicing operations. The system handles customer management, invoice generation, glass type configurations, cutting rate calculations, and print job management with real-time updates.

**Tech Stack:**
- **Backend:** Convex (serverless backend with document DB, real-time subscriptions)
- **Authentication:** Clerk (user management, sign-in/sign-up)
- **Frontend:** React 18 with Vite, TailwindCSS, React Router, Convex React hooks, i18next (Arabic RTL support)
- **PDF Generation:** pdf-lib with @pdf-lib/fontkit (Arabic text support)

## Development Commands

### Convex Backend

```bash
# Start Convex dev server (watches for changes, syncs schema/functions)
npx convex dev

# Deploy to production
npx convex deploy

# Open Convex dashboard
npx convex dashboard
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

# Lint code
npm run lint
```

### Combined Development

```bash
# From project root - start both Convex and frontend dev servers
npm run dev
```

## Architecture

### Convex Backend Structure (`convex/`)

Serverless functions organized by domain:

- **`schema.ts`** - Full database schema with 14 tables, enum validators, and indexes
- **`auth.config.ts`** - Clerk authentication provider configuration
- **`crons.ts`** - Scheduled tasks (print job monitoring, cleanup)
- **`helpers/`** - Shared utilities
  - `auth.ts` - `requireAuth()`, `requireRole()`, `getCurrentUser()` helpers
  - `idGenerator.ts` - Atomic counter-based readable ID generation ("INV-YYYY-NNN")
  - `dimensionUtils.ts` - Unit conversion (MM/CM/M to meters)
  - `enums.ts` - All enum union types
- **`lib/`** - Core business logic
  - `bevelingFormulas.ts` - 13 perimeter formulas for beveling calculation types
  - `operationCalculation.ts` - Beveling/Beveling Calculation/LASER operation pricing
  - `invoiceCreation.ts` - Invoice creation flow with validation
  - `paymentLogic.ts` - Payment recording and balance updates
  - `pdfInvoice.ts` - Invoice PDF generation (pdf-lib)
  - `pdfSticker.ts` - Sticker PDF generation (pdf-lib)
- **Domain modules** (each with `queries.ts` and `mutations.ts`):
  - `invoices/` - Invoice CRUD, preview calculation, revenue queries
  - `customers/` - Customer management with search
  - `payments/` - Payment recording and history
  - `glassTypes/` - Glass type configuration
  - `cuttingRates/` - Laser cutting rate management
  - `bevelingRates/` - Beveling rate management
  - `operationPrices/` - Operation price configuration
  - `printJobs/` - Print job lifecycle management
  - `dashboard/` - Analytics and statistics queries
  - `factory/` - Factory worker invoice views
  - `users/` - User management (synced with Clerk)
  - `notifications/` - Real-time notification system
  - `companyProfile/` - Company profile management
- **`migrations/`** - Data migration helpers (PostgreSQL → Convex)

**Key Backend Concepts:**

1. **Convex Queries** are automatically reactive - any `useQuery()` subscription on the frontend updates in real-time when data changes. No WebSocket or polling needed.

2. **Convex Mutations** are transactional - all database operations within a mutation are atomic.

3. **Authentication** uses Clerk tokens validated via `ctx.auth.getUserIdentity()`. The `requireRole()` helper checks the `users` table for role authorization.

4. **File Storage** uses Convex's built-in `_storage` table for PDFs and logos.

### Frontend Structure (`frontend/src/`)

React SPA with role-based routing and Arabic (RTL) internationalization:

- **`pages/`** - Page components organized by role
  - `auth/` - Login page (Clerk `<SignIn />` component)
  - `admin/` - Admin pages (GlassTypes, Users, CuttingPrices, OperationPrices, CompanyProfile)
  - `cashier/` - Cashier POS interface with cart, customer search, invoice creation
  - Root-level: `DashboardPage`, `CustomersPage`, `InvoicesPage`, `FactoryWorkerPage`
  - `errors/` - NotFoundPage, UnauthorizedPage
- **`components/`** - Reusable UI components
  - `layout/` - Layout wrappers (Sidebar, Layout)
  - `ui/` - UI primitives (Button, Input, Modal, Select, etc.)
  - `AppRouter.jsx` - Main routing with role-based `RoleRoute` protection
  - `InvoiceViewModal.jsx` - Invoice detail modal
- **`contexts/`** - React contexts
  - `AuthContext.jsx` - Wraps Clerk + Convex user data, provides `useAuth()` hook with role checking
  - `ThemeContext.jsx` - Dark mode toggle
  - `SnackbarContext.jsx` - Toast notifications
- **`services/`** - Convex hook wrappers (one per domain)
  - Each file exports React hooks: `useInvoices()`, `useCreateInvoice()`, etc.
  - Also exports utility functions: `formatCurrency()`, `getStatusText()`, etc.
- **`constants/`** - Application constants and enums
- **`i18n/`** - Internationalization (Arabic translations)
- **`styles/`** - Global styles
- **`utils/`** - Utility functions (dimensionUtils, invoiceUtils, bevelingUtils)

**Key Frontend Concepts:**

1. **Data Fetching:** Uses `useQuery()` from `convex/react` for reactive queries and `useMutation()` for writes. No manual refetch needed after mutations.

2. **Pagination:** Uses `usePaginatedQuery()` with cursor-based pagination and "Load More" pattern.

3. **Authentication:** `AuthContext` combines Clerk's `useUser()`/`useAuth()` with a Convex `users` query for app-level roles. Provides `hasRole()`, `hasAnyRole()`, `canAccess()` helpers.

4. **Path Aliases:** Vite aliases: `@/` (src), `@components`, `@pages`, `@services`, `@hooks`, `@utils`, `@contexts`, `@styles`, `@i18n`, `@types`, `@convex` (../convex).

5. **Styling:** TailwindCSS with dark mode via `ThemeContext`. RTL support for Arabic.

6. **Real-Time:** All data is reactive via Convex subscriptions. Factory page, dashboard, and invoice lists auto-update when data changes.

### Database Schema (Convex)

14 tables defined in `convex/schema.ts`:

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `customers` | Customer records (CASH/REGULAR/COMPANY) | by_phone, by_name, search_name |
| `glassTypes` | Glass configurations with pricing | by_active, by_name |
| `invoices` | Invoice headers with readable IDs | by_readableId, by_customerId, by_status, by_issueDate |
| `invoiceLines` | Line items with dimensions and pricing | by_invoiceId, by_status |
| `invoiceLineOperations` | Operations per line (Beveling/Beveling Calc/LASER) | by_invoiceLineId |
| `payments` | Payment records | by_customerId, by_invoiceId, by_paymentDate |
| `printJobs` | PDF generation jobs | by_invoiceId, by_status |
| `cuttingRates` | Laser cutting rates by thickness | by_cuttingType_active |
| `shatafRates` | Beveling rates by type and thickness | by_shatafType_active |
| `operationPrices` | Operation price references | by_operationType_subtype |
| `companyProfile` | Company info (singleton) | — |
| `users` | Users synced with Clerk | by_clerkUserId, by_username |
| `notifications` | Real-time notifications | by_targetUserId, by_createdAt |
| `idCounters` | Readable ID counters | by_prefix |

## Configuration

### Environment Variables

**Frontend (`frontend/.env.local`):**
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

**Convex Dashboard:**
- Clerk domain and secret key configured in Convex environment variables

### Frontend (`vite.config.js`)

- Path aliases for imports (see above)
- Dev server on port 3000
- Code splitting: vendor, router, i18n, utils chunks

## Role-Based Access

| Role | Access |
|------|--------|
| OWNER | Full system access (all admin features, user management, pricing config) |
| ADMIN | Management features (dashboard, invoices, customers, glass types, users) |
| CASHIER | Sales only (invoice creation at `/cashier`) |
| WORKER | Factory operations (view invoices at `/factory`) |

Frontend enforces via `RoleRoute` component. Backend protects via `requireRole()` in Convex functions.

## Invoice Creation Flow

**Convex Backend (`convex/invoices/mutations.ts` → `convex/lib/invoiceCreation.ts`):**
1. Validate customer exists
2. Validate invoice lines (dimensions, glass types)
3. Calculate operations via `operationCalculation.ts`
4. Calculate cutting costs (Beveling rates, LASER rates, or manual pricing)
5. Generate readable ID via `idGenerator.ts` (atomic counter)
6. Persist invoice, lines, and operations in a single transaction

**Frontend (Cashier UI):**
1. Customer selection/creation (`CustomerSelection.jsx`)
2. Product entry with dimensions, glass type, operations (`EnhancedProductEntry.jsx`)
3. Payment entry (`PaymentPanel.jsx`)
4. Preview and confirm (`InvoiceConfirmationDialog.jsx`)
5. Submit via `useCreateInvoice()` mutation, optionally create print job

## Data Migration

Scripts for migrating from PostgreSQL (legacy Spring Boot backend) to Convex:

```bash
# 1. Export from PostgreSQL
mkdir -p scripts/data
psql -d elguindy -f scripts/export-postgres.sql

# 2. Deploy migration mutation
npx convex deploy

# 3. Run import
node scripts/migrate-to-convex.mjs
```

## Internationalization

Arabic (RTL) support via i18next. Translations in `frontend/src/i18n/`. Use `useTranslation()` hook.
