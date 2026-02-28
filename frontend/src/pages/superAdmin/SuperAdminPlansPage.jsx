import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  useListPlanConfigs,
  useSeedPlanConfigs,
  useUpdatePlanConfig,
} from '@/services/superAdminService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FiEdit2,
  FiX,
  FiCheck,
  FiUsers,
  FiFileText,
  FiDollarSign,
  FiPlus,
  FiRefreshCw,
  FiStar,
} from 'react-icons/fi';

const PLAN_COLORS = {
  gray: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700', accent: 'bg-gray-500' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', accent: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', accent: 'bg-purple-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', accent: 'bg-amber-500' },
};

const AVAILABLE_FEATURES = [
  'basic_invoicing',
  'single_location',
  'multi_location',
  'reports',
  'advanced_analytics',
  'email_support',
  'priority_support',
  'custom_branding',
  'api_access',
  'dedicated_support',
  'sla',
];

const FEATURE_LABELS = {
  basic_invoicing: { en: 'Basic Invoicing', ar: 'فوترة أساسية' },
  single_location: { en: 'Single Location', ar: 'موقع واحد' },
  multi_location: { en: 'Multi Location', ar: 'مواقع متعددة' },
  reports: { en: 'Reports', ar: 'تقارير' },
  advanced_analytics: { en: 'Advanced Analytics', ar: 'تحليلات متقدمة' },
  email_support: { en: 'Email Support', ar: 'دعم بالبريد' },
  priority_support: { en: 'Priority Support', ar: 'دعم أولوية' },
  custom_branding: { en: 'Custom Branding', ar: 'علامة تجارية مخصصة' },
  api_access: { en: 'API Access', ar: 'وصول API' },
  dedicated_support: { en: 'Dedicated Support', ar: 'دعم مخصص' },
  sla: { en: 'SLA', ar: 'اتفاقية مستوى الخدمة' },
};

const COLOR_OPTIONS = ['gray', 'blue', 'purple', 'amber'];

const SuperAdminPlansPage = () => {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const isRTL = i18n.language === 'ar';

  const plans = useListPlanConfigs();
  const seedPlans = useSeedPlanConfigs();
  const updatePlan = useUpdatePlanConfig();

  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loading = plans === undefined;
  const isEmpty = plans !== undefined && plans.length === 0;

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const result = await seedPlans({});
      if (result.seeded) {
        showSnackbar(t('superAdmin.plans.seeded', 'Plans initialized successfully'), 'success');
      } else {
        showSnackbar(result.message, 'info');
      }
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan._id);
    setForm({
      nameEn: plan.nameEn,
      nameAr: plan.nameAr,
      monthlyPrice: plan.monthlyPrice.toString(),
      yearlyPrice: plan.yearlyPrice.toString(),
      maxUsers: plan.maxUsers.toString(),
      maxInvoicesPerMonth: plan.maxInvoicesPerMonth.toString(),
      features: [...plan.features],
      color: plan.color,
      isActive: plan.isActive,
      displayOrder: plan.displayOrder,
    });
  };

  const handleCancel = () => {
    setEditingPlan(null);
    setForm(null);
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      const result = await updatePlan({
        planId: editingPlan,
        nameEn: form.nameEn,
        nameAr: form.nameAr,
        monthlyPrice: parseFloat(form.monthlyPrice) || 0,
        yearlyPrice: parseFloat(form.yearlyPrice) || 0,
        maxUsers: parseInt(form.maxUsers) || 1,
        maxInvoicesPerMonth: parseInt(form.maxInvoicesPerMonth),
        features: form.features,
        color: form.color,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      });
      showSnackbar(
        t('superAdmin.plans.saved', 'Plan updated successfully') +
          (result.updated > 0 ? ` (${result.updated} ${t('superAdmin.plans.tenantsUpdated', 'tenants updated')})` : ''),
        'success'
      );
      setEditingPlan(null);
      setForm(null);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature) => {
    if (!form) return;
    const features = form.features.includes(feature)
      ? form.features.filter((f) => f !== feature)
      : [...form.features, feature];
    setForm({ ...form, features });
  };

  const getColors = (color) => PLAN_COLORS[color] || PLAN_COLORS.gray;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('superAdmin.plans.title', 'Plan Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('superAdmin.plans.subtitle', 'Configure pricing, limits, and features for each plan')}
          </p>
        </div>
        {isEmpty && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {seeding ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
            {t('superAdmin.plans.initPlans', 'Initialize Default Plans')}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {isEmpty && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FiStar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('superAdmin.plans.noPlans', 'No plans configured yet')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t('superAdmin.plans.noPlansDesc', 'Click the button above to initialize the default plan configurations')}
          </p>
        </div>
      )}

      {/* Plan Cards */}
      {plans && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = getColors(plan.color);
            const isEditing = editingPlan === plan._id;

            if (isEditing && form) {
              return (
                <div
                  key={plan._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-primary-500 p-5 space-y-4"
                >
                  {/* Edit Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase">
                      {plan.planKey}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title={t('actions.save', 'Save')}
                      >
                        {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={t('actions.cancel', 'Cancel')}
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.nameEn', 'Name (EN)')}
                      </label>
                      <input
                        type="text"
                        value={form.nameEn}
                        onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.nameAr', 'Name (AR)')}
                      </label>
                      <input
                        type="text"
                        value={form.nameAr}
                        onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                        dir="rtl"
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.monthly', 'Monthly')}
                      </label>
                      <input
                        type="number"
                        value={form.monthlyPrice}
                        onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.yearly', 'Yearly')}
                      </label>
                      <input
                        type="number"
                        value={form.yearlyPrice}
                        onChange={(e) => setForm({ ...form, yearlyPrice: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.maxUsers', 'Max Users')}
                      </label>
                      <input
                        type="number"
                        value={form.maxUsers}
                        onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('superAdmin.plans.maxInvoices', 'Max Invoices/mo')}
                      </label>
                      <input
                        type="number"
                        value={form.maxInvoicesPerMonth}
                        onChange={(e) => setForm({ ...form, maxInvoicesPerMonth: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="-1 = unlimited"
                      />
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('superAdmin.plans.color', 'Color')}
                    </label>
                    <div className="flex gap-2">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, color: c })}
                          className={`w-8 h-8 rounded-lg ${PLAN_COLORS[c].accent} ${
                            form.color === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {t('superAdmin.plans.features', 'Features')}
                    </label>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {AVAILABLE_FEATURES.map((f) => (
                        <label key={f} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.features.includes(f)}
                            onChange={() => toggleFeature(f)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {isRTL ? FEATURE_LABELS[f]?.ar : FEATURE_LABELS[f]?.en}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t('superAdmin.plans.active', 'Active')}
                    </span>
                  </label>
                </div>
              );
            }

            // Read-only card
            return (
              <div
                key={plan._id}
                className={`rounded-xl shadow-sm border-2 ${colors.border} overflow-hidden transition-all hover:shadow-md ${
                  !plan.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Card Header */}
                <div className={`${colors.bg} px-5 py-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {plan.planKey}
                      </p>
                      <h3 className={`text-xl font-bold ${colors.text} mt-1`}>
                        {isRTL ? plan.nameAr : plan.nameEn}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      title={t('actions.edit', 'Edit')}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pricing */}
                <div className="px-5 py-4 bg-white dark:bg-gray-800">
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {plan.monthlyPrice > 0 ? plan.monthlyPrice.toLocaleString() : t('superAdmin.plans.free', 'Free')}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('common.currency', 'EGP')}/{t('superAdmin.subscription.mo', 'mo')}
                      </span>
                    )}
                  </div>
                  {plan.yearlyPrice > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.yearlyPrice.toLocaleString()} {t('common.currency', 'EGP')}/{t('superAdmin.plans.yr', 'yr')}
                      {plan.monthlyPrice > 0 && (
                        <span className="text-green-600 dark:text-green-400 ms-1">
                          ({t('superAdmin.plans.save', 'Save')} {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Limits */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <FiUsers className="w-4 h-4" />
                      <span>{plan.maxUsers} {t('superAdmin.plans.users', 'users')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                      <FiFileText className="w-4 h-4" />
                      <span>
                        {plan.maxInvoicesPerMonth === -1
                          ? t('superAdmin.plans.unlimited', 'Unlimited')
                          : plan.maxInvoicesPerMonth.toLocaleString()}{' '}
                        {t('superAdmin.plans.invoicesMo', 'inv/mo')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                    {t('superAdmin.plans.features', 'Features')}
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <FiCheck className={`w-3.5 h-3.5 flex-shrink-0 ${colors.text}`} />
                        {isRTL ? FEATURE_LABELS[f]?.ar || f : FEATURE_LABELS[f]?.en || f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Status */}
                {!plan.isActive && (
                  <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 text-center">
                      {t('superAdmin.plans.inactive', 'Inactive')}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuperAdminPlansPage;
