import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlassTypesPage from "@pages/admin/GlassTypesPage.jsx";
import UserManagementPage from "@pages/admin/UserManagementPage.jsx";
import CashierInvoicesPage from "@pages/cashier/CashierInvoicePage.jsx";
import CashierLayout from "@components/layout/CashierLayout.jsx";
import CuttingPricesConfigPage from "@pages/admin/CuttingPricesConfigPage.jsx";

// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const InvoicesPage = React.lazy(() => import('@/pages/invoices/InvoicesPage'));
const CreateInvoicePage = React.lazy(() => import('@/pages/invoices/CreateInvoicePage'));
const InvoiceDetailPage = React.lazy(() => import('@/pages/invoices/InvoiceDetailPage'));
const FactoryPage = React.lazy(() => import('@/pages/factory/FactoryPage'));
const AdminGlassTypesPage = React.lazy(() => import('@/pages/admin/GlassTypesPage'));
const CustomersPage = React.lazy(() => import('@/pages/customers/CustomersPage'));
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
                        <Route
                            path="/invoices/new"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <CreateInvoicePage />
                                </RoleRoute>
                            }
                        />
                        <Route
                            path="/invoices/:id"
                            element={
                                <RoleRoute allowedRoles={SALES_ROLES}>
                                    <InvoiceDetailPage />
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

                        {/* Factory Management - Factory roles only */}
                        <Route
                            path="/factory"
                            element={
                                <RoleRoute allowedRoles={FACTORY_ROLES}>
                                    <FactoryPage />
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
                        </Route>
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