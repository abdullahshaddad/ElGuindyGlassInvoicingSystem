import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiCreditCard, FiClock, FiDollarSign } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import InvoiceViewModal from '@/components/InvoiceViewModal';
import { customerService } from '@/services/customerService';
import paymentService from '@/services/paymentService'; // Consistently use default export
import invoiceService from '@/services/invoiceService'; // Use default export
import PaymentModal from '@/components/ui/PaymentModal';
import InvoiceList from '@/pages/cashier/components/InvoiceList'; // Import InvoiceList

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Still useful if we need programmatic navigation
    const [customer, setCustomer] = useState(null);
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [invoicesLoading, setInvoicesLoading] = useState(true);
    const [invoicePage, setInvoicePage] = useState(0);
    const [invoiceTotalPages, setInvoiceTotalPages] = useState(0);

    const [activeTab, setActiveTab] = useState('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        fetchCustomerDetails();
    }, [id]);

    const fetchCustomerDetails = async () => {
        setLoading(true);
        try {
            const customerData = await customerService.getCustomer(id);
            setCustomer(customerData);

            try {
                const paymentsData = await paymentService.getCustomerPayments(id);
                setPayments(paymentsData);
            } catch (err) {
                console.error("Failed to fetch payments", err);
            }

            fetchInvoices(id, invoicePage);

        } catch (err) {
            setError('فشل في استرداد بيانات العميل');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchInvoices = async (customerId, page) => {
        setInvoicesLoading(true);
        try {
            const response = await invoiceService.listInvoices({
                customerId: customerId,
                page: page,
                size: 5
            });
            setInvoices(response.content);
            setInvoiceTotalPages(response.totalPages);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setInvoicesLoading(false);
        }
    };

    useEffect(() => {
        if (customer) { // Only fetch if we have customer ID and it changed (handled by main useEffect dependency)
            // But we need to handle page changes.
            // Actually, better to just call fetchInvoices when page changes
        }
    }, [invoicePage]); // This might conflict with initial load.

    // Better approach:
    // 1. Initial load gets everything.
    // 2. Page change triggers specific fetch.

    useEffect(() => {
        if (id) {
            fetchInvoices(id, invoicePage);
        }
    }, [invoicePage, id]);

    if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
    if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
    if (!customer) return <div className="p-8 text-center">العميل غير موجود</div>;

    const paymentColumns = [
        {
            key: 'id',
            header: 'رقم العملية',
            render: (value) => `#${value}`
        },
        {
            key: 'paymentDate',
            header: 'التاريخ',
            render: (value) => new Date(value).toLocaleDateString('ar-EG')
        },
        {
            key: 'amount',
            header: 'المبلغ',
            render: (value) => <span className="font-bold text-green-600">{parseFloat(value).toFixed(2)} ج.م</span>
        },
        {
            key: 'paymentMethod',
            header: 'طريقة الدفع',
            render: (value) => paymentService.formatPaymentMethod(value)
        },
        {
            key: 'invoice',
            header: 'الفاتورة',
            render: (_, row) => row.invoiceId ? `#${row.invoiceId}` : '-'
        },
        {
            key: 'referenceNumber',
            header: 'المرجع',
            render: (value) => value || '-'
        }
    ];

    // Define Breadcrumbs
    const breadcrumbs = [
        { label: 'الرئيسية', href: '/' },
        { label: 'العملاء', href: '/customers' }, // Assuming this route exists
        { label: customer.name }
    ];

    return (
        <div className="flex flex-col dark:bg-gray-900">
            {/* Page Header */}
            <PageHeader
                title={`ملف العميل: ${customer.name}`}
                subtitle={`عرض التفاصيل المالية وسجل المدفوعات لـ ${customer.name}`}
                breadcrumbs={breadcrumbs}
                actions={
                    ['REGULAR', 'COMPANY'].includes(customer.customerType) && (
                        <Button
                            variant="success"
                            icon={FiDollarSign}
                            onClick={() => setIsPaymentModalOpen(true)}
                        >
                            تسجيل دفعة
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">الرصيد المستحق</p>
                                <h3 className={`text-2xl font-bold font-mono mt-1 ${customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {parseFloat(customer.balance || 0).toFixed(2)} ج.م
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">نوع العميل</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
                                    {customer.customerType === 'COMPANY' ? 'شركة' :
                                        customer.customerType === 'REGULAR' ? 'عميل دائم' : 'نقدي'}
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
                                <span className="text-sm">تاريخ التسجيل: {new Date(customer.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
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
                                    label: 'الفواتير',
                                    icon: <FiCreditCard />,
                                    content: (
                                        <div className="mt-4">
                                            <InvoiceList
                                                invoices={invoices}
                                                loading={invoicesLoading}
                                                currentPage={invoicePage}
                                                totalPages={invoiceTotalPages}
                                                onPageChange={setInvoicePage}
                                                onViewInvoice={(invoice) => {
                                                    setSelectedInvoice(invoice);
                                                    setIsInvoiceModalOpen(true);
                                                }}
                                                onPrintInvoice={(invoice) => {
                                                    setSelectedInvoice(invoice);
                                                    // We can use the modal to print too, or handle directly.
                                                    // For now, let's open details which has print.
                                                    setIsInvoiceModalOpen(true);
                                                }}
                                                onSendToFactory={() => { }}
                                                filters={{}}
                                                onFilterChange={() => { }}
                                                showControls={false}
                                            />
                                        </div>
                                    )
                                },
                                {
                                    id: 'payments',
                                    label: 'سجل المدفوعات',
                                    icon: <FiDollarSign />,
                                    content: (
                                        <div className="mt-4">
                                            <DataTable
                                                data={payments}
                                                columns={paymentColumns}
                                                emptyMessage="لا يوجد سجل مدفوعات لهذا العميل"
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
                        // Implement print logic or reuse existing service
                    }}
                    onSendToFactory={(invoice) => {
                        console.log('Sending to factory', invoice);
                        // Implement logic
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
                            fetchCustomerDetails();
                        }}
                    />
                )
            }
        </div >
    );
};

export default CustomerDetailsPage;