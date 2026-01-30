import React, {useEffect, useState, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import {useAuth, usePermissions} from '@/contexts/AuthContext';
import dashboardService from '@/services/dashboardService';
import { useWebSocket, WEBSOCKET_TOPICS } from '@/hooks/useWebSocket';
import { useSnackbar } from '@/contexts/SnackbarContext';
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
    FiUsers,
    FiWifi,
    FiWifiOff,
    FiCalendar,
    FiPieChart
} from 'react-icons/fi';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

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

// Top Customer Row Component
const TopCustomerRow = ({customer, rank, isArabic}) => {
    const getRankBadge = (rank) => {
        const colors = {
            1: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            2: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
            3: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
        };
        return colors[rank] || 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
    };

    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(rank)}`}>
                    {rank}
                </span>
                <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.invoiceCount} {isArabic ? 'فاتورة' : 'invoices'}
                    </p>
                </div>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                {isArabic
                    ? `${customer.totalRevenue?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ج.م`
                    : `EGP ${customer.totalRevenue?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                }
            </span>
        </div>
    );
};

// Today's Summary Card Component
const TodaySummaryCard = ({todayStats, salesOverview, loading, isArabic}) => {
    if (loading) {
        return (
            <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${COMPANY_COLORS.primary}, ${COMPANY_COLORS.secondary})` }}>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/20 rounded w-1/3"></div>
                    <div className="h-8 bg-white/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${COMPANY_COLORS.primary}, ${COMPANY_COLORS.secondary})` }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">
                    {isArabic ? 'ملخص اليوم' : "Today's Summary"}
                </h3>
                <FiActivity className="w-6 h-6 opacity-80" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm opacity-80 mb-1">
                        {isArabic ? 'إيرادات اليوم' : "Today's Revenue"}
                    </p>
                    <p className="text-2xl font-bold">
                        {(todayStats?.totalRevenue || 0).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        <span className="text-sm mr-1">{isArabic ? 'ج.م' : 'EGP'}</span>
                    </p>
                </div>
                <div>
                    <p className="text-sm opacity-80 mb-1">
                        {isArabic ? 'فواتير اليوم' : "Today's Invoices"}
                    </p>
                    <p className="text-2xl font-bold">
                        {todayStats?.invoiceCount || 0}
                    </p>
                </div>
            </div>
            {salesOverview && (
                <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                        <span className="opacity-80">{isArabic ? 'عملاء هذا الشهر' : 'Monthly Customers'}</span>
                        <span className="font-semibold">{salesOverview.uniqueCustomers || 0}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Outstanding Balance Card
const OutstandingBalanceCard = ({stats, loading, isArabic}) => {
    if (loading || !stats) {
        return (
            <div className="rounded-xl p-6 text-white" style={{ background: `linear-gradient(135deg, ${COMPANY_COLORS.accent}, #48CAE4)` }}>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-white/20 rounded w-1/3"></div>
                    <div className="h-8 bg-white/20 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    const pendingAmount = stats.totalRevenue - (stats.paidInvoices > 0 && stats.totalInvoices > 0
        ? (stats.totalRevenue / stats.totalInvoices) * stats.paidInvoices
        : 0);

    return (
        <div className="rounded-xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${COMPANY_COLORS.accent}, #48CAE4)` }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold opacity-90">
                    {isArabic ? 'المبالغ المعلقة' : 'Outstanding Balance'}
                </h3>
                <FiAlertCircle className="w-6 h-6 opacity-80" />
            </div>
            <div className="space-y-3">
                <div>
                    <p className="text-sm opacity-80 mb-1">
                        {isArabic ? 'إجمالي المعلق' : 'Total Pending'}
                    </p>
                    <p className="text-2xl font-bold">
                        {pendingAmount.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        <span className="text-sm mr-1">{isArabic ? 'ج.م' : 'EGP'}</span>
                    </p>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/20">
                    <span className="opacity-80">{isArabic ? 'فواتير معلقة' : 'Pending Invoices'}</span>
                    <span className="font-semibold">{stats.pendingInvoices || 0}</span>
                </div>
            </div>
        </div>
    );
};

// Month name translations
const MONTH_NAMES = {
    ar: {
        JANUARY: 'يناير', FEBRUARY: 'فبراير', MARCH: 'مارس', APRIL: 'أبريل',
        MAY: 'مايو', JUNE: 'يونيو', JULY: 'يوليو', AUGUST: 'أغسطس',
        SEPTEMBER: 'سبتمبر', OCTOBER: 'أكتوبر', NOVEMBER: 'نوفمبر', DECEMBER: 'ديسمبر'
    },
    en: {
        JANUARY: 'Jan', FEBRUARY: 'Feb', MARCH: 'Mar', APRIL: 'Apr',
        MAY: 'May', JUNE: 'Jun', JULY: 'Jul', AUGUST: 'Aug',
        SEPTEMBER: 'Sep', OCTOBER: 'Oct', NOVEMBER: 'Nov', DECEMBER: 'Dec'
    }
};

// Company Colors - Bright Blue Theme
const COMPANY_COLORS = {
    primary: '#0077B6',    // Blue
    secondary: '#3FA796',  // Teal/Green
    accent: '#00B4D8',     // Bright Cyan Blue
    warning: '#F59E0B',    // Amber for warnings
    dark: '#1C1C1C',       // Dark
    light: '#F5F5F5'       // Light gray
};

// Revenue Chart Component
const RevenueChart = ({ data, loading, isArabic }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    // Transform data for chart
    const chartData = data.map(item => ({
        month: MONTH_NAMES[isArabic ? 'ar' : 'en'][item.month] || item.month,
        revenue: item.revenue || 0,
        invoices: item.invoiceCount || 0
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm" style={{ color: COMPANY_COLORS.primary }}>
                        {isArabic ? 'الإيرادات: ' : 'Revenue: '}
                        {payload[0]?.value?.toLocaleString('en-US', {minimumFractionDigits: 0})} {isArabic ? 'ج.م' : 'EGP'}
                    </p>
                    {payload[1] && (
                        <p className="text-sm" style={{ color: COMPANY_COLORS.secondary }}>
                            {isArabic ? 'الفواتير: ' : 'Invoices: '}{payload[1]?.value}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isArabic ? 'الإيرادات الشهرية' : 'Monthly Revenue'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isArabic ? 'آخر 6 أشهر' : 'Last 6 months'}
                    </p>
                </div>
                <FiBarChart2 className="w-6 h-6" style={{ color: COMPANY_COLORS.primary }} />
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COMPANY_COLORS.primary} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={COMPANY_COLORS.primary} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={COMPANY_COLORS.primary}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Invoice Status Pie Chart Component
const InvoiceStatusChart = ({ stats, loading, isArabic }) => {
    if (loading || !stats) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-full w-48 mx-auto"></div>
                </div>
            </div>
        );
    }

    // Use company colors for pie chart - bright blues
    const PIE_COLORS = [COMPANY_COLORS.secondary, COMPANY_COLORS.warning, '#ef4444'];

    const data = [
        { name: isArabic ? 'مدفوعة' : 'Paid', value: stats.paidInvoices || 0, color: PIE_COLORS[0] },
        { name: isArabic ? 'معلقة' : 'Pending', value: stats.pendingInvoices || 0, color: PIE_COLORS[1] },
        { name: isArabic ? 'ملغاة' : 'Cancelled', value: (stats.totalInvoices - stats.paidInvoices - stats.pendingInvoices) || 0, color: PIE_COLORS[2] }
    ].filter(item => item.value > 0);

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isArabic ? 'حالة الفواتير' : 'Invoice Status'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isArabic ? 'هذا الشهر' : 'This month'}
                    </p>
                </div>
                <FiPieChart className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-center">
                <div className="w-48 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value, name) => [
                                    `${value} (${((value / total) * 100).toFixed(0)}%)`,
                                    name
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mr-6 space-y-3">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Growth Comparison Card
const GrowthComparisonCard = ({ currentMonth, previousMonth, loading, isArabic }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    const currentRevenue = currentMonth?.totalRevenue || 0;
    const previousRevenue = previousMonth?.revenue || 0;
    const growthPercent = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0 ? 100 : 0;

    const isPositive = growthPercent >= 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isArabic ? 'مقارنة النمو' : 'Growth Comparison'}
                </h3>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    isPositive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                    {isPositive ? <FiTrendingUp className="w-4 h-4" /> : <FiTrendingDown className="w-4 h-4" />}
                    {Math.abs(growthPercent).toFixed(1)}%
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {isArabic ? 'الشهر الحالي' : 'This Month'}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {currentRevenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        <span className="text-xs mr-1 font-normal">{isArabic ? 'ج.م' : 'EGP'}</span>
                    </p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {isArabic ? 'الشهر السابق' : 'Last Month'}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {previousRevenue.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        <span className="text-xs mr-1 font-normal">{isArabic ? 'ج.م' : 'EGP'}</span>
                    </p>
                </div>
            </div>
            <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{isArabic ? 'التقدم نحو الهدف' : 'Progress to Goal'}</span>
                    <span>{Math.min(100, (currentRevenue / (previousRevenue || 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${isPositive ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (currentRevenue / (previousRevenue || 1)) * 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

// Daily Activity Mini Chart
const DailyActivityCard = ({ todayStats, salesOverview, loading, isArabic }) => {
    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    const avgDailyInvoices = salesOverview?.completedOrders
        ? Math.round(salesOverview.completedOrders / 30)
        : 0;

    const todayInvoices = todayStats?.invoiceCount || 0;
    const performance = avgDailyInvoices > 0
        ? ((todayInvoices / avgDailyInvoices) * 100).toFixed(0)
        : todayInvoices > 0 ? 100 : 0;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {isArabic ? 'نشاط اليوم' : "Today's Activity"}
                </h3>
                <FiActivity className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{todayInvoices}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isArabic ? 'فواتير اليوم' : 'invoices today'}
                        </p>
                    </div>
                    <div className={`text-right px-3 py-2 rounded-lg ${
                        Number(performance) >= 100
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : Number(performance) >= 50
                                ? 'bg-amber-100 dark:bg-amber-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                        <p className={`text-2xl font-bold ${
                            Number(performance) >= 100
                                ? 'text-green-600 dark:text-green-400'
                                : Number(performance) >= 50
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-red-600 dark:text-red-400'
                        }`}>{performance}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isArabic ? 'من المتوسط' : 'of average'}
                        </p>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{isArabic ? 'المتوسط اليومي' : 'Daily average'}: {avgDailyInvoices}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Number(performance))}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const {t, i18n} = useTranslation();
    const {user} = useAuth();
    const {isOwner, isCashier, isWorker} = usePermissions();
    const { showSuccess, showInfo } = useSnackbar();

    // State management
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentInvoices, setRecentInvoices] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [todayStats, setTodayStats] = useState(null);
    const [salesOverview, setSalesOverview] = useState(null);
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [error, setError] = useState(null);

    // WebSocket message handler
    const handleWebSocketMessage = useCallback((topic, data) => {
        console.log('Dashboard WebSocket message:', topic, data);

        switch (topic) {
            case WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED:
                // New invoice created - refresh data
                showInfo(i18n.language === 'ar'
                    ? `فاتورة جديدة #${data.invoiceId} - ${data.customerName}`
                    : `New invoice #${data.invoiceId} - ${data.customerName}`
                );
                fetchDashboardData();
                break;

            case WEBSOCKET_TOPICS.DASHBOARD_PRINT_UPDATE:
                // Print job status changed
                console.log('Print job update:', data);
                break;

            case WEBSOCKET_TOPICS.DASHBOARD_INVOICE_STATUS:
                // Invoice status changed - refresh data
                showInfo(i18n.language === 'ar'
                    ? `تم تحديث حالة الفاتورة #${data.invoiceId}`
                    : `Invoice #${data.invoiceId} status updated`
                );
                fetchDashboardData();
                break;

            default:
                break;
        }
    }, [i18n.language]);

    // WebSocket connection for real-time updates
    const { connected: wsConnected } = useWebSocket({
        topics: [
            WEBSOCKET_TOPICS.DASHBOARD_INVOICE_CREATED,
            WEBSOCKET_TOPICS.DASHBOARD_PRINT_UPDATE,
            WEBSOCKET_TOPICS.DASHBOARD_INVOICE_STATUS
        ],
        onMessage: handleWebSocketMessage,
        enabled: true
    });

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all data in parallel
            const [dashboardStats, invoices, customers, todayData, overview, monthly] = await Promise.all([
                dashboardService.getDashboardStats(),
                dashboardService.getRecentInvoices(5),
                dashboardService.getTopCustomers(5, 'month').catch(() => []),
                dashboardService.getRevenueStats({ period: 'today' }).catch(() => null),
                dashboardService.getSalesOverview('month').catch(() => null),
                dashboardService.getMonthlyRevenue(6).catch(() => [])
            ]);

            setStats(dashboardStats);
            setRecentInvoices(invoices || []);
            setTopCustomers(customers || []);
            setTodayStats(todayData);
            setSalesOverview(overview);
            setMonthlyRevenue(monthly || []);
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

        // Calculate outstanding balance
        const outstandingBalance = (stats.totalRevenue || 0) -
            (stats.paidInvoices > 0 ? (stats.totalRevenue / stats.totalInvoices) * stats.paidInvoices : 0);

        if (isOwner || isCashier) {
            return [{
                title: i18n.language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue',
                value: `${(stats.totalRevenue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${i18n.language === 'ar' ? 'ج.م' : 'EGP'}`,
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
                value: `${(stats.averageOrderValue || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${i18n.language === 'ar' ? 'ج.م' : 'EGP'}`,
                icon: FiShoppingCart,
                loading: loading,
                subtitle: i18n.language === 'ar' ? 'متوسط القيمة' : 'Average value'
            }];
        } else if (isWorker) {
            return [{
                title: i18n.language === 'ar' ? 'طلبات اليوم' : "Today's Orders",
                value: todayStats?.invoiceCount || '0',
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
        <div className="rounded-xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${COMPANY_COLORS.primary}, ${COMPANY_COLORS.secondary})` }}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-2">
                        {getWelcomeMessage()}{i18n.language === 'ar' ? '، ' : ', '}{user?.firstName}
                    </h1>
                    <p className="opacity-90">
                        {isOwner && (i18n.language === 'ar' ? 'نظرة عامة على أداء الأعمال' : 'Business performance overview')}
                        {isCashier && (i18n.language === 'ar' ? 'جاهز لخدمة العملاء اليوم' : 'Ready to serve customers today')}
                        {isWorker && (i18n.language === 'ar' ? 'مهامك في المصنع' : 'Your factory tasks')}
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    {/* WebSocket Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        wsConnected
                            ? 'bg-white/20 text-white'
                            : 'bg-red-500/30 text-red-100'
                    }`}>
                        {wsConnected ? <FiWifi size={14} /> : <FiWifiOff size={14} />}
                        <span className="text-xs font-medium">
                            {wsConnected
                                ? (i18n.language === 'ar' ? 'مباشر' : 'Live')
                                : (i18n.language === 'ar' ? 'غير متصل' : 'Offline')
                            }
                        </span>
                    </div>
                    <div className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                        <p className="text-sm opacity-90">
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

        {/* Today's Summary & Outstanding Balance - Owner/Cashier only */}
        {(isOwner || isCashier) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TodaySummaryCard
                    todayStats={todayStats}
                    salesOverview={salesOverview}
                    loading={loading}
                    isArabic={i18n.language === 'ar'}
                />
                <OutstandingBalanceCard
                    stats={stats}
                    loading={loading}
                    isArabic={i18n.language === 'ar'}
                />
            </div>
        )}

        {/* Charts Section - Owner only */}
        {isOwner && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <RevenueChart
                        data={monthlyRevenue}
                        loading={loading}
                        isArabic={i18n.language === 'ar'}
                    />
                </div>
                {/* Invoice Status Pie Chart */}
                <div className="lg:col-span-1">
                    <InvoiceStatusChart
                        stats={stats}
                        loading={loading}
                        isArabic={i18n.language === 'ar'}
                    />
                </div>
            </div>
        )}

        {/* Growth & Activity Cards - Owner only */}
        {isOwner && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GrowthComparisonCard
                    currentMonth={stats}
                    previousMonth={monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2] : null}
                    loading={loading}
                    isArabic={i18n.language === 'ar'}
                />
                <DailyActivityCard
                    todayStats={todayStats}
                    salesOverview={salesOverview}
                    loading={loading}
                    isArabic={i18n.language === 'ar'}
                />
            </div>
        )}

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

        {/* Top Customers (Owner Only) */}
        {isOwner && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {i18n.language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}
                    </h3>
                    <Link
                        to="/customers"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                    >
                        {i18n.language === 'ar' ? 'عرض الكل' : 'View All'}
                    </Link>
                </div>
                <div className="space-y-1">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                            ))}
                        </div>
                    ) : topCustomers.length > 0 ? (
                        topCustomers.map((customer, index) => (
                            <TopCustomerRow
                                key={customer.customerId}
                                customer={customer}
                                rank={index + 1}
                                isArabic={i18n.language === 'ar'}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <FiUsers className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm">
                                {i18n.language === 'ar' ? 'لا توجد بيانات عملاء' : 'No customer data'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}

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