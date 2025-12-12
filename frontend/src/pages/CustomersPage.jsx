import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { customerService } from '@services/customerService';
import useAuthorized from '@hooks/useAuthorized';

const CUSTOMER_TYPES = {
    CASH: 'CASH',
    REGULAR: 'REGULAR',
    COMPANY: 'COMPANY'
};

const CUSTOMER_TYPE_LABEL = {
    [CUSTOMER_TYPES.CASH]: 'نقدي',
    [CUSTOMER_TYPES.REGULAR]: 'عميل',
    [CUSTOMER_TYPES.COMPANY]: 'شركة'
};

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'OWNER']);

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        if (isAuthorized) {
            loadCustomers();
        }
    }, [isAuthorized]);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await customerService.getAllCustomers();
            // defensive normalization (ensure numeric balance)
            const normalized = (data || []).map(c => ({
                ...c,
                balance: typeof c.balance === 'number' ? c.balance : Number(c.balance || 0)
            }));
            setCustomers(normalized);
        } catch (err) {
            console.error('Load customers error:', err);
            setError(t('customers.messages.load_error', 'فشل تحميل العملاء'));
        } finally {
            setLoading(false);
        }
    };

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            errors.name = t('validation.name_required', 'الاسم مطلوب ويجب أن يكون على الأقل حرفين');
        }

        if (!formData.phone || formData.phone.trim().length < 10) {
            errors.phone = t('validation.phone_required', 'رقم الهاتف مطلوب ويجب أن يكون على الأقل 10 أرقام');
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = t('validation.email_invalid', 'البريد الإلكتروني غير صحيح');
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
                await customerService.updateCustomer(editingCustomer.id, formData);
            } else {
                await customerService.createCustomer(formData);
            }

            await loadCustomers();
            handleCloseModal();
        } catch (err) {
            console.error('Submit error:', err);
            setError(
                editingCustomer
                    ? t('customers.messages.update_error', 'فشل تحديث العميل')
                    : t('customers.messages.create_error', 'فشل إنشاء العميل')
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
            customerType: CUSTOMER_TYPES.REGULAR // default
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
        if (!window.confirm(t('customers.messages.delete_confirm', 'هل أنت متأكد من حذف هذا العميل؟'))) {
            return;
        }

        try {
            setLoading(true);
            await customerService.deleteCustomer(id);
            await loadCustomers();
        } catch (err) {
            console.error('Delete error:', err);
            setError(t('customers.messages.delete_error', 'فشل حذف العميل'));
        } finally {
            setLoading(false);
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
        return CUSTOMER_TYPE_LABEL[type] || CUSTOMER_TYPE_LABEL[CUSTOMER_TYPES.REGULAR];
    }, []);

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
        return `${formatted} جنيه`;
    }, []);

    const balanceColorClass = useCallback((customer) => {
        if (!customer) return '';
        if (customer.customerType === CUSTOMER_TYPES.CASH) return 'text-gray-500';
        const bal = typeof customer.balance === 'number' ? customer.balance : Number(customer.balance || 0);
        if (!Number.isFinite(bal) || bal <= 0) return 'text-green-600';
        return 'text-orange-600';
    }, []);

    // search includes name, phone, email, and customerType label
    const filteredCustomers = useMemo(() => {
        const q = (searchQuery || '').trim().toLowerCase();
        if (!q) return customers;
        return customers.filter(customer => {
            const name = (customer.name || '').toLowerCase();
            const phone = (customer.phone || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();
            const typeLabel = (getCustomerTypeLabel(customer.customerType) || '').toLowerCase();
            return (
                name.includes(q) ||
                phone.includes(q) ||
                email.includes(q) ||
                typeLabel.includes(q)
            );
        });
    }, [customers, searchQuery, getCustomerTypeLabel]);

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
            {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('ar-EG') : '-'}
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
                title={t('common.actions.edit', 'تعديل')}
            >
                <FiEdit2 size={16} />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(customer.id);
                }}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                title={t('common.actions.delete', 'حذف')}
            >
                <FiTrash2 size={16} />
            </Button>
        </div>
    ), [t]);

    const columns = [
        {
            key: 'name',
            header: 'اسم العميل',
            render: (_, customer) => renderNameCell(customer)
        },
        {
            key: 'phone',
            header: 'الهاتف',
            render: (_, customer) => renderPhoneCell(customer)
        },
        {
            key: 'balance',
            header: 'الرصيد المستحق',
            render: (_, customer) => renderBalanceCell(customer)
        },
        {
            key: 'email',
            header: t('customers.fields.email', 'البريد الإلكتروني'),
            render: (_, customer) => renderEmailCell(customer)
        },
        {
            key: 'createdAt',
            header: t('customers.fields.created_at', 'تاريخ الإضافة'),
            render: (_, customer) => renderCreatedAtCell(customer)
        },
        {
            key: 'actions',
            header: t('common.actions.actions', 'الإجراءات'),
            sortable: false,
            render: (_, customer) => renderActionsCell(customer)
        }
    ];


    if (authLoading) {
        return (
            <div className="flex items-center justify-center   dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400">
                    {t('common.loading', 'جاري التحميل...')}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen  dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400">
                    {t('common.unauthorized', 'غير مصرح لك بالوصول')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6  dark:bg-gray-900 ">
            <PageHeader
                title={t('customers.title', 'إدارة العملاء')}
                subtitle={t('customers.subtitle', 'عرض وإدارة بيانات العملاء')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('customers.title', 'العملاء') }
                ]}
                actions={
                    <Button
                        variant="primary"
                        onClick={handleCreateNew}
                        className="flex items-center gap-2"
                    >
                        <FiPlus size={20} />
                        <span>{t('customers.add_customer', 'إضافة عميل')}</span>
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
                        placeholder={t('customers.search_placeholder', 'البحث في العملاء...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
                    />
                </div>
            </div>

            <DataTable
                data={filteredCustomers}
                columns={columns}
                loading={loading}
                emptyMessage={t('customers.no_customers_found', 'لا توجد عملاء')}
                loadingMessage={t('customers.messages.loading', 'جاري تحميل العملاء...')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
            />

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingCustomer ? t('customers.edit_customer', 'تعديل العميل') : t('customers.create_customer', 'إضافة عميل جديد')}
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
                                ? t('common.loading', 'جاري الحفظ...')
                                : editingCustomer
                                    ? t('common.actions.update', 'تحديث')
                                    : t('common.actions.create', 'إنشاء')
                            }
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseModal}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {t('common.actions.cancel', 'إلغاء')}
                        </Button>
                    </div>
                )}
            >
                <div className="bg-white dark:bg-gray-800">
                    <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('customers.fields.name', 'الاسم')} *
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
                                {t('customers.fields.phone', 'رقم الهاتف')} *
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
                                {t('customers.fields.email', 'البريد الإلكتروني')}
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
                                {t('customers.fields.address', 'العنوان')}
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
                                {t('customers.fields.notes', 'ملاحظات')}
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
                                {t('customers.fields.type', 'نوع العميل')}
                            </label>
                            <select
                                name="customerType"
                                value={formData.customerType}
                                onChange={handleSelectCustomerType}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-900 dark:text-white"
                            >
                                <option value={CUSTOMER_TYPES.REGULAR}>{t('customers.type.regular', CUSTOMER_TYPE_LABEL[CUSTOMER_TYPES.REGULAR])}</option>
                                <option value={CUSTOMER_TYPES.CASH}>{t('customers.type.cash', CUSTOMER_TYPE_LABEL[CUSTOMER_TYPES.CASH])}</option>
                                <option value={CUSTOMER_TYPES.COMPANY}>{t('customers.type.company', CUSTOMER_TYPE_LABEL[CUSTOMER_TYPES.COMPANY])}</option>
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
                title={t('customers.customer_details', 'تفاصيل العميل')}
                size="lg"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                {selectedCustomer && (
                    <div className="bg-white dark:bg-gray-800 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.name', 'الاسم')}
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
                                    {t('customers.fields.phone', 'رقم الهاتف')}
                                </label>
                                <p className="text-gray-900 dark:text-white font-mono" dir="ltr">{selectedCustomer.phone}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.email', 'البريد الإلكتروني')}
                                </label>
                                <p className="text-gray-900 dark:text-white" dir="ltr">{selectedCustomer.email || '-'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.created_at', 'تاريخ الإضافة')}
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {selectedCustomer.createdAt ? new Date(selectedCustomer.createdAt).toLocaleDateString('ar-EG') : '-'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.balance', 'الرصيد الحالي')}
                                </label>
                                <p className={`text-lg font-mono ${balanceColorClass(selectedCustomer)}`}>
                                    {selectedCustomer.customerType === CUSTOMER_TYPES.CASH ? '-' : formatBalance(selectedCustomer)}
                                </p>
                            </div>
                        </div>

                        {selectedCustomer.address && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.address', 'العنوان')}
                                </label>
                                <p className="text-gray-900 dark:text-white">{selectedCustomer.address}</p>
                            </div>
                        )}

                        {selectedCustomer.notes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.notes', 'ملاحظات')}
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
