import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useQuery, useMutation } from 'convex/react';
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

    // Tenant queries — bootstrap (no tenant scope needed)
    const tenants = useQuery(
        api.tenants.queries.listMyTenants,
        isSignedIn ? {} : "skip"
    );

    // Current tenant — tenant-scoped (when user has a defaultTenantId or viewingTenantId)
    const currentTenant = useQuery(
        api.tenants.queries.getCurrentTenant,
        isSignedIn && convexUser && (convexUser.defaultTenantId || convexUser.viewingTenantId) ? {} : "skip"
    );

    // Switch tenant mutation
    const switchTenantMutation = useMutation(api.tenants.mutations.switchTenant);

    // Loading: wait for Clerk, Convex user, and tenant data (when applicable)
    const isLoading =
        !isClerkLoaded ||
        (isSignedIn && convexUser === undefined) ||
        (isSignedIn && convexUser && (convexUser.defaultTenantId || convexUser.viewingTenantId) && currentTenant === undefined);

    // Build user object matching the old interface + tenant fields
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
            defaultTenantId: convexUser.defaultTenantId,
            viewingTenantId: convexUser.viewingTenantId,
            isSuperAdminViewing: currentTenant?.isSuperAdminViewing || false,
            tenantRole: currentTenant?.currentUserRole,
            permissions: currentTenant?.currentUserPermissions || [],
        };
    }, [isSignedIn, convexUser, clerkUser, currentTenant]);

    const isAuthenticated = isSignedIn && !!convexUser;

    // Logout
    const logout = async () => {
        await signOut();
    };

    // Switch tenant — Convex reactivity handles refresh of all subscriptions
    const switchTenant = useCallback(async (tenantId) => {
        await switchTenantMutation({ tenantId });
    }, [switchTenantMutation]);

    // Role checking functions (app-level roles)
    const hasRole = (requiredRole) => {
        if (!user) return false;
        return user.role === requiredRole;
    };

    const hasAnyRole = (requiredRoles) => {
        if (!user || !requiredRoles?.length) return false;
        return requiredRoles.includes(user.role);
    };

    // Tenant role checking functions (deprecated — use hasTenantPermission instead)
    const hasTenantRole = (requiredRole) => {
        if (!user?.tenantRole) return false;
        return user.tenantRole === requiredRole;
    };

    const hasTenantAccess = (minimumRole) => {
        if (!user?.tenantRole) return false;
        // Kept for backward compat — maps roles to a hierarchy level
        const TENANT_ROLE_HIERARCHY = { viewer: 1, operator: 2, manager: 3, admin: 4, owner: 5 };
        return (TENANT_ROLE_HIERARCHY[user.tenantRole] || 0) >= (TENANT_ROLE_HIERARCHY[minimumRole] || 0);
    };

    // Permission checking — granular, checks the permissions array from the backend
    const hasTenantPermission = (permission) => {
        if (!user) return false;
        // SUPERADMIN bypasses
        if (user.role === 'SUPERADMIN') return true;
        return user.permissions?.includes(permission) || false;
    };

    // Permission checking function (preserved from original)
    const canAccess = (resource, action = 'read') => {
        if (!user) return false;

        const { role } = user;

        // SUPERADMIN and OWNER have access to everything
        if (role === 'SUPERADMIN' || role === 'OWNER') return true;

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
    const isSuperAdminViewing = user?.isSuperAdminViewing || false;

    const value = {
        // State
        user,
        isAuthenticated,
        isLoading,

        // Tenant state
        currentTenant: currentTenant || null,
        tenants: tenants || [],
        switchTenant,
        isSuperAdminViewing,

        // Authentication methods
        logout,

        // Utility methods
        hasRole,
        hasAnyRole,
        canAccess,
        hasTenantRole,
        hasTenantAccess,
        hasTenantPermission,
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
    const { user, hasRole, hasAnyRole, canAccess, hasTenantRole, hasTenantAccess, hasTenantPermission } = useAuth();

    return {
        user,
        hasRole,
        hasAnyRole,
        canAccess,
        hasTenantRole,
        hasTenantAccess,
        hasTenantPermission,
        // Convenience methods for common checks
        isSuperAdmin: () => hasRole('SUPERADMIN'),
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
