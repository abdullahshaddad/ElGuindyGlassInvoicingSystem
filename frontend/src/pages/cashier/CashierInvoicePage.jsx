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
import ProductEntry from './components/ProductEntry';
import ShoppingCart from './components/ShoppingCart';
import NewCustomerForm from './components/NewCustomerForm';
import InvoiceList from './components/InvoiceList';
import InvoiceViewModal from './components/InvoiceViewModal';
import PrintJobStatusModal from './components/PrintJobStatusModal';

const CashierInvoicesPage = () => {
    const { t } = useTranslation();
    const { showSuccess, showError, showInfo, showWarning } = useSnackbar();

    // Main states
    const [currentMode, setCurrentMode] = useState('list');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

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

    // Load initial data
    useEffect(() => {
        loadInvoices();
        loadGlassTypes();
    }, []);

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
            showError('فشل في تحميل الفواتير');
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
        setTimeout(() => glassTypeRef.current?.focus(), 100);
    };

    const handleStartNewCustomer = () => {
        const searchValue = customerSearch.trim();
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
            showError('اسم العميل مطلوب');
            return;
        }

        setIsAddingCustomer(true);
        try {
            const savedCustomer = await customerService.createCustomer(newCustomer);
            setSelectedCustomer(savedCustomer);
            setCurrentMode('create');
            setNewCustomer({ name: '', phone: '', address: '', email: '' });
            showSuccess(`تم إضافة العميل ${savedCustomer.name} بنجاح`);
            setTimeout(() => glassTypeRef.current?.focus(), 100);
        } catch (err) {
            console.error('Create customer error:', err);
            showError('فشل في إضافة العميل');
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const handleCancelNewCustomer = () => {
        setCurrentMode('create');
        setNewCustomer({ name: '', phone: '', address: '', email: '' });
    };

    // Cart/Invoice line management
    const handleAddLineToCart = async () => {
        if (!currentLine.glassTypeId || !currentLine.width || !currentLine.height) {
            showError('يرجى ملء جميع البيانات المطلوبة');
            return;
        }

        const glassType = glassTypes.find(gt => gt.id == currentLine.glassTypeId);
        if (!glassType) {
            showError('نوع الزجاج غير صحيح');
            return;
        }

        if (currentLine.cuttingType === 'LASER' && !currentLine.manualCuttingPrice) {
            showError('يرجى إدخال سعر القطع للقطع بالليزر');
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
            showError('فشل في حساب سعر البند. يرجى المحاولة مرة أخرى.');
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
            showError('فشل في إعادة حساب السعر');
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

    const handleRemoveFromCart = (itemId) => {
        setCart(prev => prev.filter(item => item.id !== itemId));
    };

    const calculateCartTotals = () => {
        const subtotal = cart.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
        return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: 0,
            total: Math.round(subtotal * 100) / 100
        };
    };

    // Create invoice
    const handleCreateInvoice = async () => {
        if (!selectedCustomer) {
            showError('يرجى اختيار العميل');
            return;
        }

        if (cart.length === 0) {
            showError('يرجى إضافة عنصر واحد على الأقل للفاتورة');
            return;
        }

        setIsCreating(true);

        try {
            const invoiceData = {
                customerId: selectedCustomer.id,
                issueDate: new Date().toISOString(),
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

            showSuccess(`تم إنشاء الفاتورة رقم ${newInvoice.id} بنجاح! الإجمالي: ${totals.total.toFixed(2)} ج.م`);

            // Ask if user wants to create print jobs
            setConfirmDialog({
                isOpen: true,
                title: 'إنشاء مهام الطباعة',
                message: 'هل تريد إنشاء وطباعة الفواتير وإرسال الملصق للمصنع الآن؟',
                type: 'info',
                onConfirm: async () => {
                    await createAndPrintInvoice(newInvoice.id);
                }
            });

            handleResetPOS();
            loadInvoices();

        } catch (err) {
            console.error('Create invoice error:', err);
            showError(err.response?.data?.message || 'فشل في إنشاء الفاتورة');
        } finally {
            setIsCreating(false);
        }
    };

    // Create and print invoice (CLIENT + OWNER + STICKER)
    const createAndPrintInvoice = async (invoiceId) => {
        setIsCreatingPrintJobs(true);
        try {
            const result = await printJobService.createSinglePrintJob(invoiceId, 'STICKER');

            if (result.success) {
                showSuccess('تم إنشاء مهام الطباعة بنجاح');

                // Get the created jobs
                const status = await printJobService.getPrintJobStatus(invoiceId);
                const jobs = status.jobs || [];

                // Open CLIENT and OWNER PDFs
                const clientJob = jobs.find(job => job.type === 'CLIENT');
                if (clientJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(clientJob), '_blank');
                }

                const ownerJob = jobs.find(job => job.type === 'OWNER');
                if (ownerJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(ownerJob), '_blank');
                }

                showInfo('تم إرسال الملصق للمصنع');
            }
        } catch (err) {
            console.error('Create print jobs error:', err);
            showError('فشل في إنشاء مهام الطباعة');
        } finally {
            setIsCreatingPrintJobs(false);
        }
    };

    // Print invoice (CLIENT + OWNER only)
    const handlePrintInvoice = async (invoice) => {
        if (!invoice || !invoice.id) {
            showError('معلومات الفاتورة غير صحيحة');
            return;
        }

        try {
            setIsPrinting(true);
            setPrintStatus('جاري التحقق من مهام الطباعة...');

            const status = await printJobService.getPrintJobStatus(invoice.id);

            const needsClient = status.missingJobTypes?.includes('CLIENT');
            const needsOwner = status.missingJobTypes?.includes('OWNER');

            // Create CLIENT if missing
            if (needsClient) {
                setPrintStatus('جاري إنشاء نسخة العميل...');
                const clientResult = await printJobService.createSinglePrintJob(invoice.id, 'CLIENT');
                if (clientResult.success && clientResult.printJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(clientResult.printJob), '_blank');
                }
            }

            // Create OWNER if missing
            if (needsOwner) {
                setPrintStatus('جاري إنشاء نسخة المالك...');
                const ownerResult = await printJobService.createSinglePrintJob(invoice.id, 'OWNER');
                if (ownerResult.success && ownerResult.printJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(ownerResult.printJob), '_blank');
                }
            }

            // If PDFs exist, just open them
            if (!needsClient && !needsOwner) {
                const existingJobs = status.jobs || [];

                const clientJob = existingJobs.find(job => job.type === 'CLIENT');
                if (clientJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(clientJob), '_blank');
                }

                const ownerJob = existingJobs.find(job => job.type === 'OWNER');
                if (ownerJob?.pdfPath) {
                    window.open(printJobService.getPdfUrl(ownerJob), '_blank');
                }
            }

            showSuccess('تم فتح ملفات PDF للطباعة');
            setPrintStatus(null);

        } catch (err) {
            console.error('Print invoice error:', err);
            showError('فشل في طباعة الفاتورة');
            setPrintStatus(null);
        } finally {
            setIsPrinting(false);
        }
    };

    // Send to factory (STICKER only)
    const handleSendToFactory = async (invoice) => {
        if (!invoice || !invoice.id) {
            showError('معلومات الفاتورة غير صحيحة');
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'إرسال للمصنع',
            message: `هل تريد إرسال ملصق الفاتورة #${invoice.id} للمصنع؟`,
            type: 'info',
            onConfirm: async () => {
                await executeSendToFactory(invoice);
            }
        });
    };

    const executeSendToFactory = async (invoice) => {
        try {
            setIsSendingToFactory(true);
            setPrintStatus('جاري إرسال الملصق للمصنع...');

            const status = await printJobService.getPrintJobStatus(invoice.id);
            const needsSticker = status.missingJobTypes?.includes('STICKER');


                const stickerResult = await printJobService.createSinglePrintJob(invoice.id, 'STICKER');
                if (stickerResult.success) {
                    showSuccess(`تم إرسال ملصق الفاتورة #${invoice.id} للمصنع`);
                }


            setPrintStatus(null);
        } catch (err) {
            console.error('Send to factory error:', err);
            showError('فشل في إرسال الملصق للمصنع');
            setPrintStatus(null);
        } finally {
            setIsSendingToFactory(false);
        }
    };

    // Mark invoice as paid
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
            cuttingType: 'SHATF',
            manualCuttingPrice: ''
        });
    };

    // Invoice list operations
    const handleViewInvoice = (invoice) => {
        setSelectedInvoice(invoice);
        setIsViewModalOpen(true);
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
    }, [currentMode, currentLine, cart, selectedCustomer, isViewModalOpen]);

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

            {printStatus && (
                <div className="mx-6 mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg flex items-center gap-2">
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
                        <div className="lg:col-span-2 space-y-4">
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

                        <div className="space-y-4">
                            <ShoppingCart
                                cart={cart}
                                glassTypes={glassTypes}
                                onRemove={handleRemoveFromCart}
                                onUpdate={handleUpdateCartItem}
                            />

                            {cart.length > 0 && (
                                <EnhancedOrderSummary
                                    cart={cart}
                                    glassTypes={glassTypes}
                                />
                            )}

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
                                        {isCreating ? 'جاري إنشاء الفاتورة...' :
                                            isCreatingPrintJobs ? 'جاري إنشاء مهام الطباعة...' :
                                                'إنشاء الفاتورة (F2)'}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleResetPOS}
                                        disabled={isCreating || isCreatingPrintJobs}
                                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                    >
                                        <FiX className="ml-2" />
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
                                </div>
                            </div>
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

            {/* Confirmation Dialog */}
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