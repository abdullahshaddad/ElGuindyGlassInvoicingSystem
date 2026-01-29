# Frontend Knowledge Base - ElGuindy Glass Invoicing System

This document provides comprehensive documentation for the React frontend codebase.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Operation Types](#operation-types)
3. [Pages (Role-Based)](#pages-role-based)
4. [Components](#components)
5. [Services (API)](#services-api)
6. [Contexts (Global State)](#contexts-global-state)
7. [Custom Hooks](#custom-hooks)
8. [Routing & Access Control](#routing--access-control)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Utilities](#utilities)
11. [Constants](#constants)
12. [API Configuration](#api-configuration)
13. [Key UI Flows](#key-ui-flows)

---

## Architecture Overview

**Project Structure:**
```
frontend/src/
├── pages/                # Page components by role
│   ├── auth/             # Login page
│   ├── admin/            # Admin management pages
│   │   └── customers/    # Customer details
│   ├── cashier/          # POS interface
│   │   └── components/   # Cashier sub-components
│   └── errors/           # Error pages
├── components/           # Reusable components
│   ├── layout/           # Layout wrappers
│   └── ui/               # UI primitives
├── services/             # API service modules
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── api/                  # Axios configuration
├── i18n/                 # Internationalization
│   └── locales/          # ar/, en/ translations
├── constants/            # App constants & enums
├── utils/                # Utility functions
├── styles/               # Global styles (SCSS)
├── types/                # TypeScript definitions
├── tests/                # Test files
└── assets/               # Static assets
```

**Tech Stack:**
- React 18 with Vite
- React Router v6
- TanStack React Query v4
- TailwindCSS + SCSS
- i18next (Arabic RTL primary)
- Axios for HTTP

**Path Aliases (vite.config.js):**
```javascript
@/          → src/
@components → src/components/
@pages      → src/pages/
@services   → src/services/
@hooks      → src/hooks/
@utils      → src/utils/
@contexts   → src/contexts/
@styles     → src/styles/
@i18n       → src/i18n/
@types      → src/types/
```

---

## Operation Types

There are **only 2 operation types**:

### 1. SHATF (شطف) - Chamfering
Chamfering/beveling operations with various shatf types and calculation formulas.

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

| English | Arabic | Formula |
|---------|--------|---------|
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

## Pages (Role-Based)

### Authentication
| Page | Path | Access |
|------|------|--------|
| LoginPage | `/login` | Public |

### Admin Pages (`pages/admin/`)
| Page | Path | Access |
|------|------|--------|
| GlassTypesPage | `/admin/glass-types` | OWNER, ADMIN |
| UserManagementPage | `/admin/users` | OWNER, ADMIN |
| CuttingPricesConfigPage | `/admin/cutting-prices` | OWNER only |
| OperationPricesPage | `/admin/operation-prices` | OWNER, ADMIN |
| CompanyProfilePage | `/admin/company-profile` | OWNER only |
| CustomerDetailsPage | `/customers/:id` | Sales roles |

### Cashier Pages (`pages/cashier/`)
| Page | Path | Access |
|------|------|--------|
| CashierInvoicePage | `/cashier` | CASHIER |
| (same page) | `/sys-cashier` | OWNER, ADMIN |

**CashierInvoicePage** is the main POS interface with:
- Customer selection/creation
- Product entry with dimensions (in cm)
- Quantity per line item
- Shopping cart management
- Payment processing
- Print job creation

### General Pages
| Page | Path | Access |
|------|------|--------|
| DashboardPage | `/dashboard` | OWNER, ADMIN |
| InvoicesPage | `/invoices` | Sales roles |
| CustomersPage | `/customers` | Sales roles |
| FactoryWorkerPage | `/factory` | OWNER, ADMIN, WORKER |

### Error Pages
| Page | Path |
|------|------|
| NotFoundPage | `/404` |
| UnauthorizedPage | `/unauthorized` |

---

## Components

### Layout Components (`components/layout/`)
| Component | Purpose |
|-----------|---------|
| **Layout.jsx** | Main wrapper with sidebar, header (RTL support) |
| **CashierLayout.jsx** | Simplified layout for POS |
| **Header.jsx** | Top navigation with user menu |
| **Sidebar.jsx** | Side navigation with role-based menu |

### UI Components (`components/ui/`)
| Component | Props | Purpose |
|-----------|-------|---------|
| **Button** | `variant`, `size`, `loading`, `disabled` | Variants: primary, secondary, outline, danger, success |
| **Input** | `type`, `placeholder`, `error`, `disabled` | RTL text input |
| **Select** | `options`, `value`, `onChange` | Dropdown selector |
| **Badge** | `variant`, `className` | Status badges (success, error, warning, info) |
| **Card** | `title`, `subtitle`, `children` | Container card |
| **Modal** | `isOpen`, `title`, `onClose`, `children` | Dialog modal |
| **DataTable** | `columns`, `data`, `loading`, `pagination` | Sortable data table |
| **LoadingSpinner** | `size` | Loading animation (sm, md, lg) |
| **Snackbar** | `message`, `type`, `onClose` | Toast notifications |
| **PageHeader** | `title`, `subtitle`, `actions` | Page title + breadcrumbs |
| **ConfirmationDialog** | `title`, `message`, `onConfirm`, `onCancel` | Confirm actions |
| **PaymentModal** | `total`, `onSubmit`, `methods` | Payment entry |
| **PrintOptionsModal** | `onSubmit`, `invoiceId` | Print type selector |
| **Tabs** | `tabs`, `activeTab`, `onChange` | Tab navigation |

### Core Components
| Component | Purpose |
|-----------|---------|
| **AppRouter.jsx** | Main routing with role-based access |
| **ProtectedRoute.jsx** | Route protection wrapper |
| **ErrorBoundary.jsx** | Error boundary for crashes |
| **InvoiceViewModal.jsx** | Invoice detail viewer |
| **LanguageSwitcher.jsx** | AR/EN toggle |

### Cashier Sub-Components (`pages/cashier/components/`)
| Component | Purpose |
|-----------|---------|
| **CustomerSelection** | Search/select customers with type display |
| **NewCustomerForm** | Quick customer creation |
| **EnhancedProductEntry** | Product entry with dimensions, shatf type, calculation type, quantity |
| **ShatfTypeSelector** | Shatf type dropdown (chamfer type) |
| **CalculationTypeSelector** | Chamfer calculation formula selector |
| **ShoppingCart** | Invoice line items cart with quantity |
| **EnhancedOrderSummary** | Order totals breakdown |
| **PricingBreakdown** | Detailed pricing display |
| **PaymentPanel** | Payment amount and method entry |
| **InvoiceConfirmationDialog** | Final confirmation before submit |
| **InvoiceList** | Filterable invoice list |
| **PrintJobStatusModal** | Print job status tracker |

---

## Services (API)

All services use axios with JWT authentication. Base URL: `/api/v1`

### invoiceService.js
```javascript
// CRUD
createInvoice(invoiceData)
getInvoice(id)
listInvoices(params)              // page, size, startDate, endDate, customerName, status
updateInvoice(id, data)
deleteInvoice(id)

// Status
markAsPaid(id)
markAsCancelled(id)

// Analytics
getRevenue(startDate, endDate)
getInvoiceStats(params)
getStats()
exportInvoices(startDate, endDate)

// Search
searchInvoices(query, params)
getInvoicesByCustomer(customerId, params)
getRecentInvoices(params)

// PDF & Preview
previewLineCalculation(lineData)  // Preview with shatfType, calculationType, quantity
previewLineTotal(glassTypeId, width, height, shatfType, unit)
downloadInvoicePdf(id)
viewInvoicePdf(id)
downloadStickerPdf(id)

// Utilities
validateInvoiceData(invoiceData)
calculateTotal(lines)
formatInvoiceNumber(invoice)
formatCurrency(amount)
formatDate(dateString)
```

### customerService.js
```javascript
getAllCustomers()
searchCustomers(query)
getCustomer(id)
createCustomer(customerData)
updateCustomer(id, data)
deleteCustomer(id)
getCustomerInvoices(customerId, params)
getCustomerStats(customerId)
findByPhone(phone)
findByName(name)
getPaymentHistory(customerId)
exportCustomers(params)
```

### printJobService.js
```javascript
// Creation
createAllPrintJobs(invoiceId)
createSinglePrintJob(invoiceId, type)
retryPrintJob(invoiceId, type)

// Status
getPrintJobStatus(invoiceId)
checkPrintJobStatus(invoiceId)
getPrintJobsByInvoice(invoiceId)
getPrintJob(jobId)
getQueuedJobs()
getFailedJobs()

// Status Updates
markAsPrinting(jobId)
markAsPrinted(jobId)
markAsFailed(jobId, errorMessage)

// Management
deletePrintJob(jobId)

// Utilities
getStatusText(status)     // Arabic status
getTypeText(type)         // Arabic type
getStatusColor(status)    // Tailwind color
getPdfUrl(job)
openPdf(job)
downloadPdf(job, filename)
printPdf(job)
```

### glassTypeService.js
```javascript
getAllGlassTypes()
getActiveGlassTypes()
getGlassTypeById(id)
createGlassType(data)
updateGlassType(id, data)
deleteGlassType(id)
```

### paymentService.js
```javascript
createPayment(invoiceId, amount, method)  // method includes VODAFONE_CASH
getPayments(invoiceId)
getAllPayments(params)
getPaymentStats()
```

### authService.jsx
```javascript
login(credentials)
register(payload)
refreshToken(refreshToken)
getMe()
logout()
changePassword(passwords)
updateProfile(profileData)
validateToken(token)
getUsers()
deactivateUser(userId)
activateUser(userId)
```

### Other Services
- **dashboardService.js** - Stats, revenue, top customers
- **operationPriceService.js** - Operation price management
- **shatfRateService.js** - Shatf rate config by type/thickness
- **companyProfileService.js** - Company profile
- **userService.js** - User management
- **factoryService.js** - Factory operations

---

## Contexts (Global State)

### AuthContext (`contexts/AuthContext.jsx`)

**State:**
```javascript
user           // Current user object
token          // JWT auth token
isAuthenticated // Boolean auth status
isLoading      // Loading state
error          // Error message
```

**Methods:**
```javascript
login(credentials)
logout()
refreshToken()
updateUser(userData)
clearError()
hasRole(role)
hasAnyRole(roles)
canAccess(resource, action)
```

**usePermissions() Hook:**
```javascript
isOwner(), isCashier(), isWorker(), isAdmin()
canManageInvoices(), canDeleteInvoices()
canManageCustomers(), canAccessFactory()
canManageFactory(), canAccessAdmin()
canManageGlassTypes(), canViewReports()
```

### ThemeContext (`contexts/ThemeContext.jsx`)

**State:**
```javascript
theme           // 'light' | 'dark' | 'system'
isDarkMode      // Boolean
systemPrefersDark // System preference
```

**Methods:**
```javascript
setTheme(newTheme)
toggleTheme()
getThemeDisplayName(theme)  // Arabic names
getAvailableThemes()
```

**Hooks:**
```javascript
useThemeValue(lightValue, darkValue)   // Conditional value
useThemeClasses(lightClasses, darkClasses) // Conditional CSS
```

### SnackbarContext (`contexts/SnackbarContext.jsx`)

**Methods:**
```javascript
showSuccess(message, duration)
showError(message, duration)
showInfo(message, duration)
showWarning(message, duration)
```

---

## Custom Hooks

### useAuthorized (`hooks/useAuthorized.js`)
```javascript
const {
  isAuthorized,
  isLoading,
  user,
  hasRole(role),
  hasAnyRole(roles),
  canManageUsers(),
  isOwner(),
  isAdmin()
} = useAuthorized(allowedRoles);
```

### Context Hooks
```javascript
useAuth()      // From AuthContext
useTheme()     // From ThemeContext
useSnackbar()  // From SnackbarContext
```

---

## Routing & Access Control

### Route Structure (AppRouter.jsx)
```
/login              → Public (redirects if authenticated)
/                   → Redirects to role-specific page

/dashboard          → OWNER, ADMIN
/invoices           → OWNER, ADMIN, CASHIER
/customers          → OWNER, ADMIN, CASHIER
/customers/:id      → OWNER, ADMIN, CASHIER
/factory            → OWNER, ADMIN, WORKER

/cashier            → CASHIER only
/sys-cashier        → OWNER, ADMIN (access cashier interface)

/admin/company-profile    → OWNER only
/admin/users              → OWNER, ADMIN
/admin/glass-types        → OWNER, ADMIN
/admin/cutting-prices     → OWNER only
/admin/operation-prices   → OWNER, ADMIN

/unauthorized       → Access denied
/404                → Not found
```

### Role Definitions
```javascript
const ROLES = {
  OWNER: 'OWNER',     // Full system access
  ADMIN: 'ADMIN',     // Management features
  CASHIER: 'CASHIER', // Sales only
  WORKER: 'WORKER'    // Factory only
};

const MANAGEMENT_ROLES = [OWNER, ADMIN];
const SALES_ROLES = [OWNER, ADMIN, CASHIER];
const FACTORY_ROLES = [OWNER, ADMIN, WORKER];
const USER_MANAGEMENT_ROLES = [OWNER, ADMIN];
```

### Login Redirects by Role
| Role | Redirect To |
|------|-------------|
| OWNER | /dashboard |
| ADMIN | /dashboard |
| CASHIER | /cashier |
| WORKER | /factory |

---

## Internationalization (i18n)

### Setup (`i18n/index.js`)
```javascript
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Default: Arabic (ar)
// Supported: ar, en
// Detection: localStorage > navigator > HTML
// Namespaces: common, auth, validation, navigation
```

### Translation Files
```
i18n/locales/
├── ar/
│   ├── common.json
│   ├── auth.json
│   ├── validation.json
│   └── navigation.json
└── en/
    ├── common.json
    ├── auth.json
    ├── validation.json
    └── navigation.json
```

### Usage
```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

t('key')                    // Translate key
t('namespace:key')          // With namespace
i18n.language               // Current language
i18n.changeLanguage('en')   // Change language
```

### RTL Support
- Automatic HTML `dir` attribute update
- All components RTL-first design
- TailwindCSS RTL utilities available

---

## Utilities

### dimensionUtils.js
```javascript
DIMENSION_UNITS = { CM: 'cm', M: 'm' }  // Default: CM

// Conversions
convertToMeters(value, fromUnit)
convertFromMeters(value, toUnit)
convertBetweenUnits(value, fromUnit, toUnit)

// Formatting
formatDimensions(width, height, unit)  // "200 × 150 سم"
prepareDimensionsForBackend(dimensions) // Returns cm values

// Validation
validateDimensions(width, height, unit)
// Returns: { isValid, errors[] }
// Max: 500cm width, 300cm height
```

### invoiceUtils.js
```javascript
// Unit conversion
toMeters(value, unit)
convertBetweenUnits(value, fromUnit, toUnit)

// Calculations
calculateLineTotal(line, glassType)     // Considers quantity
calculateLineDetails(line, glassType)
calculateTotals(lines, glassTypes)
calculateArea(width, height, unit)

// Display
formatCurrency(amount)  // "200.50 ج.م"
formatDimensions(width, height, unit)
```

### cuttingUtils.js
- Shatf rate calculations
- Chamfer formula computations

### printHelper.js
- PDF download helpers
- Print dialog triggers

---

## Constants

### shatfTypes.js
```javascript
SHATF_CATEGORIES = {
  FORMULA_BASED,  // Depends on thickness rate
  MANUAL_INPUT,   // Manual price input
  AREA_BASED      // Based on area (m²)
};

// ShatfTypes:
// KHARZAN, CHAMBRE, ONE_CM, TWO_CM, THREE_CM, JULIA
// SANDING (area-based)
// LASER_CHAMFER (manual)

// Each type has:
{
  value,
  arabicName,
  category,
  requiresThicknessRate,
  requiresManualPrice,
  usesAreaCalculation
}

// Helper functions:
getShatfTypeInfo(type)
getAllShatfTypes()
getShatfTypesByCategory(category)
getFormulaBasedTypes()
getManualInputTypes()
requiresManualPrice(type)
isFormulaBased(type)
```

### calculationTypes.js (Chamfer Calculation Formulas)
```javascript
// Chamfer calculation types with formulas:
// STRAIGHT, HEAD_MOLDED, DOUBLE_HEAD_MOLDED
// SIDE_MOLDED, DOUBLE_SIDE_MOLDED, HEAD_SIDE_MOLDED
// DOUBLE_HEAD_SIDE_MOLDED, DOUBLE_SIDE_HEAD_MOLDED
// FULL_MOLDED, WHEEL (requires diameter), ROTATION, PANELS

// Each type has:
{
  value,
  arabicName,
  formula,          // Display formula
  isManual,
  requiresDiameter  // For WHEEL
}

// Helper functions:
getCalculationTypeInfo(type)
getAllCalculationTypes()
requiresDiameter(type)
isManual(type)
```

### paymentMethods.js
```javascript
PAYMENT_METHODS = {
  CASH: 'CASH',                   // نقدي
  CHECK: 'CHECK',                 // شيك
  TRANSFER: 'TRANSFER',           // تحويل بنكي
  CREDIT_CARD: 'CREDIT_CARD',     // بطاقة ائتمان
  VODAFONE_CASH: 'VODAFONE_CASH', // فودافون كاش
  OTHER: 'OTHER'                  // أخرى
};
```

---

## API Configuration

### Axios Setup (`api/axios.js`)
```javascript
// Base Configuration
baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
timeout: 10000
headers: { 'Content-Type': 'application/json' }

// Request Interceptor
- Attaches JWT: Authorization: Bearer {token}
- Dev logging enabled

// Response Interceptor
- 401: Token refresh or redirect to login
- 403: Clear auth, redirect to /login
- Other: Log and reject

// Helper Functions
get(url, config)
post(url, data, config)
put(url, data, config)
patch(url, data, config)
del(url, config)
```

### Environment Variables
```
VITE_API_URL    # Backend URL (default: http://localhost:8080/api/v1)
VITE_ENV_MODE   # Build mode
```

### API Proxy (vite.config.js)
```javascript
// Dev server proxies /api to backend
// IMPORTANT: Strips /api prefix
// /api/invoices → /invoices on backend
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

---

## Key UI Flows

### Invoice Creation (Cashier)

```
1. CUSTOMER SELECTION (CustomerSelection.jsx)
   ├── Search existing customers
   └── Create new customer option

2. PRODUCT ENTRY (EnhancedProductEntry.jsx)
   ├── Select glass type
   ├── Enter dimensions (in CM)
   ├── Enter quantity
   ├── Select shatf type (chamfer type)
   │   └── For formula-based types → select calculation type
   ├── Select calculation type (chamfer formula)
   │   └── If WHEEL → requires diameter
   └── Optional: Manual price (for manual types)

3. CART MANAGEMENT (ShoppingCart.jsx)
   ├── View added items with quantities
   ├── Edit/remove items
   └── Real-time calculation updates

4. PRICING DISPLAY (PricingBreakdown.jsx)
   ├── Glass costs (per item × quantity)
   ├── Cutting/operations costs
   └── Total calculation

5. PAYMENT ENTRY (PaymentPanel.jsx)
   ├── Amount paid now
   └── Payment method (includes Vodafone Cash)

6. CONFIRMATION (InvoiceConfirmationDialog.jsx)
   ├── Review all details
   └── Final confirmation

7. SUBMISSION
   ├── invoiceService.createInvoice()
   └── Optional: Create print jobs
```

### Print Job Workflow

```
1. After invoice creation → optionally create print jobs
2. Select print types: CLIENT, OWNER, STICKER
3. Jobs queued in factory system
4. Factory workers view via WebSocket notifications
5. Workers mark: QUEUED → PRINTING → PRINTED
6. Real-time status updates via WebSocket
```

### Customer Management

```
1. View all customers with search/filter
2. Add new customer with validation
   ├── Name, phone, address
   └── Customer type (CASH, REGULAR, COMPANY, GOVERNMENT)
3. View customer details and history
4. Check payment status
5. See all associated invoices
```

---

## State Management Summary

| Type | Solution | Use Case |
|------|----------|----------|
| Local State | useState | UI state, forms, filters, pagination |
| Server State | React Query | Invoices, customers, glass types |
| Global UI State | Contexts | Auth, theme, notifications |

---

## Error Handling

### Error Boundaries
```javascript
<ErrorBoundary>
  <App />
</ErrorBoundary>
// Prevents white-screen failures
```

### API Errors
| Status | Handling |
|--------|----------|
| 401 | Token refresh or redirect to /login |
| 403 | Redirect to /unauthorized |
| 404 | User-friendly message |
| 500 | Server error notification |
| Network | Connection error notification |

### Form Validation
- Client-side validation before submission
- Arabic error messages
- Field-level error display

### Notifications (SnackbarContext)
```javascript
showSuccess(message)  // CRUD success
showError(message)    // Failures
showInfo(message)     // User actions
showWarning(message)  // Confirmations
```

---

## Responsive Design

### Tailwind Breakpoints
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Features
- RTL-first design
- Dark mode via ThemeContext
- Mobile-responsive layouts
- Keyboard navigation
- ARIA accessibility attributes
- Loading states

---

## Quick Reference

### Key File Locations
- **Router**: `components/AppRouter.jsx`
- **Auth Context**: `contexts/AuthContext.jsx`
- **Invoice Service**: `services/invoiceService.js`
- **Cashier Page**: `pages/cashier/CashierInvoicePage.jsx`
- **API Config**: `api/axios.js`
- **Translations**: `i18n/locales/ar/`, `i18n/locales/en/`

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.15.0",
  "@tanstack/react-query": "^4.32.0",
  "axios": "^1.5.0",
  "i18next": "^23.16.8",
  "react-i18next": "^13.5.0",
  "tailwindcss": "^3.4.1"
}
```

### Development Commands
```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Production build
npm test           # Run tests
npm run lint       # Lint code
```

### Default Settings
- **Dimension Unit**: Centimeters (cm)
- **Language**: Arabic (RTL)
- **Payment Methods**: CASH, CHECK, TRANSFER, CREDIT_CARD, VODAFONE_CASH, OTHER
