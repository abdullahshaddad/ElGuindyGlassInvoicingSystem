import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiPrinter,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiRefreshCw,
    FiAlertCircle,
    FiPackage,
    FiDownload
} from 'react-icons/fi';
import {
    Button,
    DataTable,
    PageHeader,
    Badge,
    Modal
} from '@components';
import { printJobService } from '@services/printJobService';
import { printPDF, fetchAndPrintPDF, downloadPDF } from '@utils/printHelper';
import useAuthorized from '@hooks/useAuthorized';

const FactoryWorkerPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['WORKER', 'OWNER']);

    const [printJobs, setPrintJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [processingJobId, setProcessingJobId] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showFailModal, setShowFailModal] = useState(false);
    const [failReason, setFailReason] = useState('');

    const isRTL = i18n.language === 'ar';

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (isAuthorized) {
            loadPrintQueue();
            const interval = setInterval(loadPrintQueue, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthorized]);

    const loadPrintQueue = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            setError('');

            const jobs = await printJobService.getQueuedJobs();
            setPrintJobs(jobs || []);
        } catch (err) {
            console.error('Load print queue error:', err);
            setError(t('factory.messages.load_error', 'فشل في تحميل قائمة الطباعة'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadPrintQueue(false);
    };

    /**
     * Start printing - Opens printer dialog
     */
    const handleStartPrinting = async (job) => {
        try {
            setProcessingJobId(job.id);
            setError('');

            // First, mark as printing in backend
            await printJobService.markAsPrinting(job.id);

            // Then, attempt to print the PDF
            if (job.pdfPath) {
                try {
                    // Construct full PDF URL
                    const pdfUrl = job.pdfPath.startsWith('http')
                        ? job.pdfPath
                        : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${job.pdfPath}`;

                    // Try to print with authentication
                    await fetchAndPrintPDF(pdfUrl);

                    setSuccess(t('factory.messages.print_started', `بدأت طباعة الملصق #${job.id}`));
                } catch (printError) {
                    console.error('Print error:', printError);

                    // Fallback: offer download
                    if (window.confirm('فشل في فتح الطابعة. هل تريد تنزيل الملف بدلاً من ذلك؟')) {
                        const pdfUrl = job.pdfPath.startsWith('http')
                            ? job.pdfPath
                            : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${job.pdfPath}`;
                        downloadPDF(pdfUrl, `sticker-${job.id}.pdf`);
                    }
                }
            } else {
                setError('مسار ملف PDF غير متوفر');
            }

            await loadPrintQueue(false);
        } catch (err) {
            console.error('Start printing error:', err);
            setError(t('factory.messages.print_start_error', 'فشل في بدء الطباعة'));
        } finally {
            setProcessingJobId(null);
        }
    };

    /**
     * Reprint job - For PRINTING status jobs
     */
    const handleReprint = async (job) => {
        if (!job.pdfPath) {
            setError('مسار ملف PDF غير متوفر');
            return;
        }

        try {
            setProcessingJobId(job.id);

            const pdfUrl = job.pdfPath.startsWith('http')
                ? job.pdfPath
                : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${job.pdfPath}`;

            await fetchAndPrintPDF(pdfUrl);
            setSuccess(`تمت إعادة طباعة الملصق #${job.id}`);
        } catch (error) {
            console.error('Reprint error:', error);
            setError('فشل في إعادة الطباعة');
        } finally {
            setProcessingJobId(null);
        }
    };

    const handleMarkPrinted = async (job) => {
        if (!window.confirm(t('factory.messages.mark_printed_confirm', 'هل تم طباعة الملصق بنجاح؟'))) {
            return;
        }

        try {
            setProcessingJobId(job.id);
            setError('');

            await printJobService.markAsPrinted(job.id);
            setSuccess(t('factory.messages.print_completed', `تمت طباعة الملصق #${job.id} بنجاح`));

            await loadPrintQueue(false);
        } catch (err) {
            console.error('Mark printed error:', err);
            setError(t('factory.messages.print_complete_error', 'فشل في تحديث حالة الطباعة'));
        } finally {
            setProcessingJobId(null);
        }
    };

    const handleOpenFailModal = (job) => {
        setSelectedJob(job);
        setFailReason('');
        setShowFailModal(true);
    };

    const handleMarkFailed = async () => {
        if (!failReason.trim()) {
            setError(t('factory.messages.fail_reason_required', 'يرجى إدخال سبب الفشل'));
            return;
        }

        try {
            setProcessingJobId(selectedJob.id);
            setError('');

            await printJobService.markAsFailed(selectedJob.id, failReason);
            setSuccess(t('factory.messages.print_failed_marked', `تم تسجيل فشل الطباعة للملصق #${selectedJob.id}`));

            setShowFailModal(false);
            setSelectedJob(null);
            setFailReason('');

            await loadPrintQueue(false);
        } catch (err) {
            console.error('Mark failed error:', err);
            setError(t('factory.messages.mark_failed_error', 'فشل في تسجيل الفشل'));
        } finally {
            setProcessingJobId(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            QUEUED: {
                variant: 'warning',
                icon: FiClock,
                label: t('factory.status.queued', 'في الانتظار')
            },
            PRINTING: {
                variant: 'info',
                icon: FiPrinter,
                label: t('factory.status.printing', 'قيد الطباعة')
            },
            PRINTED: {
                variant: 'success',
                icon: FiCheckCircle,
                label: t('factory.status.printed', 'مطبوع')
            },
            FAILED: {
                variant: 'danger',
                icon: FiXCircle,
                label: t('factory.status.failed', 'فشل')
            }
        };

        const config = statusConfig[status] || statusConfig.QUEUED;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <Icon size={14} />
                <span>{config.label}</span>
            </Badge>
        );
    };

    const getTypeBadge = (type) => {
        const typeConfig = {
            CLIENT: { label: t('factory.type.client', 'نسخة العميل'), color: 'blue' },
            OWNER: { label: t('factory.type.owner', 'نسخة المالك'), color: 'purple' },
            STICKER: { label: t('factory.type.sticker', 'ملصق'), color: 'green' }
        };

        const config = typeConfig[type] || typeConfig.STICKER;

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${config.color}-100 dark:bg-${config.color}-900/20 text-${config.color}-800 dark:text-${config.color}-300`}>
                {config.label}
            </span>
        );
    };

    const columns = [
        {
            key: 'id',
            label: t('factory.fields.job_id', 'رقم المهمة'),
            render: (value) => (
                <div className="font-mono font-bold text-primary-600 dark:text-primary-400">
                    #{value}
                </div>
            )
        },
        {
            key: 'invoiceId',
            label: t('factory.fields.invoice', 'الفاتورة'),
            render: (value, job) => (
                <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                        فاتورة #{value}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: t('factory.fields.type', 'النوع'),
            render: (value) => getTypeBadge(value)
        },
        {
            key: 'status',
            label: t('factory.fields.status', 'الحالة'),
            render: (value) => getStatusBadge(value)
        },
        {
            key: 'createdAt',
            label: t('factory.fields.created_at', 'وقت الإنشاء'),
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
            label: t('factory.fields.actions', 'الإجراءات'),
            render: (_, job) => (
                <div className="flex items-center gap-2">
                    {job.status === 'QUEUED' && (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartPrinting(job)}
                            disabled={processingJobId === job.id}
                            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
                            title={t('factory.actions.start_printing', 'بدء الطباعة')}
                        >
                            <FiPrinter size={16} />
                            <span className="hidden sm:inline mr-1">طباعة</span>
                        </Button>
                    )}

                    {job.status === 'PRINTING' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprint(job)}
                                disabled={processingJobId === job.id}
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="إعادة الطباعة"
                            >
                                <FiPrinter size={16} />
                            </Button>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleMarkPrinted(job)}
                                disabled={processingJobId === job.id}
                                className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600"
                                title={t('factory.actions.mark_printed', 'تم الطباعة')}
                            >
                                <FiCheckCircle size={16} />
                                <span className="hidden sm:inline mr-1">تم</span>
                            </Button>

                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenFailModal(job)}
                                disabled={processingJobId === job.id}
                                className="bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600"
                                title={t('factory.actions.mark_failed', 'فشل')}
                            >
                                <FiXCircle size={16} />
                                <span className="hidden sm:inline mr-1">فشل</span>
                            </Button>
                        </>
                    )}

                    {job.pdfPath && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                const pdfUrl = job.pdfPath.startsWith('http')
                                    ? job.pdfPath
                                    : `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${job.pdfPath}`;
                                downloadPDF(pdfUrl, `job-${job.id}.pdf`);
                            }}
                            className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                            title="تنزيل PDF"
                        >
                            <FiDownload size={16} />
                        </Button>
                    )}

                    {job.status === 'FAILED' && job.errorMessage && (
                        <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate">
                            {job.errorMessage}
                        </div>
                    )}
                </div>
            )
        }
    ];

    // Statistics
    const stats = {
        queued: printJobs.filter(j => j.status === 'QUEUED').length,
        printing: printJobs.filter(j => j.status === 'PRINTING').length,
        total: printJobs.length
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
        <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <PageHeader
                title={t('factory.title', 'قائمة الطباعة - المصنع')}
                subtitle={t('factory.subtitle', 'إدارة طباعة الملصقات والفواتير')}
                breadcrumbs={[
                    { label: t('navigation.home', 'الرئيسية'), href: '/' },
                    { label: t('factory.title', 'قائمة الطباعة') }
                ]}
                actions={
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2"
                    >
                        <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
                        <span>{t('common.actions.refresh', 'تحديث')}</span>
                    </Button>
                }
            />

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <FiAlertCircle size={20} />
                    <span className="flex-1">{error}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError('')}
                        className="text-red-600 dark:text-red-400"
                    >
                        <FiXCircle size={16} />
                    </Button>
                </div>
            )}

            {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <FiCheckCircle size={20} />
                    <span className="flex-1">{success}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuccess('')}
                        className="text-green-600 dark:text-green-400"
                    >
                        <FiXCircle size={16} />
                    </Button>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <FiClock className="text-yellow-600 dark:text-yellow-400" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.queued}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t('factory.stats.queued', 'في الانتظار')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <FiPrinter className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.printing}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t('factory.stats.printing', 'قيد الطباعة')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <FiPackage className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {t('factory.stats.total', 'إجمالي المهام')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Queue Table */}
            <DataTable
                data={printJobs}
                columns={columns}
                loading={loading}
                emptyMessage={t('factory.no_jobs', 'لا توجد مهام طباعة في الانتظار')}
                loadingMessage={t('factory.loading', 'جاري تحميل قائمة الطباعة...')}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            />

            {/* Fail Reason Modal */}
            <Modal
                isOpen={showFailModal}
                onClose={() => {
                    setShowFailModal(false);
                    setSelectedJob(null);
                    setFailReason('');
                }}
                title={t('factory.fail_modal.title', 'سبب فشل الطباعة')}
                size="md"
                className="dark:bg-gray-800 dark:border-gray-700"
            >
                <div className="bg-white dark:bg-gray-800 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('factory.fail_modal.reason_label', 'يرجى توضيح سبب فشل الطباعة')}
                        </label>
                        <textarea
                            value={failReason}
                            onChange={(e) => setFailReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                            placeholder={t('factory.fail_modal.reason_placeholder', 'مثال: انتهى الحبر، ورق محشور، خطأ في الطابعة...')}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="danger"
                            onClick={handleMarkFailed}
                            disabled={!failReason.trim() || processingJobId === selectedJob?.id}
                            className="flex-1"
                        >
                            {t('factory.fail_modal.confirm', 'تأكيد الفشل')}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowFailModal(false);
                                setSelectedJob(null);
                                setFailReason('');
                            }}
                            className="flex-1"
                        >
                            {t('common.actions.cancel', 'إلغاء')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FactoryWorkerPage;