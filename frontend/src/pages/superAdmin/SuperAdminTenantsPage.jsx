import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  useAllTenants,
  useSuspendTenant,
  useActivateTenant,
  useChangeTenantPlan,
  useDeleteTenant,
  useEnterTenant,
  getPlanInfo,
} from '@/services/superAdminService';
import { useCreateTenant } from '@/services/tenantService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import {
  FiPlus,
  FiPause,
  FiPlay,
  FiTrash2,
  FiUsers,
  FiGrid,
  FiFilter,
  FiX,
  FiEye,
} from 'react-icons/fi';
import { SearchInput } from '@components';

const SuperAdminTenantsPage = () => {
  const { t, i18n } = useTranslation();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const tenants = useAllTenants({ search: search || undefined, plan: planFilter, status: statusFilter });
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();
  const changePlan = useChangeTenantPlan();
  const deleteTenant = useDeleteTenant();
  const enterTenant = useEnterTenant();
  const createTenant = useCreateTenant();

  const loading = tenants === undefined;

  const handleEnterTenant = async (tenantId) => {
    try {
      await enterTenant({ tenantId });
      navigate('/dashboard');
    } catch (err) {
      showSnackbar(err.message || t('superAdmin.enterError', 'فشل الدخول للمستأجر'), 'error');
    }
  };

  const handleCreate = async () => {
    try {
      await createTenant({ name: newTenantName.trim(), slug: newTenantSlug.trim().toLowerCase() });
      showSnackbar(t('tenant.messages.tenantCreated', 'تم إنشاء المستأجر بنجاح'), 'success');
      setShowCreateModal(false);
      setNewTenantName('');
      setNewTenantSlug('');
    } catch (err) {
      showSnackbar(err.message || t('tenant.messages.tenantCreateError', 'فشل إنشاء المستأجر'), 'error');
    }
  };

  const handleSuspend = async (tenantId) => {
    try {
      await suspendTenant({ tenantId });
      showSnackbar(t('superAdmin.tenants.suspended', 'تم تعليق المستأجر'), 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
    setConfirmAction(null);
  };

  const handleActivate = async (tenantId) => {
    try {
      await activateTenant({ tenantId });
      showSnackbar(t('superAdmin.tenants.activated', 'تم تنشيط المستأجر'), 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
    setConfirmAction(null);
  };

  const handleDelete = async (tenantId) => {
    try {
      await deleteTenant({ tenantId });
      showSnackbar(t('superAdmin.tenants.deleted', 'تم حذف المستأجر'), 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
    setConfirmAction(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('superAdmin.tenants.title', 'إدارة المستأجرين')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('superAdmin.tenants.subtitle', 'عرض وإدارة جميع المستأجرين على المنصة')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          {t('tenant.createTenant', 'إنشاء مستأجر')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('superAdmin.tenants.searchPlaceholder', 'بحث بالاسم أو الرابط...')}
          wrapperClassName="flex-1"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">{t('superAdmin.tenants.allPlans', 'جميع الخطط')}</option>
          <option value="free">{t('tenant.plans.free', 'مجاني')}</option>
          <option value="starter">{t('tenant.plans.starter', 'بداية')}</option>
          <option value="professional">{t('tenant.plans.professional', 'احترافي')}</option>
          <option value="enterprise">{t('tenant.plans.enterprise', 'مؤسسي')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">{t('superAdmin.tenants.allStatuses', 'جميع الحالات')}</option>
          <option value="active">{t('superAdmin.tenants.statusActive', 'نشط')}</option>
          <option value="suspended">{t('superAdmin.tenants.statusSuspended', 'معلق')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colName', 'المستأجر')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colPlan', 'الخطة')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colMembers', 'الأعضاء')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colSubscription', 'Subscription')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colStatus', 'الحالة')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.tenants.colCreated', 'تاريخ الإنشاء')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('actions.actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tenants?.map((tenant) => {
                  const planInfo = getPlanInfo(tenant.plan);
                  const isActive = tenant.isActive && !tenant.isSuspended;
                  return (
                    <tr
                      key={tenant._id}
                      onClick={() => navigate(`/super-admin/tenants/${tenant._id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                            style={{ backgroundColor: tenant.brandColors?.primary || '#6366f1' }}
                          >
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-primary-600 dark:text-primary-400">
                              {tenant.name}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${planInfo.bgColor} ${planInfo.color}`}>
                          {isRTL ? planInfo.labelAr : planInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <FiUsers className="w-4 h-4" />
                          <span>{tenant.memberCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {tenant.subscription ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            tenant.subscription.status === 'active'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : tenant.subscription.status === 'trial'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : tenant.subscription.status === 'past_due'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {tenant.subscription.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {t('superAdmin.tenants.statusActive', 'نشط')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {t('superAdmin.tenants.statusSuspended', 'معلق')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(tenant.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEnterTenant(tenant._id); }}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title={t('superAdmin.enterTenant', 'الدخول للمستأجر')}
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {tenant.isSuspended ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'activate', tenantId: tenant._id, name: tenant.name }); }}
                              className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title={t('superAdmin.tenants.activate', 'تنشيط')}
                            >
                              <FiPlay className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'suspend', tenantId: tenant._id, name: tenant.name }); }}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                              title={t('superAdmin.tenants.suspend', 'تعليق')}
                            >
                              <FiPause className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmAction({ type: 'delete', tenantId: tenant._id, name: tenant.name }); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('actions.delete', 'حذف')}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tenants?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      {t('superAdmin.tenants.noTenants', 'لا يوجد مستأجرون')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('tenant.createTenant', 'إنشاء مستأجر')}
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tenant.fields.name', 'اسم المستأجر')}
                </label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  placeholder={t('superAdmin.tenants.namePlaceholder', 'مثال: كوارتز')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('tenant.fields.slug', 'الرابط المختصر')}
                </label>
                <input
                  type="text"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 ltr"
                  dir="ltr"
                  placeholder="kwartz-glass"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('superAdmin.tenants.slugHelp', 'أحرف صغيرة وأرقام وشرطات فقط، 3 أحرف على الأقل')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('actions.cancel', 'إلغاء')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTenantName.trim() || newTenantSlug.trim().length < 3}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('actions.create', 'إنشاء')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      {confirmAction && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === 'suspend') handleSuspend(confirmAction.tenantId);
            else if (confirmAction.type === 'activate') handleActivate(confirmAction.tenantId);
            else if (confirmAction.type === 'delete') handleDelete(confirmAction.tenantId);
          }}
          title={
            confirmAction.type === 'suspend'
              ? t('superAdmin.tenants.confirmSuspend', 'تعليق المستأجر')
              : confirmAction.type === 'activate'
              ? t('superAdmin.tenants.confirmActivate', 'تنشيط المستأجر')
              : t('superAdmin.tenants.confirmDelete', 'حذف المستأجر')
          }
          message={
            confirmAction.type === 'suspend'
              ? `${t('superAdmin.tenants.confirmSuspendMsg', 'هل أنت متأكد من تعليق')} "${confirmAction.name}"?`
              : confirmAction.type === 'activate'
              ? `${t('superAdmin.tenants.confirmActivateMsg', 'هل أنت متأكد من تنشيط')} "${confirmAction.name}"?`
              : `${t('superAdmin.tenants.confirmDeleteMsg', 'هل أنت متأكد من حذف')} "${confirmAction.name}"? ${t('superAdmin.tenants.deleteWarning', 'هذا الإجراء لا يمكن التراجع عنه.')}`
          }
          confirmText={
            confirmAction.type === 'delete'
              ? t('actions.delete', 'حذف')
              : t('actions.confirm', 'تأكيد')
          }
          type={confirmAction.type === 'delete' ? 'danger' : 'warning'}
        />
      )}
    </div>
  );
};

export default SuperAdminTenantsPage;
