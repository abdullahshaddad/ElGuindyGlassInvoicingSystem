import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiWifi, FiWifiOff } from 'react-icons/fi';
import {
    Button,
    PageHeader,
} from '@components';
import { ConfirmationDialog } from '@components/ui/ConfirmationDialog';
import PrintOptionsModal from '@components/ui/PrintOptionsModal';
import { invoiceService } from '@services/invoiceService';
import { printJobService } from '@services/printJobService';
import { useSnackbar } from '@contexts/SnackbarContext';
import useAuthorized from '@hooks/useAuthorized';
import { useWebSocket, WEBSOCKET_TOPICS } from '@hooks/useWebSocket';
import { useNavigate } from 'react-router-dom';
import InvoiceList from '@/pages/cashier/components/InvoiceList';

const InvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['CASHIER', 'ADMIN', 'OWNER']);
    const { showSuccess, showError, showInfo } = useSnackbar();
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // WebSocket message handler for real-time updates
    const handleWebSocketMessage = useCallback((topic, data) => {
        console.log('Invoices page WebSocket message:', topic, data);

        if (topic === WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED) {
            showInfo(i18n.language === 'ar'
                ? `فاتورة جديدة #${data.invoiceId}`
                : `New invoice #${data.invoiceId}`
            );
            // Reload invoices to show the new one
            loadInvoices();
        } else if (topic === WEBSOCKET_TOPICS.DASHBOARD_INVOICE_STATUS) {
            showInfo(i18n.language === 'ar'
                ? `تم تحديث الفاتورة #${data.invoiceId}`
                : `Invoice #${data.invoiceId} updated`
            );
            loadInvoices();
        }
    }, [i18n.language]);

    // WebSocket connection
    const { connected: wsConnected } = useWebSocket({
        topics: [
            WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED,
            WEBSOCKET_TOPICS.DASHBOARD_INVOICE_STATUS
        ],
        onMessage: handleWebSocketMessage,
        enabled: isAuthorized
    });

    // Filters match InvoiceList expectations
    const [filters, setFilters] = useState({
        invoiceId: '',
        startDate: '',
        endDate: '',
        customerName: '',
        status: ''
    });

    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [invoiceToPrint, setInvoiceToPrint] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingToFactory, setIsSendingToFactory] = useState(false);

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

    useEffect(() => {
        if (isAuthorized) {
            loadInvoices();
        }
    }, [isAuthorized, pagination.page, filters]);

    const loadInvoices = async () => {
        try {
            setLoading(true);

            // Filter out empty values
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '')
            );

            const params = {
                page: pagination.page,
                size: pagination.size,
                ...activeFilters
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
        navigate(`/invoices/${invoice.id}`);
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
            // createSinglePrintJob opens the PDF directly via blob fetch with auth
            await printJobService.createSinglePrintJob(invoiceToPrint.id, type);
            showSuccess(`تم فتح ${printJobService.getTypeText(type)} للفاتورة ${invoiceToPrint.id}`);
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
                    <div className="flex items-center gap-3">
                        {/* WebSocket Connection Status */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            wsConnected
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                            {wsConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
                            <span className="text-xs font-medium">
                                {wsConnected
                                    ? (i18n.language === 'ar' ? 'مباشر' : 'Live')
                                    : (i18n.language === 'ar' ? 'غير متصل' : 'Offline')
                                }
                            </span>
                        </div>
                        <Button
                            onClick={handleAddInvoice}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
                        >
                            <FiPlus size={20} />
                            <span>{t('invoices.actions.add_invoice', 'إضافة فاتورة')}</span>
                        </Button>
                    </div>
                }
            />

            {/* Invoice List Component - Replaces previous filters/search/table */}
            <InvoiceList
                invoices={invoices}
                loading={loading}
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                onViewInvoice={handleViewDetails}
                onPrintInvoice={handlePrintInvoice}
                onSendToFactory={handleSendToFactory}
                onDeleteInvoice={handleDeleteInvoice}
                filters={filters}
                onFilterChange={handleFilterChange}
                showControls={true}
                isPrinting={isPrinting}
                isSendingToFactory={isSendingToFactory}
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