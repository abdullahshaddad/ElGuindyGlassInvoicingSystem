import React from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import { Modal, Button } from '@/components';

const PrintJobStatusModal = ({ isOpen, onClose, printJobStatus, onRetry, isRetrying }) => {
    if (!printJobStatus) return null;

    const getStatusIcon = (status) => {
        const icons = {
            QUEUED: <FiClock className="text-blue-500" size={20} />,
            PRINTING: <FiClock className="text-blue-500 animate-pulse" size={20} />,
            PRINTED: <FiCheckCircle className="text-green-500" size={20} />,
            FAILED: <FiXCircle className="text-red-500" size={20} />
        };
        return icons[status] || <FiClock className="text-gray-400" size={20} />;
    };

    const getTypeName = (type) => {
        const names = {
            CLIENT: 'نسخة العميل',
            OWNER: 'نسخة المالك',
            STICKER: 'ملصق المصنع'
        };
        return names[type] || type;
    };

    const getStatusName = (status) => {
        const names = {
            QUEUED: 'في الانتظار',
            PRINTING: 'قيد الطباعة',
            PRINTED: 'تمت الطباعة',
            FAILED: 'فشل'
        };
        return names[status] || status;
    };

    const getStatusBadgeClass = (status) => {
        const classes = {
            QUEUED: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
            PRINTING: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
            PRINTED: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
            FAILED: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
        };
        return classes[status] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
    };

    const hasFailedJobs = printJobStatus.failedJobs > 0;
    const allJobsSuccess = printJobStatus.allJobsComplete && !hasFailedJobs;
    const partialSuccess = printJobStatus.successfulJobs > 0 && printJobStatus.successfulJobs < printJobStatus.totalJobs;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="حالة مهام الطباعة"
            size="md"
        >
            <div className="space-y-4" dir="rtl">
                {/* ملخص الحالة */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                الفاتورة رقم
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                #{printJobStatus.invoiceId}
                            </p>
                        </div>
                        <div className="text-left">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                مهام الطباعة
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {printJobStatus.successfulJobs} / {printJobStatus.totalJobs}
                            </p>
                        </div>
                    </div>
                </div>

                {/* قائمة مهام الطباعة */}
                <div className="space-y-3">
                    {printJobStatus.jobs && printJobStatus.jobs.length > 0 ? (
                        printJobStatus.jobs.map((job) => (
                            <div
                                key={job.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="mt-1">
                                            {getStatusIcon(job.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {getTypeName(job.type)}
                                                </p>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(job.status)}`}>
                                                    {getStatusName(job.status)}
                                                </span>
                                            </div>
                                            {job.createdAt && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    تم الإنشاء: {new Date(job.createdAt).toLocaleString('ar-EG')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {job.status === 'FAILED' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onRetry(job.type)}
                                            disabled={isRetrying}
                                            className="flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <FiRefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                                            إعادة المحاولة
                                        </Button>
                                    )}
                                </div>

                                {job.errorMessage && (
                                    <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded p-3">
                                        <p className="text-sm text-red-800 dark:text-red-300">
                                            {job.errorMessage}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-center">
                            <FiAlertTriangle className="mx-auto mb-2 text-yellow-600 dark:text-yellow-400" size={24} />
                            <p className="text-yellow-800 dark:text-yellow-300">
                                لم يتم العثور على مهام طباعة لهذه الفاتورة
                            </p>
                        </div>
                    )}
                </div>

                {/* رسالة النجاح الكامل */}
                {allJobsSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 text-green-800 dark:text-green-300">
                            <FiCheckCircle size={24} />
                            <div>
                                <p className="font-semibold">
                                    تم إنشاء جميع مهام الطباعة بنجاح
                                </p>
                                <p className="text-sm mt-1">
                                    جميع النسخ جاهزة للطباعة في قائمة انتظار المصنع
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* رسالة النجاح الجزئي */}
                {partialSuccess && !allJobsSuccess && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-300">
                            <FiAlertTriangle size={24} />
                            <div>
                                <p className="font-semibold">
                                    تم إنشاء بعض مهام الطباعة فقط
                                </p>
                                <p className="text-sm mt-1">
                                    يمكنك إعادة المحاولة للمهام الفاشلة أو طباعة الفاتورة لاحقاً
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* رسالة الفشل الكامل */}
                {printJobStatus.successfulJobs === 0 && printJobStatus.jobs && printJobStatus.jobs.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                        <div className="flex items-center gap-3 text-red-800 dark:text-red-300">
                            <FiXCircle size={24} />
                            <div>
                                <p className="font-semibold">
                                    فشل في إنشاء جميع مهام الطباعة
                                </p>
                                <p className="text-sm mt-1">
                                    الفاتورة محفوظة ويمكنك إعادة محاولة الطباعة أو طباعتها لاحقاً من قائمة الفواتير
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* أزرار الإجراءات */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        variant="primary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        إغلاق
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PrintJobStatusModal;