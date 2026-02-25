import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FiSettings,
    FiSave,
    FiRefreshCw,
    FiDollarSign,
    FiCheck,
    FiX,
    FiEdit3,
    FiInfo,
    FiAlertCircle
} from 'react-icons/fi';
import { FaCalculator, FaRuler } from 'react-icons/fa';
import Button from '@components/ui/Button.jsx';
import Input from '@components/ui/Input.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import { PageHeader } from "@components";
import { useCuttingRates, useUpdateCuttingRate, useCreateCuttingRate } from '@services/cuttingRateService';
import { calculateBeveling } from '@/utils/cuttingUtils.js';

const CuttingPriceRateConfigPage = () => {
    const { t } = useTranslation();

    // Convex reactive query - returns undefined while loading, then array
    const cuttingRatesData = useCuttingRates();
    const loading = cuttingRatesData === undefined;

    // Convex mutations
    const updateCuttingRate = useUpdateCuttingRate();
    const createCuttingRate = useCreateCuttingRate();

    // Thickness range mapping (frontend ranges to backend min/max)
    const thicknessMapping = {
        '0-3': { min: 0.0, max: 3.0 },
        '3.1-4': { min: 3.1, max: 4.0 },
        '4.1-5': { min: 4.1, max: 5.0 },
        '5.1-6': { min: 5.1, max: 6.0 },
        '6.1-8': { min: 6.1, max: 8.0 },
        '8.1-10': { min: 8.1, max: 10.0 },
        '10.1-12': { min: 10.1, max: 12.0 },
        '12+': { min: 12.1, max: 50.0 }
    };

    // Default rates
    const defaultRates = {
        '0-3': 5.0,
        '3.1-4': 7.0,
        '4.1-5': 9.0,
        '5.1-6': 11.0,
        '6.1-8': 13.0,
        '8.1-10': 15.0,
        '10.1-12': 18.0,
        '12+': 18.0
    };

    // States for editing
    const [bevelingRates, setBevelingRates] = useState({ ...defaultRates });
    const [originalRates, setOriginalRates] = useState({ ...defaultRates });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Map Convex cutting rates data to frontend format when data arrives
    useEffect(() => {
        if (cuttingRatesData) {
            const formattedRates = { ...defaultRates };

            // Filter for beveling type rates
            const bevelRates = cuttingRatesData.filter(r => r.cuttingType === 'SHATF');

            bevelRates.forEach(rate => {
                for (const [range, bounds] of Object.entries(thicknessMapping)) {
                    if (Math.abs(rate.minThickness - bounds.min) < 0.01 &&
                        Math.abs(rate.maxThickness - bounds.max) < 0.01) {
                        formattedRates[range] = rate.ratePerMeter || formattedRates[range];
                        break;
                    }
                }
            });

            setBevelingRates(formattedRates);
            setOriginalRates(formattedRates);
        }
    }, [cuttingRatesData]);

    const handleRateChange = (thicknessRange, value) => {
        setBevelingRates(prev => ({
            ...prev,
            [thicknessRange]: parseFloat(value) || 0
        }));
    };

    const startEditing = () => {
        setIsEditing(true);
        setOriginalRates({ ...bevelingRates });
    };

    const cancelEditing = () => {
        setBevelingRates({ ...originalRates });
        setIsEditing(false);
        setError(null);
    };

    const saveBevelingRates = async () => {
        setSaving(true);
        setError(null);

        try {
            // Validate rates
            const hasInvalidRates = Object.values(bevelingRates).some(rate => rate <= 0);
            if (hasInvalidRates) {
                throw new Error(t('cuttingPrices.allPricesMustBePositive'));
            }

            // For each rate, find the matching Convex record and update it, or create if missing
            const bevelRates = (cuttingRatesData || []).filter(r => r.cuttingType === 'SHATF');

            for (const [range, rateValue] of Object.entries(bevelingRates)) {
                const bounds = thicknessMapping[range];
                const existingRate = bevelRates.find(r =>
                    Math.abs(r.minThickness - bounds.min) < 0.01 &&
                    Math.abs(r.maxThickness - bounds.max) < 0.01
                );

                if (existingRate) {
                    await updateCuttingRate({
                        rateId: existingRate._id,
                        ratePerMeter: rateValue
                    });
                } else {
                    await createCuttingRate({
                        cuttingType: 'SHATF',
                        minThickness: bounds.min,
                        maxThickness: bounds.max,
                        ratePerMeter: rateValue
                    });
                }
            }

            setOriginalRates({ ...bevelingRates });
            setIsEditing(false);
            setSuccess(t('cuttingPrices.savedSuccess'));

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Save beveling rates error:', err);
            setError(err.message || t('cuttingPrices.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const calculateSamplePrice = (thickness, width, height) => {
        return calculateBeveling(thickness, width, height);
    };

    const getThicknessRangeLabel = (range) => {
        const mm = t('common.millimeter');
        const labels = {
            '0-3': `0 - 3 ${mm}`,
            '3.1-4': `3.1 - 4 ${mm}`,
            '4.1-5': `4.1 - 5 ${mm}`,
            '5.1-6': `5.1 - 6 ${mm}`,
            '6.1-8': `6.1 - 8 ${mm}`,
            '8.1-10': `8.1 - 10 ${mm}`,
            '10.1-12': `10.1 - 12 ${mm}`,
            '12+': `12+ ${mm}`
        };
        return labels[range] || range;
    };

    const hasChanges = JSON.stringify(bevelingRates) !== JSON.stringify(originalRates);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Page Header */}
            <PageHeader
                title={t('cuttingPrices.title')}
                subtitle={t('cuttingPrices.subtitle')}
                icon={FaCalculator}
                actions={
                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <FiX size={16} className="ml-2" />
                                    {t('actions.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={saveBevelingRates}
                                    disabled={saving || !hasChanges}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                                >
                                    {saving ? (
                                        <LoadingSpinner size="sm" className="ml-2" />
                                    ) : (
                                        <FiSave size={16} className="ml-2" />
                                    )}
                                    {t('cuttingPrices.saveChanges')}
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={startEditing}
                                className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                                <FiEdit3 size={16} className="ml-2" />
                                {t('cuttingPrices.editPrices')}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 mr-auto"
                        >
                            <FiX size={16} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Success Alert */}
            {success && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <FiCheck className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
                        <p className="text-green-800 dark:text-green-200">{success}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSuccess(null)}
                            className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 mr-auto"
                        >
                            <FiX size={16} />
                        </Button>
                    </div>
                </div>
            )}

            <div className="px-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Main Beveling Configuration */}
                    <div className="xl:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <FaRuler className="text-green-600 dark:text-green-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('cuttingPrices.shatafPrices')}</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('cuttingPrices.shatafCalcDescription')}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(bevelingRates).map(([thicknessRange, rate]) => (
                                    <div key={thicknessRange} className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                            <div className="flex items-center gap-3">
                                                <FiDollarSign className="text-green-600 dark:text-green-400" size={16} />
                                                <span className="font-medium text-green-900 dark:text-green-100">
                                                    {getThicknessRangeLabel(thicknessRange)}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                                                    {t('cuttingPrices.pricePerPerimeterMeter')}
                                                </label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={rate}
                                                    onChange={(e) => handleRateChange(thicknessRange, e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="0.00"
                                                    className="border-green-300 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                />
                                            </div>
                                            <div className="text-sm text-green-600 dark:text-green-400">
                                                <div className="font-medium">{t('cuttingPrices.example')}</div>
                                                <div>{`100×50 ${t('common.centimeter')} = ${calculateSamplePrice(parseFloat(thicknessRange.split('-')[0]) || 3, 100, 50).toFixed(2)} ${t('common.currency')}`}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Change Status */}
                            {isEditing && (
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                                    <div className="flex items-center gap-3">
                                        <FiInfo className="text-blue-600 dark:text-blue-400" size={16} />
                                        <div className="text-blue-800 dark:text-blue-200">
                                            {hasChanges ? t('cuttingPrices.unsavedChanges') : t('cuttingPrices.noChanges')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Laser Cutting Notice */}
                        <div className="mt-6 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/30 p-6">
                            <div className="flex items-start gap-3">
                                <FiInfo className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" size={20} />
                                <div>
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">{t('cuttingPrices.laserNotice')}</h3>
                                    <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                                        {t('cuttingPrices.laserDescription')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview & Information Panel */}
                    <div className="space-y-6">
                        {/* Current Pricing Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FiInfo className="text-purple-600 dark:text-purple-400" size={20} />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('cuttingPrices.shatafPreview')}</h3>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(bevelingRates).map(([range, rate]) => (
                                    <div key={range} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-800/30">
                                        <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                                            {getThicknessRangeLabel(range)}
                                        </span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            {rate} {t('cuttingPrices.currencyPerMeter')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Calculation Examples */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('cuttingPrices.calculationExamples')}</h3>

                            <div className="space-y-4">
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('cuttingPrices.glass4mm')}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>{t('cuttingPrices.perimeterLabel')} 2×(1.2+0.8) = 4.0 {t('common.meter')}</div>
                                        <div>{t('cuttingPrices.priceLabel')} 4.0 × {bevelingRates['4.1-5']} = {calculateSamplePrice(4, 120, 80).toFixed(2)} {t('common.currency')}</div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('cuttingPrices.glass6mm')}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>{t('cuttingPrices.perimeterLabel')} 2×(2.0+1.5) = 7.0 {t('common.meter')}</div>
                                        <div>{t('cuttingPrices.priceLabel')} 7.0 × {bevelingRates['5.1-6']} = {calculateSamplePrice(6, 200, 150).toFixed(2)} {t('common.currency')}</div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('cuttingPrices.glass10mm')}</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>{t('cuttingPrices.perimeterLabel')} 2×(1.0+1.0) = 4.0 {t('common.meter')}</div>
                                        <div>{t('cuttingPrices.priceLabel')} 4.0 × {bevelingRates['8.1-10']} = {calculateSamplePrice(10, 100, 100).toFixed(2)} {t('common.currency')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Formula */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30 p-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t('cuttingPrices.calculationFormula')}</h4>
                            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                                <div className="font-mono bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
                                    {t('cuttingPrices.formula1')}
                                </div>
                                <div className="font-mono bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
                                    {t('cuttingPrices.formula2')}
                                </div>
                                <ul className="text-xs space-y-1 mt-2">
                                    <li>{'\u2022'} {t('cuttingPrices.note1')}</li>
                                    <li>{'\u2022'} {t('cuttingPrices.note2')}</li>
                                    <li>{'\u2022'} {t('cuttingPrices.note3')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CuttingPriceRateConfigPage;
