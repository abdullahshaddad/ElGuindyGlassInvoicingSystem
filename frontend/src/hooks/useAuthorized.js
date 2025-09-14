// src/hooks/useAuthorized.js
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Custom hook for role-based authorization
 * Redirects unauthorized users to /dashboard
 *
 * @param {string[]} allowedRoles - Array of roles allowed to access the resource
 * @returns {Object} - Authorization status and user info
 */
export const useAuthorized = (allowedRoles = []) => {
    const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();
    const navigate = useNavigate();

    const isAuthorized = isAuthenticated &&
        user &&
        (allowedRoles.length === 0 || hasAnyRole(allowedRoles));

    useEffect(() => {
        // Wait for authentication to load
        if (isLoading) return;

        // Redirect if not authenticated
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        // Redirect if not authorized for the required roles
        if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
            navigate('/dashboard', { replace: true });
            return;
        }
    }, [isAuthenticated, isLoading, user, allowedRoles, navigate, hasAnyRole]);

    return {
        isAuthorized,
        isLoading,
        user,
        hasRole: (role) => user?.role === role,
        hasAnyRole: (roles) => roles.includes(user?.role),
        canManageUsers: () => ['OWNER', 'ADMIN'].includes(user?.role),
        isOwner: () => user?.role === 'OWNER',
        isAdmin: () => user?.role === 'ADMIN'
    };
};

export default useAuthorized;