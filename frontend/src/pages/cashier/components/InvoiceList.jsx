import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiClock, FiEye, FiPrinter, FiCreditCard, FiPackage, FiTrash2 } from 'react-icons/fi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePermissions } from '@/contexts/AuthContext';
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
    onMarkAsPaid,
    filters,
    onFilterChange,
    showControls = true,
    onDeleteInvoice
}) => {
    const { t, i18n } = useTranslation();
    const { canDeleteInvoices } = usePermissions();
    const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

    // Table columns for invoice list
    const columns = [
        {
            key: 'id',
            header: t('invoices.invoiceNumber'),
            sortable: true,
            render: (value, invoice) => (
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{invoice.readableId || invoice.invoiceNumber || invoice._id}</span>
                </div>
            )
        },
        {
            key: 'customer',
            header: t('invoices.customer'),
            sortable: true,
            render: (value, invoice) => (
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {['REGULAR', 'COMPANY'].includes(invoice.customerType) ? (
                            <Link
                                to={`/customers/${invoice.customerId}`}
                                className="font-medium text-primary-600 hover:underline dark:text-primary-400"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {invoice.customerName || t('common.unspecified')}
                            </Link>
                        ) : (
                            <span className="font-medium">{invoice.customerName || t('common.unspecified')}</span>
                        )}
                        <Badge
                            variant={
                                invoice.customerType === 'CASH' ? 'success' :
                                    invoice.customerType === 'COMPANY' ? 'info' : 'default'
                            }
                            className="text-xs"
                        >
                            {invoice.customerType === 'CASH' ? t('customers.types.CASH') :
                                invoice.customerType === 'COMPANY' ? t('customers.types.COMPANY') : t('customers.customer')}
                        </Badge>
                    </div>
                    {invoice.customerPhone && (
                        <span className="text-xs text-gray-500 font-mono" dir="ltr">
                            {invoice.customerPhone}
                        </span>
                    )}
                </div>
            )
        },
        {
            key: 'totalPrice',
            header: t('invoices.total'),
            sortable: true,
            render: (value, invoice) => (
                <span className="font-bold font-mono text-green-600 dark:text-green-400">
                    {parseFloat(value || 0).toFixed(2)} {t('payment.currency')}
                </span>
            )
        },
        {
            key: 'amountPaidNow',
            header: t('invoices.amountPaid'),
            sortable: true,
            render: (value, invoice) => (
                <div className="text-left">
                    <span className="font-mono text-green-600 dark:text-green-400">
                        {parseFloat(value || 0).toFixed(2)} {t('payment.currency')}
                    </span>
                    {invoice.remainingBalance > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {t('invoices.remaining')}: {invoice.remainingBalance?.toFixed(2)}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'issueDate',
            header: t('invoices.date'),
            sortable: true,
            render: (value, invoice) => (
                <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">
                        {new Date(value).toLocaleDateString(dateLocale)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                        {new Date(value).toLocaleTimeString(dateLocale, {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            header: t('invoices.status'),
            sortable: true,
            render: (value, invoice) => (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${value === 'PAID'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : value === 'CANCELLED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>
                    {value === 'PAID' ? t('invoices.paid') :
                        value === 'CANCELLED' ? t('invoices.cancelled') : t('invoices.pending')}
                </span>
            )
        },
        {
            key: 'workStatus',
            header: t('invoices.workStatus'),
            sortable: true,
            render: (value, invoice) => {
                const workStatus = value || 'PENDING';
                const styles = {
                    'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
                    'IN_PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                    'PENDING': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                };
                return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[workStatus] || styles['PENDING']}`}>
                        {t(`factory.workStatus.${workStatus}`)}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            header: t('invoices.actions'),
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
                        title={t('actions.print')}
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
                        title={t('invoices.sendToFactory')}
                    >
                        {isSendingToFactory ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 dark:border-orange-400"></div>
                        ) : (
                            <FiPackage size={16} />
                        )}
                    </Button>

                    {/* Delete Button */}
                    {canDeleteInvoices() && onDeleteInvoice && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteInvoice(invoice);
                            }}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title={t('actions.delete')}
                        >
                            <FiTrash2 size={16} />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* List Controls */}
            {showControls && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Input
                                    placeholder={t('invoices.invoiceNumber') + '...'}
                                    value={filters?.invoiceId || ''}
                                    onChange={(e) => onFilterChange && onFilterChange('invoiceId', e.target.value)}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                                <Input
                                    placeholder={t('invoices.customerName') + '...'}
                                    value={filters?.customerName || ''}
                                    onChange={(e) => onFilterChange && onFilterChange('customerName', e.target.value)}
                                    icon={<FiSearch />}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                                <Input
                                    type="date"
                                    value={filters?.startDate || ''}
                                    onChange={(e) => onFilterChange && onFilterChange('startDate', e.target.value)}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                />
                                <Select
                                    value={filters?.status || ''}
                                    onChange={(e) => onFilterChange && onFilterChange('status', e.target.value)}
                                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                    options={[
                                        { value: '', label: t('invoices.allStatuses') },
                                        { value: 'PAID', label: t('invoices.paid') },
                                        { value: 'PENDING', label: t('invoices.pending') },
                                        { value: 'CANCELLED', label: t('invoices.cancelled') }
                                    ]}
                                />
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            <FiClock />
                            <span>{new Date().toLocaleTimeString(dateLocale, {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                        </div>
                    </div>
                </div>
            )}

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
                        emptyMessage={t('messages.noInvoices')}
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