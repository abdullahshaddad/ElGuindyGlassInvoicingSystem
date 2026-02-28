import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlassTypesPage from "@pages/admin/GlassTypesPage.jsx";
import UserManagementPage from "@pages/admin/UserManagementPage.jsx";
import CashierInvoicesPage from "@pages/cashier/CashierInvoicePage.jsx";
import CuttingPricesConfigPage from "@pages/admin/CuttingPricesConfigPage.jsx";
import OperationPricesPage from "@pages/admin/OperationPricesPage.jsx";
import FactoryWorkerPage from "@pages/FactoryWorkerPage.jsx";
import CustomerDetailsPage from '@/pages/admin/customers/CustomerDetailsPage';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const InvoicesPage = React.lazy(() => import('@/pages/InvoicesPage'));
const InvoiceDetailsPage = React.lazy(() => import('@/pages/InvoiceDetailsPage'));
const AdminGlassTypesPage = React.lazy(() => import('@/pages/admin/GlassTypesPage'));
const CustomersPage = React.lazy(() => import('@/pages/CustomersPage'));
const NotFoundPage = React.lazy(() => import('@/pages/errors/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('@/pages/errors/UnauthorizedPage'));
const CompanyProfilePage = React.lazy(() => import('@/pages/admin/CompanyProfilePage'));
const TenantSettingsPage = React.lazy(() => import('@/pages/admin/TenantSettingsPage'));
const TenantMembersPage = React.lazy(() => import('@/pages/admin/TenantMembersPage'));
const SuperAdminDashboardPage = React.lazy(() => import('@/pages/superAdmin/SuperAdminDashboardPage'));
const SuperAdminTenantsPage = React.lazy(() => import('@/pages/superAdmin/SuperAdminTenantsPage'));
const SuperAdminUsersPage = React.lazy(() => import('@/pages/superAdmin/SuperAdminUsersPage'));
const SuperAdminAuditLogsPage = React.lazy(() => import('@/pages/superAdmin/SuperAdminAuditLogsPage'));
const SuperAdminPlansPage = React.lazy(() => import('@/pages/superAdmin/SuperAdminPlansPage'));
const TenantDetailPage = React.lazy(() => import('@/pages/superAdmin/TenantDetailPage'));

// Loading fallback component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
    </div>
);

// Role definitions
const SUPERADMIN = 'SUPERADMIN';
const OWNER = 'OWNER';
const ADMIN = 'ADMIN';
const CASHIER = 'CASHIER';
const WORKER = 'WORKER';

const MANAGEMENT_ROLES = [SUPERADMIN, OWNER, ADMIN];
const SALES_ROLES = [SUPERADMIN, OWNER, ADMIN, CASHIER];
const FACTORY_ROLES = [SUPERADMIN, OWNER, ADMIN, WORKER];
const USER_MANAGEMENT_ROLES = [SUPERADMIN, OWNER, ADMIN];
const SUPERADMIN_ROLES = [SUPERADMIN];

// Auth redirect component for handling root route
const AuthRedirect = () => {
    const { user, isAuthenticated, isLoading, isSuperAdminViewing } = useAuth();

    if (isLoading) return <PageLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on user role
    switch (user?.role) {
        case SUPERADMIN:
            // If viewing a tenant, go to dashboard; otherwise admin panel
            return isSuperAdminViewing
                ? <Navigate to="/dashboard" replace />
                : <Navigate to="/super-admin/dashboard" replace />;
        case OWNER:
        case ADMIN:
            return <Navigate to="/dashboard" replace />;
        case CASHIER:
            return <Navigate to="/cashier" replace />;
        case WORKER:
            return <Navigate to="/factory" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
};

// Role-based route protection component
const RoleRoute = ({ allowedRoles, children, redirectPath = "/unauthorized", noTenantRequired = false }) => {
    const { user, isAuthenticated, isLoading, currentTenant } = useAuth();

    if (isLoading) return <PageLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // SUPERADMIN always passes role check
    if (user?.role === 'SUPERADMIN') {
        // Unless noTenantRequired, SUPERADMIN needs a tenant to access tenant-scoped pages
        if (!noTenantRequired && !currentTenant) {
            return <Navigate to="/super-admin/dashboard" replace />;
        }
        return children;
    }

    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to={redirectPath} replace />;
    }

    // Non-SUPERADMIN users need an active tenant to access tenant-scoped pages
    if (!currentTenant) {
        return <NoTenantMessage />;
    }

    return children;
};

// Shown when a user has no tenant association
const NoTenantMessage = () => {
    const { logout } = useAuth();
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-md mx-auto p-8">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">!</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    لا يوجد مستأجر مرتبط
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    حسابك غير مرتبط بأي مستأجر نشط. تواصل مع مدير النظام لإضافتك إلى مستأجر.
                </p>
                <button
                    onClick={logout}
                    className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    تسجيل الخروج
                </button>
            </div>
        </div>
    );
};

// Public route wrapper - redirects authenticated users
const PublicRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <PageLoader />;

    if (isAuthenticated) {
        return <AuthRedirect />;
    }

    return children;
};

// Main layout wrapper with sidebar and navbar
const MainLayout = () => (
    <Layout>
        <Outlet />
    </Layout>
);

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        }
                    />

                    {/* Root redirect */}
                    <Route path="/" element={<AuthRedirect />} />

                    {/* All Protected Routes with Main Layout - Sidebar renders based on role */}
                    <Route element={<MainLayout />}>
                        {/* Cashier Routes */}
                        <Route
                            path="/cashier"
                            element={
                                <RoleRoute allowedRoles={[CASHIER]}>
                                    <CashierInvoicesPage />
                                </RoleRoute>
                            }
                        />

                        {/* Factory Routes */}
                        <Route
                            path="/factory"
                            element={
                                <RoleRoute allowedRoles={FACTORY_ROLES}>
                                    <FactoryWorkerPage />
                                </RoleRoute>
                            }
                        />
                        {/* Dashboard - accessible to OWNER and ADMIN */}
                        <Route
                            path="/dashboard"
                            element={
                                <RoleRoute allowedRoles={MANAGEMENT_ROLES}>
                                    <DashboardPage />
                                </RoleRoute>
                            }
                        />

                        {/* Invoice Management - Sales roles only */}
                        <Route
                            path="/invoices"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <InvoicesPage />
                                </RoleRoute>
                            }
                        />

                        {/* Invoice Details Page */}
                        <Route
                            path="/invoices/:id"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <InvoiceDetailsPage />
                                </RoleRoute>
                            }
                        />

                        {/* Customer Management - Sales roles only */}
                        <Route
                            path="/customers"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <CustomersPage />
                                </RoleRoute>
                            }
                        />

                        {/* Customer Details Route */}
                        <Route
                            path="/customers/:id"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <CustomerDetailsPage />
                                </RoleRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route path="admin">
                            {/* Company Profile - OWNER only */}
                            <Route
                                path="company-profile"
                                element={
                                    <RoleRoute allowedRoles={[OWNER]}>
                                        <CompanyProfilePage />
                                    </RoleRoute>
                                }
                            />

                            {/* User Management - OWNER and ADMIN only */}
                            <Route
                                path="users"
                                element={
                                    <RoleRoute allowedRoles={USER_MANAGEMENT_ROLES}>
                                        <UserManagementPage />
                                    </RoleRoute>
                                }
                            />

                            {/* Glass Types Management - Management roles */}
                            <Route
                                path="glass-types"
                                element={
                                    <RoleRoute allowedRoles={MANAGEMENT_ROLES}>
                                        <GlassTypesPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="cutting-prices"
                                element={
                                    <RoleRoute allowedRoles={[OWNER]}>
                                        <CuttingPricesConfigPage />
                                    </RoleRoute>
                                }
                            />

                            {/* Operation Prices Management - Management roles */}
                            <Route
                                path="operation-prices"
                                element={
                                    <RoleRoute allowedRoles={MANAGEMENT_ROLES}>
                                        <OperationPricesPage />
                                    </RoleRoute>
                                }
                            />

                            {/* Tenant Settings - SUPERADMIN only */}
                            <Route
                                path="tenant-settings"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES}>
                                        <TenantSettingsPage />
                                    </RoleRoute>
                                }
                            />

                            {/* Tenant Members - SUPERADMIN only */}
                            <Route
                                path="tenant-members"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES}>
                                        <TenantMembersPage />
                                    </RoleRoute>
                                }
                            />
                        </Route>

                        {/* Super Admin Routes — no tenant context needed */}
                        <Route path="super-admin">
                            <Route
                                path="dashboard"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <SuperAdminDashboardPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="tenants"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <SuperAdminTenantsPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="tenants/:tenantId"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <TenantDetailPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="users"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <SuperAdminUsersPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="plans"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <SuperAdminPlansPage />
                                    </RoleRoute>
                                }
                            />
                            <Route
                                path="audit-logs"
                                element={
                                    <RoleRoute allowedRoles={SUPERADMIN_ROLES} noTenantRequired>
                                        <SuperAdminAuditLogsPage />
                                    </RoleRoute>
                                }
                            />
                        </Route>

                        <Route path="sys-cashier"
                            element={
                                <RoleRoute allowedRoles={[OWNER, ADMIN, CASHIER]}>
                                    <CashierInvoicesPage />
                                </RoleRoute>
                            }
                        />
                    </Route>

                    {/* Error Pages */}
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default AppRouter;
