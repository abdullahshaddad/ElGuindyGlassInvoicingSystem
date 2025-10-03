import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request for debugging in development
        if (import.meta.env.DEV) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
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
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
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

        // Handle 401 Unauthorized - Token expired or invalid
        if (error.response?.status === 401) {
            // Prevent infinite retry loops
            if (originalRequest._retry) {
                console.error('Token refresh failed, redirecting to login');
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

                const { token } = response.data;
                localStorage.setItem('auth_token', token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                clearAuthAndRedirect();
                return Promise.reject(refreshError);
            }
        }

        // Handle 403 Forbidden - Insufficient permissions
        if (error.response?.status === 403) {
            console.error('Access forbidden:', error.response.data);

            // Optionally show a notification to the user
            if (window.showNotification) {
                window.showNotification('ليس لديك صلاحية للوصول إلى هذا المورد', 'error');
            }

            // Don't redirect, let the component handle it
            error.userMessage = 'ليس لديك صلاحية للوصول إلى هذا المورد';
        }

        // Handle 404 Not Found
        if (error.response?.status === 404) {
            console.error('Resource not found:', originalRequest?.url);
            error.userMessage = 'المورد المطلوب غير موجود';
        }

        // Handle 500 Internal Server Error
        if (error.response?.status === 500) {
            console.error('Server error:', error.response.data);
            error.userMessage = 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً';
        }

        // Handle network errors
        if (error.code === 'ERR_NETWORK' || !error.response) {
            console.error('Network error:', error);
            error.userMessage = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت';
        }

        // Handle timeout
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
            console.error('Request timeout:', error);
            error.userMessage = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى';
        }

        // Handle validation errors (usually 400)
        if (error.response?.status === 400) {
            const errorMessage = error.response.data?.message || error.response.data?.details;
            error.userMessage = errorMessage || 'بيانات غير صحيحة';
        }

        return Promise.reject(error);
    }
);

/**
 * Clear authentication data and redirect to login
 */
function clearAuthAndRedirect() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';
}

// Helper function to make typed requests
export const request = async (config) => {
    try {
        const response = await api(config);
        return response.data;
    } catch (error) {
        // Re-throw with enhanced error information
        throw error;
    }
};

// Helper functions for common HTTP methods
export const get = (url, config = {}) => request({ method: 'GET', url, ...config });

export const post = (url, data, config = {}) => request({
    method: 'POST',
    url,
    data,
    ...config
});

export const put = (url, data, config = {}) => request({
    method: 'PUT',
    url,
    data,
    ...config
});

export const patch = (url, data, config = {}) => request({
    method: 'PATCH',
    url,
    data,
    ...config
});

export const del = (url, config = {}) => request({ method: 'DELETE', url, ...config });

// Helper function to upload files
export const uploadFile = (url, formData, config = {}) => {
    return request({
        method: 'POST',
        url,
        data: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        ...config,
    });
};

// Helper function to download files
export const downloadFile = async (url, filename, config = {}) => {
    try {
        const response = await api({
            method: 'GET',
            url,
            responseType: 'blob',
            ...config,
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return response.data;
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

/**
 * Helper function to get user-friendly error message
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message in Arabic
 */
export const getErrorMessage = (error) => {
    // Use custom user message if available
    if (error.userMessage) {
        return error.userMessage;
    }

    // Check for response data message
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.response?.data?.details) {
        return error.response.data.details;
    }

    // Fallback to generic messages based on status
    switch (error.response?.status) {
        case 400:
            return 'بيانات غير صحيحة';
        case 401:
            return 'يرجى تسجيل الدخول مرة أخرى';
        case 403:
            return 'ليس لديك صلاحية للوصول';
        case 404:
            return 'المورد المطلوب غير موجود';
        case 500:
            return 'حدث خطأ في الخادم';
        default:
            return 'حدث خطأ غير متوقع';
    }
};

export default api;