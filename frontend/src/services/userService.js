// src/services/userService.js
import {get, put, post} from '@/api/axios';

/**
 * User Management Service
 * Handles all user management API calls for OWNER and ADMIN roles
 */
export const userService = {
    /**
     * Create a new user
     * @param {Object} userDto - User creation data
     * @param {string} userDto.username - Username (required, unique)
     * @param {string} userDto.firstName - First name (required)
     * @param {string} userDto.lastName - Last name (required)
     * @param {string} userDto.password - Password (required)
     * @param {string} userDto.role - User role (OWNER, ADMIN, CASHIER, WORKER)
     * @returns {Promise<User>}
     */
    async create(userDto) {
        try {
            const response = await post('/users', {
                username: userDto.username,
                firstName: userDto.firstName,
                lastName: userDto.lastName,
                password: userDto.password,
                role: userDto.role
            });
            return response;
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    },

    /**
     * Get all users - accessible by OWNER and ADMIN
     * @returns {Promise<User[]>}
     */
    async getAll() {
        try {
            return await get('/users');
        } catch (error) {
            console.error('Get all users error:', error);
            throw error;
        }
    },

    /**
     * Set user as inactive - accessible by OWNER and ADMIN
     * @param {string} userId - User ID to deactivate
     * @returns {Promise<User>}
     */
    async setInactive(userId) {
        try {
            const response = await put(`/users/${userId}/inactive`);
            return response;
        } catch (error) {
            console.error('Set user inactive error:', error);
            throw error;
        }
    },

    /**
     * Set user as active - accessible by OWNER and ADMIN
     * @param {string} userId - User ID to activate
     * @returns {Promise<User>}
     */
    async setActive(userId) {
        try {
            const response = await put(`/users/${userId}/active`);
            return response;
        } catch (error) {
            console.error('Set user active error:', error);
            throw error;
        }
    },

    /**
     * Update user role - OWNER only
     * @param {string} userId - User ID
     * @param {string} role - New role
     * @returns {Promise<User>}
     */
    async updateRole(userId, role) {
        try {
            const response = await put(`/users/${userId}/role`, { role });
            return response;
        } catch (error) {
            console.error('Update user role error:', error);
            throw error;
        }
    },

    /**
     * Validate user creation data
     * @param {Object} userData - User data to validate
     * @returns {Object} Validation result
     */
    validateUserData(userData) {
        const errors = {};

        // Username validation
        if (!userData.username || userData.username.trim().length < 3) {
            errors.username = 'اسم المستخدم مطلوب ويجب أن يكون 3 أحرف على الأقل';
        }

        // First name validation
        if (!userData.firstName || userData.firstName.trim().length < 2) {
            errors.firstName = 'الاسم الأول مطلوب ويجب أن يكون حرفين على الأقل';
        }

        // Last name validation
        if (!userData.lastName || userData.lastName.trim().length < 2) {
            errors.lastName = 'الاسم الأخير مطلوب ويجب أن يكون حرفين على الأقل';
        }

        // Password validation
        if (!userData.password || userData.password.length < 6) {
            errors.password = 'كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل';
        }

        // Role validation
        if (!userData.role || !['OWNER', 'ADMIN', 'CASHIER', 'WORKER'].includes(userData.role)) {
            errors.role = 'يرجى اختيار دور صحيح';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Get role display information with Arabic names
     * @param {string} role - Role name
     * @returns {Object} Role display info
     */
    getRoleInfo(role) {
        const roleInfo = {
            OWNER: {
                name: 'مالك',
                nameEn: 'Owner',
                color: 'text-purple-600',
                bgColor: 'bg-purple-100',
                description: 'وصول كامل للنظام وإدارة المستخدمين'
            },
            ADMIN: {
                name: 'مدير',
                nameEn: 'Admin',
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                description: 'إدارة المستخدمين، بدون إعدادات النظام'
            },
            CASHIER: {
                name: 'أمين صندوق',
                nameEn: 'Cashier',
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                description: 'إدارة الفواتير والعملاء'
            },
            WORKER: {
                name: 'عامل',
                nameEn: 'Worker',
                color: 'text-orange-600',
                bgColor: 'bg-orange-100',
                description: 'مهام المصنع والإنتاج فقط'
            }
        };

        return roleInfo[role] || {
            name: role,
            nameEn: role,
            color: 'text-gray-600',
            bgColor: 'bg-gray-100',
            description: 'دور غير معروف'
        };
    }
};