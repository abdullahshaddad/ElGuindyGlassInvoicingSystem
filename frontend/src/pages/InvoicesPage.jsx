import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiEye, FiDollarSign, FiCalendar, FiFilter } from 'react-icons/fi';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Select
} from '@components';
import { invoiceService } from '@services/invoiceService';
import useAuthorized from '@hooks/useAuthorized';

const InvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'OWNER']);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        customerName: '',
        status: ''
    });

    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0
    });

    const isRTL = i18n.language === 'ar';

    useEffect(() => {
        if (isAuthorized) {
            loadInvoices();
        }
    }, [isAuthorized, pagination.page, filters]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            setError('');

            const params = {
                page: pagination.page,
                size: pagination.size,
                ...filters
            };

            const response = await invoiceService.listInvoices(params);

            setInvoices(response.content || []);
            setPagination(prev => ({
                ...prev,
                totalElements: response.totalElements || 0,
                totalPages: response.totalPages || 0
            }));
        } catch (err) {
            console.error('Load invoices error:', err);
            setError(t('invoices.messages.load_error', 'فشل تحميل الفواتير'));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleViewDetails = async (invoice) => {
        try {
            const fullInvoice = await invoiceService.getInvoice(invoice.id);
            setSelectedInvoice(fullInvoice);
            setShowDetailsModal(true);
        } catch (err) {
            console.error('Load invoice details error:', err);
            setError(t('invoices.messages.load_details_error', 'فشل تحميل تفاصيل الفاتورة'));
        }
    };

    const handleMarkAsPaid = async (id) => {
        if (!window.confirm(t('invoices.messages.mark_paid_confirm', 'هل أنت متأكد من تحديد هذه الفاتورة كمدفوعة؟'))) {
            return;
        }

        try {
            await invoiceService.markAsPaid(id);
            await loadInvoices();
        } catch (err) {
            console.error('Mark as paid error:', err);
            setError(t('invoices.messages.mark_paid_error', 'فشل تحديث حالة الفاتورة'));
        }
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            customerName: '',
            status: ''
        });
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            invoice.id?.toString().includes(query) ||
            invoice.customer?.name?.toLowerCase().includes(query) ||
            invoice.totalAmount?.toString().includes(query)
        );
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ar-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    };

    const columns = [
        {
            key: 'id',
            label: t('invoices.fields.invoice_number', 'رقم الفاتورة'),
            render: (value) => (
                <div className="font-mono font-medium text-gray-900 dark:text-white">
                    #{value}
                </div>
            )
        },
        {
            key: 'customer',
            label: t('invoices.fields.customer', 'العميل'),
            render: (value) => (
                <div className="text-gray-900 dark:text-white">
                    {value?.name || '-'}
                </div>
            )
        },
        {
            key: 'totalAmount',
            label: t('invoices.fields.total_amount', 'المبلغ الإجمالي'),
            render: (value) => (
                <div className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(value)}
                </div>
            )
        },
        {
            key: 'isPaid',
            label: t('invoices.fields.status', 'الحالة'),
            render: (value) => (
                <Badge
                    variant={value ? 'success' : 'warning'}
                    className="text-xs"
                >
                    {value
                        ? t('invoices.status.paid', 'مدفوعة')
                        : t('invoices.status.pending', 'معلقة')
                    }
                </Badge>
            )
        },
        {
            key: 'createdAt',
            label: t('invoices.fields.date', 'التاريخ'),
            render: (value) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(value).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            )
        },
        {
            key: 'actions',
            label: t('common.actions.actions', 'الإجراءات'),
            render: (_, invoice) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(invoice)}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('common.actions.view', 'عرض')}
                    >
                        <FiEye size={16} />
                    </Button>
                    {!invoice.isPaid && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title={t('invoices.actions.mark_paid', 'تحديد كمدفوعة')}
                        >
                            <FiDollarSign size={16} />
                        </Button>
                    )}
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
        <div className="space-y-6 p-6  dark:bg-gray-900">
            <PageHeader
                title={t('invoices.title', 'إدارة الفواتير')}
                subtitle={t('invoices.subtitle', 'عرض وإدارة فواتير المبيعات')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('invoices.title', 'الفواتير') }
                ]}
            />

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-500 dark:text-gray-400" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('invoices.filters.title', 'فلترة الفواتير')}
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.filters.start_date', 'من تاريخ')}
                        </label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.filters.end_date', 'إلى تاريخ')}
                        </label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.filters.customer_name', 'اسم العميل')}
                        </label>
                        <Input
                            type="text"
                            value={filters.customerName}
                            onChange={(e) => handleFilterChange('customerName', e.target.value)}
                            placeholder={t('invoices.filters.customer_placeholder', 'ابحث باسم العميل')}
                            className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('invoices.filters.status', 'الحالة')}
                        </label>
                        <Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                            options={[
                                { value: '', label: t('invoices.filters.all_statuses', 'جميع الحالات') },
                                { value: 'paid', label: t('invoices.status.paid', 'مدفوعة') },
                                { value: 'pending', label: t('invoices.status.pending', 'معلقة') }
                            ]}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="text-gray-700 dark:text-gray-300"
                    >
                        {t('common.actions.reset', 'إعادة تعيين')}
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="relative">
                    <FiSearch
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${isRTL ? 'right-3' : 'left-3'}`}
                        size={20}
                    />
                    <Input
                        type="text"
                        placeholder={t('invoices.search_placeholder', 'البحث في الفواتير...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${isRTL ? 'pr-10' : 'pl-10'} bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white`}
                    />
                </div>
            </div>

            <DataTable
                data={filteredInvoices}
                columns={columns}
                loading={loading}
                emptyMessage={t('invoices.no_invoices_found', 'لا توجد فواتير')}
                loadingMessage={t('invoices.messages.loading', 'جاري تحميل الفواتير...')}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            />

            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={t('invoices.invoice_details', 'تفاصيل الفاتورة')}
                size="xl"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                {selectedInvoice && (
                    <div className="bg-white dark:bg-gray-800 space-y-6">
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.invoice_number', 'رقم الفاتورة')}
                                </label>
                                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                    #{selectedInvoice.id}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.status', 'الحالة')}
                                </label>
                                <Badge
                                    variant={selectedInvoice.isPaid ? 'success' : 'warning'}
                                    className="text-sm"
                                >
                                    {selectedInvoice.isPaid
                                        ? t('invoices.status.paid', 'مدفوعة')
                                        : t('invoices.status.pending', 'معلقة')
                                    }
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.customer', 'العميل')}
                                </label>
                                <p className="text-gray-900 dark:text-white font-medium">
                                    {selectedInvoice.customer?.name || '-'}
                                </p>
                                {selectedInvoice.customer?.phone && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono" dir="ltr">
                                        {selectedInvoice.customer.phone}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.date', 'التاريخ')}
                                </label>
                                <p className="text-gray-900 dark:text-white">
                                    {new Date(selectedInvoice.createdAt).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                {t('invoices.items', 'العناصر')}
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('invoices.item_fields.glass_type', 'نوع الزجاج')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('invoices.item_fields.dimensions', 'الأبعاد')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('invoices.item_fields.quantity', 'الكمية')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('invoices.item_fields.area', 'المساحة')}
                                        </th>
                                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t('invoices.item_fields.price', 'السعر')}
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {selectedInvoice.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {item.glassType?.name || item.glassType?.nameArabic || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono" dir="ltr">
                                                {item.width} × {item.height} mm
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {item.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                {item.area?.toFixed(2)} m²
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                                                {formatCurrency(item.totalPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {t('invoices.fields.total_amount', 'المبلغ الإجمالي')}
                                </span>
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(selectedInvoice.totalAmount)}
                                </span>
                            </div>
                        </div>

                        {selectedInvoice.notes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.notes', 'ملاحظات')}
                                </label>
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {selectedInvoice.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InvoicesPage;