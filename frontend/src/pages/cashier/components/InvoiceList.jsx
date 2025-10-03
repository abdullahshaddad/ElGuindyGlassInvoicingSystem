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
                         isPrinting = false, // ADD THIS PROP WITH DEFAULT VALUE
                         onSearchChange,
                         onPageChange,
                         onViewInvoice,
                         onPrintInvoice, // This is the reprint function from parent
                         onMarkAsPaid
                     }) => {
    // Table columns for invoice list
    const columns = [
        {
            key: 'id',
            header: 'رقم الفاتورة',
            sortable: true,
            render: (value, invoice) => (
                <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                    #{value}
                </span>
            )
        },
        {
            key: 'customer',
            header: 'العميل',
            sortable: false,
            render: (value, invoice) => (
                <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">
                        {invoice?.customer?.name || 'غير محدد'}
                    </div>
                    {invoice?.customer?.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {invoice.customer.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'issueDate',
            header: 'التاريخ',
            sortable: true,
            render: (value, invoice) => (
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
            key: 'totalPrice',
            header: 'المبلغ',
            sortable: true,
            align: 'right',
            render: (value) => (
                <span className="font-semibold text-lg text-green-600 dark:text-green-400">
                    {parseFloat(value || 0).toFixed(2)} ج.م
                </span>
            )
        },
        {
            key: 'status',
            header: 'الحالة',
            sortable: true,
            render: (value, invoice) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    value === 'PAID'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : value === 'CANCELLED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                }`}>
                    {value === 'PAID' ? 'مدفوعة' :
                        value === 'CANCELLED' ? 'ملغاة' : 'قيد الانتظار'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'الإجراءات',
            sortable: false,
            render: (value, invoice) => (
                <div className="flex items-center gap-1 justify-end">
                    {/* View Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewInvoice(invoice)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="عرض التفاصيل"
                    >
                        <FiEye size={16}/>
                    </Button>

                    {/* Print Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrintInvoice(invoice)}
                        disabled={isPrinting}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="طباعة"
                    >
                        {isPrinting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 dark:border-purple-400"></div>
                        ) : (
                            <FiPrinter size={16} />
                        )}
                    </Button>

                    {/* Mark as Paid Button */}
                    {invoice?.status === 'PENDING' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsPaid(invoice)}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* List Controls */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <Input
                            placeholder="البحث في الفواتير..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            icon={<FiSearch/>}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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