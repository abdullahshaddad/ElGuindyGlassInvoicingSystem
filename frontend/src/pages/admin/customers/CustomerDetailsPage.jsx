import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUser, FiPhone, FiMapPin, FiCreditCard, FiClock, FiDollarSign } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import PageHeader from '@/components/ui/PageHeader'; // Imported PageHeader
import { customerService } from '@/services/customerService';
import paymentService from '@/services/paymentService';
import PaymentModal from '@/components/ui/PaymentModal';

const CustomerDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Still useful if we need programmatic navigation
    const [customer, setCustomer] = useState(null);
    const [payments, setPayments] = useState([]);
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
        } catch (err) {
            setError('فشل في استرداد بيانات العميل');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="flex flex-col   dark:bg-gray-900">
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
                                <span>تاريخ التسجيل: {new Date(customer.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiDollarSign className="text-green-600" />
                            سجل المدفوعات
                        </h2>
                    </div>
                    <DataTable
                        data={payments}
                        columns={paymentColumns}
                        emptyMessage="لا يوجد سجل مدفوعات لهذا العميل"
                    />
                </div>
            </div>

            {/* Payment Modal */}
            {isPaymentModalOpen && (
                <PaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    customer={customer}
                    onPaymentRecorded={() => {
                        setIsPaymentModalOpen(false);
                        fetchCustomerDetails();
                    }}
                />
            )}
        </div>
    );
};

export default CustomerDetailsPage;