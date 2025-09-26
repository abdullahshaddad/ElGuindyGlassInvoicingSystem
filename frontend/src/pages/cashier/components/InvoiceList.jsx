import React from 'react';
import { FiSearch, FiClock, FiEye, FiPrinter, FiCreditCard } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DataTable from '@/components/ui/DataTable';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const InvoiceList = ({
                         invoices,
                         loading,
                         searchTerm,
                         currentPage,
                         totalPages,
                         onSearchChange,
                         onPageChange,
                         onViewInvoice,
                         onPrintInvoice,
                         onMarkAsPaid
                     }) => {
    // Table columns for invoice list
    const columns = [
        {
            key: 'id',
            title: 'رقم الفاتورة',
            render: (invoice) => (
                <span className="font-mono font-semibold text-primary-600">
                    #{invoice.id}
                </span>
            )
        },
        {
            key: 'customer',
            title: 'العميل',
            render: (invoice) => (
                <div className="text-right">
                    <div className="font-medium text-gray-900">{invoice.customer?.name}</div>
                    {invoice.customer?.phone && (
                        <div className="text-sm text-gray-500 font-mono">{invoice.customer.phone}</div>
                    )}
                </div>
            )
        },
        {
            key: 'issueDate',
            title: 'التاريخ',
            render: (invoice) => (
                <div className="text-sm">
                    <div>{new Date(invoice.issueDate).toLocaleDateString('ar-EG')}</div>
                    <div className="text-gray-500">{new Date(invoice.issueDate).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                </div>
            )
        },
        {
            key: 'totalPrice',
            title: 'المبلغ',
            render: (invoice) => (
                <span className="font-semibold text-lg text-green-600">
                    {parseFloat(invoice.totalPrice || 0).toFixed(2)} ج.م
                </span>
            )
        },
        {
            key: 'status',
            title: 'الحالة',
            render: (invoice) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {invoice.status === 'PAID' ? '✓ مدفوعة' :
                        invoice.status === 'CANCELLED' ? '✗ ملغاة' : '⏳ قيد الانتظار'}
                </span>
            )
        },
        {
            key: 'actions',
            title: 'الإجراءات',
            render: (invoice) => (
                <div className="flex items-center gap-1 justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        title="عرض التفاصيل"
                    >
                        <FiEye size={16}/>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintInvoice(invoice)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50"
                        title="طباعة"
                    >
                        <FiPrinter size={16}/>
                    </Button>
                    {invoice.status === 'PENDING' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsPaid(invoice)}
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                            title="تسديد"
                        >
                            <FiCreditCard size={16}/>
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* List Controls */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="البحث في الفواتير..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            icon={<FiSearch/>}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FiClock/>
                        <span>آخر تحديث: {new Date().toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg"/>
                    </div>
                ) : (
                    <DataTable
                        data={invoices}
                        columns={columns}
                        emptyMessage="لا توجد فواتير"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                )}
            </div>
        </div>
    );
};

export default InvoiceList;