import React from 'react';
import { FiUser, FiPackage, FiPrinter, FiCreditCard, FiSend } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Modal from '@components/ui/Modal.jsx';

const InvoiceViewModal = ({
                              isOpen,
                              onClose,
                              invoice,
                              glassTypes,
                              onPrint,
                              onSendToFactory,
                              onMarkAsPaid
                          }) => {
    if (!invoice) return null;

    const formatCurrency = (amount) => `${parseFloat(amount || 0).toFixed(2)} ج.م`;

    // Calculate glass price from backend data: lineTotal - cuttingPrice
    const getGlassPrice = (line) => {
        return (line.lineTotal || 0) - (line.cuttingPrice || 0);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تفاصيل الفاتورة #${invoice.id}`}
            size="lg"
        >
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
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    invoice.status === 'PAID'
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
                        <FiUser className="text-blue-600 dark:text-blue-400"/>
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
                        <FiPackage className="text-green-600 dark:text-green-400"/>
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
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-x-2 space-x-reverse">
                                                <span>{line.width?.toFixed(2)} × {line.height?.toFixed(2)} متر</span>
                                                {line.glassType?.thickness && (
                                                    <span>• {line.glassType.thickness} مم</span>
                                                )}
                                                <span>• {line.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}</span>
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
                                    <div className="p-4 space-y-2 text-sm">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>المساحة:</span>
                                            <span className="font-mono">{line.areaM2?.toFixed(3)} م²</span>
                                        </div>
                                        {line.lengthM && (
                                            <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                                <span>الطول:</span>
                                                <span className="font-mono">{line.lengthM?.toFixed(3)} متر</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>سعر الزجاج:</span>
                                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(getGlassPrice(line))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                            <span>سعر القطع:</span>
                                            <span className="font-mono text-orange-600 dark:text-orange-400">
                                                {formatCurrency(line.cuttingPrice)}
                                            </span>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                            <div className="flex justify-between font-medium text-gray-900 dark:text-white">
                                                <span>إجمالي البند:</span>
                                                <span className="font-mono">{formatCurrency(line.lineTotal)}</span>
                                            </div>
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

                        {/* Payment Suggestions */}
                        {invoice.totalPrice > 500 && (
                            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-300 dark:border-green-700">
                                <div className="text-center">
                                    <div className="text-xs text-green-700 dark:text-green-400">دفع كامل</div>
                                    <div className="font-mono text-green-800 dark:text-green-300 font-medium">
                                        {formatCurrency(invoice.totalPrice)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-green-700 dark:text-green-400">دفع مقدم 50%</div>
                                    <div className="font-mono text-green-800 dark:text-green-300 font-medium">
                                        {formatCurrency(invoice.totalPrice * 0.5)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
                    <Button
                        onClick={() => {
                            onPrint(invoice);
                            onClose();
                        }}
                        className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white"
                    >
                        <FiPrinter className="ml-2"/>
                        طباعة الفاتورة
                    </Button>

                    <Button
                        onClick={() => {
                            onSendToFactory(invoice);
                            onClose();
                        }}
                        className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white"
                    >
                        <FiSend className="ml-2"/>
                        إرسال للمصنع
                    </Button>

                    {invoice.status === 'PENDING' && (
                        <Button
                            onClick={() => {
                                onMarkAsPaid(invoice);
                                onClose();
                            }}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white"
                        >
                            <FiCreditCard className="ml-2"/>
                            تسديد الفاتورة
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="mr-auto"
                    >
                        إغلاق
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceViewModal;