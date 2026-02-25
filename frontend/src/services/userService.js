import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";

// ===== QUERY HOOKS =====

/**
 * Get all users (real-time)
 * @returns {Array|undefined} List of all users
 */
export function useUsers() {
    return useQuery(api.users.queries.listUsers, {});
}

/**
 * Get a single user by ID (real-time)
 * @param {string} userId - User ID
 * @returns {Object|undefined} User data
 */
export function useUser(userId) {
    return useQuery(
        api.users.queries.getUser,
        userId ? { userId } : "skip"
    );
}

/**
 * Get the currently authenticated user (real-time)
 * @returns {Object|undefined} Current user data
 */
export function useCurrentUser() {
    return useQuery(api.users.queries.getCurrentUser, {});
}

// ===== MUTATION HOOKS =====

/**
 * Create a new user
 * Usage: const createUser = useCreateUser();
 *        await createUser({ clerkUserId, username, firstName, lastName, role });
 * @returns {Function} Mutation function accepting { clerkUserId, username, firstName, lastName, role }
 */
export function useCreateUser() {
    return useMutation(api.users.mutations.createUser);
}

/**
 * Update an existing user
 * Usage: const updateUser = useUpdateUser();
 *        await updateUser({ userId, firstName, lastName, role, isActive });
 * @returns {Function} Mutation function accepting { userId, firstName?, lastName?, role?, isActive? }
 */
export function useUpdateUser() {
    return useMutation(api.users.mutations.updateUser);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Validate user creation data
 * @param {Object} userData - User data to validate
 * @returns {{ isValid: boolean, errors: string[] }} Validation result with array of error messages
 */
export const validateUserData = (userData) => {
    const errors = [];
    if (!userData?.username || userData.username.length < 3) errors.push('اسم المستخدم مطلوب ويجب أن يكون 3 أحرف على الأقل');
    if (!userData?.firstName || userData.firstName.length < 2) errors.push('الاسم الأول مطلوب ويجب أن يكون حرفين على الأقل');
    if (!userData?.lastName || userData.lastName.length < 2) errors.push('الاسم الأخير مطلوب ويجب أن يكون حرفين على الأقل');
    if (!userData?.password || userData.password.length < 6) errors.push('كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل');
    if (!['OWNER', 'ADMIN', 'CASHIER', 'WORKER'].includes(userData?.role)) errors.push('يرجى اختيار دور صحيح');
    return { isValid: errors.length === 0, errors };
};

/**
 * Get role display information with Arabic names and styling
 * @param {string} role - Role name (OWNER, ADMIN, CASHIER, WORKER)
 * @returns {{ name: string, nameEn: string, color: string, bgColor: string, description: string }} Role display info
 */
export const getRoleInfo = (role) => {
    const roles = {
        OWNER: { name: 'مالك', nameEn: 'Owner', color: 'text-purple-600', bgColor: 'bg-purple-100', description: 'صلاحيات كاملة للنظام' },
        ADMIN: { name: 'مدير', nameEn: 'Admin', color: 'text-blue-600', bgColor: 'bg-blue-100', description: 'إدارة النظام والمستخدمين' },
        CASHIER: { name: 'أمين صندوق', nameEn: 'Cashier', color: 'text-green-600', bgColor: 'bg-green-100', description: 'إنشاء وإدارة الفواتير' },
        WORKER: { name: 'عامل', nameEn: 'Worker', color: 'text-orange-600', bgColor: 'bg-orange-100', description: 'عرض مهام المصنع' },
    };
    return roles[role] || { name: role, nameEn: role, color: 'text-gray-600', bgColor: 'bg-gray-100', description: '' };
};
