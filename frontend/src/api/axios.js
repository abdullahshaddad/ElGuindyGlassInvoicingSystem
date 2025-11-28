import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper function to clear auth data and redirect to login
const clearAuthAndRedirect = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
};

// Request interceptor - attach token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request for debugging in development
        if (import.meta.env.DEV) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${ config.url}`, {
                headers: config.headers,
                data: config.data,
            });
        }

        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle responses and errors
api.interceptors.response.use(
    (response) => {
        // Log successful responses in development
        if (import.meta.env.DEV) {
            console.log(`
            ✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data,
            });
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Log errors in development
        if (import.meta.env.DEV) {
            console.error(`❌ ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        }

        // Handle 403 Forbidden - User doesn't have permission or session is invalid
        if (error.response?.status === 403) {
            console.error('Access forbidden - clearing auth and redirecting to login');
            clearAuthAndRedirect();
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401) {
            // Prevent infinite retry loops
            if (originalRequest._retry) {
                console.error('Token refresh failed, redirecting to login');
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            // Skip token refresh for auth endpoints
            const isAuthEndpoint = originalRequest.url?.includes('/auth/');
            if (isAuthEndpoint) {
                console.error('Authentication endpoint failed, redirecting to login');
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Try to refresh token
                const response = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh`,
                    { refreshToken },
                    { timeout: 5000 }
                );

                const { token, refreshToken: newRefreshToken } = response.data;

                // Save new tokens
                localStorage.setItem('auth_token', token);
                if (newRefreshToken) {
                    localStorage.setItem('refresh_token', newRefreshToken);
                }

                // Update the failed request with new token
                originalRequest.headers.Authorization = `Bearer ${token}`;

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                clearAuthAndRedirect();
                return Promise.reject(refreshError);
            }
        }

        // For all other errors, reject the promise
        return Promise.reject(error);
    }
);

// Export helper methods for use in components
export const get = async (url, config = {}) => {
    const response = await api.get(url, config);
    return response.data;
};

export const post = async (url, data, config = {}) => {
    const response = await api.post(url, data, config);
    return response.data;
};

export const put = async (url, data, config = {}) => {
    const response = await api.put(url, data, config);
    return response.data;
};

export const patch = async (url, data, config = {}) => {
    const response = await api.patch(url, data, config);
    return response.data;
};

export const del = async (url, config = {}) => {
    const response = await api.delete(url, config);
    return response.data;
};

export default api;