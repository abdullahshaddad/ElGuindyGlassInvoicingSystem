import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

// Route definitions with their permissions
const routes = [
    // Public routes
    {
        path: '/login',
        element: <LoginPage />,
        isPublic: true,
    },

    // Protected routes
    {
        path: '/dashboard',
        element: <DashboardPage />,
        allowedRoles: ['CASHIER', 'OWNER', 'WORKER'],
    },

    // Invoice routes - Cashier and Owner
    {
        path: '/invoices',
        element: <InvoicesPage />,
        allowedRoles: ['CASHIER', 'OWNER'],
    },
    {
        path: '/invoices/new',
        element: <CreateInvoicePage />,
        allowedRoles: ['CASHIER', 'OWNER'],
    },
    {
        path: '/invoices/:id',
        element: <InvoiceDetailPage />,
        allowedRoles: ['CASHIER', 'OWNER'],
    },

    // Customer routes - Cashier and Owner
    {
        path: '/customers',
        element: <CustomersPage />,
        allowedRoles: ['CASHIER', 'OWNER'],
    },

    // Factory routes - Worker and Owner
    {
        path: '/factory',
        element: <FactoryPage />,
        allowedRoles: ['WORKER', 'OWNER'],
    },

    // Admin routes - Owner only
    {
        path: '/admin/glass-types',
        element: <AdminGlassTypesPage />,
        allowedRoles: ['OWNER'],
    },

    // Error routes
    {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
        isPublic: true,
    },
    {
        path: '/404',
        element: <NotFoundPage />,
        isPublic: true,
    },
];

// Root redirect component
const RootRedirect = () => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Redirect based on user role
    switch (user?.role) {
        case 'OWNER':
            return <Navigate to="/dashboard" replace />;
        case 'CASHIER':
            return <Navigate to="/invoices" replace />;
        case 'WORKER':
            return <Navigate to="/factory" replace />;
        default:
            return <Navigate to="/dashboard" replace />;
    }
};

// Protected route wrapper
const ProtectedRouteWrapper = ({ children, allowedRoles }) => (
    <Layout>
        <ProtectedRoute allowedRoles={allowedRoles}>
            {children}
        </ProtectedRoute>
    </Layout>
);

// Public route wrapper (no layout)
const PublicRouteWrapper = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    // Redirect authenticated users away from public pages
    if (isAuthenticated && user) {
        return <RootRedirect />;
    }

    return children;
};

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Root route */}
                    <Route path="/" element={<RootRedirect />} />

                    {/* Dynamic routes */}
                    {routes.map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                route.isPublic ? (
                                    <PublicRouteWrapper>
                                        {route.element}
                                    </PublicRouteWrapper>
                                ) : (
                                    <ProtectedRouteWrapper allowedRoles={route.allowedRoles}>
                                        {route.element}
                                    </ProtectedRouteWrapper>
                                )
                            }
                        />
                    ))}

                    {/* Catch all route - 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default AppRouter;