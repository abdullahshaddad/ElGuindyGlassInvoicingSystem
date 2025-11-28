import React, { useEffect, useMemo, useState } from 'react';
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

const EnhancedProductEntry = ({
                                  glassTypes = [],
                                  currentLine = {},
                                  onLineChange,
                                  onAddToCart,
                                  disabled = false,
                                  glassTypeRef
                              }) => {
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
            errors.push('نوع الزجاج مطلوب');
        }

        const width = Number(currentLine.width || 0);
        const height = Number(currentLine.height || 0);

        if (!width || width <= 0) {
            errors.push('العرض مطلوب ويجب أن يكون أكبر من صفر');
        }
        if (!height || height <= 0) {
            errors.push('الارتفاع مطلوب ويجب أن يكون أكبر من صفر');
        }

        // Must have at least one operation
        if (operations.length === 0) {
            errors.push('يجب إضافة عملية واحدة على الأقل (شطف، فارمة، أو ليزر)');
        }

        // Validate each operation
        operations.forEach((op, idx) => {
            const prefix = `العملية ${idx + 1}: `;

            if (op.type === 'SHATAF') {
                if (!op.shatafType) {
                    errors.push(prefix + 'نوع الشطف مطلوب');
                } else {
                    const st = SHATAF_TYPES[op.shatafType];
                    if (st?.requiresManualPrice && (op.manualCuttingPrice === null || op.manualCuttingPrice === undefined || op.manualCuttingPrice === '')) {
                        errors.push(prefix + 'سعر القطع اليدوي مطلوب لهذا النوع من الشطف');
                    }
                    if (st?.requiresFarma && !op.farmaType) {
                        errors.push(prefix + 'نوع الفارمة مطلوب لهذا الشطف');
                    }
                    if (op.farmaType) {
                        const ft = FARMA_TYPES[op.farmaType];
                        if (ft?.requiresDiameter && (!op.diameter || Number(op.diameter) <= 0)) {
                            errors.push(prefix + 'القطر مطلوب لنوع الفارمة المحدد');
                        }
                    }
                }
            } else if (op.type === 'FARMA') {
                if (!op.farmaType) {
                    errors.push(prefix + 'نوع الفارمة مطلوب');
                } else {
                    const ft = FARMA_TYPES[op.farmaType];
                    if (ft?.isManual && (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '')) {
                        errors.push(prefix + 'السعر اليدوي مطلوب لنوع الفارمة');
                    }
                    if (ft?.requiresDiameter && (!op.diameter || Number(op.diameter) <= 0)) {
                        errors.push(prefix + 'القطر مطلوب لنوع الفارمة');
                    }
                }
            } else if (op.type === 'LASER') {
                if (!op.laserType) {
                    errors.push(prefix + 'نوع الليزر مطلوب');
                }
                if (op.manualPrice === null || op.manualPrice === undefined || op.manualPrice === '') {
                    errors.push(prefix + 'سعر الليزر مطلوب');
                }
            }
        });

        setValidation({ isValid: errors.length === 0, errors });
    }, [currentLine, operations]);

    // Update operations array
    const updateOperations = (newOps) => {
        onLineChange({ ...currentLine, operations: newOps });
        setTouched(true);
    };

    // Add a new operation
    const addOperation = (type) => {
        const base = {
            id: makeId(),
            type
        };

        if (type === 'SHATAF') {
            base.shatafType = '';
            base.farmaType = null;
            base.diameter = null;
            base.manualCuttingPrice = null;
        } else if (type === 'FARMA') {
            base.farmaType = '';
            base.diameter = null;
            base.manualPrice = null;
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
            manualCuttingPrice: typeInfo?.requiresManualPrice ? '' : null,
            farmaType: typeInfo?.requiresFarma ? '' : null,
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

    const ShatafCard = ({ op }) => {
        const st = op.shatafType ? SHATAF_TYPES[op.shatafType] : null;

        return (
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="info" className="text-xs">شطف</Badge>
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
                        title="حذف العملية"
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

                    {/* Farma Type (if required) */}
                    {st?.requiresFarma && (
                        <div>
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
                    {op.farmaType && FARMA_TYPES[op.farmaType]?.requiresDiameter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                القطر (مم)
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

                    {/* Manual Price (if required) */}
                    {st?.requiresManualPrice && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                سعر القطع اليدوي
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

    const FarmaCard = ({ op }) => {
        const ft = op.farmaType ? FARMA_TYPES[op.farmaType] : null;

        return (
            <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="success" className="text-xs">فارمة</Badge>
                        {ft && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {ft.arabicName}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => removeOperation(op.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="حذف العملية"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Farma Type Selector */}
                    <div>
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

                    {/* Diameter (if required) */}
                    {ft?.requiresDiameter && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                القطر (مم)
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

                    {/* Manual Price (if manual type) */}
                    {ft?.isManual && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                السعر اليدوي
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
                    )}
                </div>
            </div>
        );
    };

    const LaserCard = ({ op }) => {
        const lt = op.laserType ? LASER_TYPES[op.laserType] : null;

        return (
            <div className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-3 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Badge variant="warning" className="text-xs">ليزر</Badge>
                        {lt && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {lt.arabicName}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => removeOperation(op.id)}
                        disabled={disabled}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        title="حذف العملية"
                    >
                        <FiTrash2 size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Laser Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نوع الليزر
                            <span className="text-red-500 mr-1">*</span>
                        </label>
                        <Select
                            value={op.laserType || ''}
                            onChange={(e) => patchOperation(op.id, { laserType: e.target.value })}
                            disabled={disabled}
                        >
                            <option value="">-- اختر نوع الليزر --</option>
                            {Object.values(LASER_TYPES).map((l) => (
                                <option key={l.key} value={l.key}>{l.arabicName}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Manual Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            سعر الليزر
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
                            ملاحظات
                        </label>
                        <Input
                            value={op.notes || ''}
                            onChange={(e) => patchOperation(op.id, { notes: e.target.value })}
                            placeholder="ملاحظات (اختياري)"
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
                    اضافة صنف جديد
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs"
                >
                    {showAdvanced ? 'اخفاء التفاصيل' : 'عرض التفاصيل'}
                </Button>
            </div>

            {/* Glass Type and Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        نوع الزجاج
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Select
                        ref={glassTypeRef}
                        value={currentLine.glassTypeId || ''}
                        onChange={(e) => onLineChange({ ...currentLine, glassTypeId: e.target.value })}
                        disabled={disabled || glassTypes.length === 0}
                    >
                        <option value="">
                            {glassTypes.length === 0 ? 'جاري التحميل...' : '-- اختر نوع الزجاج --'}
                        </option>
                        {glassOptions}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        العرض (مم)
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="number"
                        value={currentLine.width || ''}
                        onChange={(e) => onLineChange({ ...currentLine, width: e.target.value })}
                        placeholder="0"
                        step="1"
                        min="1"
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الارتفاع (مم)
                        <span className="text-red-500 mr-1">*</span>
                    </label>
                    <Input
                        type="number"
                        value={currentLine.height || ''}
                        onChange={(e) => onLineChange({ ...currentLine, height: e.target.value })}
                        placeholder="0"
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
                        العمليات
                        <span className="text-red-500 mr-1">*</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOperation('SHATAF')}
                            disabled={disabled}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                            <FiPlus className="ml-1" size={14} />
                            شطف
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOperation('FARMA')}
                            disabled={disabled}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                            <FiPlus className="ml-1" size={14} />
                            فارمة
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOperation('LASER')}
                            disabled={disabled}
                            className="text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                            <FiPlus className="ml-1" size={14} />
                            ليزر
                        </Button>
                    </div>
                </div>

                {/* Operations List */}
                {operations.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <FiInfo className="mx-auto text-gray-400 mb-2" size={24} />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            لم تقم باضافة اي عملية بعد
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            اضغط على احد الازرار اعلاه لاضافة شطف او فارمة او ليزر
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {operations.map((op) => (
                            <div key={op.id}>
                                {op.type === 'SHATAF' && <ShatafCard op={op} />}
                                {op.type === 'FARMA' && <FarmaCard op={op} />}
                                {op.type === 'LASER' && <LaserCard op={op} />}
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
                                يرجى تصحيح الاخطاء التالية:
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
                    اضافة الى السلة
                    <kbd className="mr-2 px-2 py-1 bg-white/20 rounded text-xs font-mono">Ctrl+Enter</kbd>
                </Button>
            </div>
        </div>
    );
};

export default EnhancedProductEntry;