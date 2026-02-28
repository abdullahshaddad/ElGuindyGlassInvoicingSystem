import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSnackbar } from '@/contexts/SnackbarContext';
import {
  useAllUsers,
  useAllTenants,
  useChangeUserRole,
  useDeactivateUser,
  useActivateUser,
  useAssignUserToTenant,
} from '@/services/superAdminService';
import { getRoleInfo } from '@/services/userService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import {
  FiSearch,
  FiUser,
  FiUserCheck,
  FiUserX,
  FiShield,
  FiLink,
  FiX,
} from 'react-icons/fi';

const ROLES = ['SUPERADMIN', 'OWNER', 'ADMIN', 'CASHIER', 'WORKER'];

const SuperAdminUsersPage = () => {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const isRTL = i18n.language === 'ar';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { userId, name }
  const [assignTenantId, setAssignTenantId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const users = useAllUsers({ search: search || undefined, role: roleFilter });
  const tenants = useAllTenants({});
  const changeUserRole = useChangeUserRole();
  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();
  const assignUserToTenant = useAssignUserToTenant();

  const loading = users === undefined;

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeUserRole({ userId, newRole });
      showSuccess(t('superAdmin.users.roleChanged', 'تم تغيير الدور بنجاح'));
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeactivate = async (userId) => {
    try {
      await deactivateUser({ userId });
      showSuccess(t('superAdmin.users.deactivated', 'تم تعطيل المستخدم'));
    } catch (err) {
      showError(err.message);
    }
    setConfirmAction(null);
  };

  const handleActivate = async (userId) => {
    try {
      await activateUser({ userId });
      showSuccess(t('superAdmin.users.activated', 'تم تنشيط المستخدم'));
    } catch (err) {
      showError(err.message);
    }
    setConfirmAction(null);
  };

  const handleAssignToTenant = async () => {
    if (!assignModal || !assignTenantId) return;
    try {
      setAssignLoading(true);
      await assignUserToTenant({
        userId: assignModal.userId,
        tenantId: assignTenantId,
      });
      showSuccess(t('superAdmin.users.assignedToTenant', 'تم تعيين المستخدم للمستأجر بنجاح'));
      setAssignModal(null);
      setAssignTenantId('');
    } catch (err) {
      showError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  // Get active tenants for the assign modal
  const activeTenants = tenants?.filter((t) => t.isActive && !t.isSuspended) || [];

  // Map tenant IDs to names for display
  const tenantNameMap = {};
  tenants?.forEach((t) => { tenantNameMap[t._id] = t.name; });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('superAdmin.users.title', 'إدارة المستخدمين')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('superAdmin.users.subtitle', 'عرض وإدارة جميع المستخدمين على المنصة')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('superAdmin.users.searchPlaceholder', 'بحث بالاسم أو اسم المستخدم...')}
            className="w-full ps-10 pe-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">{t('superAdmin.users.allRoles', 'جميع الأدوار')}</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`users.roles.${role}`, role)}
            </option>
          ))}
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
                    {t('superAdmin.users.colUser', 'المستخدم')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.users.colRole', 'الدور')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.users.colTenants', 'المستأجرون')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('superAdmin.users.colStatus', 'الحالة')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {t('actions.actions', 'الإجراءات')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users?.map((u) => {
                  const roleInfo = getRoleInfo(u.role);
                  const isSelf = u._id === currentUser?._id;
                  const activeTenants = (u.tenantMemberships || []).filter((m) => m.isActive);
                  return (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium flex-shrink-0">
                            {u.firstName?.charAt(0) || <FiUser className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {u.firstName} {u.lastName}
                              {isSelf && (
                                <span className="text-xs text-gray-400 ms-1">({t('superAdmin.users.you', 'أنت')})</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isSelf ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${roleInfo?.bgColor || 'bg-gray-100'} ${roleInfo?.color || 'text-gray-600'}`}>
                            {u.role === 'SUPERADMIN' && <FiShield className="w-3 h-3" />}
                            {t(`users.roles.${u.role}`, u.role)}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {t(`users.roles.${role}`, role)}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {activeTenants.length === 0 ? (
                          <span className="text-xs text-gray-400 italic">
                            {t('superAdmin.users.noTenant', 'بدون مستأجر')}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {activeTenants.map((m) => (
                              <span
                                key={m.tenantId}
                                className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              >
                                {tenantNameMap[m.tenantId] || m.tenantId}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            {t('superAdmin.users.active', 'نشط')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {t('superAdmin.users.inactive', 'معطل')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            {u.isActive && u.role !== 'SUPERADMIN' && (
                              <button
                                onClick={() => setAssignModal({ userId: u._id, name: `${u.firstName} ${u.lastName}` })}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={t('superAdmin.users.assignToTenant', 'تعيين لمستأجر')}
                              >
                                <FiLink className="w-4 h-4" />
                              </button>
                            )}
                            {u.isActive ? (
                              <button
                                onClick={() => setConfirmAction({ type: 'deactivate', userId: u._id, name: `${u.firstName} ${u.lastName}` })}
                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title={t('superAdmin.users.deactivate', 'تعطيل')}
                              >
                                <FiUserX className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmAction({ type: 'activate', userId: u._id, name: `${u.firstName} ${u.lastName}` })}
                                className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title={t('superAdmin.users.activate', 'تنشيط')}
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {users?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      {t('superAdmin.users.noUsers', 'لا يوجد مستخدمون')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.type === 'deactivate') handleDeactivate(confirmAction.userId);
            else if (confirmAction.type === 'activate') handleActivate(confirmAction.userId);
          }}
          title={
            confirmAction.type === 'deactivate'
              ? t('superAdmin.users.confirmDeactivate', 'تعطيل المستخدم')
              : t('superAdmin.users.confirmActivate', 'تنشيط المستخدم')
          }
          message={`${
            confirmAction.type === 'deactivate'
              ? t('superAdmin.users.confirmDeactivateMsg', 'هل أنت متأكد من تعطيل')
              : t('superAdmin.users.confirmActivateMsg', 'هل أنت متأكد من تنشيط')
          } "${confirmAction.name}"?`}
          confirmText={t('actions.confirm', 'تأكيد')}
          type={confirmAction.type === 'deactivate' ? 'danger' : 'warning'}
        />
      )}

      {/* Assign to Tenant Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('superAdmin.users.assignToTenant', 'تعيين لمستأجر')}
              </h3>
              <button
                onClick={() => { setAssignModal(null); setAssignTenantId(''); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('superAdmin.users.assigningUser', 'تعيين المستخدم')}: <strong className="text-gray-900 dark:text-white">{assignModal.name}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('superAdmin.users.selectTenant', 'اختر المستأجر')}
                </label>
                <select
                  value={assignTenantId}
                  onChange={(e) => setAssignTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{t('superAdmin.users.chooseTenant', '-- اختر مستأجر --')}</option>
                  {activeTenants.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => { setAssignModal(null); setAssignTenantId(''); }}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('actions.cancel', 'إلغاء')}
                </button>
                <button
                  onClick={handleAssignToTenant}
                  disabled={!assignTenantId || assignLoading}
                  className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignLoading
                    ? t('actions.saving', 'جارٍ الحفظ...')
                    : t('superAdmin.users.assign', 'تعيين')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsersPage;
