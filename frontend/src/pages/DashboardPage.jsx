import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import {
    FiTrendingUp,
    FiTrendingDown,
    FiDollarSign,
    FiShoppingCart,
    FiUsers,
    FiPackage,
    FiPlus,
    FiFileText,
    FiBarChart,
    FiSettings,
    FiTool,
    FiSearch,
    FiClipboard,
    FiUser,
    FiKey,
    FiBriefcase
} from 'react-icons/fi';

const StatsCard = ({ title, value, change, IconComponent, color = 'primary' }) => {
    const colorClasses = {
        primary: 'bg-primary-500 text-white',
        secondary: 'bg-secondary-500 text-white',
        accent: 'bg-accent-500 text-white',
        green: 'bg-green-500 text-white',
        red: 'bg-red-500 text-white',
        blue: 'bg-blue-500 text-white',
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
                    {change !== undefined && (
                        <p className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1 flex items-center gap-1`}>
                            {change >= 0 ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
                            {Math.abs(change)}%
                        </p>
                    )}
                </div>
                <div className="hidden md:block">
                    <div className={`w-16 h-16 ${colorClasses[color]} rounded-full flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8" />
                    </div>
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
        if (hour < 12) return t('dashboard.welcome.morning', 'صباح الخير');
        if (hour < 18) return t('dashboard.welcome.afternoon', 'مساء الخير');
        return t('dashboard.welcome.evening', 'مساء الخير');
    };

    const getRoleIcon = () => {
        if (isOwner) return FiKey;
        if (isCashier) return FiBriefcase;
        if (isWorker) return FiTool;
        return FiUser;
    };

    const getDashboardStats = () => {
        if (isOwner) {
            return [
                {
                    title: 'إجمالي الإيرادات',
                    value: '₪45,230',
                    change: 12,
                    IconComponent: FiDollarSign,
                    color: 'green'
                },
                {
                    title: 'الفواتير هذا الشهر',
                    value: '156',
                    change: 8,
                    IconComponent: FiFileText,
                    color: 'blue'
                },
                {
                    title: 'العملاء الجدد',
                    value: '23',
                    change: 15,
                    IconComponent: FiUsers,
                    color: 'primary'
                },
                {
                    title: 'الطلبات المعلقة',
                    value: '7',
                    change: -3,
                    IconComponent: FiPackage,
                    color: 'red'
                }
            ];
        } else if (isCashier) {
            return [
                {
                    title: 'مبيعات اليوم',
                    value: '₪2,340',
                    change: 5,
                    IconComponent: FiDollarSign,
                    color: 'green'
                },
                {
                    title: 'الفواتير اليوم',
                    value: '12',
                    change: 3,
                    IconComponent: FiFileText,
                    color: 'blue'
                },
                {
                    title: 'العملاء المخدومين',
                    value: '8',
                    change: 2,
                    IconComponent: FiUsers,
                    color: 'primary'
                },
                {
                    title: 'متوسط قيمة الفاتورة',
                    value: '₪195',
                    change: 7,
                    IconComponent: FiShoppingCart,
                    color: 'accent'
                }
            ];
        } else if (isWorker) {
            return [
                {
                    title: 'مهام اليوم',
                    value: '5',
                    IconComponent: FiClipboard,
                    color: 'blue'
                },
                {
                    title: 'المهام المكتملة',
                    value: '3',
                    IconComponent: FiPackage,
                    color: 'green'
                },
                {
                    title: 'الطلبات الجديدة',
                    value: '2',
                    IconComponent: FiPlus,
                    color: 'primary'
                },
                {
                    title: 'ساعات العمل',
                    value: '6.5h',
                    IconComponent: FiTool,
                    color: 'accent'
                }
            ];
        }
        return [];
    };

    const getQuickActions = () => {
        if (isOwner) {
            return [
                {
                    title: 'عرض التقارير',
                    IconComponent: FiBarChart,
                    href: '/reports',
                    color: 'bg-primary-500'
                },
                {
                    title: 'إدارة أنواع الزجاج',
                    IconComponent: FiTool,
                    href: 'admin/glass-types',
                    color: 'bg-secondary-500'
                },
                {
                    title: 'إدارة المستخدمين',
                    IconComponent: FiUsers,
                    href: '/users',
                    color: 'bg-accent-500'
                },
                {
                    title: 'الإعدادات',
                    IconComponent: FiSettings,
                    href: '/settings',
                    color: 'bg-gray-500'
                },
            ];
        } else if (isCashier) {
            return [
                {
                    title: 'فاتورة جديدة',
                    IconComponent: FiPlus,
                    href: '/invoices/new',
                    color: 'bg-primary-500'
                },
                {
                    title: 'عرض الفواتير',
                    IconComponent: FiFileText,
                    href: '/invoices',
                    color: 'bg-secondary-500'
                },
                {
                    title: 'إدارة العملاء',
                    IconComponent: FiUsers,
                    href: '/customers',
                    color: 'bg-accent-500'
                },
                {
                    title: 'البحث',
                    IconComponent: FiSearch,
                    href: '/search',
                    color: 'bg-gray-500'
                },
            ];
        } else if (isWorker) {
            return [
                {
                    title: 'مهام المصنع',
                    IconComponent: FiTool,
                    href: '/factory',
                    color: 'bg-primary-500'
                },
                {
                    title: 'الطلبات الجديدة',
                    IconComponent: FiClipboard,
                    href: '/factory/new-orders',
                    color: 'bg-secondary-500'
                },
                {
                    title: 'تقرير الإنتاج',
                    IconComponent: FiBarChart,
                    href: '/factory/production',
                    color: 'bg-accent-500'
                },
                {
                    title: 'الملف الشخصي',
                    IconComponent: FiUser,
                    href: '/profile',
                    color: 'bg-gray-500'
                },
            ];
        }
        return [];
    };

    const stats = getDashboardStats();
    const quickActions = getQuickActions();
    const RoleIcon = getRoleIcon();

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
                            <RoleIcon className="w-8 h-8" />
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
                        IconComponent={stat.IconComponent}
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
                                <action.IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                                {action.title}
                            </span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Activity or Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        النشاط الأخير
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <FiFileText className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    فاتورة جديدة #1024
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    منذ دقيقتين
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <FiUsers className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    عميل جديد مضاف
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    منذ 5 دقائق
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                                <FiPackage className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    طلب جديد في المصنع
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    منذ 10 دقائق
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Chart or Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ملخص الأداء
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">معدل الإنجاز</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">85%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">رضا العملاء</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">كفاءة المصنع</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div className="bg-primary-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;