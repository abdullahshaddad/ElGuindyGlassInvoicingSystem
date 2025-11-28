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
import { ConfirmationDialog } from '@components/ui/ConfirmationDialog.jsx';
import { invoiceService } from '@services/invoiceService.js';
import { customerService } from '@services/customerService.js';
import { glassTypeService } from '@services/glassTypeService.js';
import { printJobService } from '@services/printJobService.js';
import { invoiceUtils } from '@utils';
import { PageHeader } from "@components";
import { useSnackbar } from "@contexts/SnackbarContext.jsx";

// Import sub-components
import PricingBreakdown from './components/PricingBreakdown.jsx';
import EnhancedOrderSummary from './components/EnhancedOrderSummary';
import CustomerSelection from './components/CustomerSelection';
import ShoppingCart from './components/ShoppingCart';
import NewCustomerForm from './components/NewCustomerForm';
import InvoiceList from './components/InvoiceList';
import InvoiceViewModal from './components/InvoiceViewModal';
import PrintJobStatusModal from './components/PrintJobStatusModal';

// Import NEW ENHANCED components
import EnhancedProductEntry from './components/EnhancedProductEntry.jsx';
import PaymentPanel from './components/PaymentPanel.jsx';
import InvoiceConfirmationDialog from './components/InvoiceConfirmationDialog.jsx';

const CashierInvoicesPage = () => {
    const { t } = useTranslation();
    const { showSuccess, showError, showInfo, showWarning } = useSnackbar();

    // Main states
    const [currentMode, setCurrentMode] = useState('list'); // 'list', 'create', 'addCustomer'
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // POS states
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [glassTypes, setGlassTypes] = useState([]);

    // Enhanced line item state with operations array
    const [currentLine, setCurrentLine] = useState({
        glassTypeId: '',
        width: '',
        height: '',
        dimensionUnit: 'MM',
        operations: [] // Array of operations (SHATAF, FARMA, LASER)
    });

    // Payment states
    const [amountPaidNow, setAmountPaidNow] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Print job states
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingToFactory, setIsSendingToFactory] = useState(false);
    const [printStatus, setPrintStatus] = useState(null);
    const [printJobStatus, setPrintJobStatus] = useState(null);
    const [showPrintJobStatusModal, setShowPrintJobStatusModal] = useState(false);
    const [isCheckingPrintJobs, setIsCheckingPrintJobs] = useState(false);
    const [isRetryingPrintJob, setIsRetryingPrintJob] = useState(false);
    const [isCreatingPrintJobs, setIsCreatingPrintJobs] = useState(false);

    // Confirmation dialog states
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        type: 'warning'
    });

    // New customer form states
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        customerType: 'REGULAR'
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

    // Load initial data
    useEffect(() => {
        loadInvoices();
        loadGlassTypes();
    }, []);

    // Auto-set payment for CASH customers
    useEffect(() => {
        if (selectedCustomer?.customerType === 'CASH') {
            const total = calculateCartTotal();
            setAmountPaidNow(total);
        }
    }, [selectedCustomer, cart]);

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

    // Keyboard shortcuts for POS workflow
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (currentMode === 'create' && !isViewModalOpen) {
                if (e.key === 'F2') {
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
    }, [currentMode, cart, selectedCustomer, isViewModalOpen]);

    // Load functions
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
            setTotalPages(response.totalPages || 0);
        } catch (err) {
            console.error('Load invoices error:', err);
            showError('فشل في تحميل الفواتير');
        } finally {
            setLoading(false);
        }
    };

    const loadGlassTypes = async () => {
        try {
            const types = await glassTypeService.getAllGlassTypes();
            setGlassTypes(types);
        } catch (err) {
            console.error('Load glass types error:', err);
            showError('فشل في تحميل انواع الزجاج');
        }
    };

    const searchCustomers = async (query) => {
        setIsSearchingCustomers(true);
        try {
            const results = await customerService.searchCustomers(query);
            setCustomerResults(results);
        } catch (err) {
            console.error('Search customers error:', err);
            setCustomerResults([]);
        } finally {
            setIsSearchingCustomers(false);
        }
    };

    // Customer handlers
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setCustomerResults([]);
        setTimeout(() => glassTypeRef.current?.focus(), 100);
    };

    const handleStartNewCustomer = (searchValue) => {
        if (searchValue) {
            setNewCustomer(prev => ({ ...prev, name: searchValue }));
        }
        setCurrentMode('addCustomer');
        setCustomerSearch('');
        setCustomerResults([]);
    };

    const handleSaveNewCustomer = async () => {
        if (!newCustomer.name.trim()) {
            showError('اسم العميل مطلوب');
            return;
        }

        setIsAddingCustomer(true);
        try {
            const savedCustomer = await customerService.createCustomer(newCustomer);
            setSelectedCustomer(savedCustomer);
            setCurrentMode('create');
            setNewCustomer({
                name: '',
                phone: '',
                address: '',
                email: '',
                customerType: 'REGULAR'
            });
            showSuccess(`تم اضافة العميل ${savedCustomer.name} بنجاح`);
            setTimeout(() => glassTypeRef.current?.focus(), 100);
        } catch (err) {
            console.error('Create customer error:', err);
            showError('فشل في اضافة العميل');
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const handleCancelNewCustomer = () => {
        setCurrentMode('create');
        setNewCustomer({
            name: '',
            phone: '',
            address: '',
            email: '',
            customerType: 'REGULAR'
        });
    };

    // ============================================================
    // MULTI-OPERATION Cart Handler
    // ============================================================
    const handleAddLineToCart = async () => {
        const operations = currentLine.operations || [];

        // Validation: Basic fields
        if (!currentLine.glassTypeId || !currentLine.width || !currentLine.height) {
            showError('يرجى ملء جميع البيانات المطلوبة (نوع الزجاج، العرض، الارتفاع)');
            return;
        }

        // Validation: Must have at least one operation
        if (operations.length === 0) {
            showError('يجب اضافة عملية واحدة على الاقل (شطف، فارمة، او ليزر)');
            return;
        }

        // Validate operations
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            const prefix = `العملية ${i + 1}: `;

            if (op.type === 'SHATAF') {
                if (!op.shatafType) {
                    showError(prefix + 'يرجى اختيار نوع الشطف');
                    return;
                }
            } else if (op.type === 'FARMA') {
                if (!op.farmaType) {
                    showError(prefix + 'يرجى اختيار نوع الفارمة');
                    return;
                }
            } else if (op.type === 'LASER') {
                if (!op.laserType) {
                    showError(prefix + 'يرجى اختيار نوع الليزر');
                    return;
                }
                if (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '') {
                    showError(prefix + 'يرجى ادخال سعر الليزر');
                    return;
                }
            }
        }

        const glassType = glassTypes.find(gt => gt.id == currentLine.glassTypeId);
        if (!glassType) {
            showError('نوع الزجاج غير صحيح');
            return;
        }

        try {
            // Calculate glass price (client-side estimate)
            const dimensionMultiplier = currentLine.dimensionUnit === 'MM' ? 0.001 :
                                       currentLine.dimensionUnit === 'CM' ? 0.01 : 1;
            const widthM = parseFloat(currentLine.width) * dimensionMultiplier;
            const heightM = parseFloat(currentLine.height) * dimensionMultiplier;
            const areaM2 = widthM * heightM;

            // Calculate glass price based on glass type calculation method
            let glassPrice = 0;
            if (glassType.calculationMethod === 'AREA') {
                glassPrice = areaM2 * (glassType.pricePerMeter || 0);
            } else if (glassType.calculationMethod === 'LENGTH') {
                const lengthM = Math.max(widthM, heightM);
                glassPrice = lengthM * (glassType.pricePerMeter || 0);
            } else {
                // Default to area
                glassPrice = areaM2 * (glassType.pricePerMeter || 0);
            }

            // Process operations - estimate prices (final calculation on backend)
            const processedOperations = operations.map(op => {
                let estimatedPrice = 0;

                if (op.type === 'SHATAF') {
                    // Estimate: For formula-based shataf, we don't have rates client-side
                    // Just mark as "to be calculated"
                    estimatedPrice = 0; // Backend will calculate
                } else if (op.type === 'FARMA') {
                    // Use manual price if provided
                    estimatedPrice = op.manualPrice ? parseFloat(op.manualPrice) : 0;
                } else if (op.type === 'LASER') {
                    // Use manual price
                    estimatedPrice = op.manualPrice ? parseFloat(op.manualPrice) : 0;
                }

                return {
                    ...op,
                    calculatedPrice: estimatedPrice
                };
            });

            const totalOperationsPrice = processedOperations.reduce(
                (sum, op) => sum + (op.calculatedPrice || 0),
                0
            );

            // Note: For SHATAF operations, the price will be calculated by backend
            // This is just an estimate for display
            const lineTotal = glassPrice + totalOperationsPrice;

            // Create cart item
            const cartItem = {
                id: Date.now(),
                glassTypeId: currentLine.glassTypeId,
                glassType: glassType,
                width: parseFloat(currentLine.width),
                height: parseFloat(currentLine.height),
                dimensionUnit: currentLine.dimensionUnit || 'MM',
                operations: processedOperations,
                glassPrice: glassPrice,
                operationsPrice: totalOperationsPrice,
                areaM2: areaM2,
                lineTotal: lineTotal
            };

            console.log('🛒 Adding to cart:', {
                glassType: glassType.name,
                dimensions: `${currentLine.width}x${currentLine.height}`,
                operationsCount: processedOperations.length,
                glassPrice,
                operationsPrice: totalOperationsPrice,
                lineTotal
            });

            setCart(prev => [...prev, cartItem]);

            // Reset current line
            setCurrentLine({
                glassTypeId: '',
                width: '',
                height: '',
                dimensionUnit: 'MM',
                operations: []
            });

            // Check if there are SHATAF operations
            const hasShataf = operations.some(op => op.type === 'SHATAF');
            if (hasShataf) {
                showInfo('تم اضافة المنتج الى السلة - سيتم حساب سعر الشطف النهائي عند انشاء الفاتورة');
            } else {
                showSuccess('تم اضافة المنتج الى السلة');
            }
            setTimeout(() => glassTypeRef.current?.focus(), 100);

        } catch (err) {
            console.error('Add to cart error:', err);
            showError(err.response?.data?.message || 'فشل في حساب السعر');
        }
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
        showInfo('تم ازالة المنتج من السلة');
    };

    const handleUpdateCartItem = async (itemId, updatedData) => {
        console.log('Update cart item:', itemId, updatedData);
    };

    // Calculate cart total
    const calculateCartTotal = () => {
        return cart.reduce((total, item) => total + (item.lineTotal || 0), 0);
    };

    // Invoice creation with payment validation
    const handleCreateInvoice = () => {
        if (!selectedCustomer) {
            showError('يرجى اختيار عميل');
            return;
        }

        if (cart.length === 0) {
            showError('يرجى اضافة منتجات للفاتورة');
            return;
        }

        const total = calculateCartTotal();

        // Validate payment for CASH customers
        if (selectedCustomer.customerType === 'CASH') {
            if (amountPaidNow !== total) {
                showError('العميل النقدي يجب ان يدفع المبلغ بالكامل عند اصدار الفاتورة.');
                return;
            }
        }

        // Validate payment amount
        if (amountPaidNow < 0) {
            showError('من فضلك ادخل قيمة صحيحة للمبلغ المدفوع.');
            return;
        }

        if (amountPaidNow > total) {
            showError('المبلغ المدفوع لا يمكن ان يكون اكبر من اجمالي الفاتورة.');
            return;
        }

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    // Confirmed invoice creation
    const handleConfirmInvoice = async () => {
        setIsCreating(true);

        try {
            // Prepare invoice request with multi-operation support
            const invoiceRequest = {
                customerId: selectedCustomer.id,
                invoiceLines: cart.map(item => {
                    // Find primary operations
                    const shatafOp = item.operations?.find(op => op.type === 'SHATAF');
                    const farmaOp = item.operations?.find(op => op.type === 'FARMA');
                    const laserOp = item.operations?.find(op => op.type === 'LASER');

                    return {
                        glassTypeId: item.glassTypeId,
                        width: item.width,
                        height: item.height,
                        dimensionUnit: item.dimensionUnit,
                        // Primary operation data (for backward compatibility)
                        shatafType: shatafOp?.shatafType || null,
                        farmaType: shatafOp?.farmaType || farmaOp?.farmaType || null,
                        diameter: shatafOp?.diameter || farmaOp?.diameter || null,
                        manualCuttingPrice: shatafOp?.manualCuttingPrice || null,
                        // Additional operations
                        operations: item.operations?.map(op => ({
                            type: op.type,
                            shatafType: op.shatafType || null,
                            farmaType: op.farmaType || null,
                            laserType: op.laserType || null,
                            diameter: op.diameter ? parseFloat(op.diameter) : null,
                            manualPrice: op.manualPrice ? parseFloat(op.manualPrice) : null,
                            manualCuttingPrice: op.manualCuttingPrice ? parseFloat(op.manualCuttingPrice) : null,
                            notes: op.notes || null
                        })) || []
                    };
                }),
                amountPaidNow: amountPaidNow,
                notes: ''
            };

            console.log('📤 Sending Invoice Request:', JSON.stringify(invoiceRequest, null, 2));

            // Create invoice
            const response = await invoiceService.createInvoice(invoiceRequest);
            const createdInvoice = response.invoice || response;

            console.log('✅ Invoice Created:', {
                id: createdInvoice.id,
                totalPrice: createdInvoice.totalPrice,
                linesCount: createdInvoice.invoiceLines?.length || 0
            });

            showSuccess('تم انشاء الفاتورة بنجاح');

            // Try to create print jobs (non-blocking)
            try {
                setIsCreatingPrintJobs(true);
                await printJobService.createAllPrintJobs(createdInvoice.id);
                showSuccess('تم انشاء مهام الطباعة بنجاح');
            } catch (printError) {
                console.error('Print jobs creation error:', printError);
                showWarning('تم انشاء الفاتورة ولكن فشل في انشاء مهام الطباعة');
            } finally {
                setIsCreatingPrintJobs(false);
            }

            // Close confirmation and reset
            setShowConfirmation(false);
            handleResetPOS();

            // Reload invoices
            loadInvoices(currentPage, searchTerm);

        } catch (error) {
            console.error('Create invoice error:', error);
            showError(error.response?.data?.message || 'فشل في انشاء الفاتورة');
        } finally {
            setIsCreating(false);
        }
    };

    // Print and factory operations
    const handlePrintInvoice = async (invoice) => {
        setIsPrinting(true);
        try {
            const pdfBlob = await printJobService.printInvoice(invoice.id);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${invoice.id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            showSuccess(`تم طباعة الفاتورة ${invoice.id} بنجاح`);
        } catch (err) {
            console.error('Print invoice error:', err);
            showError('فشل في طباعة الفاتورة');
        } finally {
            setIsPrinting(false);
        }
    };

    const handleSendToFactory = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: 'ارسال الى المصنع',
            message: `هل تريد ارسال الفاتورة #${invoice.id} الى المصنع؟`,
            type: 'info',
            onConfirm: async () => {
                await executeSendToFactory(invoice);
            }
        });
    };

    const executeSendToFactory = async (invoice) => {
        setIsSendingToFactory(true);
        try {
            const status = await printJobService.checkPrintJobStatus(invoice.id);

            if (!status.hasAllPrintJobs) {
                showWarning('بعض مهام الطباعة مفقودة. سيتم انشاؤها الان...');
                await printJobService.createAllPrintJobs(invoice.id);
            }

            showSuccess(`تم ارسال الفاتورة ${invoice.id} الى المصنع بنجاح`);
            loadInvoices(currentPage, searchTerm);
        } catch (err) {
            console.error('Send to factory error:', err);
            showError('فشل في ارسال الفاتورة الى المصنع');
        } finally {
            setIsSendingToFactory(false);
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: 'تسديد الفاتورة',
            message: `هل تريد تسديد الفاتورة #${invoice.id}؟`,
            type: 'warning',
            onConfirm: async () => {
                await executeMarkAsPaid(invoice);
            }
        });
    };

    const executeMarkAsPaid = async (invoice) => {
        try {
            await invoiceService.markAsPaid(invoice.id);
            showSuccess(`تم تسديد الفاتورة ${invoice.id} بنجاح`);
            loadInvoices(currentPage, searchTerm);
        } catch (err) {
            console.error('Mark as paid error:', err);
            showError('فشل في تسديد الفاتورة');
        }
    };

    // Reset POS
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
            dimensionUnit: 'MM',
            operations: []
        });
        setAmountPaidNow(0);
        setPaymentMethod('CASH');
    };

    // Invoice list operations
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <PageHeader
                    title="نظام المبيعات - الكاشير"
                    subtitle={currentMode === 'list' ? 'قائمة الفواتير' : 'انشاء فاتورة جديدة'}
                />

                {/* Mode Toggle */}
                <div className="flex gap-2 mt-4">
                    <Button
                        variant={currentMode === 'list' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('list')}
                        className="flex items-center gap-2"
                    >
                        <FiShoppingCart />
                        قائمة الفواتير
                    </Button>
                    <Button
                        variant={currentMode === 'create' || currentMode === 'addCustomer' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('create')}
                        className="flex items-center gap-2"
                    >
                        <FiPlus />
                        فاتورة جديدة
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="py-6">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 px-6">
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

                            {/* Enhanced Product Entry with Multi-Operations */}
                            <EnhancedProductEntry
                                glassTypes={glassTypes}
                                currentLine={currentLine}
                                onLineChange={setCurrentLine}
                                onAddToCart={handleAddLineToCart}
                                glassTypeRef={glassTypeRef}
                            />
                        </div>

                        <div className="space-y-4">
                            {/* Shopping Cart */}
                            <ShoppingCart
                                cart={cart}
                                glassTypes={glassTypes}
                                onRemove={handleRemoveFromCart}
                                onUpdate={handleUpdateCartItem}
                            />

                            {/* Order Summary */}
                            {cart.length > 0 && (
                                <EnhancedOrderSummary
                                    cart={cart}
                                    glassTypes={glassTypes}
                                />
                            )}

                            {/* Payment Panel */}
                            {cart.length > 0 && selectedCustomer && (
                                <PaymentPanel
                                    customer={selectedCustomer}
                                    totalAmount={calculateCartTotal()}
                                    amountPaidNow={amountPaidNow}
                                    onAmountPaidNowChange={setAmountPaidNow}
                                    paymentMethod={paymentMethod}
                                    onPaymentMethodChange={setPaymentMethod}
                                    disabled={isCreating || isCreatingPrintJobs}
                                />
                            )}

                            {/* Create Invoice Button */}
                            {cart.length > 0 && selectedCustomer && (
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleCreateInvoice}
                                        disabled={isCreating || isCreatingPrintJobs}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-4 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                                    >
                                        {(isCreating || isCreatingPrintJobs) ? (
                                            <LoadingSpinner size="sm" className="ml-2" />
                                        ) : (
                                            <FiDollarSign className="ml-2" />
                                        )}
                                        {isCreating ? 'جاري انشاء الفاتورة...' :
                                            isCreatingPrintJobs ? 'جاري انشاء مهام الطباعة...' : 'انشاء الفاتورة'}
                                        <kbd className="mr-2 px-2 py-1 bg-white/20 rounded text-xs font-mono">F2</kbd>
                                    </Button>

                                    {/* Keyboard Shortcuts */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                            اختصارات لوحة المفاتيح:
                                        </p>
                                        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Ctrl+Enter</kbd>
                                                <span>اضافة للسلة</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">F2</kbd>
                                                <span>انشاء الفاتورة</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Esc</kbd>
                                                <span>الغاء العملية</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Invoice List */}
                {currentMode === 'list' && (
                    <InvoiceList
                        isPrinting={isPrinting}
                        isSendingToFactory={isSendingToFactory}
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
                        onSendToFactory={handleSendToFactory}
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
                onSendToFactory={handleSendToFactory}
                onMarkAsPaid={handleMarkAsPaid}
            />

            {/* Invoice Confirmation Dialog */}
            <InvoiceConfirmationDialog
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmInvoice}
                customer={selectedCustomer}
                totalAmount={calculateCartTotal()}
                amountPaidNow={amountPaidNow}
                remainingBalance={calculateCartTotal() - amountPaidNow}
                isCreating={isCreating}
            />

            {/* Confirmation Dialog (Generic) */}
            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
            />

            {/* Print Job Status Modal */}
            <PrintJobStatusModal
                isOpen={showPrintJobStatusModal}
                onClose={() => setShowPrintJobStatusModal(false)}
                status={printJobStatus}
                onRetry={async () => {
                    if (printJobStatus?.invoiceId) {
                        setIsRetryingPrintJob(true);
                        try {
                            await printJobService.retryPrintJobs(printJobStatus.invoiceId);
                            showSuccess('تم اعادة محاولة مهام الطباعة');
                            const newStatus = await printJobService.checkPrintJobStatus(printJobStatus.invoiceId);
                            setPrintJobStatus(newStatus);
                        } catch (err) {
                            showError('فشل في اعادة محاولة مهام الطباعة');
                        } finally {
                            setIsRetryingPrintJob(false);
                        }
                    }
                }}
                isRetrying={isRetryingPrintJob}
            />
        </div>
    );
};

export default CashierInvoicesPage;