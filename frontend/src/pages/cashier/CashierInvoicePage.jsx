import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    FiCheck,
    FiShoppingCart,
    FiPlus,
    FiX,
    FiDollarSign,
    FiWifi,
    FiWifiOff
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
import { useWebSocket, WEBSOCKET_TOPICS } from '@hooks/useWebSocket';

// Import sub-components
import PricingBreakdown from './components/PricingBreakdown.jsx';
import EnhancedOrderSummary from './components/EnhancedOrderSummary';
import CustomerSelection from './components/CustomerSelection';
import ShoppingCart from './components/ShoppingCart';
import NewCustomerForm from './components/NewCustomerForm';
import InvoiceList from './components/InvoiceList';
import PrintJobStatusModal from './components/PrintJobStatusModal';

// Import NEW ENHANCED components
import EnhancedProductEntry from './components/EnhancedProductEntry.jsx';
import PaymentPanel from './components/PaymentPanel.jsx';
import InvoiceConfirmationDialog from './components/InvoiceConfirmationDialog.jsx';

const CashierInvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { showSuccess, showError, showInfo, showWarning } = useSnackbar();

    // Main states
    const [currentMode, setCurrentMode] = useState('list'); // 'list', 'create', 'addCustomer'
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // WebSocket message handler for real-time updates
    const handleWebSocketMessage = useCallback((topic, data) => {
        console.log('Cashier WebSocket message:', topic, data);

        if (topic === WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED) {
            // Only show notification if we're in list mode (not creating our own invoice)
            if (currentMode === 'list') {
                showInfo(i18n.language === 'ar'
                    ? `فاتورة جديدة #${data.invoiceId}`
                    : `New invoice #${data.invoiceId}`
                );
                loadInvoices(currentPage);
            }
        } else if (topic === WEBSOCKET_TOPICS.DASHBOARD_PRINT_UPDATE) {
            console.log('Print job update received:', data);
        }
    }, [currentMode, i18n.language]);

    // WebSocket connection
    const { connected: wsConnected } = useWebSocket({
        topics: [
            WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED,
            WEBSOCKET_TOPICS.DASHBOARD_PRINT_UPDATE
        ],
        onMessage: handleWebSocketMessage,
        enabled: true
    });

    // POS states
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
    const [glassTypes, setGlassTypes] = useState([]);

    // Enhanced line item state with operations array
    const [currentLine, setCurrentLine] = useState({
        glassTypeId: '',
        width: '',
        height: '',
        dimensionUnit: 'CM',
        quantity: 1,
        operations: [] // Array of operations (SHATF, LASER)
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

    // Filters State replaces simple searchTerm
    const [filters, setFilters] = useState({
        customerName: '',
        invoiceId: '',
        startDate: '',
        status: ''
    });

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

    // Debounce filters for invoice list loading
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadInvoices(0);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filters]);

    // Keyboard shortcuts for POS workflow
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (currentMode === 'create') {
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
    }, [currentMode, cart, selectedCustomer]);

    // Load functions with filters
    const loadInvoices = async (page = 0) => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 20,
                ...filters
            };

            const response = await invoiceService.listInvoices(params);
            setInvoices(response.content || []);
            setTotalPages(response.totalPages || 0);
            setCurrentPage(page);
        } catch (err) {
            console.error('Load invoices error:', err);
            showError(t('messages.loadingInvoices'));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const loadGlassTypes = async () => {
        try {
            const types = await glassTypeService.getAllGlassTypes();
            setGlassTypes(types);
        } catch (err) {
            console.error('Load glass types error:', err);
            showError(t('messages.loadingData'));
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
            showError(t('customers.fields.name') + ' ' + t('forms.required'));
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
            showSuccess(t('customers.messages.createSuccess'));
            setTimeout(() => glassTypeRef.current?.focus(), 100);
        } catch (err) {
            console.error('Create customer error:', err);
            showError(t('messages.saveError'));
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
            showError(t('messages.fillGlassItemsError'));
            return;
        }

        // Validation: Must have at least one operation
        if (operations.length === 0) {
            showError(t('product.validation.operationRequired'));
            return;
        }

        // Validate operations
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            const prefix = `${t('product.validation.operationPrefix')} ${i + 1}: `;

            if (op.type === 'SHATAF') {
                if (!op.shatafType) {
                    showError(prefix + t('product.validation.shatafTypeRequired'));
                    return;
                }
            } else if (op.type === 'FARMA') {
                if (!op.farmaType) {
                    showError(prefix + t('product.validation.farmaRequired'));
                    return;
                }
            } else if (op.type === 'LASER') {
                if (!op.laserType) {
                    showError(prefix + t('product.validation.laserTypeRequired'));
                    return;
                }
                if (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '') {
                    showError(prefix + t('product.validation.laserPriceRequired'));
                    return;
                }
            }
        }

        const glassType = glassTypes.find(gt => gt.id == currentLine.glassTypeId);
        if (!glassType) {
            showError(t('product.validation.glassTypeRequired'));
            return;
        }

        setIsCalculatingPrice(true);

        try {
            // Prepare request for backend calculation
            const previewRequest = {
                glassTypeId: parseInt(currentLine.glassTypeId),
                width: parseFloat(currentLine.width),
                height: parseFloat(currentLine.height),
                dimensionUnit: currentLine.dimensionUnit || 'CM',
                operations: operations.map(op => ({
                    type: op.type,
                    shatafType: op.shatafType || null,
                    farmaType: op.farmaType || null,
                    laserType: op.laserType || null,
                    diameter: op.diameter ? parseFloat(op.diameter) : null,
                    manualPrice: op.manualPrice ? parseFloat(op.manualPrice) : null,
                    manualCuttingPrice: op.manualCuttingPrice ? parseFloat(op.manualCuttingPrice) : null,
                    notes: op.notes || null
                }))
            };

            // Call backend preview endpoint
            const preview = await invoiceService.previewLineCalculation(previewRequest);

            console.log('✅ Price Calculated:', preview);

            // Create cart item with calculated prices
            const cartItem = {
                id: Date.now(),
                glassTypeId: currentLine.glassTypeId,
                glassType: glassType,
                width: parseFloat(currentLine.width),
                height: parseFloat(currentLine.height),
                dimensionUnit: currentLine.dimensionUnit || 'CM',
                operations: preview.operations || operations, // Use backend returned ops if available
                glassPrice: preview.glassPrice,
                operationsPrice: preview.cuttingPrice, // Backend returns total operations price as cuttingPrice currently
                cuttingPrice: preview.cuttingPrice, // Keep for backward compatibility
                areaM2: preview.areaM2,
                lineTotal: preview.lineTotal,
                // Store raw operations too for editing/re-calc
                rawOperations: operations
            };

            setCart(prev => [...prev, cartItem]);

            // Reset current line
            setCurrentLine({
                glassTypeId: '',
                width: '',
                height: '',
                dimensionUnit: 'CM',
                operations: []
            });

            showSuccess(t('messages.saveSuccess'));
            setTimeout(() => glassTypeRef.current?.focus(), 100);

        } catch (err) {
            console.error('Calculate price error:', err);
            showError(err.response?.data?.message || t('messages.saveError'));
        } finally {
            setIsCalculatingPrice(false);
        }
    };

    const handleRemoveFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
        showInfo(t('cart.removeItem'));
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
            showError(t('messages.selectCustomerError'));
            return;
        }

        if (cart.length === 0) {
            showError(t('messages.noGlassItems'));
            return;
        }

        const total = calculateCartTotal();
        const TOLERANCE = 0.01; // 1 piaster tolerance for floating point comparison

        // Validate payment for CASH customers
        if (selectedCustomer.customerType === 'CASH') {
            if (Math.abs(amountPaidNow - total) > TOLERANCE) {
                showError(t('payment.cashMustPayFull'));
                return;
            }
        }

        // Validate payment amount
        if (amountPaidNow < 0) {
            showError(t('payment.invalidAmount'));
            return;
        }

        if (amountPaidNow > total + TOLERANCE) {
            showError(t('payment.amountExceedsTotal'));
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

            showSuccess(t('messages.invoiceCreatedSuccess'));

            // Try to create print jobs (non-blocking)
            try {
                setIsCreatingPrintJobs(true);
                await printJobService.createAllPrintJobs(createdInvoice.id);
                showSuccess(t('messages.saveSuccess'));
            } catch (printError) {
                console.error('Print jobs creation error:', printError);
                showWarning(t('messages.invoiceCreationError'));
            } finally {
                setIsCreatingPrintJobs(false);
            }

            // Close confirmation and reset
            setShowConfirmation(false);
            handleResetPOS();

            // Reload invoices
            loadInvoices(0);

        } catch (error) {
            console.error('Create invoice error:', error);
            showError(error.response?.data?.message || t('messages.invoiceCreationError'));
        } finally {
            setIsCreating(false);
        }
    };

    // Print and factory operations
    const handlePrintInvoice = async (invoice, type = 'CLIENT') => {
        setIsPrinting(true);
        try {
            // createSinglePrintJob opens the PDF directly via blob fetch with auth
            await printJobService.createSinglePrintJob(invoice.id, type);
            showSuccess(t('messages.saveSuccess'));
        } catch (err) {
            console.error('Print invoice error:', err);
            showError(t('messages.saveError'));
        } finally {
            setIsPrinting(false);
        }
    };

    const handleSendToFactory = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: t('navigation.factory'),
            message: t('messages.confirmDelete'),
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

            // Check if STICKER is missing
            const isStickerMissing = status.missingJobTypes && status.missingJobTypes.includes('STICKER');

            if (isStickerMissing) {
                // Create ONLY sticker
                await printJobService.createSinglePrintJob(invoice.id, 'STICKER');
            }

            showSuccess(t('messages.saveSuccess'));
            loadInvoices(currentPage);
        } catch (err) {
            console.error('Send to factory error:', err);
            showError(t('messages.saveError'));
        } finally {
            setIsSendingToFactory(false);
        }
    };

    const handleMarkAsPaid = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.markAsPaid'),
            message: t('messages.markAsPaidConfirm'),
            type: 'warning',
            onConfirm: async () => {
                await executeMarkAsPaid(invoice);
            }
        });
    };

    const executeMarkAsPaid = async (invoice) => {
        try {
            await invoiceService.markAsPaid(invoice.id);
            showSuccess(t('messages.saveSuccess'));
            loadInvoices(currentPage);
        } catch (err) {
            console.error('Mark as paid error:', err);
            showError(t('messages.saveError'));
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
            dimensionUnit: 'CM',
            operations: []
        });
        setAmountPaidNow(0);
        setPaymentMethod('CASH');
    };

    // Invoice list operations
    const handleViewInvoice = (invoice) => {
        navigate(`/invoices/${invoice.id}`);
    };

    return (
        <div className="dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <PageHeader
                        title={t('invoices.cashierTitle')}
                        subtitle={currentMode === 'list' ? t('invoices.invoicesList') : t('invoices.createNew')}
                    />
                    {/* WebSocket Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        wsConnected
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                        {wsConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
                        <span className="text-xs font-medium">
                            {wsConnected ? t('factory.connected') : t('factory.disconnected')}
                        </span>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-2 mt-4">
                    <Button
                        variant={currentMode === 'list' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('list')}
                        className="flex items-center gap-2"
                    >
                        <FiShoppingCart />
                        {t('invoices.invoicesList')}
                    </Button>
                    <Button
                        variant={currentMode === 'create' || currentMode === 'addCustomer' ? 'primary' : 'outline'}
                        onClick={() => setCurrentMode('create')}
                        className="flex items-center gap-2"
                    >
                        <FiPlus />
                        {t('invoices.createNew')}
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                                loading={isCalculatingPrice}
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
                                        {isCreating ? t('invoices.creatingInvoice') :
                                            isCreatingPrintJobs ? t('invoices.creatingPrintJobs') : t('invoices.createInvoice')}
                                        <kbd className="mr-2 px-2 py-1 bg-white/20 rounded text-xs font-mono">F2</kbd>
                                    </Button>

                                    {/* Keyboard Shortcuts */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                            {t('keyboard.shortcuts')}:
                                        </p>
                                        <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Ctrl+Enter</kbd>
                                                <span>{t('keyboard.addToCart')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">F2</kbd>
                                                <span>{t('invoices.createInvoice')}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">Esc</kbd>
                                                <span>{t('keyboard.cancelOperation')}</span>
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
                        searchTerm={filters.customerName}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onSearchChange={(val) => handleFilterChange('customerName', val)}
                        onPageChange={(page) => loadInvoices(page)}
                        onViewInvoice={handleViewInvoice}
                        onPrintInvoice={handlePrintInvoice}
                        onSendToFactory={handleSendToFactory}
                        onMarkAsPaid={handleMarkAsPaid}
                    />
                )}
            </div>

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
                            showSuccess(t('printJob.retrySuccess'));
                            const newStatus = await printJobService.checkPrintJobStatus(printJobStatus.invoiceId);
                            setPrintJobStatus(newStatus);
                        } catch (err) {
                            showError(t('printJob.retryFailed'));
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