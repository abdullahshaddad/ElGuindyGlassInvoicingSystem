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
import { cuttingRateService } from '@services/cuttingRateService.js';
import { calculateShataf } from '@/utils/cuttingUtils.js';

const CuttingPriceRateConfigPage = () => {
    const { t } = useTranslation();

    // States for Shataf pricing configuration only (matching backend defaults)
    const [shatafRates, setShatafRates] = useState({
        '0-3': 5.0,      // 0.0 - 3.0 mm
        '3.1-4': 7.0,    // 3.1 - 4.0 mm
        '4.1-5': 9.0,    // 4.1 - 5.0 mm
        '5.1-6': 11.0,   // 5.1 - 6.0 mm
        '6.1-8': 13.0,   // 6.1 - 8.0 mm
        '8.1-10': 15.0,  // 8.1 - 10.0 mm
        '10.1-12': 18.0, // 10.1 - 50.0 mm (backend uses 18.0 and max 50.0)
        '12+': 18.0      // Same as 10.1-12 range in backend
    });

    const [originalRates, setOriginalRates] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load current Shataf pricing configuration
    useEffect(() => {
        loadShatafConfig();
    }, []);

    const loadShatafConfig = async () => {
        setLoading(true);
        try {
            const config = await cuttingRateService.getFormattedRates();

            // Extract Shataf rates from the API response
            const shatfRatesFromAPI = config.shatfRates || [];
            const formattedRates = { ...shatafRates }; // Start with defaults

            // Map API rates to our thickness ranges based on exact min/max matching
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

            // Map backend rates to frontend ranges
            shatfRatesFromAPI.forEach(rate => {
                for (const [range, bounds] of Object.entries(thicknessMapping)) {
                    if (Math.abs(rate.minThickness - bounds.min) < 0.01 &&
                        Math.abs(rate.maxThickness - bounds.max) < 0.01) {
                        formattedRates[range] = rate.ratePerMeter || rate.pricePerMeter || formattedRates[range];
                        break;
                    }
                }
            });

            setShatafRates(formattedRates);
            setOriginalRates(formattedRates);
        } catch (err) {
            console.error('Load Shataf config error:', err);
            setError('فشل في تحميل إعدادات أسعار الشطف');

            // Initialize defaults if loading fails
            try {
                await cuttingRateService.initializeShatafDefaults();
                // Retry loading after initialization
                setTimeout(() => loadShatafConfig(), 1000);
            } catch (initError) {
                console.error('Failed to initialize defaults:', initError);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRateChange = (thicknessRange, value) => {
        setShatafRates(prev => ({
            ...prev,
            [thicknessRange]: parseFloat(value) || 0
        }));
    };

    const startEditing = () => {
        setIsEditing(true);
        setOriginalRates({ ...shatafRates });
    };

    const cancelEditing = () => {
        setShatafRates({ ...originalRates });
        setIsEditing(false);
        setError(null);
    };

    const saveShatafRates = async () => {
        setSaving(true);
        setError(null);

        try {
            // Validate rates
            const hasInvalidRates = Object.values(shatafRates).some(rate => rate <= 0);
            if (hasInvalidRates) {
                throw new Error('جميع الأسعار يجب أن تكون أكبر من صفر');
            }

            // Update rates via API (this would need to be implemented in the service)
            await cuttingRateService.updateShatafRatesByThickness(shatafRates);

            setOriginalRates({ ...shatafRates });
            setIsEditing(false);
            setSuccess('تم حفظ أسعار الشطف بنجاح');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Save Shataf rates error:', err);
            setError(err.message || 'فشل في حفظ أسعار الشطف');
        } finally {
            setSaving(false);
        }
    };

    const calculateSamplePrice = (thickness, width, height) => {
        return calculateShataf(thickness, width, height);
    };

    const getThicknessRangeLabel = (range) => {
        const labels = {
            '0-3': '0 - 3 مم',
            '3.1-4': '3.1 - 4 مم',
            '4.1-5': '4.1 - 5 مم',
            '5.1-6': '5.1 - 6 مم',
            '6.1-8': '6.1 - 8 مم',
            '8.1-10': '8.1 - 10 مم',
            '10.1-12': '10.1 - 12 مم',
            '12+': '12+ مم'
        };
        return labels[range] || range;
    };

    const hasChanges = JSON.stringify(shatafRates) !== JSON.stringify(originalRates);

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
                title="إعدادات أسعار القطع"
                subtitle="تكوين أسعار الشطف حسب سماكة الزجاج"
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
                                    إلغاء
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={saveShatafRates}
                                    disabled={saving || !hasChanges}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                                >
                                    {saving ? (
                                        <LoadingSpinner size="sm" className="ml-2" />
                                    ) : (
                                        <FiSave size={16} className="ml-2" />
                                    )}
                                    حفظ التغييرات
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
                                تعديل الأسعار
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadShatafConfig}
                            disabled={loading}
                            className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <FiRefreshCw size={16} className="ml-2" />
                            تحديث
                        </Button>
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
                    {/* Main Shataf Configuration */}
                    <div className="xl:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <FaRuler className="text-green-600 dark:text-green-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">أسعار الشطف</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">السعر محسوب حسب السماكة والمحيط (طولان + عرضان)</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(shatafRates).map(([thicknessRange, rate]) => (
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
                                                    السعر لكل متر محيط (ج.م)
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
                                                <div className="font-medium">مثال:</div>
                                                <div>قطعة 100×50 سم = {calculateSamplePrice(parseFloat(thicknessRange.split('-')[0]) || 3, 100, 50).toFixed(2)} ج.م</div>
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
                                            {hasChanges ? 'لديك تغييرات غير محفوظة' : 'لا توجد تغييرات'}
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
                                    <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">ملاحظة حول القطع بالليزر</h3>
                                    <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                                        <strong>القطع بالليزر:</strong> يتم حساب تكلفة القطع بالليزر يدوياً لكل بند فاتورة حسب متطلبات العمل الخاصة.
                                        لا يتم تكوين أسعار ثابتة للقطع بالليزر في هذه الصفحة، بل يتم إدخال السعر مباشرة عند إنشاء الفاتورة.
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
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">معاينة أسعار الشطف</h3>
                            </div>

                            <div className="space-y-3">
                                {Object.entries(shatafRates).map(([range, rate]) => (
                                    <div key={range} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-800/30">
                                        <span className="font-medium text-green-900 dark:text-green-100 text-sm">
                                            {getThicknessRangeLabel(range)}
                                        </span>
                                        <span className="font-bold text-green-600 dark:text-green-400">
                                            {rate} ج.م/متر
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Calculation Examples */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">أمثلة على حساب الشطف</h3>

                            <div className="space-y-4">
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">زجاج 4 مم - 120×80 سم</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>المحيط: 2×(1.2+0.8) = 4.0 متر</div>
                                        <div>السعر: 4.0 × {shatafRates['4.1-5']} = {calculateSamplePrice(4, 120, 80).toFixed(2)} ج.م</div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">زجاج 6 مم - 200×150 سم</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>المحيط: 2×(2.0+1.5) = 7.0 متر</div>
                                        <div>السعر: 7.0 × {shatafRates['5.1-6']} = {calculateSamplePrice(6, 200, 150).toFixed(2)} ج.م</div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">زجاج 10 مم - 100×100 سم</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>المحيط: 2×(1.0+1.0) = 4.0 متر</div>
                                        <div>السعر: 4.0 × {shatafRates['8.1-10']} = {calculateSamplePrice(10, 100, 100).toFixed(2)} ج.م</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Formula */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30 p-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">معادلة الحساب:</h4>
                            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                                <div className="font-mono bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
                                    سعر الشطف = المحيط × سعر المتر
                                </div>
                                <div className="font-mono bg-blue-100 dark:bg-blue-900/50 p-2 rounded">
                                    المحيط = 2 × (العرض + الارتفاع)
                                </div>
                                <ul className="text-xs space-y-1 mt-2">
                                    <li>• يعتمد السعر على سماكة الزجاج</li>
                                    <li>• الأبعاد تحسب بالمتر</li>
                                    <li>• السعر النهائي بالجنيه المصري</li>
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