import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/**
 * ProtectedRoute component - handles authentication and role-based authorization
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Components to render if authorized
 * @param {string[]} [props.allowedRoles] - Array of roles allowed to access this route
 * @param {string} [props.redirectTo='/login'] - Where to redirect if not authenticated
 * @param {string} [props.unauthorizedRedirectTo='/unauthorized'] - Where to redirect if not authorized
 */
const ProtectedRoute = ({
                            children,
                            allowedRoles = [],
                            redirectTo = '/login',
                            unauthorizedRedirectTo = '/unauthorized'
                        }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <Navigate
                to={redirectTo}
                state={{ from: location.pathname }}
                replace
            />
        );
    }

    // Check role-based authorization if roles are specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return (
            <Navigate
                to={unauthorizedRedirectTo}
                state={{
                    from: location.pathname,
                    requiredRoles: allowedRoles,
                    userRole: user.role
                }}
                replace
            />
        );
    }

    // User is authenticated and authorized
    return children;
};

/**
 * RoleGuard component - conditionally render content based on user roles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if user has required role
 * @param {string[]} props.allowedRoles - Array of roles allowed to see this content
 * @param {React.ReactNode} [props.fallback] - Content to show if user doesn't have required role
 */
export const RoleGuard = ({ children, allowedRoles = [], fallback = null }) => {
    const { user } = useAuth();

    if (!user || !allowedRoles.includes(user.role)) {
        return fallback;
    }

    return children;
};

/**
 * AdminOnly component - shorthand for owner-only content
 */
export const AdminOnly = ({ children, fallback = null }) => (
    <RoleGuard allowedRoles={['OWNER']} fallback={fallback}>
        {children}
    </RoleGuard>
);

/**
 * CashierAndUp component - for cashier and owner access
 */
export const CashierAndUp = ({ children, fallback = null }) => (
    <RoleGuard allowedRoles={['CASHIER', 'OWNER']} fallback={fallback}>
        {children}
    </RoleGuard>
);

/**
 * WorkerOnly component - for factory worker access
 */
export const WorkerOnly = ({ children, fallback = null }) => (
    <RoleGuard allowedRoles={['WORKER']} fallback={fallback}>
        {children}
    </RoleGuard>
);

/**
 * Hook to check permissions in components
 */
export const usePermissions = () => {
    const { user, hasRole, hasAnyRole, canAccess } = useAuth();

    return {
        user,
        hasRole,
        hasAnyRole,
        canAccess,
        isOwner: hasRole('OWNER'),
        isCashier: hasRole('CASHIER'),
        isWorker: hasRole('WORKER'),
        canManageInvoices: hasAnyRole(['CASHIER', 'OWNER']),
        canAccessFactory: hasAnyRole(['WORKER', 'OWNER']),
        canAccessAdmin: hasRole('OWNER'),
    };
};

export default ProtectedRoute;