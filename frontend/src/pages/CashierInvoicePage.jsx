// src/pages/CashierInvoicesPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiPlus,
    FiTrash2,
    FiDownload,
    FiCheck,
    FiEye,
    FiPrinter,
    FiUser,
    FiPhone,
    FiMapPin
} from 'react-icons/fi';
import {
    Button,
    Input,
    Select,
    Modal,
    DataTable,
    PageHeader,
    Badge,
    Icon
} from '@/components';
import { usePermissions } from '@/contexts/AuthContext';
import { glassTypeService } from '@/services/glassTypeService';
import { customerService } from '@/services/customerService';
import { invoiceService } from '@/services/invoiceService';
import { calculateShataf, calculateArea, calculateLineTotal } from '@/utils/cuttingUtils';
import './CashierInvoicesPage.scss';

const CashierInvoicesPage = () => {
    const { t } = useTranslation();
    const { canManageInvoices } = usePermissions();

    // Authorization check
    if (!canManageInvoices()) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        غير مصرح لك بالوصول
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        هذه الصفحة مخصصة للكاشير والإدارة فقط
                    </p>
                </div>
            </div>
        );
    }

    // State management
    const [glassTypes, setGlassTypes] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoicesLoading, setInvoicesLoading] = useState(false);

    // Form states
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({
        name: '',
        phone: '',
        address: ''
    });
    const [invoiceLines, setInvoiceLines] = useState([{
        id: Date.now(),
        glassTypeId: '',
        width: '',
        height: '',
        cuttingType: 'SHATF',
        manualCuttingPrice: ''
    }]);

    // Modals
    const [detailsModal, setDetailsModal] = useState({ isOpen: false, invoice: null });

    // Load initial data
    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [glassTypesData, customersData] = await Promise.all([
                glassTypeService.getAllGlassTypes(),
                customerService.getAllCustomers()
            ]);
            setGlassTypes(glassTypesData);
            setCustomers(customersData);
            await loadInvoices();
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadInvoices = async () => {
        try {
            setInvoicesLoading(true);
            const response = await invoiceService.listInvoices({ size: 50 });
            setInvoices(response.content || response);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setInvoicesLoading(false);
        }
    };

    // Customer management
    const handleAddCustomer = async (e) => {
        e.preventDefault();
        try {
            const newCustomer = await customerService.createCustomer(newCustomerData);
            setCustomers(prev => [...prev, newCustomer]);
            setSelectedCustomer(newCustomer.id.toString());
            setNewCustomerData({ name: '', phone: '', address: '' });
            setShowAddCustomer(false);
        } catch (error) {
            console.error('Error creating customer:', error);
        }
    };

    // Invoice line management
    const addInvoiceLine = () => {
        setInvoiceLines(prev => [...prev, {
            id: Date.now(),
            glassTypeId: '',
            width: '',
            height: '',
            cuttingType: 'SHATF',
            manualCuttingPrice: ''
        }]);
    };

    const removeInvoiceLine = (id) => {
        setInvoiceLines(prev => prev.filter(line => line.id !== id));
    };

    // Calculate line totals
    const getLineCalculation = (line) => {
        const glassType = glassTypes.find(gt => gt.id.toString() === line.glassTypeId);
        if (!glassType || !line.width || !line.height) {
            return { area: 0, glassPrice: 0, cuttingPrice: 0, total: 0 };
        }

        return calculateLineTotal(
            parseFloat(line.width),
            parseFloat(line.height),
            glassType.pricePerMeter,
            line.cuttingType,
            glassType.thickness,
            parseFloat(line.manualCuttingPrice) || 0
        );
    };

    // Calculate invoice total
    const getInvoiceTotal = () => {
        return invoiceLines.reduce((total, line) => {
            const calculation = getLineCalculation(line);
            return total + calculation.total;
        }, 0);
    };

    // Submit invoice
    const handleSubmitInvoice = async (e) => {
        e.preventDefault();

        if (!selectedCustomer) {
            alert('يرجى اختيار العميل');
            return;
        }

        if (invoiceLines.length === 0 || invoiceLines.some(line =>
            !line.glassTypeId || !line.width || !line.height
        )) {
            alert('يرجى ملء جميع بيانات أصناف الزجاج');
            return;
        }

        try {
            const customer = customers.find(c => c.id.toString() === selectedCustomer);
            const invoiceData = {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerAddress: customer.address,
                invoiceLines: invoiceLines.map(line => ({
                    glassTypeId: parseInt(line.glassTypeId),
                    width: parseFloat(line.width),
                    height: parseFloat(line.height),
                    cuttingType: line.cuttingType,
                    manualCuttingPrice: line.cuttingType === 'LASER' ? parseFloat(line.manualCuttingPrice) || null : null
                }))
            };

            await invoiceService.createInvoice(invoiceData);

            // Reset form
            setSelectedCustomer('');
            setInvoiceLines([{
                id: Date.now(),
                glassTypeId: '',
                width: '',
                height: '',
                cuttingType: 'SHATF',
                manualCuttingPrice: ''
            }]);

            // Reload invoices
            await loadInvoices();

            alert('تم إنشاء الفاتورة بنجاح وإرسالها للطباعة');
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('حدث خطأ أثناء إنشاء الفاتورة');
        }
    };

    // Mark invoice as paid
    const handleMarkAsPaid = async (invoiceId) => {
        if (!window.confirm('تأكيد تحديد الفاتورة كمدفوعة؟')) return;

        try {
            await invoiceService.markAsPaid(invoiceId);
            await loadInvoices();
        } catch (error) {
            console.error('Error marking as paid:', error);
        }
    };

    // Export CSV
    const handleExportCSV = async () => {
        try {
            const blob = await invoiceService.exportInvoices();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting CSV:', error);
        }
    };

    // Invoice table columns
    const invoiceColumns = [
        {
            key: 'id',
            header: 'رقم الفاتورة',
            align: 'center',
            render: (value) => (
                <Badge variant="outline" size="sm">#{value}</Badge>
            )
        },
        {
            key: 'customer',
            header: 'العميل',
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.customer?.name}</div>
                    <div className="text-sm text-gray-500">{row.customer?.phone}</div>
                </div>
            )
        },
        {
            key: 'totalPrice',
            header: 'الإجمالي',
            align: 'center',
            render: (value) => (
                <span className="font-bold text-green-600">
          {value?.toFixed(2)} ج.م
        </span>
            )
        },
        {
            key: 'issueDate',
            header: 'التاريخ',
            align: 'center',
            render: (value) => new Date(value).toLocaleDateString('ar-EG')
        },
        {
            key: 'status',
            header: 'الحالة',
            align: 'center',
            render: (value) => (
                <Badge
                    variant={value === 'PAID' ? 'success' : value === 'PENDING' ? 'warning' : 'danger'}
                    size="sm"
                >
                    {value === 'PAID' ? 'مدفوعة' : value === 'PENDING' ? 'معلقة' : 'ملغاة'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'الإجراءات',
            align: 'center',
            sortable: false,
            render: (_, row) => (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailsModal({ isOpen: true, invoice: row })}
                        className="text-blue-600 hover:text-blue-800"
                        title="عرض التفاصيل"
                    >
                        <FiEye />
                    </Button>
                    {row.status === 'PENDING' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsPaid(row.id)}
                            className="text-green-600 hover:text-green-800"
                            title="تحديد كمدفوعة"
                        >
                            <FiCheck />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    const updateInvoiceLine = (id, field, value) => {
        setInvoiceLines(prev => prev.map(line =>
            line.id === id ? { ...line, [field]: value } : line
        ));
    };

    return (
        <div className="cashier-invoices-page">
            {/* Page Header */}
            <PageHeader
                title="فواتير الكاشير"
                subtitle="إنشاء وإدارة الفواتير"
                breadcrumbs={[
                    { label: 'الرئيسية', href: '/' },
                    { label: 'فواتير الكاشير' }
                ]}
            />

            {/* Create Invoice Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b pb-3">
                    إنشاء فاتورة جديدة
                </h3>

                <form onSubmit={handleSubmitInvoice} className="space-y-6">
                    {/* Customer Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                العميل *
                            </label>
                            <div className="flex gap-2">
                                <Select
                                    name="selectedCustomer"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                    options={customers.map(customer => ({
                                        value: customer.id.toString(),
                                        label: `${customer.name} - ${customer.phone}`
                                    }))}
                                    placeholder="اختر العميل"
                                    className="flex-1"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddCustomer(!showAddCustomer)}
                                    className="px-3"
                                    title="إضافة عميل جديد"
                                >
                                    <FiUser />
                                </Button>
                            </div>
                        </div>

                        {/* Add Customer Inline Form */}
                        {showAddCustomer && (
                            <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                                    إضافة عميل جديد
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <Input
                                        placeholder="اسم العميل *"
                                        value={newCustomerData.name}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        icon={FiUser}
                                    />
                                    <Input
                                        placeholder="رقم الهاتف *"
                                        value={newCustomerData.phone}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                        required
                                        icon={FiPhone}
                                    />
                                    <Input
                                        placeholder="العنوان (اختياري)"
                                        value={newCustomerData.address}
                                        onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                                        icon={FiMapPin}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowAddCustomer(false);
                                            setNewCustomerData({ name: '', phone: '', address: '' });
                                        }}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        size="sm"
                                        onClick={handleAddCustomer}
                                        disabled={!newCustomerData.name || !newCustomerData.phone}
                                    >
                                        إضافة العميل
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Invoice Lines */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                أصناف الزجاج *
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addInvoiceLine}
                                className="flex items-center gap-2"
                            >
                                <FiPlus size={16} />
                                إضافة صنف زجاج
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {invoiceLines.map((line, index) => {
                                const calculation = getLineCalculation(line);
                                const selectedGlassType = glassTypes.find(gt => gt.id.toString() === line.glassTypeId);

                                return (
                                    <div key={line.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <h5 className="font-medium text-gray-900 dark:text-white">
                                                صنف زجاج #{index + 1}
                                            </h5>
                                            {invoiceLines.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeInvoiceLine(line.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FiTrash2 />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                                            {/* Glass Type */}
                                            <Select
                                                name={`glassType_${line.id}`}
                                                value={line.glassTypeId}
                                                onChange={(e) => updateInvoiceLine(line.id, 'glassTypeId', e.target.value)}
                                                options={glassTypes.map(glassType => ({
                                                    value: glassType.id.toString(),
                                                    label: `${glassType.name} - ${glassType.thickness}مم - ${glassType.pricePerMeter} ج.م/م²`
                                                }))}
                                                placeholder="نوع الزجاج"
                                                required
                                            />
                                            {/* Width */}
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                placeholder="العرض (سم)"
                                                value={line.width}
                                                onChange={(e) => updateInvoiceLine(line.id, 'width', e.target.value)}
                                                required
                                            />

                                            {/* Height */}
                                            <Input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                placeholder="الارتفاع (سم)"
                                                value={line.height}
                                                onChange={(e) => updateInvoiceLine(line.id, 'height', e.target.value)}
                                                required
                                            />

                                            {/* Cutting Type */}
                                            <Select
                                                options={[
                                                    { value: 'SHATF', label: 'شطف (تلقائي)' },
                                                    { value: 'LASER', label: 'ليزر (يدوي)' }
                                                ]}
                                                value={line.cuttingType}
                                                onChange={(e) => updateInvoiceLine(line.id, 'cuttingType', e.target.value)}
                                                required
                                            />
                                        </div>

                                        {/* Manual Cutting Price for Laser */}
                                        {line.cuttingType === 'LASER' && (
                                            <div className="mb-3">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="سعر القص اليدوي (ج.م)"
                                                    value={line.manualCuttingPrice}
                                                    onChange={(e) => updateInvoiceLine(line.id, 'manualCuttingPrice', e.target.value)}
                                                    className="max-w-xs"
                                                />
                                            </div>
                                        )}

                                        {/* Calculations Display */}
                                        {selectedGlassType && line.width && line.height && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-white dark:bg-gray-600 p-3 rounded">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">المساحة:</span>
                                                    <span className="font-medium mr-2">{calculation.area.toFixed(3)} م²</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">سعر الزجاج:</span>
                                                    <span className="font-medium mr-2">{calculation.glassPrice.toFixed(2)} ج.م</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">سعر القص:</span>
                                                    <span className="font-medium mr-2">{calculation.cuttingPrice.toFixed(2)} ج.م</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">الإجمالي:</span>
                                                    <span className="font-bold text-green-600 mr-2">{calculation.total.toFixed(2)} ج.م</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Invoice Total */}
                    <div className="flex justify-end">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                إجمالي الفاتورة: {getInvoiceTotal().toFixed(2)} ج.م
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="px-8"
                        >
                            إنشاء الفاتورة وطباعة
                        </Button>
                    </div>
                </form>
            </div>

            {/* Invoices List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        قائمة الفواتير
                    </h3>
                    <Button
                        variant="outline"
                        onClick={handleExportCSV}
                        className="flex items-center gap-2"
                    >
                        <FiDownload />
                        تصدير CSV
                    </Button>
                </div>

                <DataTable
                    data={invoices}
                    columns={invoiceColumns}
                    loading={invoicesLoading}
                    emptyMessage="لا توجد فواتير"
                    loadingMessage="جاري تحميل الفواتير..."
                />
            </div>

            {/* Invoice Details Modal */}
            <Modal
                isOpen={detailsModal.isOpen}
                onClose={() => setDetailsModal({ isOpen: false, invoice: null })}
                title={`تفاصيل الفاتورة #${detailsModal.invoice?.id}`}
                size="lg"
            >
                {detailsModal.invoice && (
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                بيانات العميل
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">الاسم:</span>
                                    <span className="font-medium mr-2">{detailsModal.invoice.customer?.name}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 dark:text-gray-400">الهاتف:</span>
                                    <span className="font-medium mr-2">{detailsModal.invoice.customer?.phone}</span>
                                </div>
                                <div className="md:col-span-2">
                                    <span className="text-gray-600 dark:text-gray-400">العنوان:</span>
                                    <span className="font-medium mr-2">{detailsModal.invoice.customer?.address || 'غير محدد'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">تاريخ الإصدار:</span>
                                <div className="font-medium">{new Date(detailsModal.invoice.issueDate).toLocaleString('ar-EG')}</div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">الحالة:</span>
                                <div className="mt-1">
                                    <Badge
                                        variant={detailsModal.invoice.status === 'PAID' ? 'success' : detailsModal.invoice.status === 'PENDING' ? 'warning' : 'danger'}
                                        size="sm"
                                    >
                                        {detailsModal.invoice.status === 'PAID' ? 'مدفوعة' : detailsModal.invoice.status === 'PENDING' ? 'معلقة' : 'ملغاة'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">تاريخ الدفع:</span>
                                <div className="font-medium">
                                    {detailsModal.invoice.paymentDate
                                        ? new Date(detailsModal.invoice.paymentDate).toLocaleString('ar-EG')
                                        : 'لم يتم الدفع'
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Invoice Lines */}
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                                أصناف الزجاج
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            نوع الزجاج
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            الأبعاد
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            المساحة
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            نوع القص
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                            الإجمالي
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                    {detailsModal.invoice.invoiceLines?.map((line, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {line.glassType?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {line.glassType?.thickness}مم - {line.glassType?.color}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="text-sm">
                                                    {line.width} × {line.height} سم
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="text-sm font-medium">
                                                    {line.areaM2?.toFixed(3)} م²
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" size="sm">
                                                    {line.cuttingType === 'SHATF' ? 'شطف' : 'ليزر'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                          <span className="font-bold text-green-600">
                            {line.lineTotal?.toFixed(2)} ج.م
                          </span>
                                            </td>
                                        </tr>
                                    )) || (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                                لا توجد أصناف
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="border-t pt-4">
                            <div className="flex justify-end">
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                    <div className="text-xl font-bold text-green-900 dark:text-green-100">
                                        إجمالي الفاتورة: {detailsModal.invoice.totalPrice?.toFixed(2)} ج.م
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            {detailsModal.invoice.status === 'PENDING' && (
                                <Button
                                    variant="success"
                                    onClick={() => {
                                        handleMarkAsPaid(detailsModal.invoice.id);
                                        setDetailsModal({ isOpen: false, invoice: null });
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <FiCheck />
                                    تحديد كمدفوعة
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="flex items-center gap-2"
                            >
                                <FiPrinter />
                                طباعة
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDetailsModal({ isOpen: false, invoice: null })}
                            >
                                إغلاق
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CashierInvoicesPage;