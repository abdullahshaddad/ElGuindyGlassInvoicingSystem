import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSave, FiCheck } from 'react-icons/fi';
import { useSnackbar } from '@/contexts/SnackbarContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import useAuthorized from '@hooks/useAuthorized.js';
import { useCurrentTenant, useUpdateTenant } from '@/services/tenantService';
import { THEME_LIST, DEFAULT_THEME_ID } from '@/constants/tenantThemes';

const TenantSettingsPage = () => {
    const { t, i18n } = useTranslation();
    const { showSuccess, showError } = useSnackbar();
    const isRTL = i18n.language === 'ar';

    const {
        isAuthorized,
        isLoading: authLoading,
    } = useAuthorized(['SUPERADMIN', 'OWNER', 'ADMIN']);

    const currentTenant = useCurrentTenant();
    const updateTenant = useUpdateTenant();
    const loading = currentTenant === undefined;

    const canEdit = isAuthorized;

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        invoicePrefix: '',
        currency: '',
        timezone: '',
        measurementUnit: '',
        theme: DEFAULT_THEME_ID,
    });

    // Sync tenant data into local form state
    useEffect(() => {
        if (currentTenant) {
            setForm({
                name: currentTenant.name || '',
                invoicePrefix: currentTenant.settings?.invoicePrefix || '',
                currency: currentTenant.settings?.currency || '',
                timezone: currentTenant.settings?.timezone || '',
                measurementUnit: currentTenant.settings?.measurementUnit || '',
                theme: currentTenant.theme || DEFAULT_THEME_ID,
            });
        }
    }, [currentTenant]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!canEdit) return;

        try {
            setSaving(true);
            await updateTenant({
                name: form.name || undefined,
                settings: {
                    invoicePrefix: form.invoicePrefix || undefined,
                    currency: form.currency || undefined,
                    timezone: form.timezone || undefined,
                    measurementUnit: form.measurementUnit || undefined,
                },
                theme: form.theme,
            });
            showSuccess(t('tenant.messages.settingsSaved'));
        } catch (error) {
            console.error('Error saving tenant settings:', error);
            showError(t('tenant.messages.settingsSaveError'));
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('tenant.settingsPage.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('tenant.settingsPage.subtitle')}
                    </p>
                </div>
                {canEdit && (
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        loading={saving}
                        className="flex items-center gap-2"
                    >
                        <FiSave />
                        {t('actions.save')}
                    </Button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Info */}
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700">
                            {t('tenant.settingsPage.generalInfo')}
                        </h2>

                        <Input
                            label={t('tenant.fields.name')}
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            disabled={!canEdit}
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('tenant.fields.slug')}
                                name="slug"
                                value={currentTenant?.slug || ''}
                                disabled
                            />
                            <Input
                                label={t('tenant.fields.plan')}
                                name="plan"
                                value={t(`tenant.plans.${currentTenant?.plan}`) || currentTenant?.plan || ''}
                                disabled
                            />
                        </div>
                    </form>
                </Card>

                {/* Invoice & Regional Settings */}
                <Card>
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-700">
                            {t('tenant.settingsPage.invoiceSettings')}
                        </h2>

                        <Input
                            label={t('tenant.fields.invoicePrefix')}
                            name="invoicePrefix"
                            value={form.invoicePrefix}
                            onChange={handleChange}
                            disabled={!canEdit}
                            placeholder="INV"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('tenant.fields.currency')}
                                name="currency"
                                value={form.currency}
                                onChange={handleChange}
                                disabled={!canEdit}
                                placeholder="EGP"
                            />
                            <Input
                                label={t('tenant.fields.timezone')}
                                name="timezone"
                                value={form.timezone}
                                onChange={handleChange}
                                disabled={!canEdit}
                                placeholder="Africa/Cairo"
                            />
                        </div>

                        <Input
                            label={t('tenant.fields.measurementUnit')}
                            name="measurementUnit"
                            value={form.measurementUnit}
                            onChange={handleChange}
                            disabled={!canEdit}
                            placeholder="CM"
                        />
                    </div>
                </Card>

                {/* Theme Picker */}
                <Card className="lg:col-span-2">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold mb-1 border-b pb-2 dark:border-gray-700">
                                {t('tenant.theme', 'Theme')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                {t('tenant.themeDescription', 'Choose a theme for the tenant interface')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {THEME_LIST.map((theme) => {
                                const isSelected = form.theme === theme.id;
                                const themeName = isRTL ? theme.nameAr : theme.nameEn;

                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        disabled={!canEdit}
                                        onClick={() => setForm((prev) => ({ ...prev, theme: theme.id }))}
                                        className={`relative rounded-xl border-2 p-3 transition-all text-start disabled:opacity-50 disabled:cursor-not-allowed ${
                                            isSelected
                                                ? 'border-primary-500 ring-2 ring-primary-500/30 shadow-md'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                                        }`}
                                    >
                                        {/* Check mark */}
                                        {isSelected && (
                                            <div className="absolute top-2 end-2 w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.preview }}>
                                                <FiCheck className="w-4 h-4" />
                                            </div>
                                        )}

                                        {/* Gradient swatch */}
                                        <div
                                            className="h-16 rounded-lg mb-3"
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.preview}, ${theme.previewSecondary})`,
                                            }}
                                        />

                                        {/* Color bars */}
                                        <div className="flex gap-2 mb-3">
                                            <div
                                                className="flex-1 h-2 rounded-full"
                                                style={{ backgroundColor: theme.preview }}
                                            />
                                            <div
                                                className="flex-1 h-2 rounded-full"
                                                style={{ backgroundColor: theme.previewSecondary }}
                                            />
                                        </div>

                                        {/* Theme name */}
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {t(`tenant.themes.${theme.id}`, themeName)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TenantSettingsPage;
