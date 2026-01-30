/**
 * Error handling utilities for backend API responses
 *
 * Backend ErrorResponse format:
 * {
 *   status: number,
 *   error: string,
 *   message: string (Arabic),
 *   details: string[] | null,
 *   timestamp: string
 * }
 */

/**
 * Extract a user-friendly error message from an axios error response
 * @param {Error} error - The error object from axios
 * @param {string} fallbackMessage - Fallback message if no specific error found
 * @returns {string} The error message to display
 */
export const getErrorMessage = (error, fallbackMessage = 'حدث خطأ غير متوقع') => {
    // Check for axios response error
    if (error?.response?.data) {
        const data = error.response.data;

        // Standard ErrorResponse format
        if (data.message) {
            return data.message;
        }

        // Sometimes error is just a string
        if (typeof data === 'string') {
            return data;
        }

        // Check for error field
        if (data.error) {
            return data.error;
        }
    }

    // Network error
    if (error?.message === 'Network Error') {
        return 'خطأ في الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
    }

    // Timeout error
    if (error?.code === 'ECONNABORTED') {
        return 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
    }

    // Use error message if available
    if (error?.message) {
        return error.message;
    }

    return fallbackMessage;
};

/**
 * Extract validation error details from an axios error response
 * @param {Error} error - The error object from axios
 * @returns {string[]} Array of validation error details
 */
export const getErrorDetails = (error) => {
    if (error?.response?.data?.details) {
        return error.response.data.details;
    }
    return [];
};

/**
 * Get a formatted error with message and details combined
 * @param {Error} error - The error object from axios
 * @param {string} fallbackMessage - Fallback message if no specific error found
 * @returns {string} Combined error message with details
 */
export const getFullErrorMessage = (error, fallbackMessage = 'حدث خطأ غير متوقع') => {
    const message = getErrorMessage(error, fallbackMessage);
    const details = getErrorDetails(error);

    if (details.length > 0) {
        return `${message}\n${details.join('\n')}`;
    }

    return message;
};

/**
 * Check if the error is a validation error (400 status)
 * @param {Error} error - The error object from axios
 * @returns {boolean}
 */
export const isValidationError = (error) => {
    return error?.response?.status === 400;
};

/**
 * Check if the error is a not found error (404 status)
 * @param {Error} error - The error object from axios
 * @returns {boolean}
 */
export const isNotFoundError = (error) => {
    return error?.response?.status === 404;
};

/**
 * Check if the error is an authentication error (401/403 status)
 * @param {Error} error - The error object from axios
 * @returns {boolean}
 */
export const isAuthError = (error) => {
    return error?.response?.status === 401 || error?.response?.status === 403;
};

/**
 * Check if the error is a server error (5xx status)
 * @param {Error} error - The error object from axios
 * @returns {boolean}
 */
export const isServerError = (error) => {
    const status = error?.response?.status;
    return status >= 500 && status < 600;
};

/**
 * Check if the error is a network error
 * @param {Error} error - The error object from axios
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
    return error?.message === 'Network Error' || error?.code === 'ECONNABORTED';
};

export default {
    getErrorMessage,
    getErrorDetails,
    getFullErrorMessage,
    isValidationError,
    isNotFoundError,
    isAuthError,
    isServerError,
    isNetworkError
};
