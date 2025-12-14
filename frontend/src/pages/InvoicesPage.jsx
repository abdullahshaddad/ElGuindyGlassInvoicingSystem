import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiEye, FiDollarSign, FiFilter, FiPackage, FiPrinter, FiTrash2, FiPlus } from 'react-icons/fi';
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
import PrintOptionsModal from '@components/ui/PrintOptionsModal';
import { InvoiceViewModal } from '@components';
import { invoiceService } from '@services/invoiceService';
import { printJobService } from '@services/printJobService';
import { useSnackbar } from '@contexts/SnackbarContext';
import useAuthorized from '@hooks/useAuthorized';
import { useNavigate } from 'react-router-dom';

const InvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'OWNER']);
    const { showSuccess, showError, showInfo } = useSnackbar();
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [invoiceToPrint, setInvoiceToPrint] = useState(null);
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

    const handleViewDetails = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailsModal(true);
    };

    const handlePrintInvoice = (invoice) => {
        if (!invoice || !invoice.id) return;
        setInvoiceToPrint(invoice);
        setIsPrintOptionsOpen(true);
    };

    const handlePrintOption = async (type) => {
        if (!invoiceToPrint) return;

        try {
            setIsPrinting(true);
            const response = await printJobService.createSinglePrintJob(invoiceToPrint.id, type);

            if (response && response.printJob) {
                printJobService.openPdf(response.printJob);
                showSuccess(`تم فتح ${printJobService.getTypeText(type)} للفاتورة ${invoiceToPrint.id}`);
            } else {
                throw new Error("لم يتم استلام ملف الطباعة");
            }
        } catch (err) {
            console.error('Print error:', err);
            showError('فشل في الطباعة');
        } finally {
            setIsPrinting(false);
            setInvoiceToPrint(null);
        }
    };

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

    const handleAddInvoice = () => {
        navigate('/sys-cashier');
    };

    const handleDeleteInvoice = (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: 'حذف الفاتورة',
            message: `هل أنت متأكد من حذف الفاتورة #${invoice.id}؟ سيتم حذف جميع المدفوعات المرتبطة وتحديث رصيد العميل.`,
            type: 'danger',
            confirmText: 'حذف',
            cancelText: 'إلغاء',
            onConfirm: async () => {
                await executeDeleteInvoice(invoice);
            }
        });
    };

    const executeDeleteInvoice = async (invoice) => {
        try {
            await invoiceService.deleteInvoice(invoice.id);
            showSuccess(`تم حذف الفاتورة ${invoice.id} بنجاح`);
            await loadInvoices();
        } catch (err) {
            console.error('Delete invoice error:', err);
            showError('فشل حذف الفاتورة');
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
            header: t('invoices.fields.invoice_number', 'رقم الفاتورة'),
            sortable: true,
            render: (value) => (
                <div className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                    #{value}
                </div>
            )
        },
        {
            key: 'customer',
            header: t('invoices.fields.customer', 'العميل'),
            sortable: true,
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
            header: t('invoices.fields.total_amount', 'المبلغ الإجمالي'),
            sortable: true,
            render: (value) => (
                <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {formatCurrency(value)}
                </div>
            )
        },
        {
            key: 'amountPaidNow',
            header: t('invoices.fields.amount_paid', 'المدفوع'),
            sortable: true,
            render: (value, invoice) => (
                <div className="text-left">
                    <span className="font-mono text-green-600 dark:text-green-400">
                        {formatCurrency(value)}
                    </span>
                    {invoice.remainingBalance > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {t('invoices.fields.remaining', 'متبقي')}: {invoice.remainingBalance?.toFixed(2)}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status',
            header: t('invoices.fields.status', 'الحالة'),
            sortable: true,
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
            header: t('invoices.fields.date', 'التاريخ'),
            sortable: true,
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
            header: t('common.actions.actions', 'الإجراءات'),
            sortable: false,
            render: (_, invoice) => (
                <div className="flex items-center gap-1 justify-end">
                    {/* View Button Removed - Rows are now clickable */}


                    {/* Print Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handlePrintInvoice(invoice); }}
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
                        onClick={(e) => { e.stopPropagation(); handleSendToFactory(invoice); }}
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

                    {/* Delete Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice); }}
                        className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="حذف"
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
        <div className="space-y-6 p-6 dark:bg-gray-900">
            <PageHeader
                title={t('invoices.title', 'إدارة الفواتير')}
                subtitle={t('invoices.subtitle', 'عرض وإدارة فواتير المبيعات')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('invoices.title', 'الفواتير') }
                ]}
                action={
                    <Button
                        onClick={handleAddInvoice}
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
                    >
                        <FiPlus size={20} />
                        <span>{t('invoices.actions.add_invoice', 'إضافة فاتورة')}</span>
                    </Button>
                }
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
                onRowClick={(invoice) => handleViewDetails(invoice)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            />


            {/* Invoice Details Modal */}
            <InvoiceViewModal
                key={selectedInvoice?.id || 'modal'}
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedInvoice(null);
                }}
                invoice={selectedInvoice}
                onPrint={(invoice, type) => {
                    setShowDetailsModal(false);
                    // If type is passed directly (from modal's internal print options)
                    if (type && typeof type === 'string') {
                        // We need to set invoiceToPrint first if we want to use the handlePrintOption logic generically, 
                        // OR just call printJobService directly here.
                        // But for consistency with Page's print logic:
                        setInvoiceToPrint(invoice);
                        handlePrintOption(type);
                    } else {
                        // Open the page's print options
                        handlePrintInvoice(invoice);
                    }
                }}
                onSendToFactory={(invoice) => {
                    setShowDetailsModal(false);
                    handleSendToFactory(invoice);
                }}
                onMarkAsPaid={(invoice) => {
                    setShowDetailsModal(false);
                    handleMarkAsPaid(invoice);
                }}
            />

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
            {/* Print Options Modal */}
            <PrintOptionsModal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                onPrint={handlePrintOption}
            />
        </div>
    );
};

export default InvoicesPage;