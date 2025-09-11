import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Types for API responses
export interface ApiError {
    error: string;
    message: string;
    statusCode?: number;
}

export interface AuthTokens {
    token: string;
    refreshToken?: string;
}

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Token management utilities
export const tokenManager = {
    getToken: (): string | null => {
        return localStorage.getItem('access_token');
    },

    setToken: (token: string): void => {
        localStorage.setItem('access_token', token);
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem('refresh_token');
    },

    setRefreshToken: (token: string): void => {
        localStorage.setItem('refresh_token', token);
    },

    clearTokens: (): void => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
    },

    setTokens: (tokens: AuthTokens): void => {
        tokenManager.setToken(tokens.token);
        if (tokens.refreshToken) {
            tokenManager.setRefreshToken(tokens.refreshToken);
        }
    }
};

// Request interceptor - attach authorization header
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        // config.metadata = { startTime: new Date() };

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`🚀 API Request [${config.method?.toUpperCase()}] ${config.url}`, {
                headers: config.headers,
                data: config.data,
            });
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle common responses and errors
api.interceptors.response.use(
    (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
            // const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
            // console.log(`✅ API Response [${response.status}] ${response.config.url} (${duration}ms)`, response.data);
        }

        return response;
    },
    async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        // Log error in development
        if (import.meta.env.DEV) {
            console.error(`❌ API Error [${error.response?.status}] ${originalRequest?.url}:`, {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message,
            });
        }

        // Handle 401 Unauthorized
        // if (error.response?.status === 401 && originalRequest) {
        //     const refreshToken = tokenManager.getRefreshToken();
        //
        //     // Try to refresh token if available and not already trying
        //     if (refreshToken && !originalRequest.retry) {
        //         originalRequest._retry = true;
        //
        //         try {
        //             // Attempt token refresh
        //             const refreshResponse = await axios.post(
        //                 `${api.defaults.baseURL}/auth/refresh`,
        //                 { refreshToken },
        //                 {
        //                     headers: {
        //                         'Content-Type': 'application/json',
        //                     },
        //                 }
        //             );
        //
        //             const newTokens = refreshResponse.data;
        //             tokenManager.setTokens(newTokens);
        //
        //             // Retry original request with new token
        //             if (originalRequest.headers) {
        //                 originalRequest.headers.Authorization = `Bearer ${newTokens.token}`;
        //             }
        //
        //             return api(originalRequest);
        //
        //         } catch (refreshError) {
        //             console.error('❌ Token refresh failed:', refreshError);
        //
        //             // Refresh failed, clear tokens and redirect to login
        //             tokenManager.clearTokens();
        //
        //             // Dispatch custom event for auth state change
        //             window.dispatchEvent(new CustomEvent('auth:logout', {
        //                 detail: { reason: 'token_refresh_failed' }
        //             }));
        //
        //             // Redirect to login page
        //             if (typeof window !== 'undefined') {
        //                 window.location.href = '/login';
        //             }
        //
        //             return Promise.reject(refreshError);
        //         }
        //     }
        //     else {
        //         // No refresh token or already tried refresh, logout user
        //         tokenManager.clearTokens();
        //
        //         window.dispatchEvent(new CustomEvent('auth:logout', {
        //             detail: { reason: 'unauthorized' }
        //         }));
        //
        //         if (typeof window !== 'undefined') {
        //             window.location.href = '/login';
        //         }
        //     }
        // }

        // Handle other common HTTP errors
        if (error.response?.status === 403) {
            // Forbidden - user doesn't have permission
            window.dispatchEvent(new CustomEvent('auth:forbidden', {
                detail: { message: 'عذراً، ليس لديك صلاحية للوصول إلى هذا المورد' }
            }));
        }

        if (error.response?.status === 429) {
            // Too many requests
            window.dispatchEvent(new CustomEvent('api:rate_limit', {
                detail: { message: 'تم تجاوز عدد الطلبات المسموح، يرجى المحاولة لاحقاً' }
            }));
        }

        // if (error.response?.status >= 500) {
        //     // Server errors
        //     window.dispatchEvent(new CustomEvent('api:server_error', {
        //         detail: {
        //             message: 'خطأ في الخادم، يرجى المحاولة لاحقاً',
        //             status: error.response.status
        //         }
        //     }));
        // }

        // Network errors
        if (!error.response && error.code === 'NETWORK_ERROR') {
            window.dispatchEvent(new CustomEvent('api:network_error', {
                detail: { message: 'خطأ في الشبكة، يرجى التحقق من الاتصال' }
            }));
        }

        return Promise.reject(error);
    }
);

// API helper functions
// export const apiHelpers = {
//     // Check if error is from API
//     isApiError: (error: any): error is AxiosError<ApiError> => {
//         return error?.isAxiosError === true;
//     },
//
//     // Extract error message from API response
//     getErrorMessage: (error: any): string => {
//         if (apiHelpers.isApiError(error)) {
//             return error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
//         }
//         return error?.message || 'حدث خطأ غير متوقع';
//     },
//
//     // Check if user is authenticated
//     isAuthenticated: (): boolean => {
//         const token = tokenManager.getToken();
//         if (!token) return false;
//
//         try {
//             // Basic JWT validation (check if not expired)
//             const payload = JSON.parse(atob(token.split('.')[1]));
//             const currentTime = Date.now() / 1000;
//             return payload.exp > currentTime;
//         } catch {
//             return false;
//         }
//     },
//
//     // Logout user
//     logout: (): void => {
//         tokenManager.clearTokens();
//         window.dispatchEvent(new CustomEvent('auth:logout', {
//             detail: { reason: 'manual_logout' }
//         }));
//
//         if (typeof window !== 'undefined') {
//             window.location.href = '/login';
//         }
//     },
//
//     // Upload file with progress
//     uploadFile: (
//         file: File,
//         url: string,
//         onProgress?: (progress: number) => void
//     ) => {
//         const formData = new FormData();
//         formData.append('file', file);
//
//         return api.post(url, formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//             onUploadProgress: (progressEvent) => {
//                 if (onProgress && progressEvent.total) {
//                     const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//                     onProgress(progress);
//                 }
//             },
//         });
//     },
//
//     // Download file
//     downloadFile: async (url: string, filename?: string) => {
//         try {
//             const response = await api.get(url, {
//                 responseType: 'blob',
//             });
//
//             const blob = new Blob([response.data]);
//             const downloadUrl = window.URL.createObjectURL(blob);
//             const link = document.createElement('a');
//             link.href = downloadUrl;
//             link.download = filename || 'download';
//             document.body.appendChild(link);
//             link.click();
//             document.body.removeChild(link);
//             window.URL.revokeObjectURL(downloadUrl);
//
//             return response;
//         } catch (error) {
//             console.error('❌ File download failed:', error);
//             throw error;
//         }
//     },
// };

// Export the configured axios instance
export default api;

// Re-export axios types for convenience
export type { AxiosResponse, AxiosError } from 'axios';