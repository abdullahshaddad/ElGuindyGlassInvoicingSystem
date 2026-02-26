import React, { useState, useMemo } from 'react';
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
import { useFactoryInvoices, useUpdateLineStatus } from '@services/factoryService';
import { usePrintInvoice } from '@services/printService';
import useAuthorized from '@hooks/useAuthorized';
import { useSnackbar } from '@contexts/SnackbarContext';

/**
 * Factory Worker Page - Cutting Jobs View
 *
 * Optimized for factory workers to execute cutting jobs.
 * Features:
 * - Jobs grouped by glass thickness for batch processing
 * - Cutting specifications prominently displayed
 * - Beveling type, dimensions, quantity clearly visible
 * - View sticker for each job
 * - Real-time updates via Convex reactive queries (no WebSocket needed)
 */
const FactoryWorkerPage = () => {
    const { t, i18n } = useTranslation();
    const { isAuthorized, isLoading: authLoading } = useAuthorized(['WORKER', 'OWNER', 'ADMIN']);
    const { showSuccess, showError } = useSnackbar();

    // State - UI only
    const [selectedThickness, setSelectedThickness] = useState('ALL');
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
    const [hideCompleted, setHideCompleted] = useState(true); // Hide completed jobs by default

    // Convex reactive query - auto-updates in real-time, no WebSocket or polling needed
    const { results: factoryInvoicesRaw, status: paginationStatus, loadMore } = useFactoryInvoices();

    // Convex mutations
    const updateLineStatusMutation = useUpdateLineStatus();
    const { printSticker } = usePrintInvoice();

    // Derive loading state
    const loading = paginationStatus === "LoadingFirstPage";

    const transformLine = (line, invoice) => {
        // New DB format: operations[].operationType: {code, ar, en}, .calculationMethod?: {code, ar, en}, .price
        const ops = line.operations || [];

        // Derive beveling info from first non-LASER, non-SANDING operation
        let bevelingType = null;
        let bevelingFormula = null;
        for (const op of ops) {
            const code = op.operationType?.code;
            if (code && code !== 'LASER' && code !== 'SANDING') {
                bevelingType = op.operationType?.ar || code;
                bevelingFormula = op.calculationMethod?.ar || null;
                break;
            }
        }

        const snapshot = line.glassTypeSnapshot || line.glassType || {};
        const dims = line.dimensions || {};
        const thickness = snapshot.thickness || null;

        return {
            id: line._id || line.id,
            invoiceId: invoice._id || invoice.id,
            invoiceNumber: invoice.readableId || invoice.invoiceNumber || '',
            customerName: invoice.customer?.name || invoice.customerName || 'عميل',
            // Glass info
            glassType: snapshot.name || 'زجاج',
            thickness,
            thicknessDisplay: thickness ? `${thickness} مم` : 'غير محدد',
            // Dimensions (from nested dimensions object)
            width: dims.width || line.width,
            height: dims.height || line.height,
            widthCm: dims.width || line.width,
            heightCm: dims.height || line.height,
            dimensionUnit: dims.measuringUnit || 'CM',
            areaM2: line.areaM2,
            // Cutting specifications
            bevelingType,
            bevelingFormula,
            bevelingMeters: line.bevelingMeters,
            // Quantity
            quantity: line.quantity || 1,
            // Status
            status: line.status || 'PENDING',
            // Operations — pass through raw DB format
            operations: ops.map(op => ({
                description: op.operationType?.ar || op.operationType?.code || '',
                calcMethod: op.calculationMethod?.ar || '',
                price: op.price || 0,
            })),
            // Notes
            notes: line.notes || '',
            // Timestamp
            timestamp: invoice.issueDate
        };
    };

    // Transform factory invoices data into the format expected by the UI
    const invoices = useMemo(() => {
        if (!factoryInvoicesRaw || factoryInvoicesRaw.length === 0) return [];
        return factoryInvoicesRaw.map(inv => ({
            id: inv._id || inv.id,
            customerName: inv.customer?.name || inv.customerName || 'عميل',
            customerPhone: inv.customer?.phone || inv.customerPhone || '',
            timestamp: inv.issueDate,
            status: inv.status,
            workStatus: inv.workStatus || 'PENDING',
            lines: (inv.lines || inv.invoiceLines || []).map(line => transformLine(line, inv))
        }));
    }, [factoryInvoicesRaw]);

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

    const handleViewSticker = async (invoiceId, lineId) => {
        try {
            await printSticker(invoiceId, lineId);
            showSuccess(t('factory.stickerCreated', 'تم فتح الملصق'));
        } catch (error) {
            console.error('Error opening sticker:', error);
            showError(t('factory.stickerError'));
        }
    };

    /**
     * Handle status change for a line
     */
    const handleStatusChange = async (lineId, newStatus, invoiceId) => {
        try {
            await updateLineStatusMutation({ lineId, status: newStatus });
            showSuccess(t('factory.statusUpdated'));
            // No manual state update needed - Convex auto-updates via reactive query
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
                        {/* Convex is always connected - show real-time indicator */}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <FiBell size={16} />
                            <span className="text-sm font-medium">
                                {t('factory.connected', 'متصل')}
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

            {/* Load More */}
            {paginationStatus === "CanLoadMore" && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => loadMore(50)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        {t('common.loadMore', 'تحميل المزيد')}
                    </button>
                </div>
            )}
            {paginationStatus === "LoadingMore" && (
                <div className="flex justify-center mt-6">
                    <div className="text-gray-600 dark:text-gray-400">{t('app.loading')}</div>
                </div>
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
                                onViewSticker={() => onViewSticker(job.invoiceId, job.id)}
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
                    onViewSticker={() => onViewSticker(job.invoiceId, job.id)}
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

    const getBevelingDisplay = () => {
        if (job.bevelingType) {
            const formula = job.bevelingFormula ? ` (${job.bevelingFormula})` : '';
            return `${job.bevelingType}${formula}`;
        }
        return null;
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full">
            {/* Header - Customer & Invoice */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {job.customerName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        #{job.invoiceNumber}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-3 flex-1">
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

                {/* Beveling Type */}
                {getBevelingDisplay() && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-1">
                            <FiScissors className="text-purple-600 dark:text-purple-400" size={14} />
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">{t('factory.bevelingType')}</span>
                        </div>
                        <div className="text-sm font-bold text-purple-800 dark:text-purple-300">
                            {getBevelingDisplay()}
                        </div>
                        {job.shatafMeters > 0 && (
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {job.shatafMeters.toFixed(2)} {t('factory.bevelingMeters')}
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
