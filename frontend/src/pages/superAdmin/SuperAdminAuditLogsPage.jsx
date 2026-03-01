import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSuperAdminAuditLogs, getSeverityInfo, formatAuditAction } from '@/services/auditLogService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  FiActivity,
  FiFilter,
  FiClock,
  FiChevronDown,
} from 'react-icons/fi';

const SuperAdminAuditLogsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [actionFilter, setActionFilter] = useState('');
  const [cursor, setCursor] = useState(undefined);
  const [allItems, setAllItems] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);

  const filters = {};
  if (actionFilter) filters.action = actionFilter;
  if (cursor) filters.cursor = cursor;

  const result = useSuperAdminAuditLogs(filters);
  const loading = result === undefined;

  // Merge loaded items
  const items = initialLoad ? (result?.items || []) : [...allItems, ...(result?.items || [])];

  const handleLoadMore = () => {
    if (result?.nextCursor) {
      setAllItems(items);
      setCursor(result.nextCursor);
      setInitialLoad(false);
    }
  };

  const handleFilterChange = (newAction) => {
    setActionFilter(newAction);
    setCursor(undefined);
    setAllItems([]);
    setInitialLoad(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('superAdmin.auditLogs.title', 'سجل مراجعة النظام')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('superAdmin.auditLogs.subtitle', 'جميع الإجراءات الإدارية على مستوى المنصة')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">{t('superAdmin.auditLogs.allActions', 'جميع الإجراءات')}</option>
          <option value="tenant.created">{t('superAdmin.auditLogs.tenantCreated', 'إنشاء مستأجر')}</option>
          <option value="tenant.suspended">{t('superAdmin.auditLogs.tenantSuspended', 'تعليق مستأجر')}</option>
          <option value="tenant.activated">{t('superAdmin.auditLogs.tenantActivated', 'تنشيط مستأجر')}</option>
          <option value="tenant.deleted">{t('superAdmin.auditLogs.tenantDeleted', 'حذف مستأجر')}</option>
          <option value="tenant.plan_changed">{t('superAdmin.auditLogs.planChanged', 'تغيير الخطة')}</option>
          <option value="user.role_changed">{t('superAdmin.auditLogs.roleChanged', 'تغيير الدور')}</option>
          <option value="user.deactivated">{t('superAdmin.auditLogs.userDeactivated', 'تعطيل مستخدم')}</option>
          <option value="user.activated">{t('superAdmin.auditLogs.userActivated', 'تنشيط مستخدم')}</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <FiActivity className="w-12 h-12 mb-3 opacity-30" />
            <p>{t('superAdmin.auditLogs.noLogs', 'لا يوجد سجلات')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((log, index) => {
              const severity = getSeverityInfo(log.severity);
              return (
                <div
                  key={log._id || index}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Severity indicator */}
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${severity.dotColor}`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatAuditAction(log.action)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {log.userEmail}
                          {log.entityId && (
                            <span className="mx-1">·</span>
                          )}
                          {log.entityType && (
                            <span className="capitalize">{log.entityType}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${severity.bgColor} ${severity.color}`}>
                          {isRTL ? severity.labelAr : severity.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Changes */}
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        {Object.entries(log.changes).map(([field, change]) => (
                          <div key={field} className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{field}:</span>{' '}
                            <span className="text-red-500 line-through">{String(change.from ?? '—')}</span>
                            {' → '}
                            <span className="text-green-600">{String(change.to ?? '—')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {result?.hasMore && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleLoadMore}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium transition-colors"
            >
              <FiChevronDown className="w-4 h-4" />
              {t('actions.loadMore', 'تحميل المزيد')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAuditLogsPage;
