import React, { useState, useEffect } from 'react';
import { FiUser, FiPackage, FiPrinter, FiDollarSign, FiSend } from 'react-icons/fi';
import Button from '@components/ui/Button';
import Modal from '@components/ui/Modal';
import LoadingSpinner from '@components/ui/LoadingSpinner';
import { SHATAF_TYPES } from '@/constants/shatafTypes';
import PaymentModal from '@components/ui/PaymentModal';
import { invoiceService } from '@services/invoiceService';
import PrintOptionsModal from '@components/ui/PrintOptionsModal';

const InvoiceViewModal = ({
    isOpen,
    onClose,
    invoice: initialInvoice,
    glassTypes,
    onPrint,
    onSendToFactory,
    onMarkAsPaid
}) => {
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);
    const [invoice, setInvoice] = useState(initialInvoice);
    // Initialize loading to true if we don't have detailed lines yet
    const [loading, setLoading] = useState(
        !initialInvoice?.invoiceLines || initialInvoice.invoiceLines.length === 0
    );

    useEffect(() => {
        // Reset state when modal opens or invoice changes
        if (isOpen && initialInvoice?.id) {
            console.log('InvoiceViewModal opened/changed:', { id: initialInvoice.id, hasLines: initialInvoice.invoiceLines?.length });

            // Set initial partial data
            setInvoice(initialInvoice);

            // Determine if we need to fetch full data
            // ALWAYS fetch for now to ensure data integrity
            const shouldFetch = true;

            setLoading(shouldFetch);

            if (shouldFetch) {
                const fetchDetails = async () => {
                    try {
                        let fullInvoice = await invoiceService.getInvoice(initialInvoice.id);
                        console.log('Fetched invoice data type:', typeof fullInvoice);

                        // Handle potential double-serialization (stringified JSON)
                        if (typeof fullInvoice === 'string') {
                            console.warn('Received stringified JSON, parsing...');
                            try {
                                fullInvoice = JSON.parse(fullInvoice);
                            } catch (e) {
                                console.error('Failed to parse invoice string:', e);
                            }
                        }

                        console.log('Final invoice object:', fullInvoice);
                        setInvoice(fullInvoice);
                    } catch (error) {
                        console.error("Failed to fetch invoice details:", error);
                        // Keep using initialInvoice (better than nothing)
                    } finally {
                        setLoading(false);
                    }
                };
                fetchDetails();
            }
        }
    }, [isOpen, initialInvoice?.id]); // Depend on ID specifically to trigger updates

    if (!isOpen) return null; // Ensure we don't render if not open

    // Safety check: if we are loading, show spinner. If not loading but no invoice, show nothing.
    if (!invoice && !loading) return null;

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    // Calculate glass price from backend data: lineTotal - cuttingPrice
    const getGlassPrice = (line) => {
        return (line.lineTotal || 0) - (line.cuttingPrice || 0);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={loading ? 'جاري التحميل...' : `تفاصيل الفاتورة #${invoice?.id}`}
                size="lg"
                footer={invoice && (
                    <div className="flex justify-end gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            إغلاق
                        </Button>
                        <Button
                            variant="primary"
                            icon={FiPrinter}
                            onClick={() => setIsPrintOptionsOpen(true)}
                        >
                            طباعة
                        </Button>
                        <Button
                            onClick={() => {
                                onSendToFactory(invoice);
                                onClose();
                            }}
                            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white"
                        >
                            <FiSend className="ml-2" />
                            إرسال للمصنع
                        </Button>

                        {/* Partial Payment Button */}
                        {invoice.status !== 'PAID' && invoice.remainingBalance > 0 &&
                            ['REGULAR', 'COMPANY'].includes(invoice.customer?.customerType) && (
                                <Button
                                    variant="success"
                                    icon={FiDollarSign}
                                    onClick={() => setIsPaymentModalOpen(true)}
                                >
                                    تسجيل دفعة
                                </Button>
                            )}
                    </div>
                )}
            >
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-6" dir="rtl">
                        {/* Invoice Header */}
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">رقم الفاتورة:</span>
                                    <div className="font-bold text-lg text-primary-600 dark:text-primary-400">#{invoice.id}</div>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">التاريخ:</span>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {new Date(invoice.issueDate).toLocaleDateString('ar-EG')}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">الحالة:</span>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'PAID'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                            : invoice.status === 'CANCELLED'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                            }`}>
                                            {invoice.status === 'PAID' ? 'مدفوعة' :
                                                invoice.status === 'CANCELLED' ? 'ملغاة' : 'قيد الانتظار'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <FiUser className="text-blue-600 dark:text-blue-400" />
                                بيانات العميل
                            </h3>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-blue-600 dark:text-blue-400">الاسم:</span>
                                        <div className="font-medium text-blue-900 dark:text-blue-200">
                                            {invoice.customer?.name || 'غير محدد'}
                                        </div>
                                    </div>
                                    {invoice.customer?.phone && (
                                        <div>
                                            <span className="text-sm text-blue-600 dark:text-blue-400">الهاتف:</span>
                                            <div className="font-medium text-blue-900 dark:text-blue-200 font-mono">
                                                {invoice.customer.phone}
                                            </div>
                                        </div>
                                    )}
                                    {invoice.customer?.address && (
                                        <div className="md:col-span-2">
                                            <span className="text-sm text-blue-600 dark:text-blue-400">العنوان:</span>
                                            <div className="font-medium text-blue-900 dark:text-blue-200">
                                                {invoice.customer.address}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Invoice Lines */}
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <FiPackage className="text-green-600 dark:text-green-400" />
                                تفاصيل المنتجات ({invoice.invoiceLines?.length || 0} بند)
                            </h3>
                            <div className="space-y-3">
                                {invoice.invoiceLines && invoice.invoiceLines.length > 0 ? (
                                    invoice.invoiceLines.map((line, index) => (
                                        <div key={line.id || index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                            {/* Line Header */}
                                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-600 flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                                        {line.glassType?.name || 'نوع غير محدد'}
                                                    </h4>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-2">
                                                        <span>{line.width?.toFixed(1)} × {line.height?.toFixed(1)} {line.dimensionUnit === 'MM' ? 'مم' : line.dimensionUnit === 'M' ? 'م' : 'سم'}</span>
                                                        {line.glassType?.thickness && (
                                                            <span>• {line.glassType.thickness} مم</span>
                                                        )}
                                                        {line.quantity && line.quantity > 1 && (
                                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                                                                × {line.quantity} قطعة
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Operations Chips - Only SHATF (Chamfer) and LASER */}
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {line.operations && line.operations.length > 0 ? (
                                                            line.operations.map((op, i) => {
                                                                const opType = op.operationType || op.type;
                                                                let displayName = '';
                                                                if (opType === 'SHATAF' || opType === 'SHATF') {
                                                                    displayName = op.shatafType
                                                                        ? (SHATAF_TYPES[op.shatafType]?.arabicName || op.shatafType)
                                                                        : 'شطف';
                                                                } else if (opType === 'LASER') {
                                                                    displayName = op.laserType || 'ليزر';
                                                                } else {
                                                                    displayName = op.description || opType || 'عملية';
                                                                }
                                                                return (
                                                                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                                        {displayName}
                                                                        {(op.operationPrice || op.manualPrice) > 0 && ` (${formatCurrency(op.operationPrice || op.manualPrice)})`}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            /* Legacy Fallback */
                                                            <>
                                                                {line.shatafType && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        {SHATAF_TYPES[line.shatafType]?.arabicName || line.shatafType}
                                                                    </span>
                                                                )}
                                                                {line.cuttingType === 'LASER' && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                        ليزر
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي البند</div>
                                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {formatCurrency(line.lineTotal)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Line Details */}
                                            <div className="p-4 space-y-2 text-sm bg-gray-50/50 dark:bg-gray-800/50">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>المساحة:</span>
                                                            <span className="font-mono">{line.areaM2?.toFixed(3)} م²</span>
                                                        </div>
                                                        {line.quantity && line.quantity > 1 && (
                                                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                                <span>الكمية:</span>
                                                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{line.quantity} قطعة</span>
                                                            </div>
                                                        )}
                                                        {line.shatafMeters > 0 && (
                                                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                                <span>أمتار الشطف:</span>
                                                                <span className="font-mono">{line.shatafMeters?.toFixed(2)} م</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>سعر الزجاج:</span>
                                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                                                {formatCurrency(getGlassPrice(line))}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                            <span>إجمالي العمليات:</span>
                                                            <span className="font-mono text-orange-600 dark:text-orange-400">
                                                                {formatCurrency(line.cuttingPrice)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Detailed Operations List */}
                                                {line.operations && line.operations.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                        <div className="text-xs font-semibold text-gray-500 mb-1">تفاصيل العمليات:</div>
                                                        <ul className="space-y-1">
                                                            {line.operations.map((op, idx) => (
                                                                <li key={idx} className="flex justify-between text-xs text-gray-600 dark:text-gray-300">
                                                                    <span>
                                                                        {op.type === 'SHATAF' && `شطف: ${SHATAF_TYPES[op.shatafType]?.arabicName || op.shatafType}`}
                                                                        {op.type === 'FARMA' && `فارمة: ${FARMA_TYPES[op.farmaType]?.arabicName || op.farmaType}`}
                                                                        {op.type === 'LASER' && `ليزر: ${op.laserType === 'NORMAL' ? 'عادي' : op.laserType}`}
                                                                    </span>
                                                                    <span className="font-mono">
                                                                        {formatCurrency(op.operationPrice || op.manualPrice || op.manualCuttingPrice)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
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

                        {/* Invoice Summary */}
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>المجموع الفرعي:</span>
                                    <span className="font-mono font-medium">{formatCurrency(invoice.totalPrice)}</span>
                                </div>

                                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                    <span>الضريبة:</span>
                                    <span className="font-mono">0.00 ج.م</span>
                                </div>

                                <div className="border-t border-green-300 dark:border-green-700 pt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-green-800 dark:text-green-300">الإجمالي النهائي:</span>
                                        <span className="text-3xl font-bold text-green-700 dark:text-green-400 font-mono">
                                            {formatCurrency(invoice.totalPrice)}
                                        </span>
                                    </div>
                                </div>

                                {/* Balance Info - Always Show */}
                                <div className="border-t border-green-300 dark:border-green-700 pt-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            <span className="text-gray-600 dark:text-gray-400">المدفوع:</span>
                                            <span className="text-lg font-bold text-green-600 dark:text-green-400 font-mono">
                                                {formatCurrency(invoice.amountPaidNow || 0)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            <span className="text-gray-600 dark:text-gray-400">المتبقي:</span>
                                            <span className={`text-lg font-bold font-mono ${(invoice.remainingBalance || 0) > 0
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {formatCurrency(invoice.remainingBalance || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Suggestions */}
                                {/*{invoice.totalPrice > 500 && (*/}
                                {/*    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-300 dark:border-green-700">*/}
                                {/*        <div className="text-center">*/}
                                {/*            <div className="text-xs text-green-700 dark:text-green-400">دفع كامل</div>*/}
                                {/*            <div className="font-mono text-green-800 dark:text-green-300 font-medium">*/}
                                {/*                {formatCurrency(invoice.totalPrice)}*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*        <div className="text-center">*/}
                                {/*            <div className="text-xs text-green-700 dark:text-green-400">دفع مقدم 50%</div>*/}
                                {/*            <div className="font-mono text-green-800 dark:text-green-300 font-medium">*/}
                                {/*                {formatCurrency(invoice.totalPrice * 0.5)}*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            {
                isPaymentModalOpen && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        customer={invoice.customer}
                        invoice={invoice}
                        onPaymentRecorded={(payment) => {
                            setIsPaymentModalOpen(false);
                            onClose(); // Close the modal to refresh
                        }}
                    />
                )
            }

            {/* Print Options Modal */}
            <PrintOptionsModal
                isOpen={isPrintOptionsOpen}
                onClose={() => setIsPrintOptionsOpen(false)}
                onPrint={(type) => onPrint(invoice, type)}
            />
        </>
    );
};

export default InvoiceViewModal;