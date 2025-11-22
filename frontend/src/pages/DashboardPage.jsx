import React, {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {useAuth, usePermissions} from '@/contexts/AuthContext';
import dashboardService from '@/services/dashboardService';
import {
    FiActivity,
    FiAlertCircle,
    FiBarChart2,
    FiCheckCircle,
    FiClock,
    FiDollarSign,
    FiFileText,
    FiPackage,
    FiShoppingCart,
    FiTool,
    FiTrendingDown,
    FiTrendingUp,
    FiUsers
} from 'react-icons/fi';

// Stats Card Component
const StatsCard = ({title, value, change, icon: Icon, loading, trend, subtitle}) => {
    return (<div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>) : (<>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</h3>
                    {subtitle && (<p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>)}
                    {change !== undefined && change !== null && (<div
                        className={`flex items-center gap-1 text-sm font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? <FiTrendingUp className="w-4 h-4"/> :
                            <FiTrendingDown className="w-4 h-4"/>}
                        <span>{Math.abs(change).toFixed(1)}%</span>
                        {trend &&
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">من الشهر الماضي</span>}
                    </div>)}
                </>)}
            </div>
            <div className="flex-shrink-0">
                <div
                    className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400"/>
                </div>
            </div>
        </div>
    </div>);
};

// Quick Action Card Component
const QuickActionCard = ({title, icon: Icon, to, description}) => {
    const {i18n} = useTranslation();
    const isArabic = i18n.language === 'ar';

    return (<Link
        to={to}
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-lg transition-all duration-200 group block"
        dir={isArabic ? 'rtl' : 'ltr'}
    >
        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : 'flex-row'}`}>
            <div
                className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400"/>
            </div>

            <div className="flex-1">
                <h4
                    className={`text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${isArabic ? 'text-right' : 'text-left'}`}
                >
                    {title}
                </h4>
                {description && (<p
                    className={`text-xs text-gray-500 dark:text-gray-400 mt-0.5 ${isArabic ? 'text-right' : 'text-left'}`}
                >
                    {description}
                </p>)}
            </div>
        </div>
    </Link>);
};


// Recent Invoice Row Component
const InvoiceRow = ({invoice}) => {
    const {i18n} = useTranslation();

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
            case 'PENDING':
                return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
            case 'CANCELLED':
                return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PAID':
                return 'مدفوعة';
            case 'PENDING':
                return 'معلقة';
            case 'CANCELLED':
                return 'ملغاة';
            default:
                return status;
        }
    };

    return (<div
        className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {invoice.customer?.name || 'عميل'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                #{invoice.id}
            </p>
        </div>
        <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
    {i18n.language === 'ar' ? `${invoice.totalPrice?.toFixed(2)} ج.م` : `EGP ${invoice.totalPrice?.toFixed(2)}`}
</span>

        </div>
    </div>);
};

const DashboardPage = () => {
    const {t, i18n} = useTranslation();
    const {user} = useAuth();
    const {isOwner, isCashier, isWorker} = usePermissions();

    // State management
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [error, setError] = useState(null);

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch dashboard stats from backend
            const dashboardStats = await dashboardService.getDashboardStats();

            // Fetch recent invoices
            const invoices = await dashboardService.getRecentInvoices(5);

            setStats(dashboardStats);
            setRecentInvoices(invoices || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError(i18n.language === 'ar' ? 'فشل في تحميل بيانات لوحة التحكم' : 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getWelcomeMessage = () => {
        const hour = new Date().getHours();
        if (i18n.language === 'ar') {
            if (hour < 12) return 'صباح الخير';
            if (hour < 18) return 'مساء الخير';
            return 'مساء الخير';
        } else {
            if (hour < 12) return 'Good Morning';
            if (hour < 18) return 'Good Afternoon';
            return 'Good Evening';
        }
    };

    const getQuickActions = () => {
        if (isOwner) {
            return [{
                title: i18n.language === 'ar' ? 'فاتورة جديدة' : 'New Invoice',
                icon: FiFileText,
                to: '/sys-cashier',
                description: i18n.language === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create new invoice'
            }, {
                title: i18n.language === 'ar' ? 'عميل جديد' : 'New Customer',
                icon: FiUsers,
                to: '/customers',
                description: i18n.language === 'ar' ? 'إضافة عميل جديد' : 'Add new customer'
            }, {
                title: i18n.language === 'ar' ? 'التقارير' : 'Reports',
                icon: FiBarChart2,
                to: '/reports',
                description: i18n.language === 'ar' ? 'عرض التقارير والإحصائيات' : 'View reports and analytics'
            }, {
                title: i18n.language === 'ar' ? 'الإعدادات' : 'Settings',
                icon: FiTool,
                to: '/settings',
                description: i18n.language === 'ar' ? 'إدارة إعدادات النظام' : 'Manage system settings'
            }];
        } else if (isCashier) {
            return [{
                title: i18n.language === 'ar' ? 'فاتورة جديدة' : 'New Invoice',
                icon: FiFileText,
                to: '/invoices/new',
                description: i18n.language === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create new invoice'
            }, {
                title: i18n.language === 'ar' ? 'عرض الفواتير' : 'View Invoices',
                icon: FiPackage,
                to: '/invoices',
                description: i18n.language === 'ar' ? 'إدارة الفواتير' : 'Manage invoices'
            }, {
                title: i18n.language === 'ar' ? 'العملاء' : 'Customers',
                icon: FiUsers,
                to: '/customers',
                description: i18n.language === 'ar' ? 'إدارة العملاء' : 'Manage customers'
            }];
        } else if (isWorker) {
            return [{
                title: i18n.language === 'ar' ? 'طلبات المصنع' : 'Factory Orders',
                icon: FiPackage,
                to: '/factory',
                description: i18n.language === 'ar' ? 'عرض طلبات الإنتاج' : 'View production orders'
            }, {
                title: i18n.language === 'ar' ? 'المهام المعلقة' : 'Pending Tasks',
                icon: FiClock,
                to: '/factory/pending',
                description: i18n.language === 'ar' ? 'عرض المهام المعلقة' : 'View pending tasks'
            }];
        }
        return [];
    };

    const getDashboardStats = () => {
        if (!stats) return [];

        if (isOwner || isCashier) {
            return [{
                title: i18n.language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
                value: `${(stats.totalRevenue || 0).toFixed(2)} ${i18n.language === 'ar' ? 'ج.م' : 'EGP'}`,
                icon: FiDollarSign,
                loading: loading,
                subtitle: i18n.language === 'ar' ? 'هذا الشهر' : 'This month'
            }, {
                title: i18n.language === 'ar' ? 'عدد الفواتير' : 'Total Invoices',
                value: stats.totalInvoices || '0',
                icon: FiFileText,
                loading: loading,
                subtitle: i18n.language === 'ar' ? 'هذا الشهر' : 'This month'
            }, {
                title: i18n.language === 'ar' ? 'الفواتير المدفوعة' : 'Paid Invoices',
                value: stats.paidInvoices || '0',
                icon: FiCheckCircle,
                loading: loading,
                subtitle: `${stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(0) : 0}% ${i18n.language === 'ar' ? 'من الإجمالي' : 'of total'}`
            }, {
                title: i18n.language === 'ar' ? 'معدل الفاتورة' : 'Average Invoice',
                value: `${(stats.averageOrderValue || 0).toFixed(2)} ${i18n.language === 'ar' ? 'ج.م' : 'EGP'}`,
                icon: FiShoppingCart,
                loading: loading,
                subtitle: i18n.language === 'ar' ? 'متوسط القيمة' : 'Average value'
            }

            ];
        } else if (isWorker) {
            return [{
                title: i18n.language === 'ar' ? 'طلبات اليوم' : "Today's Orders",
                value: '0',
                icon: FiPackage,
                loading: loading
            }, {
                title: i18n.language === 'ar' ? 'المهام المكتملة' : 'Completed Tasks',
                value: '0',
                icon: FiCheckCircle,
                loading: loading
            }, {
                title: i18n.language === 'ar' ? 'المهام المعلقة' : 'Pending Tasks',
                value: '0',
                icon: FiClock,
                loading: loading
            }, {
                title: i18n.language === 'ar' ? 'الإنتاجية' : 'Productivity',
                value: '0%',
                icon: FiActivity,
                loading: loading
            }];
        }
        return [];
    };

    const quickActions = getQuickActions();
    const dashboardStats = getDashboardStats();

    return (<div className="space-y-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        {getWelcomeMessage()}، {user?.firstName}
                    </h1>
                    <p className="text-blue-100">
                        {isOwner && (i18n.language === 'ar' ? 'نظرة عامة على أداء الأعمال' : 'Business performance overview')}
                        {isCashier && (i18n.language === 'ar' ? 'جاهز لخدمة العملاء اليوم' : 'Ready to serve customers today')}
                        {isWorker && (i18n.language === 'ar' ? 'مهامك في المصنع' : 'Your factory tasks')}
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <div className="text-right">
                        <p className="text-sm text-blue-100">
                            {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Error Message */}
        {error && (<div
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"/>
            <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline mt-1"
                >
                    {i18n.language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
            </div>
        </div>)}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardStats.map((stat, index) => (<StatsCard key={index} {...stat} />))}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {i18n.language === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
                    </h3>
                    <div className="space-y-3">
                        {quickActions.map((action, index) => (<QuickActionCard key={index} {...action} />))}
                    </div>
                </div>
            </div>

            {/* Recent Invoices */}
            <div className="lg:col-span-2">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {i18n.language === 'ar' ? 'الفواتير الأخيرة' : 'Recent Invoices'}
                        </h3>
                        <Link
                            to="/invoices"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                            {i18n.language === 'ar' ? 'عرض الكل' : 'View All'}
                        </Link>
                    </div>
                    <div className="space-y-1">
                        {loading ? (<div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (<div key={i}
                                                              className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>))}
                        </div>) : recentInvoices.length > 0 ? (recentInvoices.map((invoice) => (
                            <InvoiceRow key={invoice.id} invoice={invoice}/>))) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <FiFileText className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600"/>
                                <p className="text-sm">
                                    {i18n.language === 'ar' ? 'لا توجد فواتير حديثة' : 'No recent invoices'}
                                </p>
                            </div>)}
                    </div>
                </div>
            </div>
        </div>

        {/* Performance Overview (Owner Only) */}
        {isOwner && stats && (<div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {i18n.language === 'ar' ? 'نظرة عامة على الأداء' : 'Performance Overview'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {i18n.language === 'ar' ? 'معدل الدفع' : 'Payment Rate'}
                                </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(0) : 0}%
                                </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-green-500 dark:bg-green-400 h-2 rounded-full transition-all"
                            style={{width: `${stats.totalInvoices > 0 ? ((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%`}}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {i18n.language === 'ar' ? 'الفواتير المعلقة' : 'Pending Invoices'}
                                </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats.totalInvoices > 0 ? ((stats.pendingInvoices / stats.totalInvoices) * 100).toFixed(0) : 0}%
                                </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full transition-all"
                            style={{width: `${stats.totalInvoices > 0 ? ((stats.pendingInvoices / stats.totalInvoices) * 100) : 0}%`}}
                        ></div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {i18n.language === 'ar' ? 'كفاءة النظام' : 'System Efficiency'}
                                </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {stats.totalInvoices > 0 ? 85 : 0}%
                                </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all"
                            style={{width: `${stats.totalInvoices > 0 ? '85%' : '0%'}`}}
                        ></div>
                    </div>
                </div>
            </div>
        </div>)}
    </div>);
};

export default DashboardPage;