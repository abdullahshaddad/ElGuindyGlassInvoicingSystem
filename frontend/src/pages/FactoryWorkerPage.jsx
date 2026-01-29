import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiCheckCircle,
    FiClock,
    FiRefreshCw,
    FiPackage,
    FiFileText,
    FiLayers,
    FiBell,
    FiSquare,
    FiGrid,
    FiScissors,
    FiTag,
    FiEye,
    FiEyeOff
} from 'react-icons/fi';
import {
    Button,
    Badge
} from '@components';
import { invoiceService } from '@services/invoiceService';
import { printJobService } from '@services/printJobService';
import useAuthorized from '@hooks/useAuthorized';
import { useWebSocket, WEBSOCKET_TOPICS } from '@hooks/useWebSocket';
import { useSnackbar } from '@contexts/SnackbarContext';

/**
 * Factory Worker Page - Cutting Jobs View
 *
 * Optimized for factory workers to execute cutting jobs.
 * Features:
 * - Jobs grouped by glass thickness for batch processing
 * - Cutting specifications prominently displayed
 * - Chamfer type, dimensions, quantity clearly visible
 * - View sticker for each job
 * - WebSocket for real-time notifications
 */
const FactoryWorkerPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['WORKER', 'OWNER', 'ADMIN']);
    const { showSuccess, showError, showInfo } = useSnackbar();

    // State
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedThickness, setSelectedThickness] = useState('ALL');
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
    const [hideCompleted, setHideCompleted] = useState(false); // Hide completed jobs

    // ==================== WebSocket Handlers ====================

    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    }, []);

    const handleLineStatusChange = useCallback((data) => {
        console.log('Line status changed:', data);
        setInvoices(prev => prev.map(inv => {
            if (inv.id === data.invoiceId) {
                return {
                    ...inv,
                    lines: inv.lines.map(line =>
                        line.id === data.lineId
                            ? { ...line, status: data.newStatus }
                            : line
                    )
                };
            }
            return inv;
        }));
    }, []);

    const handleInvoiceWorkStatusChange = useCallback((data) => {
        console.log('Invoice work status changed:', data);
        setInvoices(prev => prev.map(inv => {
            if (inv.id === data.invoiceId) {
                return {
                    ...inv,
                    workStatus: data.newStatus
                };
            }
            return inv;
        }));
        showInfo(`${t('factory.invoiceWorkStatusChanged')} #${data.invoiceId}: ${t(`factory.workStatus.${data.newStatus}`)}`);
    }, [showInfo, t]);

    // ==================== Data Loading ====================
    // Defined before WebSocket handler to be used in callback

    const loadRecentInvoices = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);

            const response = await invoiceService.listInvoices({
                page: 0,
                size: 50,
                sortBy: 'issueDate',
                sortDirection: 'DESC'
            });

            const invoicesWithLines = await Promise.all(
                (response.content || []).map(async (inv) => {
                    try {
                        const fullInvoice = await invoiceService.getInvoice(inv.id);
                        return {
                            id: fullInvoice.id,
                            customerName: fullInvoice.customer?.name || 'عميل',
                            customerPhone: fullInvoice.customer?.phone || '',
                            timestamp: fullInvoice.issueDate,
                            status: fullInvoice.status,
                            workStatus: fullInvoice.workStatus || 'PENDING',
                            lines: (fullInvoice.invoiceLines || []).map(line => transformLine(line, fullInvoice))
                        };
                    } catch (e) {
                        console.error('Error loading invoice details:', e);
                        return null;
                    }
                })
            );

            setInvoices(invoicesWithLines.filter(Boolean));

        } catch (err) {
            console.error('Load invoices error:', err);
            showError(t('messages.loadingCuttingJobs'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showError, t]);

    const transformLine = (line, invoice) => {
        // Extract chamfer/shatf information from operations
        let chamferType = null;
        let chamferFormula = null;
        const operations = [];

        if (line.operations && line.operations.length > 0) {
            line.operations.forEach(op => {
                if (op.type === 'SHATAF' || op.operationType === 'SHATAF') {
                    chamferType = op.shatafType || op.description || 'شطف';
                    chamferFormula = op.farmaType || null;
                }
                operations.push({
                    type: op.type || op.operationType,
                    description: op.description || op.operationType?.arabicName || '',
                    shatafType: op.shatafType,
                    farmaType: op.farmaType,
                    price: op.operationPrice || op.manualPrice
                });
            });
        }

        // Legacy fallback
        if (!chamferType && line.shatafType) {
            chamferType = line.shatafType;
        }
        if (!chamferFormula && line.farmaType) {
            chamferFormula = line.farmaType;
        }

        return {
            id: line.id,
            invoiceId: invoice.id,
            customerName: invoice.customer?.name || 'عميل',
            // Glass info
            glassType: line.glassType?.name || 'زجاج',
            thickness: line.glassType?.thickness || null,
            thicknessDisplay: line.glassType?.thickness ? `${line.glassType.thickness} مم` : '-',
            // Dimensions
            width: line.width,
            height: line.height,
            widthCm: line.width, // Backend stores in CM
            heightCm: line.height,
            dimensionUnit: line.dimensionUnit || 'CM',
            areaM2: line.areaM2,
            // Cutting specifications
            chamferType: chamferType,
            chamferFormula: chamferFormula,
            shatafMeters: line.shatafMeters,
            cuttingType: line.cuttingType,
            // Quantity
            quantity: line.quantity || 1,
            // Status
            status: line.status || 'PENDING',
            // Operations
            operations: operations,
            // Notes
            notes: line.notes || '',
            // Timestamp
            timestamp: invoice.issueDate
        };
    };

    // ==================== WebSocket Connection ====================

    // WebSocket message handler - defined after loadRecentInvoices
    const handleWebSocketMessage = useCallback((topic, data) => {
        console.log('Factory WebSocket message:', topic, data);

        if (topic === WEBSOCKET_TOPICS.FACTORY_NEW_INVOICE) {
            console.log('New cutting job received:', data);
            playNotificationSound();
            showSuccess(`${t('factory.newCuttingJob')} #${data.invoiceId} - ${data.customerName}`);
            loadRecentInvoices(false);
        } else if (topic === WEBSOCKET_TOPICS.FACTORY_LINE_STATUS) {
            handleLineStatusChange(data);
        } else if (topic === WEBSOCKET_TOPICS.FACTORY_INVOICE_WORK_STATUS) {
            handleInvoiceWorkStatusChange(data);
        } else if (topic === WEBSOCKET_TOPICS.FACTORY_PRINT_UPDATE) {
            console.log('Print update received:', data);
        }
    }, [playNotificationSound, handleLineStatusChange, handleInvoiceWorkStatusChange, showSuccess, loadRecentInvoices, t]);

    // WebSocket connection using the reusable hook
    const { connected } = useWebSocket({
        topics: [
            WEBSOCKET_TOPICS.FACTORY_NEW_INVOICE,
            WEBSOCKET_TOPICS.FACTORY_LINE_STATUS,
            WEBSOCKET_TOPICS.FACTORY_INVOICE_WORK_STATUS,
            WEBSOCKET_TOPICS.FACTORY_PRINT_UPDATE
        ],
        onMessage: handleWebSocketMessage,
        enabled: isAuthorized
    });

    // ==================== Lifecycle ====================

    useEffect(() => {
        if (isAuthorized) {
            loadRecentInvoices();
        }
    }, [isAuthorized, loadRecentInvoices]);

    // Auto-refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (isAuthorized && !loading) {
                loadRecentInvoices(false);
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [isAuthorized, loading, loadRecentInvoices]);

    // ==================== Data Processing ====================

    // Get all cutting jobs (lines) with invoice context
    const getAllCuttingJobs = (applyCompletedFilter = true) => {
        let allJobs = [];
        invoices.forEach(inv => {
            (inv.lines || []).forEach(line => {
                allJobs.push(line);
            });
        });
        // Filter out completed jobs if hideCompleted is true
        if (applyCompletedFilter && hideCompleted) {
            allJobs = allJobs.filter(job => job.status !== 'COMPLETED');
        }
        return allJobs;
    };

    // Group jobs by thickness
    const getJobsGroupedByThickness = () => {
        const jobs = getAllCuttingJobs();
        const grouped = {};

        jobs.forEach(job => {
            const thicknessKey = job.thickness || 'غير محدد';
            if (!grouped[thicknessKey]) {
                grouped[thicknessKey] = [];
            }
            grouped[thicknessKey].push(job);
        });

        // Sort groups by thickness (numeric)
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'غير محدد') return 1;
            if (b === 'غير محدد') return -1;
            return parseFloat(a) - parseFloat(b);
        });

        return sortedKeys.map(key => ({
            thickness: key,
            thicknessDisplay: key === 'غير محدد' ? key : `${key} مم`,
            jobs: grouped[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        }));
    };

    // Get filtered jobs
    const getFilteredJobs = () => {
        const allJobs = getAllCuttingJobs();

        if (selectedThickness === 'ALL') {
            return allJobs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        return allJobs
            .filter(job => String(job.thickness) === selectedThickness)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    };

    // Get available thicknesses for filter
    const getAvailableThicknesses = () => {
        const thicknesses = new Set();
        getAllCuttingJobs().forEach(job => {
            if (job.thickness) thicknesses.add(job.thickness);
        });
        return Array.from(thicknesses).sort((a, b) => a - b);
    };

    // ==================== Statistics ====================

    const stats = {
        totalJobs: getAllCuttingJobs().length,
        pendingJobs: getAllCuttingJobs().filter(j => j.status === 'PENDING').length,
        totalPieces: getAllCuttingJobs().reduce((sum, j) => sum + (j.quantity || 1), 0)
    };

    // ==================== Actions ====================

    const handleRefresh = () => {
        setRefreshing(true);
        loadRecentInvoices(false);
    };

    const handleViewSticker = async (invoiceId) => {
        try {
            await printJobService.openStickerPdf(invoiceId);
        } catch (error) {
            console.error('Error opening sticker:', error);
        }
    };

    /**
     * Handle status change for a line
     */
    const handleStatusChange = async (lineId, newStatus, invoiceId) => {
        try {
            await invoiceService.updateLineStatus(lineId, newStatus);
            showSuccess(t('factory.statusUpdated'));

            // Update local state
            setInvoices(prevInvoices =>
                prevInvoices.map(inv => {
                    if (inv.id === invoiceId) {
                        return {
                            ...inv,
                            invoiceLines: inv.invoiceLines?.map(line =>
                                line.id === lineId ? { ...line, status: newStatus } : line
                            )
                        };
                    }
                    return inv;
                })
            );
        } catch (error) {
            console.error('Error updating status:', error);
            showError(t('factory.statusUpdateError'));
        }
    };

    // ==================== Render ====================

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-400">{t('app.loading')}</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-red-600 dark:text-red-400">{t('messages.unauthorized')}</div>
            </div>
        );
    }

    const groupedJobs = getJobsGroupedByThickness();
    const filteredJobs = getFilteredJobs();
    const availableThicknesses = getAvailableThicknesses();

    const isRTL = i18n.language === 'ar';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FiScissors className="text-blue-600" />
                            {t('factory.title')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {t('factory.subtitle')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Connection status */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            connected
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                            <FiBell size={16} />
                            <span className="text-sm font-medium">
                                {connected ? t('factory.connected') : t('factory.disconnected')}
                            </span>
                        </div>

                        {/* View mode toggle */}
                        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setViewMode('grouped')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'grouped'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <FiLayers size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                                <FiGrid size={16} />
                            </button>
                        </div>

                        {/* Hide completed toggle */}
                        <button
                            onClick={() => setHideCompleted(!hideCompleted)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                hideCompleted
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={hideCompleted ? t('factory.showCompleted') : t('factory.hideCompleted')}
                        >
                            {hideCompleted ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            <span className="hidden sm:inline">
                                {hideCompleted ? t('factory.showCompleted') : t('factory.hideCompleted')}
                            </span>
                        </button>

                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2"
                        >
                            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
                            <span>{t('factory.refresh')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    icon={<FiScissors className="text-blue-600 dark:text-blue-400" size={24} />}
                    iconBg="bg-blue-100 dark:bg-blue-900/20"
                    value={stats.totalJobs}
                    label={t('factory.cuttingJobs')}
                />
                <StatCard
                    icon={<FiClock className="text-yellow-600 dark:text-yellow-400" size={24} />}
                    iconBg="bg-yellow-100 dark:bg-yellow-900/20"
                    value={stats.pendingJobs}
                    label={t('factory.waiting')}
                />
                <StatCard
                    icon={<FiSquare className="text-purple-600 dark:text-purple-400" size={24} />}
                    iconBg="bg-purple-100 dark:bg-purple-900/20"
                    value={stats.totalPieces}
                    label={t('factory.totalPieces')}
                />
            </div>

            {/* Content based on view mode */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-600 dark:text-gray-400">{t('app.loading')}</div>
                </div>
            ) : getAllCuttingJobs().length === 0 ? (
                <EmptyState t={t} />
            ) : viewMode === 'grouped' ? (
                <GroupedView groups={groupedJobs} onViewSticker={handleViewSticker} onStatusChange={handleStatusChange} t={t} />
            ) : (
                <ListView
                    jobs={filteredJobs}
                    selectedThickness={selectedThickness}
                    availableThicknesses={availableThicknesses}
                    onThicknessChange={setSelectedThickness}
                    onViewSticker={handleViewSticker}
                    onStatusChange={handleStatusChange}
                    t={t}
                />
            )}
        </div>
    );
};

// ==================== Sub Components ====================

const StatCard = ({ icon, iconBg, value, label }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-4">
            <div className={`p-3 ${iconBg} rounded-lg`}>
                {icon}
            </div>
            <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
            </div>
        </div>
    </div>
);

const EmptyState = ({ t }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
        <FiPackage className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
        <p className="text-gray-600 dark:text-gray-400 text-lg">{t('factory.noCuttingJobs')}</p>
    </div>
);

/**
 * Grouped View - Jobs organized by glass thickness
 */
const GroupedView = ({ groups, onViewSticker, onStatusChange, t }) => (
    <div className="space-y-8">
        {groups.map(group => (
            <div key={group.thickness} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Group Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="text-2xl font-black text-white">
                                    {group.thickness === t('factory.unspecified') || group.thickness === 'غير محدد' ? '?' : group.thickness}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {t('factory.thickness')} {group.thicknessDisplay}
                                </h2>
                                <p className="text-blue-100 text-sm">
                                    {group.jobs.length} {t('factory.orders')} • {group.jobs.reduce((sum, j) => sum + (j.quantity || 1), 0)} {t('factory.pieces')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Jobs Grid */}
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.jobs.map((job, index) => (
                            <CuttingJobCard
                                key={`${job.invoiceId}-${job.id}-${index}`}
                                job={job}
                                onViewSticker={() => onViewSticker(job.invoiceId)}
                                onStatusChange={onStatusChange}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

/**
 * List View - Flat list with thickness filter
 */
const ListView = ({ jobs, selectedThickness, availableThicknesses, onThicknessChange, onViewSticker, onStatusChange, t }) => (
    <div>
        {/* Thickness Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
            <button
                onClick={() => onThicknessChange('ALL')}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedThickness === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
            >
                {t('factory.all')} ({jobs.length})
            </button>
            {availableThicknesses.map(thickness => (
                <button
                    key={thickness}
                    onClick={() => onThicknessChange(String(thickness))}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedThickness === String(thickness)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                    {thickness} {t('common.millimeter')}
                </button>
            ))}
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jobs.map((job, index) => (
                <CuttingJobCard
                    key={`${job.invoiceId}-${job.id}-${index}`}
                    job={job}
                    onViewSticker={() => onViewSticker(job.invoiceId)}
                    onStatusChange={onStatusChange}
                    showThickness
                    t={t}
                />
            ))}
        </div>
    </div>
);

/**
 * Cutting Job Card
 * Displays all cutting-related details for a single job
 */
const CuttingJobCard = ({ job, onViewSticker, onStatusChange, showThickness = false, t }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300';
            case 'IN_PROGRESS':
                return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300';
            case 'PENDING':
            default:
                return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'COMPLETED': return t('factory.status.COMPLETED');
            case 'IN_PROGRESS': return t('factory.status.IN_PROGRESS');
            default: return t('factory.status.PENDING');
        }
    };

    const getChamferDisplay = () => {
        if (job.chamferType) {
            const formula = job.chamferFormula ? ` (${job.chamferFormula})` : '';
            return `${job.chamferType}${formula}`;
        }
        return null;
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-all">
            {/* Header - Customer & Invoice */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {job.customerName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        #{job.invoiceId}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-3">
                {/* Glass Type & Thickness */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {job.glassType}
                        </div>
                        {showThickness && job.thickness && (
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {job.thicknessDisplay}
                            </div>
                        )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(job.status)}`}>
                        {getStatusText(job.status)}
                    </span>
                </div>

                {/* Dimensions - Prominent */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 text-center">{t('factory.dimensions')}</div>
                    <div className="text-2xl font-black text-center text-gray-900 dark:text-white">
                        {job.width?.toFixed(1)} × {job.height?.toFixed(1)}
                    </div>
                    {job.areaM2 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                            {job.areaM2.toFixed(3)} {t('common.squareMeter')}
                        </div>
                    )}
                </div>

                {/* Quantity - Very Prominent */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('invoices.quantity')}</div>
                    <div className="text-4xl font-black text-blue-700 dark:text-blue-300">
                        {job.quantity}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">{t('factory.piece')}</div>
                </div>

                {/* Chamfer/Shatf Type */}
                {getChamferDisplay() && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-1">
                            <FiScissors className="text-purple-600 dark:text-purple-400" size={14} />
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('factory.chamferType')}</span>
                        </div>
                        <div className="text-sm font-bold text-purple-800 dark:text-purple-300">
                            {getChamferDisplay()}
                        </div>
                        {job.shatafMeters > 0 && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {job.shatafMeters.toFixed(2)} {t('factory.chamferMeters')}
                            </div>
                        )}
                    </div>
                )}

                {/* Operations */}
                {job.operations && job.operations.length > 0 && (
                    <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <FiTag size={12} />
                            {t('factory.operations')}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {job.operations.map((op, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded font-medium"
                                >
                                    {op.description || op.type}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {job.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 border-r-4 border-yellow-400">
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">{t('factory.notes')}</div>
                        <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            {job.notes}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer - Status Actions & View Sticker */}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 space-y-2">
                {/* Status Change Buttons */}
                {onStatusChange && (
                    <div className="flex gap-2">
                        {job.status !== 'IN_PROGRESS' && (
                            <button
                                onClick={() => onStatusChange(job.id, 'IN_PROGRESS', job.invoiceId)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <FiClock size={16} />
                                <span>{t('factory.startWork')}</span>
                            </button>
                        )}
                        {job.status !== 'COMPLETED' && (
                            <button
                                onClick={() => onStatusChange(job.id, 'COMPLETED', job.invoiceId)}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <FiCheckCircle size={16} />
                                <span>{t('factory.markComplete')}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* View Sticker Button */}
                <button
                    onClick={onViewSticker}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                    <FiFileText size={18} />
                    <span>{t('factory.viewSticker')}</span>
                </button>
            </div>
        </div>
    );
};

export default FactoryWorkerPage;
