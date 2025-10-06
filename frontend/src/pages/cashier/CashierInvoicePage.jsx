import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiCheck,
    FiShoppingCart,
    FiPlus,
    FiX,
    FiDollarSign
} from 'react-icons/fi';
import Button from '@components/ui/Button.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import { invoiceService } from '@services/invoiceService.js';
import { customerService } from '@services/customerService.js';
import { glassTypeService } from '@services/glassTypeService.js';
import { invoiceUtils } from '@utils';
import { PageHeader } from "@components";
import { printJobService } from '@services/printJobService';

// Import sub-components
import PricingBreakdown from './components/PricingBreakdown.jsx';
import EnhancedOrderSummary from './components/EnhancedOrderSummary';
import CustomerSelection from './components/CustomerSelection';
import ProductEntry from './components/ProductEntry';
import ShoppingCart from './components/ShoppingCart';
import NewCustomerForm from './components/NewCustomerForm';
import InvoiceList from './components/InvoiceList';
import InvoiceViewModal from './components/InvoiceViewModal';
import PrintJobStatusModal from './components/PrintJobStatusModal';


const CashierInvoicesPage = () => {
    const { t } = useTranslation();

    // Main states
    const [currentMode, setCurrentMode] = useState('list'); // 'list', 'create', 'addCustomer'
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // POS states
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [glassTypes, setGlassTypes] = useState([]);
    const [currentLine, setCurrentLine] = useState({
        glassTypeId: '',
        width: '',
        height: '',
        dimensionUnit: 'MM',
        cuttingType: 'SHATF',
        manualCuttingPrice: ''
    });
    const [isPrinting, setIsPrinting] = useState(false);
    const [printStatus, setPrintStatus] = useState(null);
    const [printJobStatus, setPrintJobStatus] = useState(null);
    const [showPrintJobStatusModal, setShowPrintJobStatusModal] = useState(false);
    const [isCheckingPrintJobs, setIsCheckingPrintJobs] = useState(false);
    const [isRetryingPrintJob, setIsRetryingPrintJob] = useState(false);
    // New customer form states
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        email: ''
    });

    // View invoice modal
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Processing states
    const [isCreating, setIsCreating] = useState(false);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);

    // Refs for POS workflow
    const customerSearchRef = useRef(null);
    const glassTypeRef = useRef(null);
    const widthRef = useRef(null);
    const heightRef = useRef(null);

    // Pagination for invoice list
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Auto-clear messages
    const clearMessages = useCallback(() => {
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 5000);
    }, []);

    // Load initial data
    useEffect(() => {
        loadInvoices();
        loadGlassTypes();
    }, []);

    useEffect(() => {
        if (error || success) {
            clearMessages();
        }
    }, [error, success, clearMessages]);

    // Customer search with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (customerSearch.length >= 2) {
                searchCustomers(customerSearch);
            } else {
                setCustomerResults([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [customerSearch]);

    // Invoice list search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadInvoices(0, searchTerm);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Data loading functions
    const loadInvoices = async (page = 0, search = '') => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 20,
                ...(search && { customerName: search })
            };

            const response = await invoiceService.listInvoices(params);
            setInvoices(response.content || []);
            setCurrentPage(response.number || 0);
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            console.error('Load invoices error:', err);
            setError('فشل في تحميل الفواتير');
        } finally {
            setLoading(false);
        }
    };

    const loadGlassTypes = async () => {
        try {
            const types = await glassTypeService.getAllGlassTypes();
            setGlassTypes(types || []);
        } catch (err) {
            console.error('Load glass types error:', err);
        }
    };

    const searchCustomers = async (query) => {
        setIsSearchingCustomers(true);
        try {
            const results = await customerService.searchCustomers(query);
            setCustomerResults(results || []);
        } catch (err) {
            console.error('Customer search error:', err);
            setCustomerResults([]);
        } finally {
            setIsSearchingCustomers(false);
        }
    };

    // Customer management handlers
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setCustomerResults([]);
        // Focus on glass type selection
        setTimeout(() => glassTypeRef.current?.focus(), 100);
    };

    const handleStartNewCustomer = () => {
        const searchValue = customerSearch.trim();
        // Pre-fill phone if search looks like a phone number
        const phonePattern = /^\d+$/;
        if (phonePattern.test(searchValue)) {
            setNewCustomer(prev => ({ ...prev, phone: searchValue }));
        } else {
            setNewCustomer(prev => ({ ...prev, name: searchValue }));
        }
        setCurrentMode('addCustomer');
        setCustomerSearch('');
        setCustomerResults([]);
    };

    const handleSaveNewCustomer = async () => {
        if (!newCustomer.name.trim()) {
            setError('اسم العميل مطلوب');
            return;
        }

        setIsAddingCustomer(true);
        try {
            const savedCustomer = await customerService.createCustomer(newCustomer);
            setSelectedCustomer(savedCustomer);
            setCurrentMode('create');
            setNewCustomer({ name: '', phone: '', address: '', email: '' });
            setSuccess(`تم إضافة العميل ${savedCustomer.name} بنجاح`);

            // Focus on glass type selection
            setTimeout(() => glassTypeRef.current?.focus(), 100);
        } catch (err) {
            console.error('Create customer error:', err);
            setError('فشل في إضافة العميل');
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const handleCancelNewCustomer = () => {
        setCurrentMode('create');
        setNewCustomer({ name: '', phone: '', address: '', email: '' });
    };

    // Cart/Invoice line management
    // Replace the handleAddLineToCart function in CashierInvoicePage.jsx with this version:

    const handleAddLineToCart = async () => {
        if (!currentLine.glassTypeId || !currentLine.width || !currentLine.height) {
            setError('يرجى ملء جميع البيانات المطلوبة');
            return;
        }

        const glassType = glassTypes.find(gt => gt.id == currentLine.glassTypeId);
        if (!glassType) {
            setError('نوع الزجاج غير صحيح');
            return;
        }

        if (currentLine.cuttingType === 'LASER' && !currentLine.manualCuttingPrice) {
            setError('يرجى إدخال سعر القطع للقطع بالليزر');
            return;
        }

        try {
            const preview = await invoiceService.previewLineCalculation({
                glassTypeId: currentLine.glassTypeId,
                width: parseFloat(currentLine.width),
                height: parseFloat(currentLine.height),
                dimensionUnit: currentLine.dimensionUnit || 'MM',
                cuttingType: currentLine.cuttingType,
                manualCuttingPrice: currentLine.manualCuttingPrice ? parseFloat(currentLine.manualCuttingPrice) : null
            });

            const newCartItem = {
                id: Date.now(),
                ...currentLine,
                glassType,
                lineTotal: preview.lineTotal,
                glassPrice: preview.glassPrice,
                cuttingPrice: preview.cuttingPrice,
                backendPreview: preview
            };

            setCart(prev => [...prev, newCartItem]);

            setCurrentLine({
                glassTypeId: currentLine.glassTypeId,
                width: '',
                height: '',
                dimensionUnit: currentLine.dimensionUnit,
                cuttingType: 'SHATF',
                manualCuttingPrice: ''
            });

            setTimeout(() => widthRef.current?.focus(), 100);
        } catch (err) {
            console.error('Add to cart error:', err);
            setError('فشل في حساب سعر البند. يرجى المحاولة مرة أخرى.');
        }
    };

    const recalculateCartItem = async (itemId, updatedItem) => {
        try {
            const preview = await invoiceService.previewLineCalculation({
                glassTypeId: updatedItem.glassTypeId,
                width: parseFloat(updatedItem.width),
                height: parseFloat(updatedItem.height),
                dimensionUnit: updatedItem.dimensionUnit || 'MM',
                cuttingType: updatedItem.cuttingType,
                manualCuttingPrice: updatedItem.manualCuttingPrice ? parseFloat(updatedItem.manualCuttingPrice) : null
            });

            setCart(prev => prev.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        lineTotal: preview.lineTotal,
                        glassPrice: preview.glassPrice,
                        cuttingPrice: preview.cuttingPrice,
                        backendPreview: preview
                    }
                    : item
            ));
        } catch (err) {
            console.error('Recalculate cart item error:', err);
            setError('فشل في إعادة حساب السعر');
        }
    };

    const handleUpdateCartItem = async (itemId, field, value) => {
        setCart(prev => prev.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, [field]: value };
                if (['width', 'height', 'cuttingType', 'manualCuttingPrice'].includes(field)) {
                    recalculateCartItem(itemId, updated);
                }
                return updated;
            }
            return item;
        }));
    };

    const handleCreateInvoice = async () => {
        if (!selectedCustomer) {
            setError('يرجى اختيار العميل');
            return;
        }

        if (cart.length === 0) {
            setError('يرجى إضافة عنصر واحد على الأقل للفاتورة');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const invoiceData = {
                customerId: selectedCustomer.id,
                issuedAt: new Date().toISOString(),
                invoiceLines: cart.map(item => ({
                    glassTypeId: parseInt(item.glassTypeId),
                    width: parseFloat(item.width),
                    height: parseFloat(item.height),
                    dimensionUnit: item.dimensionUnit || 'MM',
                    cuttingType: item.cuttingType,
                    ...(item.cuttingType === 'LASER' && item.manualCuttingPrice && {
                        manualCuttingPrice: parseFloat(item.manualCuttingPrice)
                    })
                }))
            };

            const newInvoice = await invoiceService.createInvoice(invoiceData);
            const totals = calculateCartTotals();

            setSuccess(`تم إنشاء الفاتورة رقم ${newInvoice.id} بنجاح! الإجمالي: ${totals.total.toFixed(2)} ج.م`);

            // التحقق من حالة مهام الطباعة
            await checkPrintJobStatus(newInvoice.id);

            handleResetPOS();
            loadInvoices();

        } catch (err) {
            console.error('Create invoice error:', err);
            setError(err.response?.data?.message || 'فشل في إنشاء الفاتورة');
        } finally {
            setIsCreating(false);
        }
    };

    const calculateCartTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: 0,
            total: Math.round(subtotal * 100) / 100
        };
    };

// 3. Update totals calculation
    const handleRemoveFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const checkPrintJobStatus = async (invoiceId) => {
        setIsCheckingPrintJobs(true);
        try {
            // الانتظار قليلاً للسماح للنظام الخلفي بإنشاء مهام الطباعة
            await new Promise(resolve => setTimeout(resolve, 1500));

            const status = await printJobService.getPrintJobStatus(invoiceId);
            setPrintJobStatus(status);
            setShowPrintJobStatusModal(true);

            console.log('Print job status:', status);

        } catch (err) {
            console.error('Check print job status error:', err);
            // لا نعرض خطأ هنا لأن مهام الطباعة غير حرجة
            console.warn('Failed to check print job status, but invoice was created successfully');
        } finally {
            setIsCheckingPrintJobs(false);
        }
    };
    // Calculate totals
    const totals = invoiceUtils.calculateTotals(cart, glassTypes);

    // Invoice operations

    const handleResetPOS = () => {
        setCurrentMode('list');
        setSelectedCustomer(null);
        setCustomerSearch('');
        setCustomerResults([]);
        setCart([]);
        setCurrentLine({
            glassTypeId: '',
            width: '',
            height: '',
            cuttingType: 'SHATF',
            manualCuttingPrice: ''
        });
    };

    // Invoice list operations
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    const handlePrintInvoice = async (invoice) => {
        if (!invoice || !invoice.id) {
            setError('معلومات الفاتورة غير صحيحة');
            return;
        }
        try {
            setIsPrinting(true);
            setPrintStatus('جاري إرسال الفاتورة للطباعة...');
            setError('');

            // Note: Print jobs are automatically created when the invoice is created
            // by the backend InvoiceService. However, we can trigger additional
            // print jobs if needed, such as reprinting or printing stickers separately.

            // Check if we need to create additional sticker print job
            // (Usually done for factory workers)
            if (window.confirm('هل تريد طباعة ملصق للفاتورة؟')) {
                try {
                    const stickerJob = await printJobService.createStickerPrintJob(invoice.id);
                    setPrintStatus('تم إرسال الملصق للطباعة بنجاح');
                    setSuccess(`تم إرسال الفاتورة ${invoice.id} والملصق للطباعة`);
                } catch (stickerError) {
                    console.error('Sticker print error:', stickerError);
                    // Don't fail the entire process if sticker fails
                    setSuccess(`تم إرسال الفاتورة ${invoice.id} للطباعة (فشل طباعة الملصق)`);
                }
            } else {
                setSuccess(`تم إرسال الفاتورة ${invoice.id} للطباعة`);
            }

            // Show print status details
            setTimeout(() => {
                setPrintStatus(null);
            }, 3000);

        } catch (err) {
            console.error('Print invoice error:', err);

            let errorMessage = 'فشل في إرسال الفاتورة للطباعة';

            if (err.response?.data?.message) {
                errorMessage = `خطأ في الطباعة: ${err.response.data.message}`;
            } else if (err.message) {
                errorMessage = `خطأ في الطباعة: ${err.message}`;
            }

            setError(errorMessage);
            setPrintStatus(null);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleReprintInvoice = async (invoice) => {
        if (!invoice || !invoice.id) {
            setError('معلومات الفاتورة غير صحيحة');
            return;
        }

        if (!window.confirm(`هل تريد إعادة طباعة الفاتورة ${invoice.id}؟`)) {
            return;
        }

        try {
            setIsPrinting(true);
            setPrintStatus('جاري إعادة إرسال الفاتورة للطباعة...');
            setError('');

            // Get queued print jobs to check status
            const queuedJobs = await printJobService.getQueuedJobs();
            const invoicePrintJobs = queuedJobs.filter(job => job.invoice?.id === invoice.id);

            if (invoicePrintJobs.length > 0) {
                setSuccess(`يوجد ${invoicePrintJobs.length} مهام طباعة في قائمة الانتظار للفاتورة ${invoice.id}`);
            } else {
                // Create new sticker print job for reprint
                await printJobService.createStickerPrintJob(invoice.id);
                setSuccess(`تم إرسال الفاتورة ${invoice.id} للطباعة مجدداً`);
            }

            setPrintStatus(null);

        } catch (err) {
            console.error('Reprint invoice error:', err);
            setError(`فشل في إعادة طباعة الفاتورة: ${err.message || 'خطأ غير معروف'}`);
            setPrintStatus(null);
        } finally {
            setIsPrinting(false);
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        try {
            await invoiceService.markAsPaid(invoice.id);
            setSuccess(`تم تسديد الفاتورة ${invoice.id} بنجاح`);
            loadInvoices(currentPage, searchTerm);
        } catch (err) {
            setError('فشل في تسديد الفاتورة');
        }
    };

    const handleRetryPrintJob = async (printType) => {
        if (!printJobStatus?.invoiceId) {
            console.error('No invoice ID available for retry');
            return;
        }

        setIsRetryingPrintJob(true);
        setError(null);

        try {
            await printJobService.retryPrintJob(printJobStatus.invoiceId, printType);

            const typeName = {
                CLIENT: 'نسخة العميل',
                OWNER: 'نسخة المالك',
                STICKER: 'ملصق المصنع'
            }[printType] || printType;

            setSuccess(`تم إعادة محاولة طباعة ${typeName} بنجاح`);

            // تحديث الحالة بعد إعادة المحاولة
            await new Promise(resolve => setTimeout(resolve, 1000));
            await checkPrintJobStatus(printJobStatus.invoiceId);

        } catch (err) {
            console.error('Retry print job error:', err);
            setError(err.response?.data?.message || 'فشل في إعادة محاولة الطباعة');
        } finally {
            setIsRetryingPrintJob(false);
        }
    };

    // Keyboard shortcuts for POS workflow
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (currentMode === 'create' && !isViewModalOpen) {
                if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    if (currentLine.glassTypeId && currentLine.width && currentLine.height) {
                        handleAddLineToCart();
                    }
                } else if (e.key === 'F2') {
                    e.preventDefault();
                    if (cart.length > 0 && selectedCustomer) {
                        handleCreateInvoice();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleResetPOS();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentMode, currentLine, cart, selectedCustomer]);

    return (
        <div className="" dir="rtl">
            <PageHeader
                title="نقطة البيع"
                subtitle="نظام إدارة الفواتير مع تفصيل الأسعار"
                actions={
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">التاريخ</div>
                            <div className="font-medium">{new Date().toLocaleDateString('ar-EG')}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">الوقت</div>
                            <div className="font-medium font-mono">{new Date().toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</div>
                        </div>
                    </div>
                }
            />

            {/* Messages */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                    <FiX className="text-red-500 flex-shrink-0"/>
                    <span className="text-red-700 flex-1">{error}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="text-red-500 hover:text-red-700"
                    >
                        <FiX size={16}/>
                    </Button>
                </div>
            )}

            {success && (
                <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                    <FiCheck className="text-green-500 flex-shrink-0"/>
                    <span className="text-green-700 flex-1">{success}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuccess(null)}
                        className="text-green-500 hover:text-green-700"
                    >
                        <FiX size={16}/>
                    </Button>
                </div>
            )}

            {printStatus && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>{printStatus}</span>
                </div>
            )}

            {/* Mode Switcher */}
            <div className="px-6 py-4">
                <div className="flex gap-2">
                    <Button
                        variant={currentMode === 'list' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('list')}
                        className="flex items-center gap-2"
                    >
                        <FiShoppingCart/>
                        قائمة الفواتير
                    </Button>
                    <Button
                        variant={currentMode === 'create' || currentMode === 'addCustomer' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('create')}
                        className="flex items-center gap-2"
                    >
                        <FiPlus/>
                        فاتورة جديدة
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6">
                {/* New Customer Form */}
                {currentMode === 'addCustomer' && (
                    <NewCustomerForm
                        newCustomer={newCustomer}
                        isAddingCustomer={isAddingCustomer}
                        onCustomerChange={setNewCustomer}
                        onSave={handleSaveNewCustomer}
                        onCancel={handleCancelNewCustomer}
                    />
                )}

                {/* POS Interface */}
                {(currentMode === 'create' || currentMode === 'addCustomer') && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Left Panel - Product Entry */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Customer Selection */}
                            <CustomerSelection
                                selectedCustomer={selectedCustomer}
                                customerSearch={customerSearch}
                                customerResults={customerResults}
                                isSearchingCustomers={isSearchingCustomers}
                                onCustomerSearchChange={setCustomerSearch}
                                onSelectCustomer={handleSelectCustomer}
                                onStartNewCustomer={handleStartNewCustomer}
                                onClearSelection={() => setSelectedCustomer(null)}
                            />

                            {/* Product Entry */}
                            <ProductEntry
                                currentLine={currentLine}
                                glassTypes={glassTypes}
                                onCurrentLineChange={setCurrentLine}
                                onAddToCart={handleAddLineToCart}
                                glassTypeRef={glassTypeRef}
                                widthRef={widthRef}
                                heightRef={heightRef}
                            />
                        </div>

                        {/* Right Panel - Cart & Summary */}
                        <div className="space-y-4">
                            {/* Shopping Cart */}
                            <ShoppingCart
                                cart={cart}
                                glassTypes={glassTypes}
                                onRemove={handleRemoveFromCart}
                                onUpdate={handleUpdateCartItem}
                            />

                            {/* Enhanced Order Summary */}
                            {cart.length > 0 && (
                                <EnhancedOrderSummary
                                    cart={cart}
                                    glassTypes={glassTypes}
                                />
                            )}

                            {/* Action Buttons */}
                            {cart.length > 0 && selectedCustomer && (
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleCreateInvoice}
                                        disabled={isCreating}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-4 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                                    >
                                        {isCreating ? (
                                            <LoadingSpinner size="sm" className="ml-2"/>
                                        ) : (
                                            <FiDollarSign className="ml-2"/>
                                        )}
                                        {isCreating ? 'جارٍ إنشاء الفاتورة...' : 'إنشاء الفاتورة (F2)'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleResetPOS}
                                        disabled={isCreating}
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    >
                                        <FiX className="ml-2"/>
                                        إلغاء (Esc)
                                    </Button>
                                </div>
                            )}

                            {/* POS Instructions */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    اختصارات لوحة المفاتيح:
                                </h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-blue-100 rounded text-xs font-mono">Ctrl+Enter</kbd>
                                        <span>إضافة للسلة</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-blue-100 rounded text-xs font-mono">F2</kbd>
                                        <span>إنشاء الفاتورة</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-blue-100 rounded text-xs font-mono">Esc</kbd>
                                        <span>إلغاء العملية</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-2 py-1 bg-blue-100 rounded text-xs font-mono">Enter</kbd>
                                        <span>الانتقال للحقل التالي</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Invoice List */}
                {currentMode === 'list' && (
                    <InvoiceList
                        isPrinting={isPrinting}
                        invoices={invoices}
                        loading={loading}
                        searchTerm={searchTerm}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onSearchChange={setSearchTerm}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            loadInvoices(page, searchTerm);
                        }}
                        onViewInvoice={handleViewInvoice}
                        onPrintInvoice={handlePrintInvoice}
                        onMarkAsPaid={handleMarkAsPaid}
                    />
                )}
            </div>

            {/* Invoice View Modal */}
            <InvoiceViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                invoice={selectedInvoice}
                glassTypes={glassTypes}
                onPrint={handlePrintInvoice}
                onMarkAsPaid={handleMarkAsPaid}
            />

            <PrintJobStatusModal
                isOpen={showPrintJobStatusModal}
                onClose={() => setShowPrintJobStatusModal(false)}
                printJobStatus={printJobStatus}
                onRetry={handleRetryPrintJob}
                isRetrying={isRetryingPrintJob}
            />
        </div>
    );
};

export default CashierInvoicesPage;