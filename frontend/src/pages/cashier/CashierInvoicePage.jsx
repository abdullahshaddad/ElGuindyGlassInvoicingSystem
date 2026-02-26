import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConvex } from 'convex/react';
import { api } from '@convex/_generated/api';
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
import { useGlassTypes } from '@services/glassTypeService';
import { useSearchCustomers, useCreateCustomer } from '@services/customerService';
import { useInvoices, useCreateInvoice, useMarkAsPaid } from '@services/invoiceService';
import { usePrintInvoice } from '@services/printService';
import { invoiceUtils, getErrorMessage, getErrorDetails } from '@utils';
import { PageHeader } from "@components";
import { useSnackbar } from "@contexts/SnackbarContext.jsx";

// Import sub-components
import PricingBreakdown from './components/PricingBreakdown.jsx';
import EnhancedOrderSummary from './components/EnhancedOrderSummary';
import CustomerSelection from './components/CustomerSelection';
import ShoppingCart from './components/ShoppingCart';
import NewCustomerForm from './components/NewCustomerForm';
import InvoiceList from './components/InvoiceList';

// Import NEW ENHANCED components
import EnhancedProductEntry from './components/EnhancedProductEntry.jsx';
import PaymentPanel from './components/PaymentPanel.jsx';
import InvoiceConfirmationDialog from './components/InvoiceConfirmationDialog.jsx';
import { BEVELING_TYPES } from '@/constants/bevelingTypes.js';
import { BEVELING_CALCULATIONS } from '@/constants/bevelingCalculations.js';

/**
 * Maps a frontend operation object to the backend's bilingual label format.
 * { bevelingType, calcMethod, manualMeters, manualPrice, diameter }
 *   → { operationType: {code, ar, en}, calculationMethod?: {code, ar, en}, manualMeters?, manualPrice? }
 */
const mapOperationToBackend = (op) => {
    const bType = BEVELING_TYPES[op.bevelingType];
    const result = {
        operationType: {
            code: op.bevelingType,
            ar: bType?.arabicName || op.bevelingType,
            en: bType?.englishName || op.bevelingType,
        },
    };
    if (op.calcMethod) {
        const cType = BEVELING_CALCULATIONS[op.calcMethod];
        result.calculationMethod = {
            code: op.calcMethod,
            ar: cType?.arabicName || op.calcMethod,
            en: cType?.englishName || op.calcMethod,
        };
    }
    if (op.manualMeters != null && op.manualMeters !== '') {
        result.manualMeters = parseFloat(op.manualMeters);
    }
    if (op.manualPrice != null && op.manualPrice !== '') {
        result.manualPrice = parseFloat(op.manualPrice);
    }
    return result;
};

const CashierInvoicesPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const convex = useConvex();
    const { showSuccess, showError, showInfo, showWarning } = useSnackbar();

    // Main states
    const [currentMode, setCurrentMode] = useState('list'); // 'list', 'create', 'addCustomer'
    const [loading, setLoading] = useState(false);

    // Convex reactive query for glass types (active only)
    const glassTypes = useGlassTypes(true);

    // Customer search - debounce the query string in state
    const [customerSearch, setCustomerSearch] = useState('');
    const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
    const customerResults = useSearchCustomers(debouncedCustomerSearch.length >= 2 ? debouncedCustomerSearch : undefined);
    const isSearchingCustomers = debouncedCustomerSearch.length >= 2 && customerResults === undefined;

    // Customer search debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedCustomerSearch(customerSearch);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [customerSearch]);

    // Convex mutations
    const createInvoice = useCreateInvoice();
    const createCustomer = useCreateCustomer();
    const markAsPaid = useMarkAsPaid();
    const { printInvoice: doPrintInvoice, printAllStickers } = usePrintInvoice();

    // Invoice list with Convex paginated query
    const [filters, setFilters] = useState({
        customerName: '',
        invoiceId: '',
        startDate: '',
        status: ''
    });

    // Build query args for the invoices paginated query
    const invoiceQueryArgs = {};
    if (filters.status) invoiceQueryArgs.status = filters.status;

    const {
        results: invoices,
        status: invoicePaginationStatus,
        loadMore: loadMoreInvoices,
        isLoading: invoicesLoading
    } = useInvoices({
        ...invoiceQueryArgs,
        initialNumItems: 20
    });

    // Filter invoices client-side for text-based filters (customerName, invoiceId)
    const filteredInvoices = (invoices || []).filter(inv => {
        if (filters.customerName && inv.customerName) {
            if (!inv.customerName.toLowerCase().includes(filters.customerName.toLowerCase())) return false;
        }
        if (filters.invoiceId) {
            const invoiceIdStr = String(inv.invoiceNumber || inv.readableId || '');
            if (!invoiceIdStr.toLowerCase().includes(filters.invoiceId.toLowerCase())) return false;
        }
        return true;
    });

    // POS states
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

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

    // Print states
    const [isPrinting, setIsPrinting] = useState(false);
    const [isSendingToFactory, setIsSendingToFactory] = useState(false);

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

    // Pagination compatibility for InvoiceList component
    const canLoadMore = invoicePaginationStatus === 'CanLoadMore';
    const currentPage = 0; // Convex uses cursor-based, simulate page 0
    const totalPages = canLoadMore ? 2 : 1; // Indicate there's more if CanLoadMore

    // Auto-set payment for CASH customers
    useEffect(() => {
        if (selectedCustomer?.customerType === 'CASH') {
            const total = calculateCartTotal();
            setAmountPaidNow(total);
        }
    }, [selectedCustomer, cart]);

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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Customer handlers
    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setTimeout(() => glassTypeRef.current?.focus(), 100);
    };

    const handleStartNewCustomer = (searchValue) => {
        if (searchValue) {
            setNewCustomer(prev => ({ ...prev, name: searchValue }));
        }
        setCurrentMode('addCustomer');
        setCustomerSearch('');
    };

    const handleSaveNewCustomer = async () => {
        if (!newCustomer.name.trim()) {
            showError(t('customers.fields.name') + ' ' + t('forms.required'));
            return;
        }

        setIsAddingCustomer(true);
        try {
            const savedCustomerId = await createCustomer({
                name: newCustomer.name,
                phone: newCustomer.phone || undefined,
                address: newCustomer.address || undefined,
                customerType: newCustomer.customerType || 'REGULAR'
            });
            // With Convex, createCustomer returns the ID. We need to construct a basic customer object
            // for the selectedCustomer state since the reactive query won't give us this immediately inline
            setSelectedCustomer({
                _id: savedCustomerId,
                name: newCustomer.name,
                phone: newCustomer.phone,
                address: newCustomer.address,
                customerType: newCustomer.customerType
            });
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
            showError(getErrorMessage(err, t('messages.saveError')));
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

        // Validate each operation
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            const prefix = `${t('product.validation.operationPrefix')} ${i + 1}: `;

            if (!op.bevelingType) {
                showError(prefix + t('product.validation.shatafTypeRequired'));
                return;
            }

            const st = BEVELING_TYPES[op.bevelingType];
            if (st?.requiresCalculation && !op.calcMethod) {
                showError(prefix + t('product.validation.farmaRequired'));
                return;
            }

            if (st?.requiresManualPrice && (op.manualPrice == null || op.manualPrice === '')) {
                showError(prefix + t('product.validation.laserPriceRequired'));
                return;
            }
        }

        const glassType = (glassTypes || []).find(gt => gt._id == currentLine.glassTypeId);
        if (!glassType) {
            showError(t('product.validation.glassTypeRequired'));
            return;
        }

        setIsCalculatingPrice(true);

        try {
            // Map operations to backend bilingual format
            const mappedOps = operations
                .filter(op => op.bevelingType)
                .map(mapOperationToBackend);

            // Call backend preview with new format (nested dimensions)
            const preview = await convex.query(api.invoices.queries.previewLineCalculation, {
                glassTypeId: currentLine.glassTypeId,
                dimensions: {
                    width: parseFloat(currentLine.width),
                    height: parseFloat(currentLine.height),
                    measuringUnit: currentLine.dimensionUnit || 'CM',
                },
                ...(mappedOps.length > 0 ? { operations: mappedOps } : {})
            });

            const quantity = parseInt(currentLine.quantity) || 1;
            const lineTotal = preview.lineTotal * quantity;

            const cartItem = {
                id: Date.now(),
                glassTypeId: currentLine.glassTypeId,
                glassType: glassType,
                width: parseFloat(currentLine.width),
                height: parseFloat(currentLine.height),
                dimensionUnit: currentLine.dimensionUnit || 'CM',
                quantity: quantity,
                operations: operations,
                glassPrice: preview.glassPrice,
                operationsPrice: preview.totalOperationsPrice,
                areaM2: preview.areaM2,
                lineTotal: lineTotal,
                backendPreview: preview,
            };

            setCart(prev => [...prev, cartItem]);

            setCurrentLine({
                glassTypeId: '',
                width: '',
                height: '',
                dimensionUnit: 'CM',
                quantity: 1,
                operations: []
            });

            showSuccess(t('messages.saveSuccess'));
            setTimeout(() => glassTypeRef.current?.focus(), 100);

        } catch (err) {
            console.error('Calculate price error:', err);
            const errorMsg = getErrorMessage(err, t('messages.saveError'));
            const details = getErrorDetails(err);
            if (details.length > 0) {
                showError(`${errorMsg}: ${details.join(', ')}`);
            } else {
                showError(errorMsg);
            }
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
        const TOLERANCE = 0.01;

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
            // Prepare invoice request with new nested format
            const invoiceRequest = {
                customerId: selectedCustomer._id,
                lines: cart.map(item => ({
                    glassTypeId: item.glassTypeId,
                    dimensions: {
                        width: item.width,
                        height: item.height,
                        measuringUnit: item.dimensionUnit || 'CM',
                    },
                    quantity: item.quantity || 1,
                    operations: (item.operations || [])
                        .filter(op => op.bevelingType)
                        .map(mapOperationToBackend),
                    notes: item.notes || undefined,
                })),
                amountPaidNow: amountPaidNow > 0 ? amountPaidNow : undefined,
                notes: undefined
            };

            console.log('Sending Invoice Request:', JSON.stringify(invoiceRequest, null, 2));

            // Create invoice via Convex mutation
            const createdInvoiceId = await createInvoice(invoiceRequest);

            console.log('Invoice Created:', createdInvoiceId);

            showSuccess(t('messages.invoiceCreatedSuccess'));

            // Open client invoice preview (non-blocking)
            try {
                await doPrintInvoice(createdInvoiceId, 'CLIENT');
            } catch (printError) {
                console.error('Print preview error:', printError);
                showWarning(t('messages.printError'));
            }

            // Close confirmation and reset
            setShowConfirmation(false);
            handleResetPOS();

            // No manual reload needed - Convex auto-updates the invoices query

        } catch (error) {
            console.error('Create invoice error:', error);
            const errorMsg = getErrorMessage(error, t('messages.invoiceCreationError'));
            const details = getErrorDetails(error);
            if (details.length > 0) {
                showError(`${errorMsg}: ${details.join(', ')}`);
            } else {
                showError(errorMsg);
            }
        } finally {
            setIsCreating(false);
        }
    };

    // Print and factory operations
    const handlePrintInvoice = async (invoice, type = 'CLIENT') => {
        setIsPrinting(true);
        try {
            await doPrintInvoice(invoice._id, type);
            showSuccess(t('messages.saveSuccess'));
        } catch (err) {
            console.error('Print invoice error:', err);
            showError(getErrorMessage(err, t('messages.printError')));
        } finally {
            setIsPrinting(false);
        }
    };

    const handleSendToFactory = async (invoice) => {
        setConfirmDialog({
            isOpen: true,
            title: t('invoices.details.sendToFactoryConfirmTitle'),
            message: t('invoices.details.sendToFactoryConfirmMessage', { id: invoice.readableId }),
            type: 'info',
            onConfirm: async () => {
                await executeSendToFactory(invoice);
            }
        });
    };
    // title: t('invoices.details.sendToFactoryConfirmTitle'),
    //     message: t('invoices.details.sendToFactoryConfirmMessage', { id: invoiceId }),

    const executeSendToFactory = async (invoice) => {
        setIsSendingToFactory(true);
        try {
            await printAllStickers(invoice._id);
            showSuccess(t('messages.saveSuccess'));
        } catch (err) {
            console.error('Send to factory error:', err);
            showError(getErrorMessage(err, t('messages.sendToFactoryError')));
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
            await markAsPaid({ invoiceId: invoice._id });
            showSuccess(t('messages.saveSuccess'));
            // No manual reload needed - Convex auto-updates
        } catch (err) {
            console.error('Mark as paid error:', err);
            showError(getErrorMessage(err, t('messages.markAsPaidError')));
        }
    };

    // Reset POS
    const handleResetPOS = () => {
        setCurrentMode('list');
        setSelectedCustomer(null);
        setCustomerSearch('');
        setCart([]);
        setCurrentLine({
            glassTypeId: '',
            width: '',
            height: '',
            dimensionUnit: 'CM',
            quantity: 1,
            operations: []
        });
        setAmountPaidNow(0);
        setPaymentMethod('CASH');
    };

    // Invoice list operations
    const handleViewInvoice = (invoice) => {
        navigate(`/invoices/${invoice._id}`);
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
                                customerResults={customerResults || []}
                                isSearchingCustomers={isSearchingCustomers}
                                onCustomerSearchChange={setCustomerSearch}
                                onSelectCustomer={handleSelectCustomer}
                                onStartNewCustomer={handleStartNewCustomer}
                                onClearSelection={() => setSelectedCustomer(null)}
                            />

                            {/* Enhanced Product Entry with Multi-Operations */}
                            <EnhancedProductEntry
                                glassTypes={glassTypes || []}
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
                                glassTypes={glassTypes || []}
                                onRemove={handleRemoveFromCart}
                                onUpdate={handleUpdateCartItem}
                            />

                            {/* Order Summary */}
                            {cart.length > 0 && (
                                <EnhancedOrderSummary
                                    cart={cart}
                                    glassTypes={glassTypes || []}
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
                                    disabled={isCreating || false}
                                />
                            )}

                            {/* Create Invoice Button */}
                            {cart.length > 0 && selectedCustomer && (
                                <div className="space-y-3">
                                    <Button
                                        onClick={handleCreateInvoice}
                                        disabled={isCreating || false}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg py-4 shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                                    >
                                        {(isCreating || false) ? (
                                            <LoadingSpinner size="sm" className="ml-2" />
                                        ) : (
                                            <FiDollarSign className="ml-2" />
                                        )}
                                        {isCreating ? t('invoices.creatingInvoice') :
                                            false ? t('invoices.creatingPrintJobs') : t('invoices.createInvoice')}
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
                    <>
                        <InvoiceList
                            isPrinting={isPrinting}
                            isSendingToFactory={isSendingToFactory}
                            invoices={filteredInvoices}
                            loading={invoicesLoading}
                            searchTerm={filters.customerName}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onSearchChange={(val) => handleFilterChange('customerName', val)}
                            onPageChange={() => {
                                if (canLoadMore) loadMoreInvoices(20);
                            }}
                            onViewInvoice={handleViewInvoice}
                            onPrintInvoice={handlePrintInvoice}
                            onSendToFactory={handleSendToFactory}
                            onMarkAsPaid={handleMarkAsPaid}
                        />
                        {canLoadMore && (
                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => loadMoreInvoices(20)}
                                >
                                    {t('common.loadMore')}
                                </Button>
                            </div>
                        )}
                    </>
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

        </div>
    );
};

export default CashierInvoicesPage;
