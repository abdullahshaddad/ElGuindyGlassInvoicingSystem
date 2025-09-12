import { get, post } from '@/api/axios';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
    /**
     * Login user with credentials
     * @param {Object} credentials - Login credentials
     * @param {string} credentials.username - Username or email
     * @param {string} credentials.password - Password
     * @returns {Promise<{token: string, refreshToken: string, user: User}>}
     */
    async login(credentials) {
        try {
            const response = await post('/auth/authenticate', {
                username: credentials.username || credentials.email,
                password: credentials.password,
            });

            // Backend returns user data at root level, not nested in response.user
            return {
                token: response.token,
                refreshToken: response.refreshToken,
                user: {
                    id: response.id || response.username, // Use username as fallback if id not present
                    username: response.username,
                    displayName: `${response.firstName} ${response.lastName}`,
                    firstName: response.firstName,
                    lastName: response.lastName,
                    role: response.role,
                    isActive: response.isActive !== undefined ? response.isActive : true, // Default to true if not provided
                },
            };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Register new user (admin only)
     * @param {Object} payload - Registration data
     * @param {string} payload.username - Username
     * @param {string} payload.password - Password
     * @param {string} payload.firstName - First name
     * @param {string} payload.lastName - Last name
     * @param {string} payload.role - User role (CASHIER, OWNER, WORKER)
     * @returns {Promise<User>}
     */
    async register(payload) {
        try {
            const response = await post('/auth/register', payload);
            return response;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Refresh authentication token
     * @param {string} refreshToken - Refresh token
     * @returns {Promise<{token: string}>}
     */
    async refreshToken(refreshToken) {
        try {
            const token = refreshToken || localStorage.getItem('refresh_token');

            if (!token) {
                throw new Error('No refresh token available');
            }

            const response = await post('/auth/refresh', { refreshToken: token });
            return {
                token: response.token,
                refreshToken: response.refreshToken || token, // Use new refresh token if provided
            };
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    },

    /**
     * Get current user information
     * @returns {Promise<User>}
     */
    async getMe() {
        try {
            const response = await get('/auth/me');
            return {
                id: response.id || response.username, // Use username as fallback if id not present
                username: response.username,
                displayName: `${response.firstName} ${response.lastName}`,
                firstName: response.firstName,
                lastName: response.lastName,
                role: response.role,
                isActive: response.isActive !== undefined ? response.isActive : true,
            };
        } catch (error) {
            console.error('Get me error:', error);
            throw error;
        }
    },

    /**
     * Logout user
     * @returns {Promise<void>}
     */
    async logout() {
        try {
            await post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
            // Don't throw error for logout - just log it
        }
    },

    /**
     * Change user password
     * @param {Object} passwords
     * @param {string} passwords.currentPassword - Current password
     * @param {string} passwords.newPassword - New password
     * @returns {Promise<void>}
     */
    async changePassword(passwords) {
        try {
            await post('/auth/change-password', passwords);
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    },

    /**
     * Update user profile
     * @param {Object} profileData
     * @param {string} profileData.firstName - First name
     * @param {string} profileData.lastName - Last name
     * @returns {Promise<User>}
     */
    async updateProfile(profileData) {
        try {
            const response = await post('/auth/profile', profileData);
            return {
                id: response.id || response.username,
                username: response.username,
                displayName: `${response.firstName} ${response.lastName}`,
                firstName: response.firstName,
                lastName: response.lastName,
                role: response.role,
                isActive: response.isActive !== undefined ? response.isActive : true,
            };
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    /**
     * Validate token
     * @param {string} token - Token to validate
     * @returns {Promise<boolean>}
     */
    async validateToken(token) {
        try {
            await get('/auth/validate', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return true;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    },

    /**
     * Get all users (admin only)
     * @returns {Promise<User[]>}
     */
    async getUsers() {
        try {
            const response = await get('/auth/users');
            return response.map(user => ({
                id: user.id || user.username,
                username: user.username,
                displayName: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isActive: user.isActive !== undefined ? user.isActive : true,
            }));
        } catch (error) {
            console.error('Get users error:', error);
            throw error;
        }
    },

    /**
     * Deactivate user (admin only)
     * @param {string} userId - User ID to deactivate
     * @returns {Promise<void>}
     */
    async deactivateUser(userId) {
        try {
            await post(`/auth/users/${userId}/deactivate`);
        } catch (error) {
            console.error('Deactivate user error:', error);
            throw error;
        }
    },

    /**
     * Activate user (admin only)
     * @param {string} userId - User ID to activate
     * @returns {Promise<void>}
     */
    async activateUser(userId) {
        try {
            await post(`/auth/users/${userId}/activate`);
        } catch (error) {
            console.error('Activate user error:', error);
            throw error;
        }
    },
};