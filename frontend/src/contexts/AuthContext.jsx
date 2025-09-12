import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {authService} from "@services/authService.jsx";

// Create the context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    // Function to handle login
    const login = async (credentials) => {
        try {
            setError(null);

            const response = await authService.login(credentials);
            const { token: jwtToken, user: userData } = response;

            // Save token to localStorage
            localStorage.setItem('auth_token', jwtToken);
            if (response.refreshToken) {
                localStorage.setItem('refresh_token', response.refreshToken);
            }

            // Save user info to localStorage for persistence
            localStorage.setItem('user_info', JSON.stringify(userData));

            // Update state
            setToken(jwtToken);
            setUser(userData);
            setIsAuthenticated(true);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    // Function to handle logout
    const logout = async () => {
        try {
            // Call server-side logout if available
            await authService.logout();
        } catch (error) {
            console.warn('Server logout failed, continuing with local logout:', error);
        } finally {
            // Always clear local storage and state
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('token_expiry');
            localStorage.removeItem('user_info');

            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
        }
    };

    // Function to refresh token
    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authService.refreshToken(refreshToken);
            const { token: newToken } = response;

            localStorage.setItem('auth_token', newToken);
            setToken(newToken);

            return newToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
            throw error;
        }
    };

    // Function to update user data
    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user_info', JSON.stringify(userData));
    };

    // Clear error function
    const clearError = () => {
        setError(null);
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

    // Permission checking function
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

    // Initialize auth state from localStorage on mount - NO API CALLS
    useEffect(() => {
        const initializeAuth = () => {
            try {
                const storedToken = localStorage.getItem('auth_token');
                const storedUserInfo = localStorage.getItem('user_info');

                if (storedToken && storedUserInfo) {
                    // Parse stored user info
                    const userData = JSON.parse(storedUserInfo);

                    // Set authenticated state immediately
                    setToken(storedToken);
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    // No stored auth data
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error parsing stored auth data:', error);

                // Clear invalid data
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('token_expiry');
                localStorage.removeItem('user_info');

                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                // Always set loading to false
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    // Context value
    const value = {
        // State
        user,
        token,
        isAuthenticated,
        isLoading,
        error,

        // Authentication methods
        login,
        logout,
        refreshToken,

        // User management
        updateUser,
        clearError,

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