import React, { createContext, useContext, useMemo } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { isSignedIn, signOut } = useClerkAuth();

    // Fetch app user from Convex (role, isActive, etc.)
    const convexUser = useQuery(
        api.users.queries.getCurrentUser,
        isSignedIn ? {} : "skip"
    );

    const isLoading = !isClerkLoaded || (isSignedIn && convexUser === undefined);

    // Build user object matching the old interface
    const user = useMemo(() => {
        if (!isSignedIn || !convexUser) return null;
        return {
            id: convexUser._id,
            clerkUserId: convexUser.clerkUserId,
            username: convexUser.username,
            firstName: convexUser.firstName || clerkUser?.firstName || '',
            lastName: convexUser.lastName || clerkUser?.lastName || '',
            displayName: `${convexUser.firstName || ''} ${convexUser.lastName || ''}`.trim(),
            role: convexUser.role,
            isActive: convexUser.isActive,
        };
    }, [isSignedIn, convexUser, clerkUser]);

    const isAuthenticated = isSignedIn && !!convexUser;

    // Logout
    const logout = async () => {
        await signOut();
    };

    // Role checking functions
    const hasRole = (requiredRole) => {
        if (!user) return false;
        return user.role === requiredRole;
    };

    const hasAnyRole = (requiredRoles) => {
        if (!user || !requiredRoles?.length) return false;
        return requiredRoles.includes(user.role);
    };

    // Permission checking function (preserved from original)
    const canAccess = (resource, action = 'read') => {
        if (!user) return false;

        const { role } = user;

        // Owner has access to everything
        if (role === 'OWNER') return true;

        // Define permission matrix
        const permissions = {
            invoices: {
                read: ['CASHIER', 'OWNER'],
                write: ['CASHIER', 'OWNER'],
                delete: ['OWNER'],
            },
            customers: {
                read: ['CASHIER', 'OWNER'],
                write: ['CASHIER', 'OWNER'],
                delete: ['OWNER'],
            },
            factory: {
                read: ['WORKER', 'OWNER'],
                write: ['WORKER', 'OWNER'],
            },
            admin: {
                read: ['OWNER'],
                write: ['OWNER'],
                delete: ['OWNER'],
            },
            'glass-types': {
                read: ['OWNER'],
                write: ['OWNER'],
                delete: ['OWNER'],
            },
            reports: {
                read: ['OWNER'],
                write: ['OWNER'],
            },
        };

        const resourcePermissions = permissions[resource];
        if (!resourcePermissions) return false;

        const allowedRoles = resourcePermissions[action];
        return allowedRoles?.includes(role) || false;
    };

    // Context value
    const value = {
        // State
        user,
        isAuthenticated,
        isLoading,

        // Authentication methods
        logout,

        // Utility methods
        hasRole,
        hasAnyRole,
        canAccess,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use the auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Custom hook for permission-based functionality
export const usePermissions = () => {
    const { user, hasRole, hasAnyRole, canAccess } = useAuth();

    return {
        user,
        hasRole,
        hasAnyRole,
        canAccess,
        // Convenience methods for common checks
        isOwner: () => hasRole('OWNER'),
        isCashier: () => hasRole('CASHIER'),
        isWorker: () => hasRole('WORKER'),
        isAdmin: () => hasRole('ADMIN'),
        canManageInvoices: () => canAccess('invoices', 'write'),
        canDeleteInvoices: () => canAccess('invoices', 'delete'),
        canManageCustomers: () => canAccess('customers', 'write'),
        canAccessFactory: () => canAccess('factory', 'read'),
        canManageFactory: () => canAccess('factory', 'write'),
        canAccessAdmin: () => canAccess('admin', 'read'),
        canManageGlassTypes: () => canAccess('glass-types', 'write'),
        canViewReports: () => canAccess('reports', 'read'),
    };
};
