import React, { useState, useEffect } from 'react';
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

const CustomersPage = () => {
    const { t, i18n } = useTranslation();
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
        notes: ''
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
            setCustomers(data);
        } catch (err) {
            console.error('Load customers error:', err);
            setError(t('customers.messages.load_error', 'فشل تحميل العملاء'));
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
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
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
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

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            address: customer.address || '',
            notes: customer.notes || ''
        });
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

    const handleViewDetails = async (customer) => {
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
            notes: ''
        });
        setFormErrors({});
        setError('');
    };

    const filteredCustomers = customers.filter(customer => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            customer.name?.toLowerCase().includes(query) ||
            customer.phone?.toLowerCase().includes(query) ||
            customer.email?.toLowerCase().includes(query)
        );
    });

    const columns = [
        {
            key: 'name',
            label: t('customers.fields.name', 'الاسم'),
            render: (value, row) => (
                <div className="font-medium text-gray-900 dark:text-white">
                    {value}
                </div>
            )
        },
        {
            key: 'phone',
            label: t('customers.fields.phone', 'رقم الهاتف'),
            render: (value) => (
                <div className="text-gray-700 dark:text-gray-300 font-mono" dir="ltr">
                    {value}
                </div>
            )
        },
        {
            key: 'email',
            label: t('customers.fields.email', 'البريد الإلكتروني'),
            render: (value) => (
                <div className="text-gray-600 dark:text-gray-400" dir="ltr">
                    {value || '-'}
                </div>
            )
        },
        {
            key: 'createdAt',
            label: t('customers.fields.created_at', 'تاريخ الإضافة'),
            render: (value) => (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(value).toLocaleDateString('ar-EG')}
                </div>
            )
        },
        {
            key: 'actions',
            label: t('common.actions.actions', 'الإجراءات'),
            render: (_, customer) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(customer)}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('common.actions.view', 'عرض')}
                    >
                        <FiEye size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(customer)}
                        className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title={t('common.actions.edit', 'تعديل')}
                    >
                        <FiEdit2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title={t('common.actions.delete', 'حذف')}
                    >
                        <FiTrash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400">
                    {t('common.loading', 'جاري التحميل...')}
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400">
                    {t('common.unauthorized', 'غير مصرح لك بالوصول')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 ">
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
                        onClick={() => setShowModal(true)}
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
            />

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingCustomer ? t('customers.edit_customer', 'تعديل العميل') : t('customers.create_customer', 'إضافة عميل جديد')}
                size="md"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                <div className="bg-white dark:bg-gray-800">
                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        <div className="flex gap-3 pt-4">
                            <Button
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('customers.fields.name', 'الاسم')}
                                </label>
                                <p className="text-gray-900 dark:text-white font-medium">{selectedCustomer.name}</p>
                            </div>
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
                                    {new Date(selectedCustomer.createdAt).toLocaleDateString('ar-EG')}
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