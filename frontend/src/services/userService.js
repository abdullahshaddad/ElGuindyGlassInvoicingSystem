import { useQuery, useMutation, useAction } from "convex/react";
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
 * Create a new user (creates in Clerk + Convex)
 * Usage: const createUser = useCreateUser();
 *        await createUser({ username, firstName, lastName, password, role });
 */
export function useCreateUser() {
    return useAction(api.users.actions.createUserWithClerk);
}

/**
 * Update an existing user
 * Usage: const updateUser = useUpdateUser();
 *        await updateUser({ userId, firstName, lastName, role, isActive });
 */
export function useUpdateUser() {
    return useMutation(api.users.mutations.updateUser);
}

// ===== UTILITY FUNCTIONS =====

/**
 * Returns password requirement checks with pass/fail status.
 * @param {string} password
 * @returns {Array<{ label: string, passed: boolean }>}
 */
export const getPasswordChecks = (password = '') => {
    return [
        { label: '8 أحرف على الأقل', passed: password.length >= 8 },
        { label: 'حرف كبير (A-Z)', passed: /[A-Z]/.test(password) },
        { label: 'حرف صغير (a-z)', passed: /[a-z]/.test(password) },
        { label: 'رقم (0-9)', passed: /[0-9]/.test(password) },
        { label: 'رمز خاص (!@#$...)', passed: /[^A-Za-z0-9]/.test(password) },
    ];
};

/**
 * Validate user creation data
 * @param {Object} userData - User data to validate
 * @returns {{ isValid: boolean, errors: Object }} Validation result with field-level errors
 */
export const validateUserData = (userData) => {
    const errors = {};
    if (!userData?.username || userData.username.length < 3) {
        errors.username = 'اسم المستخدم مطلوب ويجب أن يكون 3 أحرف على الأقل';
    }
    if (!userData?.firstName || userData.firstName.length < 2) {
        errors.firstName = 'الاسم الأول مطلوب ويجب أن يكون حرفين على الأقل';
    }
    // Password validation - check all rules
    const checks = getPasswordChecks(userData?.password || '');
    const failingChecks = checks.filter(c => !c.passed);
    if (failingChecks.length > 0) {
        errors.password = true; // flag as invalid; UI shows the checklist
    }
    if (!['OWNER', 'ADMIN', 'CASHIER', 'WORKER'].includes(userData?.role)) {
        errors.role = 'يرجى اختيار دور صحيح';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Extract a clean error message from a Convex error.
 * Convex action errors include prefixes like "[CONVEX A(...)] Server Error Uncaught Error: ..."
 */
export const extractErrorMessage = (err) => {
    const msg = err?.message || '';
    // Strip Convex server error prefix
    const match = msg.match(/(?:Uncaught Error:|Server Error[^:]*:)\s*(.+)/);
    return match ? match[1].trim() : msg || 'حدث خطأ غير متوقع';
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
