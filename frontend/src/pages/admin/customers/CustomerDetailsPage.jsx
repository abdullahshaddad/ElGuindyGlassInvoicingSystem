import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiPhone, FiMapPin, FiCreditCard, FiClock, FiDollarSign } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import { useCustomer, useCustomerInvoices } from '@/services/customerService';
import { useCustomerPayments, formatPaymentMethod } from '@/services/paymentService';
import PaymentModal from '@/components/ui/PaymentModal';
import InvoiceList from '@/pages/cashier/components/InvoiceList';

const CustomerDetailsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    // Convex reactive queries
    const customer = useCustomer(id);
    const payments = useCustomerPayments(id);
    const {
        results: invoices,
        status: invoicesPaginationStatus,
        loadMore: loadMoreInvoices,
        isLoading: invoicesLoading
    } = useCustomerInvoices(id, { initialNumItems: 10, customerName: customer?.name });

    const loading = customer === undefined;

    const [activeTab, setActiveTab] = useState('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    if (loading) return <div className="p-8 text-center">{t('app.loading')}</div>;
    if (!customer) return <div className="p-8 text-center">{t('customers.details.notFound')}</div>;

    const paymentColumns = [
        {
            key: '_id',
            header: t('customers.details.paymentId'),
            render: (value) => `#${String(value).slice(-6)}`
        },
        {
            key: 'paymentDate',
            header: t('customers.details.paymentDate'),
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        {
            key: 'amount',
            header: t('customers.details.paymentAmount'),
            render: (value) => <span className="font-bold text-green-600">{parseFloat(value).toFixed(2)} {t('common.currency')}</span>
        },
        {
            key: 'paymentMethod',
            header: t('customers.details.paymentMethod'),
            render: (value) => t(`payment.methods.${value}`, formatPaymentMethod(value))
        },
        {
            key: 'invoiceId',
            header: t('customers.details.paymentInvoice'),
            render: (value) => value ? `#${String(value).slice(-6)}` : '-'
        },
        {
            key: 'referenceNumber',
            header: t('customers.details.paymentReference'),
            render: (value) => value || '-'
        }
    ];

    // Define Breadcrumbs
    const breadcrumbs = [
        { label: t('navigation.home'), href: '/' },
        { label: t('customers.title'), href: '/customers' },
        { label: customer.name }
    ];

    // Convert paginated invoices into a format compatible with InvoiceList
    // InvoiceList expects currentPage/totalPages style pagination
    const canLoadMore = invoicesPaginationStatus === 'CanLoadMore';

    return (
        <div className="flex flex-col dark:bg-gray-900">
            {/* Page Header */}
            <PageHeader
                title={`${t('customers.details.title')}: ${customer.name}`}
                subtitle={t('customers.details.subtitle', { name: customer.name })}
                breadcrumbs={breadcrumbs}
                actions={
                    ['REGULAR', 'COMPANY'].includes(customer.customerType) && (
                        <Button
                            variant="success"
                            icon={FiDollarSign}
                            onClick={() => setIsPaymentModalOpen(true)}
                        >
                            {t('customers.details.recordPayment')}
                        </Button>
                    )
                }
            />

            {/* Main Content Area */}
            <div className="mt-6 space-y-6">

                {/* Customer Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('customers.details.outstandingBalance')}</p>
                                <h3 className={`text-2xl font-bold font-mono mt-1 ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {parseFloat(customer.balance || 0).toFixed(2)} {t('common.currency')}
                                </h3>
                            </div>
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <FiCreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t('customers.details.customerType')}</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                    {t(`customers.types.${customer.customerType || 'CASH'}`)}
                                </h3>
                            </div>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <FiUser className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                            {customer.phone && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <FiPhone className="text-gray-400" />
                                    <span className="font-mono">{customer.phone}</span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                    <FiMapPin className="text-gray-400" />
                                    <span>{customer.address}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                <FiClock className="text-gray-400" />
                                <span className="text-sm">{t('customers.details.registrationDate')}: {new Date(customer._creationTime || Date.now()).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px]">
                    <div className="p-4">
                        <Tabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                            tabs={[
                                {
                                    id: 'invoices',
                                    label: t('customers.details.invoicesTab'),
                                    icon: <FiCreditCard />,
                                    content: (
                                        <div className="mt-4">
                                            <InvoiceList
                                                invoices={invoices || []}
                                                loading={invoicesLoading}
                                                currentPage={0}
                                                totalPages={canLoadMore ? 2 : 1}
                                                onPageChange={() => {
                                                    if (canLoadMore) loadMoreInvoices(10);
                                                }}
                                                onViewInvoice={(invoice) => {
                                                    setSelectedInvoice(invoice);
                                                    setIsInvoiceModalOpen(true);
                                                }}
                                                onPrintInvoice={(invoice) => {
                                                    setSelectedInvoice(invoice);
                                                    setIsInvoiceModalOpen(true);
                                                }}
                                                onSendToFactory={() => { }}
                                                filters={{}}
                                                onFilterChange={() => { }}
                                                showControls={false}
                                            />
                                            {canLoadMore && (
                                                <div className="flex justify-center mt-4">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => loadMoreInvoices(10)}
                                                    >
                                                        {t('actions.loadMore', '\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0632\u064a\u062f')}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                },
                                {
                                    id: 'payments',
                                    label: t('customers.details.paymentsTab'),
                                    icon: <FiDollarSign />,
                                    content: (
                                        <div className="mt-4">
                                            <DataTable
                                                data={payments || []}
                                                columns={paymentColumns}
                                                emptyMessage={t('customers.details.noPayments')}
                                                loading={payments === undefined}
                                            />
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Invoices View Modal */}
            {selectedInvoice && (
                <InvoiceViewModal
                    isOpen={isInvoiceModalOpen}
                    onClose={() => {
                        setIsInvoiceModalOpen(false);
                        setSelectedInvoice(null);
                    }}
                    invoice={selectedInvoice}
                    onPrint={(invoice, type) => {
                        console.log('Printing', type, invoice);
                    }}
                    onSendToFactory={(invoice) => {
                        console.log('Sending to factory', invoice);
                    }}
                />
            )}


            {/* Payment Modal */}
            {
                isPaymentModalOpen && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        customer={customer}
                        onPaymentRecorded={() => {
                            setIsPaymentModalOpen(false);
                            // No manual refetch needed - Convex auto-updates
                        }}
                    />
                )
            }
        </div >
    );
};

export default CustomerDetailsPage;
