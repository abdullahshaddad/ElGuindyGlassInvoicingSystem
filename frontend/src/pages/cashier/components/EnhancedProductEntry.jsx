import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiTrash2, FiInfo, FiAlertCircle, FiLayers } from 'react-icons/fi';
import Input from '@components/ui/Input.jsx';
import Select from '@components/ui/Select.jsx';
import Button from '@components/ui/Button.jsx';
import Badge from '@components/ui/Badge.jsx';
import FarmaTypeSelector from './FarmaTypeSelector.jsx';
import ShatafTypeSelector from './ShatafTypeSelector.jsx';
import { SHATAF_TYPES, SHATAF_CATEGORIES } from '@/constants/shatafTypes.js';
import { FARMA_TYPES } from '@/constants/farmaTypes.js';

/**
 * EnhancedProductEntry - Multi-operation card layout
 * Supports multiple operations (SHATAF, FARMA, LASER) per line item
 *
 * Props:
 *  - glassTypes: array of available glass types
 *  - currentLine: object containing glass info and operations array
 *  - onLineChange: function(updatedLine) - called when line data changes
 *  - onAddToCart: function() - called when user wants to add to cart
 *  - disabled: bool
 *  - glassTypeRef: ref for focusing glass type select
 */

const LASER_TYPES = {
    NORMAL: { key: 'NORMAL', arabicName: 'ليزر عادي' },
    DEEP: { key: 'DEEP', arabicName: 'ليزر عميق' },
    ENGRAVE: { key: 'ENGRAVE', arabicName: 'حفر ليزر' },
    POLISH: { key: 'POLISH', arabicName: 'تلميع ليزر' }
};

// Maximum number of operations allowed per line item
const MAX_OPERATIONS_PER_LINE = 10;

const EnhancedProductEntry = ({
    glassTypes = [],
    currentLine = {},
    onLineChange,
    onAddToCart,
    disabled = false,
    glassTypeRef
}) => {
    const { t } = useTranslation();
    // Ensure operations array exists
    const operations = currentLine.operations || [];

    const [touched, setTouched] = useState(false);
    const [validation, setValidation] = useState({ isValid: true, errors: [] });
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Helper for generating unique IDs
    const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // Glass options for select dropdown
    const glassOptions = useMemo(
        () =>
            (glassTypes || []).map((g) => (
                <option key={g.id} value={g.id}>
                    {`${g.name} (${g.thickness || 0} مم) - ${(g.pricePerMeter || 0).toFixed(2)} جنيه/م${g.calculationMethod === 'AREA' ? '²' : ''}`}
                </option>
            )),
        [glassTypes]
    );

    // Validation logic
    useEffect(() => {
        const errors = [];

        // Basic validations
        if (!currentLine.glassTypeId) {
            errors.push(t('product.validation.glassTypeRequired'));
        }

        const width = Number(currentLine.width || 0);
        const height = Number(currentLine.height || 0);

        if (!width || width <= 0) {
            errors.push(t('product.validation.widthRequired'));
        }
        if (!height || height <= 0) {
            errors.push(t('product.validation.heightRequired'));
        }

        // Validate each operation (operations are optional)
        operations.forEach((op, idx) => {
            const prefix = `${t('product.validation.operationPrefix')} ${idx + 1}: `;

            if (op.type === 'SHATAF') {
                if (!op.shatafType) {
                    errors.push(prefix + t('product.validation.shatafTypeRequired'));
                } else {
                    const st = SHATAF_TYPES[op.shatafType];

                    // Validate Farma / Calculation Method
                    if (st?.requiresFarma) {
                        if (!op.farmaType) {
                            errors.push(prefix + t('product.validation.farmaRequired'));
                        } else {
                            const ft = FARMA_TYPES[op.farmaType];
                            if (ft?.requiresDiameter && (!op.diameter || Number(op.diameter) <= 0)) {
                                errors.push(prefix + t('product.validation.diameterRequired'));
                            }
                            if (ft?.isManual && (op.manualCuttingPrice === null || op.manualCuttingPrice === undefined || op.manualCuttingPrice === '')) {
                                errors.push(prefix + t('product.validation.manualPriceRequired'));
                            }
                        }
                    }

                    if (st?.requiresManualPrice && (op.manualCuttingPrice === null || op.manualCuttingPrice === undefined || op.manualCuttingPrice === '')) {
                        // This is likely deprecated for new types but kept for safety
                        errors.push(prefix + t('product.validation.cuttingPriceRequired'));
                    }
                }
            } else if (op.type === 'LASER') {
                if (!op.laserType) {
                    errors.push(prefix + t('product.validation.laserTypeRequired'));
                }
                if (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '') {
                    errors.push(prefix + t('product.validation.laserPriceRequired'));
                }
            }
        });

        setValidation({ isValid: errors.length === 0, errors });
    }, [currentLine, operations, t]);

    // Update operations array
    const updateOperations = (newOps) => {
        onLineChange({ ...currentLine, operations: newOps });
        setTouched(true);
    };

    // Add a new operation (with max limit)
    const addOperation = (type) => {
        // Check max operations limit
        if (operations.length >= MAX_OPERATIONS_PER_LINE) {
            return; // Silently ignore, button will be disabled
        }

        const base = {
            id: makeId(),
            type
        };

        if (type === 'SHATAF') {
            base.shatafType = '';
            base.farmaType = null; // Default null, force user to select
            base.diameter = null;
            base.manualCuttingPrice = null;
        } else if (type === 'LASER') {
            base.laserType = '';
            base.manualPrice = null;
            base.notes = '';
        }

        updateOperations([...operations, base]);
    };

    // Remove an operation
    const removeOperation = (id) => {
        updateOperations(operations.filter((o) => o.id !== id));
    };

    // Update a single operation by ID
    const patchOperation = (id, patch) => {
        const newOps = operations.map((op) => (op.id === id ? { ...op, ...patch } : op));
        updateOperations(newOps);
    };

    // Handle shataf type change with proper field resets
    const handleShatafTypeChange = (opId, newShatafType) => {
        const typeInfo = SHATAF_TYPES[newShatafType];
        const patch = {
            shatafType: newShatafType,
            manualCuttingPrice: null, // Reset manual price
            // Reset farma but keep calculation method selection open
            farmaType: '',
            diameter: null
        };
        patchOperation(opId, patch);
    };

    // Handle add to cart
    const handleAddToCartClick = () => {
        setTouched(true);
        if (validation.isValid) {
            onAddToCart();
        }
    };

    // Keyboard shortcut handler
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

    // ========== Render Card Components ==========

    const ShatafCard = ({ op, t }) => {
        const st = op.shatafType ? SHATAF_TYPES[op.shatafType] : null;

        // Define if we should show calculation method (Farma) selector
        // Show for formula based types
        const showCalculationMethod = st?.requiresFarma;

        // Check if selected calculation method is Manual (Rotation/Tableaux)
        const isManualMethod = op.farmaType ? FARMA_TYPES[op.farmaType]?.isManual : false;

        // Check if selected method requires diameter
        const requiresDiameter = op.farmaType ? FARMA_TYPES[op.farmaType]?.requiresDiameter : false;

        return (
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="info" className="text-xs">{t('product.addShataf')}</Badge>
                        {st && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {st.arabicName}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => removeOperation(op.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title={t('product.removeOperation')}
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Shataf Type Selector */}
                    <div>
                        <ShatafTypeSelector
                            value={op.shatafType || ''}
                            onChange={(v) => handleShatafTypeChange(op.id, v)}
                            disabled={disabled}
                            showDescription={showAdvanced}
                        />
                    </div>

                    {/* Calculation Method (Farma) Selector */}
                    {showCalculationMethod && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('product.calculationMethod')}
                                <span className="text-red-500 mr-1">*</span>
                            </label>
                            <FarmaTypeSelector
                                value={op.farmaType || ''}
                                onChange={(v) => patchOperation(op.id, { farmaType: v })}
                                width={currentLine.width}
                                height={currentLine.height}
                                diameter={op.diameter}
                                disabled={disabled}
                                showCalculationPreview={showAdvanced}
                            />
                        </div>
                    )}

                    {/* Diameter (if farma requires it) */}
                    {requiresDiameter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('product.diameter')}
                                <span className="text-red-500 mr-1">*</span>
                            </label>
                            <Input
                                type="number"
                                value={op.diameter || ''}
                                onChange={(e) => patchOperation(op.id, { diameter: e.target.value })}
                                placeholder="0"
                                step="1"
                                min="1"
                                disabled={disabled}
                            />
                        </div>
                    )}

                    {/* Manual Price (if required by Manual Shataf OR Manual Calculation Method) */}
                    {(st?.requiresManualPrice || isManualMethod) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {isManualMethod ? t('product.manualCalcPrice') : t('product.manualCuttingPrice')}
                                <span className="text-red-500 mr-1">*</span>
                            </label>
                            <Input
                                type="number"
                                value={op.manualCuttingPrice ?? ''}
                                onChange={(e) => patchOperation(op.id, { manualCuttingPrice: e.target.value })}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                disabled={disabled}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const LaserCard = ({ op, t }) => {
        const lt = op.laserType ? LASER_TYPES[op.laserType] : null;

        return (
            <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="warning" className="text-xs">{t('product.addLaser')}</Badge>
                        {lt && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {t(`product.laser.${lt.key}`)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => removeOperation(op.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title={t('product.removeOperation')}
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Laser Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.laserType')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Select
                            value={op.laserType || ''}
                            onChange={(e) => patchOperation(op.id, { laserType: e.target.value })}
                            disabled={disabled}
                        >
                            <option value="">{t('product.selectLaserType')}</option>
                            {Object.values(LASER_TYPES).map((l) => (
                                <option key={l.key} value={l.key}>{t(`product.laser.${l.key}`)}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Manual Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.laserPrice')}
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Input
                            type="number"
                            value={op.manualPrice ?? ''}
                            onChange={(e) => patchOperation(op.id, { manualPrice: e.target.value })}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={disabled}
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('product.notes')}
                        </label>
                        <Input
                            value={op.notes || ''}
                            onChange={(e) => patchOperation(op.id, { notes: e.target.value })}
                            placeholder={t('product.notesOptional')}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </div>
        );
    };

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
                        type="number"
                        value={currentLine.width || ''}
                        onChange={(e) => onLineChange({ ...currentLine, width: e.target.value })}
                        placeholder="0"
                        step="0.1"
                        min="0.1"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.height')}
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="number"
                        value={currentLine.height || ''}
                        onChange={(e) => onLineChange({ ...currentLine, height: e.target.value })}
                        placeholder="0"
                        step="0.1"
                        min="0.1"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('product.quantity')}
                    </label>
                    <Input
                        type="number"
                        value={currentLine.quantity || 1}
                        onChange={(e) => onLineChange({ ...currentLine, quantity: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                        step="1"
                        min="1"
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* Operations Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('product.operations')}
                        <span className="text-red-500 mr-1">*</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOperation('SHATAF')}
                            disabled={disabled || operations.length >= MAX_OPERATIONS_PER_LINE}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            title={operations.length >= MAX_OPERATIONS_PER_LINE ? t('product.maxOperationsReached') : ''}
                        >
                            <FiPlus className="ml-1" size={14} />
                            {t('product.addShataf')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOperation('LASER')}
                            disabled={disabled || operations.length >= MAX_OPERATIONS_PER_LINE}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                            title={operations.length >= MAX_OPERATIONS_PER_LINE ? t('product.maxOperationsReached') : ''}
                        >
                            <FiPlus className="ml-1" size={14} />
                            {t('product.addLaser')}
                        </Button>
                    </div>
                </div>

                {/* Operations List */}
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
                            <div key={op.id}>
                                {op.type === 'SHATAF' && <ShatafCard op={op} t={t} />}
                                {op.type === 'LASER' && <LaserCard op={op} t={t} />}
                            </div>
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