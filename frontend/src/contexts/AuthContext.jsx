import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { authService } from '../services/authService';

// Auth state reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isAuthenticated: true,
                user: action.payload.user,
                token: action.payload.token,
                error: null,
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                token: null,
                error: null,
                isLoading: false,
            };
        case 'SET_USER':
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
            };
        case 'SET_LOADING':
            return {
                ...state,
                isLoading: action.payload,
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };
        default:
            return state;
    }
};

// Initial state
const initialState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
};

// Create context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Initialize auth state on app load
    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });

            const token = localStorage.getItem('auth_token');
            if (!token) {
                dispatch({ type: 'SET_LOADING', payload: false });
                return;
            }

            // Verify token and get user info
            const user = await authService.getMe();
            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, token },
            });
        } catch (error) {
            console.error('Auth initialization failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    const login = async (credentials) => {
        try {
            dispatch({ type: 'LOGIN_START' });

            const response = await authService.login(credentials);
            const { token, user } = response;

            // Store tokens
            localStorage.setItem('auth_token', token);
            if (response.refreshToken) {
                localStorage.setItem('refresh_token', response.refreshToken);
            }

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: { user, token },
            });

            return { success: true, user };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            dispatch({
                type: 'LOGIN_FAILURE',
                payload: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            // Clear tokens from storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('token_expiry');

            dispatch({ type: 'LOGOUT' });

            // Optional: Call backend logout endpoint
            try {
                await authService.logout();
            } catch (error) {
                // Ignore logout endpoint errors
                console.warn('Logout endpoint failed:', error);
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Still dispatch logout to clear local state
            dispatch({ type: 'LOGOUT' });
        }
    };

    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authService.refreshToken();
            const { token } = response;

            localStorage.setItem('auth_token', token);

            return token;
        } catch (error) {
            console.error('Token refresh failed:', error);
            await logout();
            throw error;
        }
    };

    const updateUser = (userData) => {
        dispatch({ type: 'SET_USER', payload: userData });
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const hasRole = (requiredRole) => {
        if (!state.user) return false;
        return state.user.role === requiredRole;
    };

    const hasAnyRole = (requiredRoles) => {
        if (!state.user || !requiredRoles?.length) return false;
        return requiredRoles.includes(state.user.role);
    };

    // Helper function to check permissions
    const canAccess = (resource, action = 'read') => {
        if (!state.user) return false;

        const { role } = state.user;

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

    const contextValue = {
        // State
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        isLoading: state.isLoading,
        error: state.error,

        // Actions
        login,
        logout,
        refreshToken,
        updateUser,
        clearError,

        // Helpers
        hasRole,
        hasAnyRole,
        canAccess,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
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