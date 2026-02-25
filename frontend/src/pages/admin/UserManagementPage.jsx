// src/pages/admin/UserManagementPage.jsx - WITH FULL DARK MODE SUPPORT
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiUserCheck, FiUserX } from 'react-icons/fi';

// Import existing components
import { Badge, Button, DataTable, Input, Modal, PageHeader, Select } from '@components';

// Import Convex hooks and utilities from rewritten service
import { useUsers, useCreateUser, useUpdateUser, validateUserData, getRoleInfo } from '@services/userService';
import useAuthorized from "@hooks/useAuthorized.js";

const UserManagementPage = () => {
    const { t, i18n } = useTranslation();

    // Step 1 -- Access Control: OWNER and ADMIN only
    const {
        isAuthorized,
        isLoading: authLoading,
        canManageUsers,
        isOwner
    } = useAuthorized(['OWNER', 'ADMIN']);

    // Convex reactive query - returns undefined while loading, then array
    const users = useUsers();
    const loading = users === undefined;

    // Convex mutations
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();

    // Local UI state
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 2 -- Add User Form State
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        password: '',
        role: 'CASHIER' // Default role
    });
    const [formErrors, setFormErrors] = useState({});

    // RTL support
    const isRTL = i18n.language === 'ar';

    // Filter users based on search query
    const filteredUsers = (users || []).filter(user =>
        !searchQuery ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Step 2 -- Form Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form data
        const validation = validateUserData(formData);
        if (!validation.isValid) {
            // Convert errors array to field-level errors for display
            const fieldErrors = {};
            validation.errors.forEach(err => {
                if (err.includes('\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645')) fieldErrors.username = err;
                else if (err.includes('\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0623\u0648\u0644')) fieldErrors.firstName = err;
                else if (err.includes('\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631')) fieldErrors.password = err;
                else if (err.includes('\u062f\u0648\u0631')) fieldErrors.role = err;
            });
            setFormErrors(fieldErrors);
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            // Call Convex mutation
            await createUser({
                username: formData.username,
                firstName: formData.firstName,
                password: formData.password,
                role: formData.role
            });

            // Success: Reset form and close modal
            setFormData({
                username: '',
                firstName: '',
                password: '',
                role: 'CASHIER'
            });
            setFormErrors({});
            setShowCreateModal(false);

            // No manual reload needed - Convex auto-updates
            console.log(t('users.messages.create_success'));

        } catch (err) {
            console.error('Create user error:', err);
            if (err.message?.includes('already exists') || err.message?.includes('username')) {
                setError(t('users.messages.username_exists'));
            } else {
                setError(err.message || t('users.messages.create_error'));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Step 3 -- Toggle User Status (Active/Inactive)
    const handleToggleUserStatus = async (user) => {
        try {
            setError('');

            await updateUser({
                userId: user._id,
                isActive: !user.isActive
            });

            // No manual reload needed - Convex auto-updates

        } catch (err) {
            console.error('Toggle user status error:', err);
            setError(err.message || t('users.messages.update_error'));
        }
    };

    // Step 3 -- Table Columns Configuration - WITH DARK MODE SUPPORT
    const columns = [
        {
            key: 'username',
            header: t('users.fields.username'),
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium text-sm">
                        {row.firstName?.[0] || ''}{row.lastName?.[0] || row.username?.[0] || ''}
                    </div>
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                        <div className="font-medium text-gray-900 dark:text-white">{row.username}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {row.firstName} {row.lastName || ''}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'firstName',
            header: t('users.fields.first_name'),
            render: (value, row) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {row.firstName} {row.lastName || ''}
                </div>
            )
        },
        {
            key: 'role',
            header: t('users.fields.role'),
            align: 'center',
            render: (value, row) => {
                const roleInfo = getRoleInfo(row.role);
                // Enhanced role badges with dark mode colors
                const getRoleBadgeClasses = (role) => {
                    switch (role) {
                        case 'OWNER':
                            return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-700';
                        case 'ADMIN':
                            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-700';
                        case 'CASHIER':
                            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700';
                        case 'WORKER':
                            return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-700';
                        default:
                            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
                    }
                };

                return (
                    <Badge
                        variant="outline"
                        className={`px-2 py-1 text-xs font-medium border ${getRoleBadgeClasses(row.role)}`}
                    >
                        {roleInfo.name}
                    </Badge>
                );
            }
        },
        {
            key: 'isActive',
            header: t('users.fields.status'),
            align: 'center',
            render: (value, row) => (
                <Badge
                    variant={row.isActive ? 'success' : 'danger'}
                    className={`px-2 py-1 text-xs font-medium border ${
                        row.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700'
                    }`}
                >
                    {row.isActive ? t('status.active') : t('status.inactive')}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: t('actions.actions', '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a'),
            align: 'center',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(row)}
                        className={`flex items-center gap-1 border transition-colors ${
                            row.isActive
                                ? 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-600'
                                : 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/20 dark:hover:border-green-600'
                        }`}
                        title={row.isActive ? t('users.actions.set_inactive') : t('users.actions.set_active')}
                    >
                        {row.isActive ? (
                            <>
                                <FiUserX className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('users.actions.set_inactive')}</span>
                            </>
                        ) : (
                            <>
                                <FiUserCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('users.actions.set_active')}</span>
                            </>
                        )}
                    </Button>
                </div>
            )
        }
    ];

    // Role options for the form
    const roleOptions = [
        { value: 'OWNER', label: t('users.roles.OWNER') + ' - ' + t('users.roles.descriptions.OWNER') },
        { value: 'ADMIN', label: t('users.roles.ADMIN') + ' - ' + t('users.roles.descriptions.ADMIN') },
        { value: 'CASHIER', label: t('users.roles.CASHIER') + ' - ' + t('users.roles.descriptions.CASHIER') },
        { value: 'WORKER', label: t('users.roles.WORKER') + ' - ' + t('users.roles.descriptions.WORKER') }
    ];

    // Show loading while checking authorization
    if (authLoading || !isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">{t('users.messages.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-gray-50 dark:bg-gray-900 " dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Step 4 -- RTL + Arabic-first Page Header */}
            <PageHeader
                title={t('users.title')}
                subtitle={t('users.subtitle')}
                breadcrumbs={[
                    { label: t('navigation.dashboard'), href: '/dashboard' },
                    { label: t('users.title') }
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white border-0"
                    >
                        <FiPlus className="w-4 h-4" />
                        {t('users.add_user')}
                    </Button>
                }
            />

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-red-800 dark:text-red-300 text-sm">{error}</div>
                </div>
            )}

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="relative max-w-md">
                    <FiSearch
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5 ${isRTL ? 'right-3' : 'left-3'}`}
                    />
                    <Input
                        type="text"
                        placeholder={t('users.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400`}
                    />
                </div>
            </div>

            {/* Step 3 -- User List Table */}
            <DataTable
                data={filteredUsers}
                columns={columns}
                loading={loading}
                emptyMessage={t('users.no_users_found')}
                loadingMessage={t('users.messages.loading')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            />

            {/* Step 2 -- Add User Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setFormData({
                        username: '',
                        firstName: '',
                        password: '',
                        role: 'CASHIER'
                    });
                    setFormErrors({});
                    setError('');
                }}
                title={t('users.create_user')}
                size="md"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                <div className="bg-white dark:bg-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('users.fields.username')} *
                            </label>
                            <Input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                error={!!formErrors.username}
                                helperText={formErrors.username}
                                placeholder={t('forms.placeholder', { field: t('users.fields.username') })}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                required
                            />
                        </div>

                        {/* First Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('users.fields.first_name')} *
                            </label>
                            <Input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                error={!!formErrors.firstName}
                                helperText={formErrors.firstName}
                                placeholder={t('forms.placeholder', { field: t('users.fields.first_name') })}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('users.fields.password')} *
                            </label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                error={!!formErrors.password}
                                helperText={formErrors.password}
                                placeholder={t('forms.placeholder', { field: t('users.fields.password') })}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                required
                            />
                        </div>

                        {/* Role Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('users.fields.role')} *
                            </label>
                            <Select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                error={!!formErrors.role}
                                helperText={formErrors.role}
                                options={roleOptions}
                                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                required
                            />
                        </div>

                        {/* Form Actions */}
                        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3 pt-4 border-t border-gray-200 dark:border-gray-600`}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({
                                        username: '',
                                        firstName: '',
                                        password: '',
                                        role: 'CASHIER'
                                    });
                                    setFormErrors({});
                                    setError('');
                                }}
                                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                {t('actions.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white border-0 disabled:opacity-50 dark:disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white dark:border-gray-300"></div>
                                        {t('users.actions.creating')}
                                    </>
                                ) : (
                                    <>
                                        <FiPlus className="w-4 h-4" />
                                        {t('actions.create')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagementPage;
