import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge
} from '@components';
import { useCustomers, useSearchCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@services/customerService';
import useAuthorized from '@hooks/useAuthorized';

const CUSTOMER_TYPES = {
    CASH: 'CASH',
    REGULAR: 'REGULAR',
    COMPANY: 'COMPANY'
};


const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'ADMIN', 'OWNER']);

    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        customerType: CUSTOMER_TYPES.REGULAR
    });
    const [formErrors, setFormErrors] = useState({});

    const isRTL = i18n.language === 'ar';

    // Convex reactive queries - auto-update in real-time
    const { results: allCustomersRaw, status: paginationStatus, loadMore } = useCustomers({ initialNumItems: 50 });
    const searchResults = useSearchCustomers(searchQuery);

    // Convex mutations
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();
    const deleteCustomerMutation = useDeleteCustomer();

    // Derive loading state
    const loading = paginationStatus === 'LoadingFirstPage';

    // Normalize customers data (ensure numeric balance)
    const allCustomers = useMemo(() => {
        return (allCustomersRaw || []).map(c => ({
            ...c,
            id: c._id || c.id, // Ensure id field is available for compatibility
            balance: typeof c.balance === 'number' ? c.balance : Number(c.balance || 0)
        }));
    }, [allCustomersRaw]);

    // Use search results when searching, otherwise use all customers
    const customers = useMemo(() => {
        const q = (searchQuery || '').trim();
        if (q.length > 0 && searchResults !== undefined) {
            return (searchResults || []).map(c => ({
                ...c,
                id: c._id || c.id,
                balance: typeof c.balance === 'number' ? c.balance : Number(c.balance || 0)
            }));
        }
        return allCustomers;
    }, [searchQuery, searchResults, allCustomers]);

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            errors.name = t('validation.name_required');
        }

        if (!formData.phone || formData.phone.trim().length < 10) {
            errors.phone = t('validation.phone_required');
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t('validation.email_invalid');
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, t]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectCustomerType = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, customerType: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');

            if (editingCustomer) {
                await updateCustomerMutation({
                    customerId: editingCustomer._id || editingCustomer.id,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || undefined,
                    address: formData.address || undefined,
                    notes: formData.notes || undefined,
                    customerType: formData.customerType
                });
            } else {
                await createCustomerMutation({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email || undefined,
                    address: formData.address || undefined,
                    notes: formData.notes || undefined,
                    customerType: formData.customerType
                });
            }

            // No manual refetch needed - Convex auto-updates
            handleCloseModal();
        } catch (err) {
            console.error('Submit error:', err);
            setError(
                editingCustomer
                    ? t('customers.messages.update_error')
                    : t('customers.messages.create_error')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateNew = () => {
        setEditingCustomer(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: '',
            customerType: CUSTOMER_TYPES.REGULAR
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            address: customer.address || '',
            notes: customer.notes || '',
            customerType: customer.customerType || CUSTOMER_TYPES.REGULAR
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t('customers.messages.deleteConfirm'))) {
            return;
        }

        try {
            await deleteCustomerMutation({ customerId: id });
            // No manual refetch needed - Convex auto-updates
        } catch (err) {
            console.error('Delete error:', err);
            setError(t('customers.messages.delete_error'));
        }
    };

    const handleViewDetails = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
        setFormData({
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: '',
            customerType: CUSTOMER_TYPES.REGULAR
        });
        setFormErrors({});
        setError('');
    };

    // Helper functions for rendering & formatting (avoids inline functions)
    const getCustomerTypeLabel = useCallback((type) => {
        return t(`customers.types.${type}`, t('customers.types.REGULAR'));
    }, [t]);

    const getCustomerTypeBadgeVariant = useCallback((type) => {
        switch (type) {
            case CUSTOMER_TYPES.CASH:
                return 'success';
            case CUSTOMER_TYPES.COMPANY:
                return 'info';
            default:
                return 'default';
        }
    }, []);

    const formatBalance = useCallback((customer) => {
        if (!customer) return '-';
        if (customer.customerType === CUSTOMER_TYPES.CASH) return '-';
        const bal = typeof customer.balance === 'number' ? customer.balance : Number(customer.balance || 0);
        const safe = Number.isFinite(bal) ? bal : 0;
        const formatted = safe.toFixed(2);
        return `${formatted} ${t('common.currency')}`;
    }, [t]);

    const balanceColorClass = useCallback((customer) => {
        if (!customer) return '';
        if (customer.customerType === CUSTOMER_TYPES.CASH) return 'text-gray-500';
        const bal = typeof customer.balance === 'number' ? customer.balance : Number(customer.balance || 0);
        if (!Number.isFinite(bal) || bal <= 0) return 'text-green-600';
        return 'text-orange-600';
    }, []);

    // Column renderers (named functions to avoid inline lambdas)
    const renderNameCell = useCallback((customer) => (
        <div className="flex items-center gap-2">
            <span className="font-medium">{customer.name}</span>
            <Badge
                variant={getCustomerTypeBadgeVariant(customer.customerType)}
                className="text-xs"
            >
                {getCustomerTypeLabel(customer.customerType)}
            </Badge>
        </div>
    ), [getCustomerTypeBadgeVariant, getCustomerTypeLabel]);

    const renderPhoneCell = useCallback((customer) => (
        <span className="font-mono" dir="ltr">{customer.phone || '-'}</span>
    ), []);

    const renderBalanceCell = useCallback((customer) => (
        <div className="text-left">
            {customer.customerType === CUSTOMER_TYPES.CASH ? (
                <span className="text-sm text-gray-500">-</span>
            ) : (
                <span className={`font-bold font-mono ${balanceColorClass(customer)}`}>
                    {formatBalance(customer)}
                </span>
            )}
        </div>
    ), [balanceColorClass, formatBalance]);

    const renderEmailCell = useCallback((customer) => (
        <div className="text-gray-600 dark:text-gray-400" dir="ltr">
            {customer.email || '-'}
        </div>
    ), []);

    const renderCreatedAtCell = useCallback((customer) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
            {customer.createdAt || customer._creationTime
                ? new Date(customer.createdAt || customer._creationTime).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')
                : '-'}
        </div>
    ), []);

    const renderActionsCell = useCallback((customer) => (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(customer);
                }}
                className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                title={t('actions.edit')}
            >
                <FiEdit2 size={16} />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(customer._id || customer.id);
                }}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title={t('actions.delete')}
            >
                <FiTrash2 size={16} />
            </Button>
        </div>
    ), [t]);

    const columns = [
        {
            key: 'name',
            header: t('customers.fields.name'),
            render: (_, customer) => renderNameCell(customer)
        },
        {
            key: 'phone',
            header: t('customers.fields.phone'),
            render: (_, customer) => renderPhoneCell(customer)
        },
        {
            key: 'balance',
            header: t('customers.fields.outstandingBalance'),
            render: (_, customer) => renderBalanceCell(customer)
        },
        {
            key: 'email',
            header: t('customers.fields.email'),
            render: (_, customer) => renderEmailCell(customer)
        },
        {
            key: 'createdAt',
            header: t('customers.fields.created_at'),
            render: (_, customer) => renderCreatedAtCell(customer)
        },
        {
            key: 'actions',
            header: t('common.actionsColumn'),
            sortable: false,
            render: (_, customer) => renderActionsCell(customer)
        }
    ];


    if (authLoading) {
        return (
            <div className="flex items-center justify-center   dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400">
                    {t('common.loading')}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen  dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400">
                    {t('common.unauthorized')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6  dark:bg-gray-900 ">
            <PageHeader
                title={t('customers.title')}
                subtitle={t('customers.subtitle')}
                breadcrumbs={[
                    { label: t('navigation.home'), href: '/' },
                    { label: t('customers.title') }
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={handleCreateNew}
                        className="flex items-center gap-2"
                    >
                        <FiPlus size={20} />
                        <span>{t('customers.addCustomer')}</span>
                    </Button>
                }
            />

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="relative">
                    <FiSearch
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${isRTL ? 'right-3' : 'left-3'}`}
                        size={20}
                    />
                    <Input
                        type="text"
                        placeholder={t('customers.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
                    />
                </div>
            </div>

            <DataTable
                data={customers}
                columns={columns}
                loading={loading}
                emptyMessage={t('customers.noCustomers')}
                loadingMessage={t('customers.messages.loading')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                onRowClick={(customer) => navigate(`/customers/${customer._id || customer.id}`)}
            />

            {/* Load More for paginated customers */}
            {paginationStatus === 'CanLoadMore' && !searchQuery && (
                <div className="flex justify-center py-4">
                    <Button
                        variant="outline"
                        onClick={() => loadMore(50)}
                        className="px-8"
                    >
                        {t('common.loadMore')}
                    </Button>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingCustomer ? t('customers.editCustomer') : t('customers.addCustomer')}
                size="md"
                className="dark:bg-gray-800 dark:border-gray-700"
                footer={(
                    <div className="flex gap-3 w-full">
                        <Button
                            form="customer-form"
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting
                                ? t('common.loading')
                                : editingCustomer
                                    ? t('actions.update')
                                    : t('actions.create')
                            }
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {t('actions.cancel')}
                        </Button>
                    </div>
                )}
            >
                <div className="bg-white dark:bg-gray-800">
                    <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.name')} *
                            </label>
                            <Input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                error={!!formErrors.name}
                                className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                required
                            />
                            {formErrors.name && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.phone')} *
                            </label>
                            <Input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                error={!!formErrors.phone}
                                className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                required
                                dir="ltr"
                            />
                            {formErrors.phone && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.email')}
                            </label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                error={!!formErrors.email}
                                className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                dir="ltr"
                            />
                            {formErrors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.address')}
                            </label>
                            <Input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.notes')}
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.type')}
                            </label>
                            <select
                                name="customerType"
                                value={formData.customerType}
                                onChange={handleSelectCustomerType}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white"
                            >
                                <option value={CUSTOMER_TYPES.REGULAR}>{t('customers.types.REGULAR')}</option>
                                <option value={CUSTOMER_TYPES.CASH}>{t('customers.types.CASH')}</option>
                                <option value={CUSTOMER_TYPES.COMPANY}>{t('customers.types.COMPANY')}</option>
                            </select>
                        </div>

                        {/* Note: balance is not editable here to avoid accidental manipulation.
                            If you want a balance-edit feature, create a separate controlled flow. */}
                    </form>
                </div>
            </Modal>

            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={t('customers.customerDetails')}
                size="lg"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                {selectedCustomer && (
                    <div className="bg-white dark:bg-gray-800 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.name')}
                                </label>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedCustomer.name}</p>
                            </div>
                            <div>
                                <Badge variant={getCustomerTypeBadgeVariant(selectedCustomer.customerType)}>
                                    {getCustomerTypeLabel(selectedCustomer.customerType)}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.phone')}
                                </label>
                                <p className="text-gray-900 dark:text-white font-mono" dir="ltr">{selectedCustomer.phone}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.email')}
                                </label>
                                <p className="text-gray-900 dark:text-white" dir="ltr">{selectedCustomer.email || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.created_at')}
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {(selectedCustomer.createdAt || selectedCustomer._creationTime)
                                        ? new Date(selectedCustomer.createdAt || selectedCustomer._creationTime).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.balance')}
                                </label>
                                <p className={`text-lg font-mono ${balanceColorClass(selectedCustomer)}`}>
                                    {selectedCustomer.customerType === CUSTOMER_TYPES.CASH ? '-' : formatBalance(selectedCustomer)}
                                </p>
                            </div>
                        </div>

                        {selectedCustomer.address && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.address')}
                                </label>
                                <p className="text-gray-900 dark:text-white">{selectedCustomer.address}</p>
                            </div>
                        )}

                        {selectedCustomer.notes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.notes')}
                                </label>
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedCustomer.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CustomersPage;
