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
import { getRoleInfo, useCreateUser } from '@/services/userService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import {
  FiUser,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiShield,
  FiLink,
} from 'react-icons/fi';
import { SearchInput } from '@components';

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', firstName: '', lastName: '', role: 'OWNER', password: '' });
  const [createLoading, setCreateLoading] = useState(false);

  const users = useAllUsers({ search: search || undefined, role: roleFilter });
  const tenants = useAllTenants({});
  const createUser = useCreateUser();
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

  const handleCreateUser = async () => {
    try {
      setCreateLoading(true);
      await createUser({
        username: newUser.username.trim(),
        firstName: newUser.firstName.trim(),
        lastName: newUser.lastName.trim() || undefined,
        password: newUser.password,
        role: newUser.role,
      });
      showSuccess(t('superAdmin.users.created', 'تم إنشاء المستخدم بنجاح'));
      setShowCreateModal(false);
      setNewUser({ username: '', firstName: '', lastName: '', role: 'OWNER', password: '' });
    } catch (err) {
      showError(err.message);
    } finally {
      setCreateLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('superAdmin.users.title', 'إدارة المستخدمين')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('superAdmin.users.subtitle', 'عرض وإدارة جميع المستخدمين على المنصة')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FiUserPlus className="w-4 h-4" />
          {t('superAdmin.users.addUser', 'إضافة مستخدم')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('superAdmin.users.searchPlaceholder', 'بحث بالاسم أو اسم المستخدم...')}
          wrapperClassName="flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-44 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('superAdmin.users.addUser', 'إضافة مستخدم')}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('actions.cancel', 'إلغاء')}
            </button>
            <button
              onClick={handleCreateUser}
              disabled={!newUser.username.trim() || !newUser.firstName.trim() || newUser.password.length < 8 || createLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createLoading ? t('actions.saving', 'جارٍ الحفظ...') : t('actions.create', 'إنشاء')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('users.fields.username', 'اسم المستخدم')}
            </label>
            <input
              type="text"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('users.fields.firstName', 'الاسم الأول')}
              </label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('users.fields.lastName', 'الاسم الأخير')}
              </label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('superAdmin.users.colRole', 'الدور')}
            </label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`users.roles.${role}`, role)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('users.fields.password', 'كلمة المرور')}
            </label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              dir="ltr"
              placeholder="••••••••"
            />
            {newUser.password && newUser.password.length < 8 && (
              <p className="mt-1 text-xs text-red-500">
                {t('validation.passwordMinLength', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')}
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Assign to Tenant Modal */}
      <Modal
        isOpen={!!assignModal}
        onClose={() => { setAssignModal(null); setAssignTenantId(''); }}
        title={t('superAdmin.users.assignToTenant', 'تعيين لمستأجر')}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
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
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('superAdmin.users.assigningUser', 'تعيين المستخدم')}: <strong className="text-gray-900 dark:text-white">{assignModal?.name}</strong>
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
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminUsersPage;
