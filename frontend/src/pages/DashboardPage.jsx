import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';

const StatsCard = ({ title, value, change, icon, color = 'primary' }) => {
    const colorClasses = {
        primary: 'bg-primary-500 text-white',
        secondary: 'bg-secondary-500 text-white',
        accent: 'bg-accent-500 text-white',
        green: 'bg-green-500 text-white',
        red: 'bg-red-500 text-white',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {change && (
                        <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1`}>
                            {change >= 0 ? '↗️' : '↘️'} {Math.abs(change)}%
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { isOwner, isCashier, isWorker } = usePermissions();

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير';
        if (hour < 18) return 'مساء الخير';
        return 'مساء الخير';
    };

    const getDashboardStats = () => {
        // This would normally come from API calls
        if (isOwner) {
            return [
                { title: 'إجمالي الإيرادات', value: '15,240 ج.م', change: 12.5, icon: '💰', color: 'primary' },
                { title: 'الفواتير اليوم', value: '23', change: 8.2, icon: '🧾', color: 'secondary' },
                { title: 'العملاء الجدد', value: '7', change: -2.1, icon: '👥', color: 'accent' },
                { title: 'الطلبات المعلقة', value: '12', change: 0, icon: '⏳', color: 'red' },
            ];
        } else if (isCashier) {
            return [
                { title: 'الفواتير اليوم', value: '8', change: 5.3, icon: '🧾', color: 'primary' },
                { title: 'المبيعات اليوم', value: '3,450 ج.م', change: 15.2, icon: '💰', color: 'secondary' },
                { title: 'العملاء المخدومين', value: '12', change: 8.7, icon: '👥', color: 'accent' },
                { title: 'الطلبات المعلقة', value: '3', change: -12.5, icon: '⏳', color: 'green' },
            ];
        } else if (isWorker) {
            return [
                { title: 'المهام اليوم', value: '6', change: 0, icon: '🔧', color: 'primary' },
                { title: 'المهام المكتملة', value: '4', change: 33.3, icon: '✅', color: 'green' },
                { title: 'المهام المعلقة', value: '2', change: -50, icon: '⏳', color: 'red' },
                { title: 'ساعات العمل', value: '7.5', change: 6.7, icon: '⏰', color: 'secondary' },
            ];
        }
        return [];
    };

    const getQuickActions = () => {
        if (isOwner) {
            return [
                { title: 'عرض التقارير', icon: '📊', href: '/admin/reports', color: 'bg-primary-500' },
                { title: 'إدارة أنواع الزجاج', icon: '🔷', href: '/admin/glass-types', color: 'bg-secondary-500' },
                { title: 'إدارة المستخدمين', icon: '👥', href: '/admin/users', color: 'bg-accent-500' },
                { title: 'الإعدادات', icon: '⚙️', href: '/settings', color: 'bg-gray-500' },
            ];
        } else if (isCashier) {
            return [
                { title: 'فاتورة جديدة', icon: '➕', href: '/invoices/new', color: 'bg-primary-500' },
                { title: 'عرض الفواتير', icon: '🧾', href: '/invoices', color: 'bg-secondary-500' },
                { title: 'إدارة العملاء', icon: '👥', href: '/customers', color: 'bg-accent-500' },
                { title: 'البحث', icon: '🔍', href: '/search', color: 'bg-gray-500' },
            ];
        } else if (isWorker) {
            return [
                { title: 'مهام المصنع', icon: '🏭', href: '/factory', color: 'bg-primary-500' },
                { title: 'الطلبات الجديدة', icon: '📋', href: '/factory/new-orders', color: 'bg-secondary-500' },
                { title: 'تقرير الإنتاج', icon: '📈', href: '/factory/production', color: 'bg-accent-500' },
                { title: 'الملف الشخصي', icon: '👤', href: '/profile', color: 'bg-gray-500' },
            ];
        }
        return [];
    };

    const stats = getDashboardStats();
    const quickActions = getQuickActions();

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold mb-2">
                            {getWelcomeMessage()}، {user?.firstName}
                        </h1>
                        <p className="text-primary-100">
                            {isOwner && 'مرحباً بك في لوحة تحكم المالك'}
                            {isCashier && 'جاهز لخدمة العملاء اليوم؟'}
                            {isWorker && 'لديك مهام جديدة في المصنع'}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">
                {isOwner && '👑'}
                  {isCashier && '💼'}
                  {isWorker && '🔧'}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <StatsCard
                        key={index}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    الإجراءات السريعة
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <a
                            key={index}
                            href={action.href}
                            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                        >
                            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                <span className="text-xl text-white">{action.icon}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                {action.title}
              </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        الفواتير الأخيرة
                    </h2>
                    <div className="space-y-3">
                        {[1, 2, 3].map((_, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        #
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            فاتورة #{2024000 + index + 1}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            عميل {index + 1}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {(Math.random() * 1000 + 500).toFixed(0)} ج.م
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        اليوم
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        حالة النظام
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">الخادم</span>
                            <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">متصل</span>
              </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">قاعدة البيانات</span>
                            <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">متصلة</span>
              </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">الطابعة</span>
                            <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">تحذير</span>
              </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">التخزين</span>
                            <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 dark:text-green-400">متاح</span>
              </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;