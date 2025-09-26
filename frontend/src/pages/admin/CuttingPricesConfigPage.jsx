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
    FiInfo
} from 'react-icons/fi';
import { FaCalculator } from 'react-icons/fa';
import Button from '@components/ui/Button.jsx';
import Input from '@components/ui/Input.jsx';
import LoadingSpinner from '@components/ui/LoadingSpinner.jsx';
import { PageHeader } from "@components";
import { cuttingRateService } from '@services/cuttingRateService.js';

const CuttingPricesConfigPage = () => {
    const { t } = useTranslation();

    // States for cutting prices
    const [prices, setPrices] = useState({
        shatfRate: 25,
        laserRate: 50,
        customCuttingEnabled: true,
        minimumOrderValue: 100
    });

    const [originalPrices, setOriginalPrices] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Load current pricing configuration
    useEffect(() => {
        loadPricingConfig();
    }, []);

    const loadPricingConfig = async () => {
        setLoading(true);
        try {
            const config = await cuttingRateService.getFormattedRates();

            const formattedPrices = {
                shatfRate: config.defaultShatfRate,
                laserRate: config.defaultLaserRate,
                customCuttingEnabled: true, // This would come from app settings
                minimumOrderValue: 100 // This would come from app settings
            };

            setPrices(formattedPrices);
            setOriginalPrices(formattedPrices);
        } catch (err) {
            console.error('Load pricing config error:', err);
            setError('فشل في تحميل إعدادات الأسعار');
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (field, value) => {
        setPrices(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }));
    };

    const handleToggleChange = (field, checked) => {
        setPrices(prev => ({
            ...prev,
            [field]: checked
        }));
    };

    const startEditing = () => {
        setIsEditing(true);
        setOriginalPrices({ ...prices });
    };

    const cancelEditing = () => {
        setPrices({ ...originalPrices });
        setIsEditing(false);
        setError(null);
    };

    const savePrices = async () => {
        setSaving(true);
        setError(null);

        try {
            // Validate prices
            if (prices.shatfRate <= 0 || prices.laserRate <= 0) {
                throw new Error('الأسعار يجب أن تكون أكبر من صفر');
            }

            await cuttingRateService.updateDefaultRates({
                shatfRate: prices.shatfRate,
                laserRate: prices.laserRate
            });

            setOriginalPrices({ ...prices });
            setIsEditing(false);
            setSuccess('تم حفظ أسعار القطع بنجاح');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Save pricing error:', err);
            setError(err.message || 'فشل في حفظ أسعار القطع');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = async () => {
        try {
            await cuttingRateService.initializeDefaultRates();
            await loadPricingConfig(); // Reload to get the new defaults
            setSuccess('تم استعادة القيم الافتراضية بنجاح');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Reset to defaults error:', err);
            setError('فشل في استعادة القيم الافتراضية');
        }
    };

    const hasChanges = JSON.stringify(prices) !== JSON.stringify(originalPrices);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-96">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="" dir="rtl">
            <PageHeader
                title="إعدادات أسعار القطع"
                subtitle="إدارة أسعار الشطف والليزر والإعدادات ذات الصلة"
                actions={
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <Button
                                onClick={startEditing}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                            >
                                <FiEdit3 className="ml-2" />
                                تعديل الأسعار
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    onClick={savePrices}
                                    disabled={saving || !hasChanges}
                                    className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
                                >
                                    {saving ? <LoadingSpinner size="sm" className="ml-2" /> : <FiSave className="ml-2" />}
                                    {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    إلغاء
                                </Button>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Messages */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex items-center gap-3">
                    <FiX className="text-red-500 dark:text-red-400 flex-shrink-0"/>
                    <span className="text-red-700 dark:text-red-300 flex-1">{error}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        <FiX size={16}/>
                    </Button>
                </div>
            )}

            {success && (
                <div className="mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg flex items-center gap-3">
                    <FiCheck className="text-green-500 dark:text-green-400 flex-shrink-0"/>
                    <span className="text-green-700 dark:text-green-300 flex-1">{success}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuccess(null)}
                        className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                    >
                        <FiX size={16}/>
                    </Button>
                </div>
            )}

            <div className="px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Pricing Configuration */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <FaCalculator className="text-green-600 dark:text-green-400" size={20}/>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">أسعار القطع</h2>
                            </div>

                            <div className="space-y-6">
                                {/* SHATF Price */}
                                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-800/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FiDollarSign className="text-green-600 dark:text-green-400" size={18}/>
                                        <h3 className="font-semibold text-green-900 dark:text-green-100">سعر الشطف</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                                                السعر لكل متر (ج.م)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={prices.shatfRate}
                                                onChange={(e) => handlePriceChange('shatfRate', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="25"
                                                className="border-green-300 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <div className="text-sm text-green-600 dark:text-green-400">
                                                <div className="font-medium">مثال للحساب:</div>
                                                <div>قطعة 1م × 1م = {prices.shatfRate} ج.م</div>
                                                <div>قطعة 2م × 1.5م = {(3 * prices.shatfRate).toFixed(2)} ج.م</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* LASER Price */}
                                <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FiDollarSign className="text-orange-600 dark:text-orange-400" size={18}/>
                                        <h3 className="font-semibold text-orange-900 dark:text-orange-100">سعر الليزر</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                                                السعر لكل متر (ج.م)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={prices.laserRate}
                                                onChange={(e) => handlePriceChange('laserRate', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="50"
                                                className="border-orange-300 dark:border-orange-700 focus:border-orange-500 dark:focus:border-orange-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <div className="text-sm text-orange-600 dark:text-orange-400">
                                                <div className="font-medium">مثال للحساب:</div>
                                                <div>قطعة 1م × 1م = {prices.laserRate} ج.م</div>
                                                <div>قطعة 2م × 1.5م = {(3 * prices.laserRate).toFixed(2)} ج.م</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Settings */}
                                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FiSettings className="text-blue-600 dark:text-blue-400" size={18}/>
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">إعدادات إضافية</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                                                الحد الأدنى لقيمة الطلب (ج.م)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={prices.minimumOrderValue}
                                                onChange={(e) => handlePriceChange('minimumOrderValue', e.target.value)}
                                                disabled={!isEditing}
                                                placeholder="100"
                                                className="border-blue-300 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 max-w-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="customCuttingEnabled"
                                                checked={prices.customCuttingEnabled}
                                                onChange={(e) => handleToggleChange('customCuttingEnabled', e.target.checked)}
                                                disabled={!isEditing}
                                                className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700"
                                            />
                                            <label htmlFor="customCuttingEnabled" className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                السماح بإدخال أسعار قطع يدوية للليزر
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons at Bottom */}
                            {isEditing && (
                                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={resetToDefaults}
                                        className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <FiRefreshCw className="ml-2" />
                                        استعادة القيم الافتراضية
                                    </Button>

                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {hasChanges ? 'لديك تغييرات غير محفوظة' : 'لا توجد تغييرات'}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview & Information Panel */}
                    <div className="space-y-6">
                        {/* Current Pricing Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <FiInfo className="text-purple-600 dark:text-purple-400" size={20}/>
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">معاينة الأسعار الحالية</h3>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-800/30">
                                    <span className="font-medium text-green-900 dark:text-green-100">شطف (متر)</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">{prices.shatfRate} ج.م</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800/30">
                                    <span className="font-medium text-orange-900 dark:text-orange-100">ليزر (متر)</span>
                                    <span className="font-bold text-orange-600 dark:text-orange-400">{prices.laserRate} ج.م</span>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <span className="font-medium text-blue-900 dark:text-blue-100">الحد الأدنى</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{prices.minimumOrderValue} ج.م</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculation Examples */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">أمثلة على الحساب</h3>

                            <div className="space-y-4">
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">قطعة زجاج 1200 × 800 مم</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>المساحة: 0.96 م²</div>
                                        <div>شطف: {(0.96 * prices.shatfRate).toFixed(2)} ج.م</div>
                                        <div>ليزر: {(0.96 * prices.laserRate).toFixed(2)} ج.م</div>
                                    </div>
                                </div>

                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-750">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">قطعة زجاج 2000 × 1500 مم</div>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                        <div>المساحة: 3.0 م²</div>
                                        <div>شطف: {(3.0 * prices.shatfRate).toFixed(2)} ج.م</div>
                                        <div>ليزر: {(3.0 * prices.laserRate).toFixed(2)} ج.م</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800/30 p-4">
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">نصائح:</h4>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                                <li>• يتم حساب السعر حسب المساحة (العرض × الارتفاع)</li>
                                <li>• يمكن إدخال أسعار يدوية لليزر عند الحاجة</li>
                                <li>• تأكد من مراجعة الأسعار بانتظام</li>
                                <li>• الأسعار المحدثة ستطبق على جميع الفواتير الجديدة</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CuttingPricesConfigPage;