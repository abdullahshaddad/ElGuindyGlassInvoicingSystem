import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiSearch, FiTrash2, FiMail, FiX, FiClock, FiEdit2, FiShield } from 'react-icons/fi';
import { Badge, Button, Modal, Select } from '@components';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useSnackbar } from '@/contexts/SnackbarContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import useAuthorized from '@hooks/useAuthorized.js';
import { useUsers } from '@services/userService';
import {
    useTenantMembers,
    useAddTenantMember,
    useUpdateMemberPermissions,
    useRemoveTenantMember,
    useTenantInvitations,
    useCreateInvitation,
    useCancelInvitation,
} from '@/services/tenantService';
import { useAllUsers } from '@/services/superAdminService';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================
// Permission presets and categories (mirrors backend enums.ts)
// ============================================================

const PERMISSION_PRESETS = {
    fullAccess: [
        "orders:create", "orders:read", "orders:update", "orders:delete", "orders:export",
        "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:print", "invoices:export",
        "products:create", "products:read", "products:update", "products:delete",
        "stickers:generate", "stickers:print",
        "customers:create", "customers:read", "customers:update", "customers:delete",
        "inventory:read", "inventory:update",
        "users:read", "users:invite", "users:manage", "users:delete",
        "roles:read", "roles:manage",
        "settings:read", "settings:update",
        "audit:read", "audit:export",
        "reports:view", "reports:export",
        "tenant:manage",
    ],
    management: [
        "orders:create", "orders:read", "orders:update", "orders:delete", "orders:export",
        "invoices:create", "invoices:read", "invoices:update", "invoices:delete", "invoices:print", "invoices:export",
        "products:create", "products:read", "products:update", "products:delete",
        "stickers:generate", "stickers:print",
        "customers:create", "customers:read", "customers:update", "customers:delete",
        "inventory:read", "inventory:update",
        "users:read", "users:invite", "users:manage",
        "roles:read",
        "settings:read", "settings:update",
        "audit:read", "audit:export",
        "reports:view", "reports:export",
    ],
    basic: [
        "orders:create", "orders:read", "orders:update", "orders:delete",
        "invoices:create", "invoices:read", "invoices:update", "invoices:print",
        "products:create", "products:read", "products:update",
        "stickers:generate", "stickers:print",
        "customers:create", "customers:read", "customers:update",
        "inventory:read", "inventory:update",
        "users:read",
        "reports:view",
    ],
    readOnly: [
        "orders:read",
        "invoices:read",
        "products:read",
        "customers:read",
        "inventory:read",
        "reports:view",
    ],
};

const PERMISSION_CATEGORIES = [
    { resource: "invoices", actions: ["create", "read", "update", "delete", "print", "export"] },
    { resource: "orders", actions: ["create", "read", "update", "delete", "export"] },
    { resource: "customers", actions: ["create", "read", "update", "delete"] },
    { resource: "products", actions: ["create", "read", "update", "delete"] },
    { resource: "stickers", actions: ["generate", "print"] },
    { resource: "inventory", actions: ["read", "update"] },
    { resource: "reports", actions: ["view", "export"] },
    { resource: "users", actions: ["read", "invite", "manage", "delete"] },
    { resource: "roles", actions: ["read", "manage"] },
    { resource: "settings", actions: ["read", "update"] },
    { resource: "audit", actions: ["read", "export"] },
    { resource: "tenant", actions: ["manage"] },
];

/** Summarize a permissions array for display */
function getPermissionSummary(permissions, t) {
    if (!permissions || permissions.length === 0) {
        return { label: t('tenant.permissions.preset.readOnly'), badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }

    const sortedPerms = [...permissions].sort().join(',');

    for (const [key, preset] of Object.entries(PERMISSION_PRESETS)) {
        const sortedPreset = [...preset].sort().join(',');
        if (sortedPerms === sortedPreset) {
            const colors = {
                fullAccess: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                management: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                basic: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                readOnly: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            };
            return { label: t(`tenant.permissions.preset.${key}`), badgeClass: colors[key] };
        }
    }

    return {
        label: t('tenant.permissions.summary', { count: permissions.length }),
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
}

// ============================================================
// Permission Editor Component
// ============================================================

const PermissionEditor = ({ permissions, onChange, t, isRTL }) => {
    const handleToggle = (permission) => {
        const newPerms = permissions.includes(permission)
            ? permissions.filter((p) => p !== permission)
            : [...permissions, permission];
        onChange(newPerms);
    };

    const applyPreset = (presetKey) => {
        onChange([...PERMISSION_PRESETS[presetKey]]);
    };

    const activePreset = useMemo(() => {
        const sorted = [...permissions].sort().join(',');
        for (const [key, preset] of Object.entries(PERMISSION_PRESETS)) {
            if (sorted === [...preset].sort().join(',')) return key;
        }
        return null;
    }, [permissions]);

    return (
        <div className="space-y-4">
            {/* Presets */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('tenant.permissions.presets')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {Object.keys(PERMISSION_PRESETS).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => applyPreset(key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                activePreset === key
                                    ? 'bg-primary-100 border-primary-500 text-primary-700 dark:bg-primary-900 dark:border-primary-400 dark:text-primary-300'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {t(`tenant.permissions.preset.${key}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Groups */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pe-1">
                {PERMISSION_CATEGORIES.map((cat) => (
                    <div
                        key={cat.resource}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                    >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                            {t(`tenant.permissions.categories.${cat.resource}`)}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {cat.actions.map((action) => {
                                const perm = `${cat.resource}:${action}`;
                                return (
                                    <label
                                        key={perm}
                                        className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissions.includes(perm)}
                                            onChange={() => handleToggle(perm)}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                        {t(`tenant.permissions.actions.${action}`)}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================
// Main Page
// ============================================================

const TenantMembersPage = () => {
    const { t, i18n } = useTranslation();
    const { showSuccess, showError } = useSnackbar();
    const { currentTenant, user } = useAuth();
    const isRTL = i18n.language === 'ar';

    const {
        isAuthorized,
        isLoading: authLoading,
    } = useAuthorized(['SUPERADMIN']);

    const isSuperAdmin = user?.role === 'SUPERADMIN';

    const members = useTenantMembers();
    const tenantUsers = useUsers();
    const platformUsers = useAllUsers(isSuperAdmin ? {} : "skip");
    const allUsers = isSuperAdmin ? platformUsers : tenantUsers;
    const addMember = useAddTenantMember();
    const updateMemberPermissions = useUpdateMemberPermissions();
    const removeMember = useRemoveTenantMember();
    const invitations = useTenantInvitations();
    const createInvitation = useCreateInvitation();
    const cancelInvitation = useCancelInvitation();

    const loading = members === undefined;

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ userId: '', permissions: [...PERMISSION_PRESETS.basic] });
    const [addLoading, setAddLoading] = useState(false);
    const [removeTarget, setRemoveTarget] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', permissions: [...PERMISSION_PRESETS.basic] });
    const [inviteLoading, setInviteLoading] = useState(false);

    // Permission editor modal
    const [editTarget, setEditTarget] = useState(null); // { membershipId, permissions, name, tenantRole }
    const [editPermissions, setEditPermissions] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    // Filter members by search
    const filteredMembers = useMemo(() => {
        if (!members) return [];
        if (!searchTerm.trim()) return members;
        const lower = searchTerm.toLowerCase();
        return members.filter(
            (m) =>
                m.username?.toLowerCase().includes(lower) ||
                m.firstName?.toLowerCase().includes(lower) ||
                m.lastName?.toLowerCase().includes(lower)
        );
    }, [members, searchTerm]);

    // Users not already members (for add-member dropdown)
    const availableUsers = useMemo(() => {
        if (!allUsers || !members) return [];
        const memberIds = new Set(members.map((m) => m.userId));
        return allUsers.filter((u) => !memberIds.has(u._id) && u.isActive);
    }, [allUsers, members]);

    const handleAddMember = async () => {
        if (!addForm.userId || addForm.permissions.length === 0) return;
        try {
            setAddLoading(true);
            await addMember({ userId: addForm.userId, permissions: addForm.permissions });
            showSuccess(t('tenant.messages.memberAdded'));
            setShowAddModal(false);
            setAddForm({ userId: '', permissions: [...PERMISSION_PRESETS.basic] });
        } catch (error) {
            console.error('Error adding member:', error);
            showError(error?.message || t('tenant.messages.memberAddError'));
        } finally {
            setAddLoading(false);
        }
    };

    const handleOpenEdit = useCallback((member) => {
        setEditTarget({
            membershipId: member.membershipId,
            name: `${member.firstName} ${member.lastName}`,
            tenantRole: member.tenantRole,
        });
        setEditPermissions([...(member.permissions || [])]);
    }, []);

    const handleSavePermissions = async () => {
        if (!editTarget) return;
        try {
            setEditLoading(true);
            await updateMemberPermissions({
                membershipId: editTarget.membershipId,
                permissions: editPermissions,
            });
            showSuccess(t('tenant.messages.roleUpdated'));
            setEditTarget(null);
        } catch (error) {
            console.error('Error updating permissions:', error);
            showError(error?.message || t('tenant.messages.roleUpdateError'));
        } finally {
            setEditLoading(false);
        }
    };

    const handleRemoveMember = async () => {
        if (!removeTarget) return;
        try {
            await removeMember({ membershipId: removeTarget });
            showSuccess(t('tenant.messages.memberRemoved'));
        } catch (error) {
            console.error('Error removing member:', error);
            showError(error?.message || t('tenant.messages.memberRemoveError'));
        } finally {
            setRemoveTarget(null);
        }
    };

    const handleSendInvitation = async () => {
        if (!inviteForm.email || inviteForm.permissions.length === 0) return;
        try {
            setInviteLoading(true);
            await createInvitation({ email: inviteForm.email, permissions: inviteForm.permissions });
            showSuccess(t('tenant.messages.invitationSent', 'تم إرسال الدعوة بنجاح'));
            setShowInviteModal(false);
            setInviteForm({ email: '', permissions: [...PERMISSION_PRESETS.basic] });
        } catch (error) {
            console.error('Error sending invitation:', error);
            showError(error?.message || t('tenant.messages.invitationError', 'فشل إرسال الدعوة'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCancelInvitation = async (invitationId) => {
        try {
            await cancelInvitation({ invitationId });
            showSuccess(t('tenant.messages.invitationCancelled', 'تم إلغاء الدعوة'));
        } catch (error) {
            console.error('Error cancelling invitation:', error);
            showError(error?.message || t('tenant.messages.invitationCancelError', 'فشل إلغاء الدعوة'));
        }
    };

    const pendingInvitations = useMemo(() => {
        if (!invitations) return [];
        return invitations.filter((inv) => inv.status === 'pending');
    }, [invitations]);

    // Table columns
    const columns = [
        {
            key: 'user',
            label: t('tenant.membersPage.columns.user'),
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-primary-500"
                    >
                        {row.firstName?.charAt(0) || row.username?.charAt(0) || '?'}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            {row.firstName} {row.lastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{row.username}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'permissions',
            label: t('tenant.permissions.title'),
            render: (row) => {
                const isOwner = row.tenantRole === 'owner';

                if (isOwner) {
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                            <FiShield className="w-3 h-3" />
                            {t('tenant.permissions.owner')}
                        </span>
                    );
                }

                const summary = getPermissionSummary(row.permissions, t);
                const canEdit = isSuperAdmin || (user?.permissions?.includes('users:manage') && row.userId !== user?.id);

                return (
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${summary.badgeClass}`}>
                            {summary.label}
                        </span>
                        {canEdit && (
                            <button
                                onClick={() => handleOpenEdit(row)}
                                className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                title={t('tenant.permissions.editPermissions')}
                            >
                                <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: t('tenant.membersPage.columns.status'),
            render: (row) => (
                <Badge
                    variant={row.isActive ? 'success' : 'error'}
                >
                    {row.isActive
                        ? (isRTL ? 'نشط' : 'Active')
                        : (isRTL ? 'معطل' : 'Inactive')}
                </Badge>
            ),
        },
        {
            key: 'joinedAt',
            label: t('tenant.membersPage.columns.joinedAt'),
            render: (row) => (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {row.joinedAt
                        ? new Date(row.joinedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')
                        : '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: t('tenant.membersPage.columns.actions'),
            render: (row) => {
                const isOwner = row.tenantRole === 'owner';
                const canRemove = !isOwner && (isSuperAdmin || user?.permissions?.includes('users:manage')) && row.userId !== user?.id;

                if (!canRemove) return null;

                return (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget(row.membershipId)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                );
            },
        },
    ];

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
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('tenant.membersPage.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {t('tenant.membersPage.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2"
                    >
                        <FiMail />
                        {t('tenant.memberActions.inviteMember', 'دعوة عضو')}
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2"
                    >
                        <FiPlus />
                        {t('tenant.memberActions.addMember')}
                    </Button>
                </div>
            </header>

            {/* Search */}
            <div className="relative max-w-md">
                <FiSearch className="absolute top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 start-3" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('tenant.membersPage.searchPlaceholder')}
                    className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {filteredMembers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {t('tenant.membersPage.noMembers')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                    {columns.map((col) => (
                                        <th
                                            key={col.key}
                                            className="px-4 py-3 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                        >
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredMembers.map((member) => (
                                    <tr
                                        key={member.membershipId}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                                                {col.render(member)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setAddForm({ userId: '', permissions: [...PERMISSION_PRESETS.basic] });
                }}
                title={t('tenant.memberActions.addMember')}
                size="lg"
            >
                <div className="space-y-4 p-4">
                    <Select
                        label={t('tenant.memberActions.selectUser')}
                        value={addForm.userId}
                        onChange={(e) => setAddForm((prev) => ({ ...prev, userId: e.target.value }))}
                        placeholder={t('tenant.memberActions.selectUser')}
                        options={availableUsers.map((u) => ({
                            value: u._id,
                            label: `${u.firstName} ${u.lastName} (@${u.username})`,
                        }))}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tenant.permissions.title')}
                        </label>
                        <PermissionEditor
                            permissions={addForm.permissions}
                            onChange={(perms) => setAddForm((prev) => ({ ...prev, permissions: perms }))}
                            t={t}
                            isRTL={isRTL}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowAddModal(false);
                                setAddForm({ userId: '', permissions: [...PERMISSION_PRESETS.basic] });
                            }}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            onClick={handleAddMember}
                            disabled={!addForm.userId || addForm.permissions.length === 0 || addLoading}
                            loading={addLoading}
                        >
                            {t('tenant.memberActions.addMember')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Permissions Modal */}
            <Modal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                title={`${t('tenant.permissions.editPermissions')} — ${editTarget?.name || ''}`}
                size="lg"
            >
                <div className="space-y-4 p-4">
                    <PermissionEditor
                        permissions={editPermissions}
                        onChange={setEditPermissions}
                        t={t}
                        isRTL={isRTL}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => setEditTarget(null)}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            onClick={handleSavePermissions}
                            disabled={editLoading}
                            loading={editLoading}
                        >
                            {t('actions.save')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            {t('tenant.invitations.pending', 'دعوات معلقة')} ({pendingInvitations.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {pendingInvitations.map((inv) => {
                            const summary = getPermissionSummary(inv.permissions, t);
                            return (
                                <div key={inv._id} className="px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                            <FiMail className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{inv.email}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {t('tenant.invitations.invitedBy', 'بدعوة من')} {inv.inviterName} &middot;{' '}
                                                {new Date(inv.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${summary.badgeClass}`}>
                                            {summary.label}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleCancelInvitation(inv._id)}
                                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                                            title={t('tenant.invitations.cancel', 'إلغاء الدعوة')}
                                        >
                                            <FiX className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            <Modal
                isOpen={showInviteModal}
                onClose={() => {
                    setShowInviteModal(false);
                    setInviteForm({ email: '', permissions: [...PERMISSION_PRESETS.basic] });
                }}
                title={t('tenant.memberActions.inviteMember', 'دعوة عضو')}
                size="lg"
            >
                <div className="space-y-4 p-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('tenant.invitations.email', 'البريد الإلكتروني')}
                        </label>
                        <input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder={t('tenant.invitations.emailPlaceholder', 'example@company.com')}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            dir="ltr"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tenant.permissions.title')}
                        </label>
                        <PermissionEditor
                            permissions={inviteForm.permissions}
                            onChange={(perms) => setInviteForm((prev) => ({ ...prev, permissions: perms }))}
                            t={t}
                            isRTL={isRTL}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowInviteModal(false);
                                setInviteForm({ email: '', permissions: [...PERMISSION_PRESETS.basic] });
                            }}
                        >
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            onClick={handleSendInvitation}
                            disabled={!inviteForm.email || inviteForm.permissions.length === 0 || inviteLoading}
                            loading={inviteLoading}
                        >
                            {t('tenant.invitations.send', 'إرسال الدعوة')}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Remove Confirmation */}
            <ConfirmationDialog
                isOpen={!!removeTarget}
                onClose={() => setRemoveTarget(null)}
                onConfirm={handleRemoveMember}
                title={t('tenant.memberActions.removeMember')}
                message={t('tenant.memberActions.confirmRemove')}
                confirmText={t('tenant.memberActions.removeMember')}
                cancelText={t('actions.cancel')}
                type="danger"
            />
        </div>
    );
};

export default TenantMembersPage;
