import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  useTenantDetail,
  useTenantUsage,
  useSubscriptionPayments,
  usePlanConfigs,
  useUpdateSubscription,
  useRecordSubscriptionPayment,
  useChangeTenantPlan,
  getPlanInfo,
} from '@/services/superAdminService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FiArrowLeft,
  FiArrowRight,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiPlus,
  FiX,
  FiCheck,
  FiClock,
  FiActivity,
  FiFileText,
} from 'react-icons/fi';

const TenantDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { tenantId } = useParams();
  const { showSnackbar } = useSnackbar();
  const isRTL = i18n.language === 'ar';
  const BackArrow = isRTL ? FiArrowRight : FiArrowLeft;

  const tenant = useTenantDetail(tenantId);
  const usage = useTenantUsage(tenantId);
  const payments = useSubscriptionPayments(tenantId);
  const planConfigs = usePlanConfigs();
  const updateSubscription = useUpdateSubscription();
  const recordPayment = useRecordSubscriptionPayment();
  const changePlan = useChangeTenantPlan();

  const [showSubForm, setShowSubForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [subForm, setSubForm] = useState({
    selectedPlan: 'free',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodStart: '',
    currentPeriodEnd: '',
    monthlyPrice: '',
    yearlyPrice: '',
    discount: '',
    notes: '',
  });
  const [payForm, setPayForm] = useState({
    amount: '',
    billingCycle: 'monthly',
    periodStart: '',
    periodEnd: '',
    status: 'paid',
    paymentMethod: '',
    referenceNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const loading = tenant === undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        {t('superAdmin.tenantDetail.notFound', 'Tenant not found')}
      </div>
    );
  }

  const planInfo = getPlanInfo(tenant.plan);
  const sub = tenant.subscription;
  const isActive = tenant.isActive && !tenant.isSuspended;

  const handleInitSub = () => {
    const currentPlan = tenant.plan || 'free';
    const planConfig = planConfigs?.[currentPlan];
    setSubForm({
      selectedPlan: currentPlan,
      status: sub?.status || 'active',
      billingCycle: sub?.billingCycle || 'monthly',
      currentPeriodStart: sub?.currentPeriodStart
        ? new Date(sub.currentPeriodStart).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      currentPeriodEnd: sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString().split('T')[0]
        : '',
      monthlyPrice: sub?.monthlyPrice?.toString() || planConfig?.monthlyPrice?.toString() || '0',
      yearlyPrice: sub?.yearlyPrice?.toString() || planConfig?.yearlyPrice?.toString() || '0',
      discount: sub?.discount?.toString() || '',
      notes: sub?.notes || '',
    });
    setShowSubForm(true);
  };

  const handlePlanChange = (newPlan) => {
    const config = planConfigs?.[newPlan];
    if (config) {
      setSubForm((prev) => ({
        ...prev,
        selectedPlan: newPlan,
        monthlyPrice: config.monthlyPrice.toString(),
        yearlyPrice: config.yearlyPrice.toString(),
      }));
    }
  };

  const handleSaveSub = async () => {
    try {
      setSaving(true);
      // If plan changed, update tenant plan first
      if (subForm.selectedPlan !== tenant.plan) {
        await changePlan({ tenantId, newPlan: subForm.selectedPlan });
      }
      await updateSubscription({
        tenantId,
        status: subForm.status,
        billingCycle: subForm.billingCycle,
        currentPeriodStart: new Date(subForm.currentPeriodStart).getTime(),
        currentPeriodEnd: new Date(subForm.currentPeriodEnd).getTime(),
        monthlyPrice: parseFloat(subForm.monthlyPrice) || 0,
        yearlyPrice: parseFloat(subForm.yearlyPrice) || 0,
        discount: subForm.discount ? parseFloat(subForm.discount) : undefined,
        notes: subForm.notes || undefined,
      });
      showSnackbar(t('superAdmin.subscription.saved', 'Subscription updated'), 'success');
      setShowSubForm(false);
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setSaving(true);
      await recordPayment({
        tenantId,
        amount: parseFloat(payForm.amount) || 0,
        billingCycle: payForm.billingCycle,
        periodStart: new Date(payForm.periodStart).getTime(),
        periodEnd: new Date(payForm.periodEnd).getTime(),
        status: payForm.status,
        paymentMethod: payForm.paymentMethod || undefined,
        referenceNumber: payForm.referenceNumber || undefined,
        notes: payForm.notes || undefined,
      });
      showSnackbar(t('superAdmin.payments.recorded', 'Payment recorded'), 'success');
      setShowPayForm(false);
      setPayForm({
        amount: '',
        billingCycle: 'monthly',
        periodStart: '',
        periodEnd: '',
        status: 'paid',
        paymentMethod: '',
        referenceNumber: '',
        notes: '',
      });
    } catch (err) {
      showSnackbar(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusColors = {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    trial: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    past_due: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    expired: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/super-admin/tenants"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <BackArrow className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: tenant.brandColors?.primary || '#6366f1' }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-gray-500 dark:text-gray-400">{tenant.slug}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${planInfo.bgColor} ${planInfo.color}`}>
                  {isRTL ? planInfo.labelAr : planInfo.label}
                </span>
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {t('superAdmin.tenants.statusActive', 'Active')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {t('superAdmin.tenants.statusSuspended', 'Suspended')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Card */}
      {usage && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiActivity className="w-5 h-5" />
            {t('superAdmin.tenantDetail.usage', 'Usage')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Users usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiUsers className="w-4 h-4" />
                  {t('superAdmin.tenantDetail.usersUsage', 'Users')}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {usage.users.current} / {usage.users.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    usage.users.max > 0 && usage.users.current / usage.users.max > 0.9
                      ? 'bg-red-500'
                      : usage.users.max > 0 && usage.users.current / usage.users.max > 0.7
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, usage.users.max > 0 ? (usage.users.current / usage.users.max) * 100 : 0)}%` }}
                />
              </div>
            </div>
            {/* Invoices usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FiFileText className="w-4 h-4" />
                  {t('superAdmin.tenantDetail.invoicesUsage', 'Invoices This Month')}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {usage.invoices.max === -1
                    ? `${usage.invoices.current} / ${t('superAdmin.tenantDetail.unlimited', 'Unlimited')}`
                    : `${usage.invoices.current} / ${usage.invoices.max}`}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                {usage.invoices.max === -1 ? (
                  <div className="h-2.5 rounded-full bg-green-500 w-full" />
                ) : (
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      usage.invoices.current / usage.invoices.max > 0.9
                        ? 'bg-red-500'
                        : usage.invoices.current / usage.invoices.max > 0.7
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (usage.invoices.current / usage.invoices.max) * 100)}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiCreditCard className="w-5 h-5" />
            {t('superAdmin.subscription.title', 'Subscription')}
          </h2>
          <button
            onClick={handleInitSub}
            className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {sub ? t('actions.edit', 'Edit') : t('superAdmin.subscription.setup', 'Setup Subscription')}
          </button>
        </div>

        {sub ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('superAdmin.subscription.status', 'Status')}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[sub.status] || statusColors.expired}`}>
                {t(`superAdmin.subscription.statuses.${sub.status}`, sub.status)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('superAdmin.subscription.cycle', 'Billing Cycle')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{sub.billingCycle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('superAdmin.subscription.price', 'Price')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {(sub.billingCycle === 'monthly' ? sub.monthlyPrice : sub.yearlyPrice).toLocaleString()} {t('common.currency', 'EGP')}
                {sub.discount ? (
                  <span className="text-xs text-green-600 dark:text-green-400 ms-1">
                    (-{sub.discount.toLocaleString()})
                  </span>
                ) : null}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('superAdmin.subscription.period', 'Current Period')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(sub.currentPeriodStart).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                {' - '}
                {new Date(sub.currentPeriodEnd).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
              </p>
            </div>
            {sub.notes && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('superAdmin.subscription.notes', 'Notes')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{sub.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            {t('superAdmin.subscription.noSubscription', 'No subscription configured yet')}
          </p>
        )}
      </div>

      {/* Subscription Edit Form Modal */}
      {showSubForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('superAdmin.subscription.editTitle', 'Edit Subscription')}
              </h2>
              <button onClick={() => setShowSubForm(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Plan Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('superAdmin.subscription.selectPlan', 'Plan')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {planConfigs && Object.entries(planConfigs).map(([key, config]) => {
                    const isSelected = subForm.selectedPlan === key;
                    const info = getPlanInfo(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePlanChange(key)}
                        className={`p-3 rounded-lg border-2 text-start transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${isSelected ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                            {isRTL ? config.nameAr : config.nameEn}
                          </span>
                          {isSelected && <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {config.monthlyPrice > 0
                            ? `${config.monthlyPrice.toLocaleString()} ${t('common.currency', 'EGP')}/${t('superAdmin.subscription.mo', 'mo')}`
                            : t('superAdmin.subscription.freeForever', 'Free')}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {t('superAdmin.subscription.upToUsers', 'Up to {{count}} users', { count: config.maxUsers })}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.status', 'Status')}</label>
                  <select value={subForm.status} onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="active">{t('superAdmin.subscription.statuses.active', 'Active')}</option>
                    <option value="trial">{t('superAdmin.subscription.statuses.trial', 'Trial')}</option>
                    <option value="past_due">{t('superAdmin.subscription.statuses.past_due', 'Past Due')}</option>
                    <option value="cancelled">{t('superAdmin.subscription.statuses.cancelled', 'Cancelled')}</option>
                    <option value="expired">{t('superAdmin.subscription.statuses.expired', 'Expired')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.cycle', 'Billing Cycle')}</label>
                  <select value={subForm.billingCycle} onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="monthly">{t('superAdmin.subscription.monthly', 'Monthly')}</option>
                    <option value="yearly">{t('superAdmin.subscription.yearly', 'Yearly')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.periodStart', 'Period Start')}</label>
                  <input type="date" value={subForm.currentPeriodStart} onChange={(e) => setSubForm({ ...subForm, currentPeriodStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.periodEnd', 'Period End')}</label>
                  <input type="date" value={subForm.currentPeriodEnd} onChange={(e) => setSubForm({ ...subForm, currentPeriodEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.monthlyPrice', 'Monthly Price (EGP)')}</label>
                  <input type="number" value={subForm.monthlyPrice} onChange={(e) => setSubForm({ ...subForm, monthlyPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.yearlyPrice', 'Yearly Price (EGP)')}</label>
                  <input type="number" value={subForm.yearlyPrice} onChange={(e) => setSubForm({ ...subForm, yearlyPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.discount', 'Discount (EGP)')}</label>
                <input type="number" value={subForm.discount} onChange={(e) => setSubForm({ ...subForm, discount: e.target.value })}
                  placeholder="0" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.subscription.notes', 'Notes')}</label>
                <textarea value={subForm.notes} onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSubForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {t('actions.cancel', 'Cancel')}
              </button>
              <button onClick={handleSaveSub} disabled={saving || !subForm.currentPeriodStart || !subForm.currentPeriodEnd}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
                {saving ? t('app.loading', 'Loading...') : t('actions.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiDollarSign className="w-5 h-5" />
            {t('superAdmin.payments.title', 'Subscription Payments')}
          </h2>
          <button
            onClick={() => setShowPayForm(true)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            {t('superAdmin.payments.record', 'Record Payment')}
          </button>
        </div>

        {/* Payment History Table */}
        {payments === undefined ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {t('superAdmin.payments.noPayments', 'No payments recorded yet')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.amount', 'Amount')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.cycle', 'Cycle')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.period', 'Period')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.status', 'Status')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.method', 'Method')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.recordedBy', 'Recorded By')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.payments.date', 'Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p._id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{p.amount.toLocaleString()} {t('common.currency', 'EGP')}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 capitalize">{p.billingCycle}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 text-xs">
                      {new Date(p.periodStart).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')} - {new Date(p.periodEnd).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : p.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{p.paymentMethod || '—'}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{p.recordedByName}</td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPayForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('superAdmin.payments.recordTitle', 'Record Subscription Payment')}
              </h2>
              <button onClick={() => setShowPayForm(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.amount', 'Amount (EGP)')}</label>
                  <input type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.cycle', 'Billing Cycle')}</label>
                  <select value={payForm.billingCycle} onChange={(e) => setPayForm({ ...payForm, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="monthly">{t('superAdmin.subscription.monthly', 'Monthly')}</option>
                    <option value="yearly">{t('superAdmin.subscription.yearly', 'Yearly')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.periodStart', 'Period Start')}</label>
                  <input type="date" value={payForm.periodStart} onChange={(e) => setPayForm({ ...payForm, periodStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.periodEnd', 'Period End')}</label>
                  <input type="date" value={payForm.periodEnd} onChange={(e) => setPayForm({ ...payForm, periodEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.status', 'Status')}</label>
                  <select value={payForm.status} onChange={(e) => setPayForm({ ...payForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="paid">{t('superAdmin.payments.statusPaid', 'Paid')}</option>
                    <option value="pending">{t('superAdmin.payments.statusPending', 'Pending')}</option>
                    <option value="failed">{t('superAdmin.payments.statusFailed', 'Failed')}</option>
                    <option value="refunded">{t('superAdmin.payments.statusRefunded', 'Refunded')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.method', 'Payment Method')}</label>
                  <input type="text" value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                    placeholder={t('superAdmin.payments.methodPlaceholder', 'Cash, bank transfer, etc.')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.reference', 'Reference Number')}</label>
                <input type="text" value={payForm.referenceNumber} onChange={(e) => setPayForm({ ...payForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('superAdmin.payments.notes', 'Notes')}</label>
                <textarea value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowPayForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                {t('actions.cancel', 'Cancel')}
              </button>
              <button onClick={handleRecordPayment} disabled={saving || !payForm.amount || !payForm.periodStart || !payForm.periodEnd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {saving ? t('app.loading', 'Loading...') : t('superAdmin.payments.record', 'Record Payment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <FiUsers className="w-5 h-5" />
          {t('superAdmin.tenantDetail.members', 'Members')} ({tenant.members?.length || 0})
        </h2>
        {tenant.members && tenant.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.users.colUser', 'User')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.users.colRole', 'Role')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('tenant.membersPage.columns.tenantRole', 'Tenant Role')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('superAdmin.users.colStatus', 'Status')}</th>
                  <th className="px-3 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('tenant.membersPage.columns.joinedAt', 'Joined')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tenant.members.map((m) => (
                  <tr key={m.membershipId} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-2">
                      <p className="font-medium text-gray-900 dark:text-white">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.username}</p>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{m.role}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 capitalize">{m.tenantRole}</td>
                    <td className="px-3 py-2">
                      {m.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {t('superAdmin.users.active', 'Active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          {t('superAdmin.users.inactive', 'Inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {new Date(m.joinedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {t('superAdmin.tenantDetail.noMembers', 'No members')}
          </p>
        )}
      </div>

      {/* Recent Audit Activity */}
      {tenant.recentAudit && tenant.recentAudit.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiClock className="w-5 h-5" />
            {t('superAdmin.tenantDetail.recentActivity', 'Recent Activity')}
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tenant.recentAudit.slice(0, 10).map((log) => (
              <div key={log._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="w-2 h-2 mt-2 rounded-full bg-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{log.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {log.userEmail} · {new Date(log.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetailPage;
