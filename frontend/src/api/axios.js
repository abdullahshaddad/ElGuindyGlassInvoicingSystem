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

// Response interceptor - handle responses and token refresh
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
            console.error(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
                status: error.response?.status,
                data: error.response?.data,
            });
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Try to refresh token
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    refreshToken,
                });

                const { token } = response.data;
                localStorage.setItem('auth_token', token);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);

            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);

                // Clear tokens and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('token_expiry');

                // Redirect to login page
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            // User doesn't have permission
            console.error('Access forbidden:', error.response.data);

            // You might want to redirect to unauthorized page
            // window.location.href = '/unauthorized';
        }

        // Handle network errors
        if (error.code === 'NETWORK_ERROR' || !error.response) {
            console.error('Network error:', error);
            error.message = 'Network error. Please check your connection.';
        }

        // Handle timeout
        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timeout. Please try again.';
        }

        return Promise.reject(error);
    }
);

// Helper function to make typed requests
export const request = async (config) => {
    try {
        const response = await api(config);
        return response.data;
    } catch (error) {
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

export default api;