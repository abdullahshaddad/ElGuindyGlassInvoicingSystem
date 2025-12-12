import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlassTypesPage from "@pages/admin/GlassTypesPage.jsx";
import UserManagementPage from "@pages/admin/UserManagementPage.jsx";
import CashierInvoicesPage from "@pages/cashier/CashierInvoicePage.jsx";
import CashierLayout from "@components/layout/CashierLayout.jsx";
import CuttingPricesConfigPage from "@pages/admin/CuttingPricesConfigPage.jsx";
import OperationPricesPage from "@pages/admin/OperationPricesPage.jsx";
import FactoryWorkerPage from "@pages/FactoryWorkerPage.jsx";
import CustomerDetailsPage from '@/pages/admin/customers/CustomerDetailsPage';

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const InvoicesPage = React.lazy(() => import('@/pages/InvoicesPage'));
const AdminGlassTypesPage = React.lazy(() => import('@/pages/admin/GlassTypesPage'));
const CustomersPage = React.lazy(() => import('@/pages/CustomersPage'));
const NotFoundPage = React.lazy(() => import('@/pages/errors/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('@/pages/errors/UnauthorizedPage'));

// Loading fallback component
const PageLoader = () => (
    <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
    </div>
);

// Role definitions
const OWNER = 'OWNER';
const ADMIN = 'ADMIN';
const CASHIER = 'CASHIER';
const WORKER = 'WORKER';

const MANAGEMENT_ROLES = [OWNER, ADMIN];
const SALES_ROLES = [OWNER, ADMIN, CASHIER];
const FACTORY_ROLES = [OWNER, ADMIN, WORKER];
const USER_MANAGEMENT_ROLES = [OWNER, ADMIN];

// Auth redirect component for handling root route
const AuthRedirect = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <PageLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on user role
    switch (user?.role) {
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
const RoleRoute = ({ allowedRoles, children, redirectPath = "/unauthorized" }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <PageLoader />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to={redirectPath} replace />;
    }

    return children;
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

                    {/* Cashier Routes - Separate Layout (CASHIER only) */}
                    <Route
                        path="/cashier"
                        element={
                            <RoleRoute allowedRoles={[CASHIER]}>
                                <CashierLayout />
                            </RoleRoute>
                        }
                    >
                        {/* Default cashier route goes to invoices */}
                        <Route index element={<CashierInvoicesPage />} />
                    </Route>

                    {/* Protected Routes with Main Layout (OWNER, ADMIN, WORKER) */}
                    <Route element={<MainLayout />}>
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

                        {/* Factory Management - Factory roles only */}
                        <Route
                            path="/factory"
                            element={
                                <RoleRoute allowedRoles={FACTORY_ROLES}>
                                    <FactoryWorkerPage />
                                </RoleRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route path="admin">
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
                        </Route>

                        <Route path="sys-cashier"
                            element={
                                <RoleRoute allowedRoles={[OWNER, ADMIN]}>
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