import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2, FiInfo, FiAlertCircle, FiLayers } from 'react-icons/fi';
import Input from '@components/ui/Input.jsx';
import Select from '@components/ui/Select.jsx';
import Button from '@components/ui/Button.jsx';
import Badge from '@components/ui/Badge.jsx';
import BevelingCalculationSelector from './BevelingCalculationSelector.jsx';
import BevelingTypeSelector from './BevelingTypeSelector.jsx';
import { BEVELING_TYPES, BEVELING_CATEGORIES } from '@/constants/bevelingTypes.js';
import { BEVELING_CALCULATIONS } from '@/constants/bevelingCalculations.js';

/**
 * EnhancedProductEntry - Multi-operation card layout
 * Supports multiple operations per line item.
 *
 * Each operation in state has the shape:
 *   { id, bevelingType, calcMethod?, diameter?, manualMeters?, manualPrice? }
 *
 * bevelingType = one of the operationTypeCode values (KHARZAN, LASER, SANDING, etc.)
 * calcMethod   = one of the calculationMethodCode values (STRAIGHT, FRAME_HEAD, etc.)
 */

const MAX_OPERATIONS_PER_LINE = 10;

// Extracted outside EnhancedProductEntry so React keeps a stable component
// identity across re-renders — prevents inputs from losing focus on every keystroke.
const OperationCard = ({
    op,
    disabled,
    showAdvanced,
    lineWidth,
    lineHeight,
    onRemove,
    onBevelingTypeChange,
    onPatch,
}) => {
    const { t } = useTranslation();
    const st = op.bevelingType ? BEVELING_TYPES[op.bevelingType] : null;
    const showCalcMethod = st?.requiresCalculation;
    const isManualMethod = op.calcMethod ? BEVELING_CALCULATIONS[op.calcMethod]?.isManual : false;
    const requiresDiameter = op.calcMethod ? BEVELING_CALCULATIONS[op.calcMethod]?.requiresDiameter : false;

    const borderColor = st?.category === BEVELING_CATEGORIES.MANUAL_INPUT
        ? 'border-purple-200 dark:border-purple-800'
        : st?.category === BEVELING_CATEGORIES.AREA_BASED
            ? 'border-green-200 dark:border-green-800'
            : 'border-blue-200 dark:border-blue-800';

    const badgeLabel = st?.category === BEVELING_CATEGORIES.MANUAL_INPUT
        ? t('product.addLaser')
        : st?.category === BEVELING_CATEGORIES.AREA_BASED
            ? t('product.sanding', 'صنفرة')
            : t('product.addShataf');

    const badgeVariant = st?.category === BEVELING_CATEGORIES.MANUAL_INPUT ? 'warning'
        : st?.category === BEVELING_CATEGORIES.AREA_BASED ? 'success' : 'info';

    return (
        <div className={`bg-white dark:bg-gray-800 border ${borderColor} rounded-lg p-4 space-y-3 shadow-sm`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant} className="text-xs">{badgeLabel}</Badge>
                    {st && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {st.arabicName}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => onRemove(op.id)}
                    disabled={disabled}
                    className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                    title={t('product.removeOperation')}
                >
                    <FiTrash2 size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                    <BevelingTypeSelector
                        value={op.bevelingType || ''}
                        onChange={(v) => onBevelingTypeChange(op.id, v)}
                        disabled={disabled}
                        showDescription={showAdvanced}
                    />
                </div>

                {showCalcMethod && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.calculationMethod')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <BevelingCalculationSelector
                            value={op.calcMethod || ''}
                            onChange={(v) => onPatch(op.id, { calcMethod: v })}
                            width={lineWidth}
                            height={lineHeight}
                            diameter={op.diameter}
                            disabled={disabled}
                            showCalculationPreview={showAdvanced}
                        />
                    </div>
                )}

                {requiresDiameter && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.diameter')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            value={op.diameter || ''}
                            onChange={(e) => onPatch(op.id, { diameter: e.target.value })}
                            placeholder="0"
                            disabled={disabled}
                        />
                    </div>
                )}

                {isManualMethod && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.manualCalcPrice', 'عدد الأمتار (يدوي)')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={op.manualMeters ?? ''}
                            onChange={(e) => onPatch(op.id, { manualMeters: e.target.value })}
                            placeholder="0.00"
                            disabled={disabled}
                        />
                    </div>
                )}

                {st?.requiresManualPrice && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.laserPrice')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={op.manualPrice ?? ''}
                            onChange={(e) => onPatch(op.id, { manualPrice: e.target.value })}
                            placeholder="0.00"
                            disabled={disabled}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

const EnhancedProductEntry = ({
    glassTypes = [],
    currentLine = {},
    onLineChange,
    onAddToCart,
    disabled = false,
    glassTypeRef
}) => {
    const { t } = useTranslation();
    const operations = currentLine.operations || [];

    const [touched, setTouched] = useState(false);
    const [validation, setValidation] = useState({ isValid: true, errors: [] });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const glassOptions = useMemo(
        () =>
            (glassTypes || []).map((g) => (
                <option key={g._id} value={g._id}>
                    {t('product.glassOptionLabel', { name: g.name, thickness: g.thickness || 0, price: (g.pricePerMeter || 0).toFixed(2) })}
                </option>
            )),
        [glassTypes]
    );

    // Validation logic
    useEffect(() => {
        const errors = [];

        if (!currentLine.glassTypeId) {
            errors.push(t('product.validation.glassTypeRequired'));
        }

        const width = Number(currentLine.width || 0);
        const height = Number(currentLine.height || 0);

        if (!width || width <= 0) errors.push(t('product.validation.widthRequired'));
        if (!height || height <= 0) errors.push(t('product.validation.heightRequired'));

        // Validate each operation
        operations.forEach((op, idx) => {
            const prefix = `${t('product.validation.operationPrefix')} ${idx + 1}: `;

            if (!op.bevelingType) {
                errors.push(prefix + t('product.validation.shatafTypeRequired'));
                return;
            }

            const st = BEVELING_TYPES[op.bevelingType];

            // Formula-based types need a calculation method
            if (st?.requiresCalculation) {
                if (!op.calcMethod) {
                    errors.push(prefix + t('product.validation.farmaRequired'));
                } else {
                    const ft = BEVELING_CALCULATIONS[op.calcMethod];
                    if (ft?.requiresDiameter && (!op.diameter || Number(op.diameter) <= 0)) {
                        errors.push(prefix + t('product.validation.diameterRequired'));
                    }
                    if (ft?.isManual && (op.manualMeters === null || op.manualMeters === undefined || op.manualMeters === '')) {
                        errors.push(prefix + t('product.validation.manualPriceRequired'));
                    }
                }
            }

            // LASER requires manual price
            if (st?.requiresManualPrice && (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '')) {
                errors.push(prefix + t('product.validation.laserPriceRequired'));
            }
        });

        setValidation({ isValid: errors.length === 0, errors });
    }, [currentLine, operations, t]);

    const updateOperations = (newOps) => {
        onLineChange({ ...currentLine, operations: newOps });
        setTouched(true);
    };

    const addOperation = () => {
        if (operations.length >= MAX_OPERATIONS_PER_LINE) return;

        updateOperations([...operations, {
            id: makeId(),
            bevelingType: '',
            calcMethod: null,
            diameter: null,
            manualMeters: null,
            manualPrice: null,
        }]);
    };

    const removeOperation = (id) => {
        updateOperations(operations.filter((o) => o.id !== id));
    };

    const patchOperation = (id, patch) => {
        updateOperations(operations.map((op) => (op.id === id ? { ...op, ...patch } : op)));
    };

    const handleBevelingTypeChange = (opId, newBevelingType) => {
        patchOperation(opId, {
            bevelingType: newBevelingType,
            calcMethod: '',
            diameter: null,
            manualMeters: null,
            manualPrice: null,
        });
    };

    const handleAddToCartClick = () => {
        setTouched(true);
        if (validation.isValid) {
            onAddToCart();
            setTouched(false);
        }
    };

    // Keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleAddToCartClick();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [validation.isValid]);

    // ========== Main Render ==========
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiLayers className="text-blue-600" />
                    {t('product.addNewItem')}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs"
                >
                    {showAdvanced ? t('product.hideDetails') : t('product.showDetails')}
                </Button>
            </div>

            {/* Glass Type, Dimensions, and Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.glassType')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Select
                        ref={glassTypeRef}
                        value={currentLine.glassTypeId || ''}
                        onChange={(e) => onLineChange({ ...currentLine, glassTypeId: e.target.value })}
                        disabled={disabled || glassTypes.length === 0}
                    >
                        <option value="">
                            {glassTypes.length === 0 ? t('app.loading') : t('product.selectGlassType')}
                        </option>
                        {glassOptions}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.width')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={currentLine.width || ''}
                        onChange={(e) => onLineChange({ ...currentLine, width: e.target.value })}
                        placeholder="0"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.height')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={currentLine.height || ''}
                        onChange={(e) => onLineChange({ ...currentLine, height: e.target.value })}
                        placeholder="0"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.quantity')}
                    </label>
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={currentLine.quantity || 1}
                        onChange={(e) => onLineChange({ ...currentLine, quantity: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Operations Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('product.operations')}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addOperation}
                        disabled={disabled || operations.length >= MAX_OPERATIONS_PER_LINE}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        title={operations.length >= MAX_OPERATIONS_PER_LINE ? t('product.maxOperationsReached') : ''}
                    >
                        <FiPlus className="ml-1" size={14} />
                        {t('product.addOperation', 'إضافة عملية')}
                    </Button>
                </div>

                {operations.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <FiInfo className="mx-auto text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('product.noOperationsYet')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {t('product.clickToAddOperation')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {operations.map((op) => (
                            <OperationCard
                                key={op.id}
                                op={op}
                                disabled={disabled}
                                showAdvanced={showAdvanced}
                                lineWidth={currentLine.width}
                                lineHeight={currentLine.height}
                                onRemove={removeOperation}
                                onBevelingTypeChange={handleBevelingTypeChange}
                                onPatch={patchOperation}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Validation Errors */}
            {touched && !validation.isValid && validation.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                                {t('product.validation.fixErrors')}
                            </p>
                            <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                {validation.errors.map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Add to Cart Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    variant="primary"
                    onClick={handleAddToCartClick}
                    disabled={disabled}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    icon={<FiPlus />}
                >
                    {t('product.addToCart')}
                    <kbd className="mr-2 px-2 py-1 bg-white/20 rounded text-xs font-mono">Ctrl+Enter</kbd>
                </Button>
            </div>
        </div>
    );
};

export default EnhancedProductEntry;
