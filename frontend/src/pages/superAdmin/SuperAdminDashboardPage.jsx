import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOverview, useRevenueStats } from '@/services/superAdminService';
import { getPlanInfo } from '@/services/superAdminService';
import { getSeverityInfo, formatAuditAction } from '@/services/auditLogService';
import {
  FiUsers,
  FiGrid,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiPauseCircle,
  FiTrendingUp,
  FiShield,
  FiClock,
  FiDollarSign,
} from 'react-icons/fi';

const StatsCard = ({ title, value, icon: Icon, color, subtitle, loading }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
        {loading ? (
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24" />
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const SuperAdminDashboardPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const overview = usePlatformOverview();
  const revenue = useRevenueStats();
  const isRTL = i18n.language === 'ar';
  const loading = overview === undefined;
  const revenueLoading = revenue === undefined;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('superAdmin.dashboard.title', 'لوحة تحكم النظام')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('superAdmin.dashboard.subtitle', 'نظرة عامة على المنصة')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiShield className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {t('superAdmin.badge', 'مدير النظام')}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('superAdmin.dashboard.totalTenants', 'إجمالي المستأجرين')}
          value={overview?.tenants?.total ?? '—'}
          icon={FiGrid}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          subtitle={`${overview?.tenants?.newThisMonth ?? 0} ${t('superAdmin.dashboard.newThisMonth', 'جديد هذا الشهر')}`}
          loading={loading}
        />
        <StatsCard
          title={t('superAdmin.dashboard.activeTenants', 'المستأجرون النشطون')}
          value={overview?.tenants?.active ?? '—'}
          icon={FiCheckCircle}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          loading={loading}
        />
        <StatsCard
          title={t('superAdmin.dashboard.suspendedTenants', 'المستأجرون المعلقون')}
          value={overview?.tenants?.suspended ?? '—'}
          icon={FiPauseCircle}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          loading={loading}
        />
        <StatsCard
          title={t('superAdmin.dashboard.totalUsers', 'إجمالي المستخدمين')}
          value={overview?.users?.total ?? '—'}
          icon={FiUsers}
          color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          subtitle={`${overview?.users?.active ?? 0} ${t('superAdmin.dashboard.activeUsers', 'نشط')}`}
          loading={loading}
        />
      </div>

      {/* Revenue Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t('superAdmin.revenue.mrr', 'MRR')}
          value={revenueLoading ? '—' : `${(revenue?.mrr ?? 0).toLocaleString()} ${t('common.currency', 'EGP')}`}
          icon={FiDollarSign}
          color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          subtitle={t('superAdmin.revenue.monthlyRecurring', 'Monthly recurring revenue')}
          loading={revenueLoading}
        />
        <StatsCard
          title={t('superAdmin.revenue.totalRevenue', 'Total Revenue')}
          value={revenueLoading ? '—' : `${(revenue?.totalRevenue ?? 0).toLocaleString()} ${t('common.currency', 'EGP')}`}
          icon={FiTrendingUp}
          color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
          loading={revenueLoading}
        />
        <StatsCard
          title={t('superAdmin.revenue.thisMonth', 'This Month')}
          value={revenueLoading ? '—' : `${(revenue?.thisMonthRevenue ?? 0).toLocaleString()} ${t('common.currency', 'EGP')}`}
          icon={FiDollarSign}
          color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          loading={revenueLoading}
        />
        <StatsCard
          title={t('superAdmin.revenue.activeSubscriptions', 'Active Subscriptions')}
          value={revenue?.activeSubscriptions ?? '—'}
          icon={FiCheckCircle}
          color="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
          subtitle={`${revenue?.totalPayments ?? 0} ${t('superAdmin.revenue.totalPayments', 'total payments')}`}
          loading={revenueLoading}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plans Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('superAdmin.dashboard.planDistribution', 'توزيع الخطط')}
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(overview?.tenants?.byPlan || {}).map(([plan, count]) => {
                const planInfo = getPlanInfo(plan);
                const total = overview?.tenants?.total || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={plan} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${planInfo.color}`}>
                          {isRTL ? planInfo.labelAr : planInfo.label}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${planInfo.bgColor}`}
                          style={{ width: `${percentage}%`, backgroundColor: planInfo.color.replace('text-', '').includes('gray') ? '#9ca3af' : undefined }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.keys(overview?.tenants?.byPlan || {}).length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('superAdmin.dashboard.noData', 'لا توجد بيانات')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('superAdmin.dashboard.recentActivity', 'النشاط الأخير')}
            </h2>
            <Link
              to="/super-admin/audit-logs"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('actions.viewAll', 'عرض الكل')}
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(overview?.recentActivity || []).slice(0, 10).map((log) => {
                const severity = getSeverityInfo(log.severity);
                return (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${severity.dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">
                        {formatAuditAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {log.userEmail} · {new Date(log.timestamp).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                );
              })}
              {(!overview?.recentActivity || overview.recentActivity.length === 0) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('superAdmin.dashboard.noActivity', 'لا يوجد نشاط حديث')}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Subscription Payments */}
      {revenue?.recentPayments && revenue.recentPayments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('superAdmin.revenue.recentPayments', 'Recent Payments')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-2 text-start">{t('superAdmin.tenants.colName', 'Tenant')}</th>
                  <th className="pb-2 text-start">{t('superAdmin.payments.amount', 'Amount')}</th>
                  <th className="pb-2 text-start">{t('superAdmin.payments.cycle', 'Cycle')}</th>
                  <th className="pb-2 text-start">{t('superAdmin.payments.status', 'Status')}</th>
                  <th className="pb-2 text-start">{t('superAdmin.payments.date', 'Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {revenue.recentPayments.map((p) => (
                  <tr key={p._id} className="text-sm">
                    <td className="py-2 font-medium text-gray-900 dark:text-white">{p.tenantName}</td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{p.amount.toLocaleString()} {t('common.currency', 'EGP')}</td>
                    <td className="py-2 text-gray-500 dark:text-gray-400 capitalize">{p.billingCycle}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'paid'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : p.status === 'pending'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/super-admin/tenants"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <FiGrid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('superAdmin.nav.manageTenants', 'إدارة المستأجرين')}
          </span>
        </Link>
        <Link
          to="/super-admin/users"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <FiUsers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('superAdmin.nav.manageUsers', 'إدارة المستخدمين')}
          </span>
        </Link>
        <Link
          to="/super-admin/audit-logs"
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
        >
          <FiActivity className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            {t('superAdmin.nav.auditLogs', 'سجل المراجعة')}
          </span>
        </Link>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
