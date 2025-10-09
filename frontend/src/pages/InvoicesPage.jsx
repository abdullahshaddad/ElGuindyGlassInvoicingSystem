import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiEye, FiDollarSign, FiFilter, FiPackage, FiPrinter } from 'react-icons/fi';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Select
} from '@components';
import { ConfirmationDialog } from '@components/ui/ConfirmationDialog';
import { invoiceService } from '@services/invoiceService';
import { printJobService } from '@services/printJobService';
import { useSnackbar } from '@contexts/SnackbarContext';
import useAuthorized from '@hooks/useAuthorized';

const InvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'OWNER']);
    const { showSuccess, showError, showInfo } = useSnackbar();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingToFactory, setIsSendingToFactory] = useState(false);

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

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
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
            showError(t('invoices.messages.load_error', 'فشل تحميل الفواتير'));
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
            showError(t('invoices.messages.load_details_error', 'فشل تحميل تفاصيل الفاتورة'));
        }
    };

    const handlePrintInvoice = async (invoice) => {
        if (!invoice || !invoice.id) {
            showError('معلومات الفاتورة غير صحيحة');
            return;
        }

        try {
            setIsPrinting(true);
            setPrintStatus('جاري التحقق من مهام الطباعة...');

            // Get current print job status
            const status = await printJobService.getPrintJobStatus(invoice.id);
            console.log('Print job status:', status);

            const needsClient = status.missingJobTypes?.includes('CLIENT');
            const needsOwner = status.missingJobTypes?.includes('OWNER');
            const existingJobs = status.jobs || [];

            console.log('Missing job types:', status.missingJobTypes);
            console.log('Existing jobs:', existingJobs);
            console.log('Needs CLIENT:', needsClient);
            console.log('Needs OWNER:', needsOwner);

            let clientOpened = false;
            let ownerOpened = false;

            // Create CLIENT if missing
            if (needsClient) {
                setPrintStatus('جاري إنشاء نسخة العميل...');
                try {
                    const clientResult = await printJobService.createSinglePrintJob(invoice.id, 'CLIENT');
                    console.log('CLIENT creation result:', clientResult);

                    if (clientResult.success && clientResult.printJob?.pdfPath) {
                        const pdfUrl = printJobService.getPdfUrl(clientResult.printJob);
                        console.log('Opening CLIENT PDF:', pdfUrl);
                        window.open(pdfUrl, '_blank');
                        clientOpened = true;
                    }
                } catch (err) {
                    console.error('Failed to create CLIENT print job:', err);
                    showWarning('فشل في إنشاء نسخة العميل');
                }
            } else {
                // CLIENT exists, just open it
                const clientJob = existingJobs.find(job => job.type === 'CLIENT');
                console.log('Found existing CLIENT job:', clientJob);

                if (clientJob?.pdfPath) {
                    const pdfUrl = printJobService.getPdfUrl(clientJob);
                    console.log('Opening existing CLIENT PDF:', pdfUrl);
                    window.open(pdfUrl, '_blank');
                    clientOpened = true;
                } else {
                    console.warn('CLIENT job exists but has no pdfPath');
                }
            }

            // Create OWNER if missing
            if (needsOwner) {
                setPrintStatus('جاري إنشاء نسخة المالك...');
                try {
                    const ownerResult = await printJobService.createSinglePrintJob(invoice.id, 'OWNER');
                    console.log('OWNER creation result:', ownerResult);

                    if (ownerResult.success && ownerResult.printJob?.pdfPath) {
                        const pdfUrl = printJobService.getPdfUrl(ownerResult.printJob);
                        console.log('Opening OWNER PDF:', pdfUrl);
                        window.open(pdfUrl, '_blank');
                        ownerOpened = true;
                    }
                } catch (err) {
                    console.error('Failed to create OWNER print job:', err);
                    showWarning('فشل في إنشاء نسخة المالك');
                }
            } else {
                // OWNER exists, just open it
                const ownerJob = existingJobs.find(job => job.type === 'OWNER');
                console.log('Found existing OWNER job:', ownerJob);

                if (ownerJob?.pdfPath) {
                    const pdfUrl = printJobService.getPdfUrl(ownerJob);
                    console.log('Opening existing OWNER PDF:', pdfUrl);
                    window.open(pdfUrl, '_blank');
                    ownerOpened = true;
                } else {
                    console.warn('OWNER job exists but has no pdfPath');
                }
            }

            // Show appropriate success message
            if (clientOpened && ownerOpened) {
                showSuccess('تم فتح ملفات PDF للطباعة (العميل + المالك)');
            } else if (clientOpened) {
                showSuccess('تم فتح نسخة العميل للطباعة');
            } else if (ownerOpened) {
                showSuccess('تم فتح نسخة المالك للطباعة');
            } else {
                showWarning('لم يتم العثور على ملفات PDF للطباعة');
            }

            setPrintStatus(null);

        } catch (err) {
            console.error('Print invoice error:', err);
            showError('فشل في طباعة الفاتورة');
            setPrintStatus(null);
        } finally {
            setIsPrinting(false);
        }
    };

// Alternative simpler version if you always want to create fresh print jobs
    const handlePrintInvoiceSimple = async (invoice) => {
        if (!invoice || !invoice.id) {
            showError('معلومات الفاتورة غير صحيحة');
            return;
        }

        try {
            setIsPrinting(true);
            setPrintStatus('جاري إنشاء ملفات الطباعة...');

            // Always create fresh CLIENT print job
            const clientResult = await printJobService.createSinglePrintJob(invoice.id, 'CLIENT');
            console.log('CLIENT result:', clientResult);

            // Always create fresh OWNER print job
            const ownerResult = await printJobService.createSinglePrintJob(invoice.id, 'OWNER');
            console.log('OWNER result:', ownerResult);

            // Open both PDFs
            if (clientResult.success && clientResult.printJob?.pdfPath) {
                const clientUrl = printJobService.getPdfUrl(clientResult.printJob);
                console.log('Opening CLIENT:', clientUrl);
                window.open(clientUrl, '_blank');
            }

            if (ownerResult.success && ownerResult.printJob?.pdfPath) {
                const ownerUrl = printJobService.getPdfUrl(ownerResult.printJob);
                console.log('Opening OWNER:', ownerUrl);
                window.open(ownerUrl, '_blank');
            }

            showSuccess('تم فتح ملفات PDF للطباعة');
            setPrintStatus(null);

        } catch (err) {
            console.error('Print invoice error:', err);
            showError('فشل في طباعة الفاتورة');
            setPrintStatus(null);
        } finally {
            setIsPrinting(false);
        }
    };

// If you need to check what getPdfUrl returns
    console.log('Testing getPdfUrl function:');
    const testJob = { pdfPath: '/api/pdfs/test.pdf' };
    console.log('getPdfUrl result:', printJobService.getPdfUrl(testJob));
    const handleSendToFactory = async (invoice) => {
        if (!invoice || !invoice.id) {
            showError('معلومات الفاتورة غير صحيحة');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'إرسال للمصنع',
            message: `هل تريد إرسال ملصق الفاتورة #${invoice.id} للمصنع؟`,
            type: 'info',
            onConfirm: async () => {
                await executeSendToFactory(invoice);
            }
        });
    };

    const executeSendToFactory = async (invoice) => {
        try {
            setIsSendingToFactory(true);

            const status = await printJobService.getPrintJobStatus(invoice.id);
            const needsSticker = status.missingJobTypes?.includes('STICKER');

            if (needsSticker) {
                const stickerResult = await printJobService.createSinglePrintJob(invoice.id, 'STICKER');
                if (stickerResult.success) {
                    showSuccess(`تم إرسال ملصق الفاتورة #${invoice.id} للمصنع`);
                }
            } else {
                showInfo('الملصق موجود بالفعل في قائمة المصنع');
            }

        } catch (err) {
            console.error('Send to factory error:', err);
            showError('فشل في إرسال الملصق للمصنع');
        } finally {
            setIsSendingToFactory(false);
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: 'تسديد الفاتورة',
            message: `هل تريد تسديد الفاتورة #${invoice.id}؟`,
            type: 'warning',
            confirmText: 'تسديد',
            cancelText: 'إلغاء',
            onConfirm: async () => {
                await executeMarkAsPaid(invoice);
            }
        });
    };

    const executeMarkAsPaid = async (invoice) => {
        try {
            await invoiceService.markAsPaid(invoice.id);
            showSuccess(`تم تسديد الفاتورة ${invoice.id} بنجاح`);
            await loadInvoices();
        } catch (err) {
            console.error('Mark as paid error:', err);
            showError(t('invoices.messages.mark_paid_error', 'فشل تحديث حالة الفاتورة'));
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
            invoice.totalPrice?.toString().includes(query)
        );
    });

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    const columns = [
        {
            key: 'id',
            label: t('invoices.fields.invoice_number', 'رقم الفاتورة'),
            render: (value) => (
                <div className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                    #{value}
                </div>
            )
        },
        {
            key: 'customer',
            label: t('invoices.fields.customer', 'العميل'),
            render: (value) => (
                <div>
                    <div className="text-gray-900 dark:text-white font-medium">
                        {value?.name || '-'}
                    </div>
                    {value?.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {value.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'totalPrice',
            label: t('invoices.fields.total_amount', 'المبلغ الإجمالي'),
            render: (value) => (
                <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {formatCurrency(value)}
                </div>
            )
        },
        {
            key: 'status',
            label: t('invoices.fields.status', 'الحالة'),
            render: (value) => (
                <Badge
                    variant={value === 'PAID' ? 'success' : value === 'CANCELLED' ? 'danger' : 'warning'}
                    className="text-xs"
                >
                    {value === 'PAID'
                        ? t('invoices.status.paid', 'مدفوعة')
                        : value === 'CANCELLED'
                            ? t('invoices.status.cancelled', 'ملغاة')
                            : t('invoices.status.pending', 'قيد الانتظار')
                    }
                </Badge>
            )
        },
        {
            key: 'issueDate',
            label: t('invoices.fields.date', 'التاريخ'),
            render: (value) => (
                <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">
                        {new Date(value).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {new Date(value).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            )
        },
        {
            key: 'actions',
            label: t('common.actions.actions', 'الإجراءات'),
            render: (_, invoice) => (
                <div className="flex items-center gap-1 justify-end">
                    {/* View Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(invoice)}
                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title={t('common.actions.view', 'عرض')}
                    >
                        <FiEye size={16} />
                    </Button>

                    {/* Print Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePrintInvoice(invoice)}
                        disabled={isPrinting}
                        className="text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="طباعة"
                    >
                        {isPrinting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 dark:border-purple-400"></div>
                        ) : (
                            <FiPrinter size={16} />
                        )}
                    </Button>

                    {/* Send to Factory Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendToFactory(invoice)}
                        disabled={isSendingToFactory}
                        className="text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="إرسال للمصنع"
                    >
                        {isSendingToFactory ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-400"></div>
                        ) : (
                            <FiPackage size={16} />
                        )}
                    </Button>

                    {/* Mark as Paid Button */}
                    {invoice.status === 'PENDING' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice)}
                            className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            title={t('invoices.actions.mark_paid', 'تسديد')}
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
        <div className="space-y-6 p-6 dark:bg-gray-900">
            <PageHeader
                title={t('invoices.title', 'إدارة الفواتير')}
                subtitle={t('invoices.subtitle', 'عرض وإدارة فواتير المبيعات')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('invoices.title', 'الفواتير') }
                ]}
            />

            {/* Filters Section */}
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
                                { value: 'PAID', label: t('invoices.status.paid', 'مدفوعة') },
                                { value: 'PENDING', label: t('invoices.status.pending', 'قيد الانتظار') },
                                { value: 'CANCELLED', label: t('invoices.status.cancelled', 'ملغاة') }
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

            {/* Search Section */}
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

            {/* Data Table */}
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

            {/* Invoice Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => setShowDetailsModal(false)}
                title={t('invoices.invoice_details', 'تفاصيل الفاتورة')}
                size="xl"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                {selectedInvoice && (
                    <div className="bg-white dark:bg-gray-800 space-y-6" dir="rtl">
                        {/* Invoice Header */}
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.invoice_number', 'رقم الفاتورة')}
                                </label>
                                <p className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                                    #{selectedInvoice.id}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    {t('invoices.fields.status', 'الحالة')}
                                </label>
                                <Badge
                                    variant={selectedInvoice.status === 'PAID' ? 'success' : selectedInvoice.status === 'CANCELLED' ? 'danger' : 'warning'}
                                    className="text-sm"
                                >
                                    {selectedInvoice.status === 'PAID'
                                        ? t('invoices.status.paid', 'مدفوعة')
                                        : selectedInvoice.status === 'CANCELLED'
                                            ? t('invoices.status.cancelled', 'ملغاة')
                                            : t('invoices.status.pending', 'قيد الانتظار')
                                    }
                                </Badge>
                            </div>
                        </div>

                        {/* Customer & Date Info */}
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
                                    {new Date(selectedInvoice.issueDate).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        {/* Invoice Lines */}
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                {t('invoices.items', 'بنود الفاتورة')} ({selectedInvoice.invoiceLines?.length || 0})
                            </h4>
                            <div className="space-y-3">
                                {selectedInvoice.invoiceLines && selectedInvoice.invoiceLines.length > 0 ? (
                                    selectedInvoice.invoiceLines.map((line, index) => (
                                        <div key={line.id || index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-medium text-gray-900 dark:text-white">
                                                        {line.glassType?.name || 'نوع غير محدد'}
                                                    </h5>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        <span>{line.width?.toFixed(2)} × {line.height?.toFixed(2)} متر</span>
                                                        {line.glassType?.thickness && <span> • {line.glassType.thickness} مم</span>}
                                                        <span> • {line.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(line.lineTotal)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">المساحة: </span>
                                                    <span className="text-gray-900 dark:text-white font-mono">{line.areaM2?.toFixed(3)} م²</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">سعر الزجاج: </span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                                                        {formatCurrency((line.lineTotal || 0) - (line.cuttingPrice || 0))}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 dark:text-gray-400">سعر القطع: </span>
                                                    <span className="text-orange-600 dark:text-orange-400 font-mono">
                                                        {formatCurrency(line.cuttingPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        لا توجد بنود في الفاتورة
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {t('invoices.fields.total_amount', 'المبلغ الإجمالي')}
                                </span>
                                <span className="text-3xl font-bold text-green-700 dark:text-green-400">
                                    {formatCurrency(selectedInvoice.totalPrice)}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
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

                        {/* Action Buttons in Modal */}
                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                onClick={() => {
                                    handlePrintInvoice(selectedInvoice);
                                    setShowDetailsModal(false);
                                }}
                                disabled={isPrinting}
                                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
                            >
                                <FiPrinter className="ml-2" />
                                طباعة الفاتورة
                            </Button>

                            <Button
                                onClick={() => {
                                    handleSendToFactory(selectedInvoice);
                                    setShowDetailsModal(false);
                                }}
                                disabled={isSendingToFactory}
                                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white"
                            >
                                <FiPackage className="ml-2" />
                                إرسال للمصنع
                            </Button>

                            {selectedInvoice.status === 'PENDING' && (
                                <Button
                                    onClick={() => {
                                        handleMarkAsPaid(selectedInvoice);
                                        setShowDetailsModal(false);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                                >
                                    <FiDollarSign className="ml-2" />
                                    تسديد الفاتورة
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => setShowDetailsModal(false)}
                                className="mr-auto"
                            >
                                إغلاق
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText={confirmDialog.cancelText}
                type={confirmDialog.type}
            />
        </div>
    );
};

export default InvoicesPage;