import React from 'react';
import { FiUser, FiPackage, FiPrinter, FiCreditCard } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Modal from '@components/ui/Modal.jsx';
import PricingBreakdown from './PricingBreakdown';

const InvoiceViewModal = ({
                              isOpen,
                              onClose,
                              invoice,
                              glassTypes,
                              onPrint,
                              onMarkAsPaid
                          }) => {
    if (!invoice) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تفاصيل الفاتورة #${invoice.id}`}
            size="lg"
        >
            <div className="space-y-6" dir="rtl">
                {/* Invoice Header */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-600">رقم الفاتورة:</span>
                            <div className="font-bold text-lg text-primary-600">#{invoice.id}</div>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">التاريخ:</span>
                            <div className="font-medium">{new Date(invoice.issueDate).toLocaleDateString('ar-EG')}</div>
                        </div>
                        <div>
                            <span className="text-sm text-gray-600">الحالة:</span>
                            <div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                    invoice.status === 'PAID'
                                        ? 'bg-green-100 text-green-800'
                                        : invoice.status === 'CANCELLED'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {invoice.status === 'PAID' ? '✓ مدفوعة' :
                                        invoice.status === 'CANCELLED' ? '✗ ملغاة' : '⏳ قيد الانتظار'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Info */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiUser className="text-blue-600"/>
                        بيانات العميل
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-blue-600">الاسم:</span>
                                <div className="font-medium text-blue-900">{invoice.customer?.name}</div>
                            </div>
                            {invoice.customer?.phone && (
                                <div>
                                    <span className="text-sm text-blue-600">الهاتف:</span>
                                    <div className="font-medium text-blue-900 font-mono">{invoice.customer.phone}</div>
                                </div>
                            )}
                            {invoice.customer?.address && (
                                <div className="md:col-span-2">
                                    <span className="text-sm text-blue-600">العنوان:</span>
                                    <div className="font-medium text-blue-900">{invoice.customer.address}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Invoice Items with Enhanced Pricing */}
                <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiPackage className="text-green-600"/>
                        تفاصيل المنتجات والأسعار
                    </h3>
                    <div className="space-y-3">
                        {invoice.invoiceLines?.map((line, index) => (
                            <PricingBreakdown
                                key={index}
                                item={{
                                    ...line,
                                    glassTypeId: line.glassType?.id,
                                    glassType: line.glassType
                                }}
                                glassTypes={glassTypes}
                                isDetailed={true}
                            />
                        ))}
                    </div>
                </div>

                {/* Enhanced Totals */}
                <div className="bg-green-50 rounded-lg p-6">
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-sm text-green-600 mb-1">الإجمالي النهائي</div>
                            <div className="text-3xl font-bold text-green-700 font-mono">
                                {parseFloat(invoice.totalPrice || 0).toFixed(2)} ج.م
                            </div>
                        </div>

                        {/* Quick payment options */}
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                            <div className="text-center">
                                <div className="text-xs text-green-600">دفع نقدي</div>
                                <div className="font-mono text-green-700">
                                    {parseFloat(invoice.totalPrice || 0).toFixed(2)} ج.م
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-xs text-green-600">دفع مقدم 50%</div>
                                <div className="font-mono text-green-700">
                                    {(parseFloat(invoice.totalPrice || 0) * 0.5).toFixed(2)} ج.م
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={() => onPrint(invoice)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <FiPrinter className="ml-2"/>
                        طباعة الفاتورة
                    </Button>
                    {invoice.status === 'PENDING' && (
                        <Button
                            onClick={() => {
                                onMarkAsPaid(invoice);
                                onClose();
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
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