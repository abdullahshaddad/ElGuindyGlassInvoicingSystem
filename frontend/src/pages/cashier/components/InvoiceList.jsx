import React from 'react';
import { FiSearch, FiClock, FiEye, FiPrinter, FiCreditCard, FiPackage } from 'react-icons/fi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
    Button,
    Input,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Select
} from '@/components';

const InvoiceList = ({
    invoices,
    loading,
    searchTerm,
    currentPage,
    totalPages,
    isPrinting = false,
    isSendingToFactory = false,
    onSearchChange,
    onPageChange,
    onViewInvoice,
    onPrintInvoice,
    onSendToFactory,
    onMarkAsPaid
}) => {
    // Table columns for invoice list
    const columns = [
        {
            key: 'id',
            header: 'رقم الفاتورة',
            sortable: true,
            render: (value, invoice) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">#{invoice.id}</span>
                </div>
            )
        },
        {
            key: 'customer',
            header: 'العميل',
            sortable: true,
            render: (value, invoice) => (
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {['REGULAR', 'COMPANY'].includes(invoice.customer?.customerType) ? (
                            <Link
                                to={`/customers/${invoice.customer.id}`}
                                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {invoice.customer?.name || 'غير محدد'}
                            </Link>
                        ) : (
                            <span className="font-medium">{invoice.customer?.name || 'غير محدد'}</span>
                        )}
                        <Badge
                            variant={
                                invoice.customer?.customerType === 'CASH' ? 'success' :
                                    invoice.customer?.customerType === 'COMPANY' ? 'info' : 'default'
                            }
                            className="text-xs"
                        >
                            {invoice.customer?.customerType === 'CASH' ? 'نقدي' :
                                invoice.customer?.customerType === 'COMPANY' ? 'شركة' : 'عميل'}
                        </Badge>
                    </div>
                    {invoice.customer?.phone && (
                        <span className="text-xs text-gray-500 font-mono" dir="ltr">
                            {invoice.customer.phone}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'totalPrice',
            header: 'الإجمالي',
            sortable: true,
            render: (value, invoice) => (
                <span className="font-bold font-mono text-green-600 dark:text-green-400">
                    {parseFloat(value || 0).toFixed(2)} جنيه
                </span>
            )
        },
        {
            key: 'amountPaidNow',
            header: 'المدفوع',
            sortable: true,
            render: (value, invoice) => (
                <div className="text-left">
                    <span className="font-mono text-green-600 dark:text-green-400">
                        {parseFloat(value || 0).toFixed(2)} جنيه
                    </span>
                    {invoice.remainingBalance > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            متبقي: {invoice.remainingBalance?.toFixed(2)}
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
            key: 'status',
            header: 'الحالة',
            sortable: true,
            render: (value, invoice) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${value === 'PAID'
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
                    {/* Print Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPrintInvoice(invoice);
                        }}
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

                    {/* Send to Factory Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSendToFactory(invoice);
                        }}
                        disabled={isSendingToFactory}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="إرسال للمصنع"
                    >
                        {isSendingToFactory ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-400"></div>
                        ) : (
                            <FiPackage size={16} />
                        )}
                    </Button>
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
                            icon={<FiSearch />}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <FiClock />
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
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <DataTable
                        data={invoices}
                        columns={columns}
                        emptyMessage="لا توجد فواتير"
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        onRowClick={onViewInvoice}
                    />
                )}
            </div>
        </div>
    );
};

export default InvoiceList;