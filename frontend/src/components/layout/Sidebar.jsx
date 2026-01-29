import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext.jsx';
import { companyProfileService } from '@services/companyProfileService';
import clsx from 'clsx';
import {
    FiHome,
    FiFileText,
    FiUsers,
    FiSettings,
    FiBox,
    FiBarChart,
    FiTool,
    FiLogOut,
    FiX,
    FiUserCheck,
    FiDollarSign,
    FiLayers,
    FiActivity,
    FiBriefcase,
    FiSun,
    FiMoon,
    FiGlobe,
    FiUser
} from 'react-icons/fi';

// Professional icon mapping using React Icons
const icons = {
    dashboard: FiHome,
    invoices: FiFileText,
    customers: FiUsers,
    factory: FiBox,
    admin: FiSettings,
    glassTypes: FiLayers,
    reports: FiBarChart,
    settings: FiSettings,
    userManagement: FiUserCheck,
    cuttingPrices: FiDollarSign,
    operationPrices: FiActivity,
    companyProfile: FiBriefcase,
    tools: FiTool,
    cashierInvoice: FiFileText,
};

// Sidebar configuration - centralized navigation structure
const getSidebarItems = (t) => [
    {
        id: 'main',
        title: t('navigation.main', 'الرئيسية'),
        items: [
            {
                id: 'dashboard',
                to: '/dashboard',
                icon: icons.dashboard,
                label: t('navigation.dashboard', 'لوحة التحكم'),
                roles: ['OWNER', 'ADMIN']
            }
        ]
    },
    {
        id: 'sales',
        title: t('navigation.sales', 'المبيعات'),
        roles: ['OWNER', 'ADMIN', 'CASHIER'],
        items: [
            {
                id: 'invoices',
                to: '/invoices',
                icon: icons.invoices,
                label: t('navigation.invoices', 'الفواتير'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            },
            {
                id: 'customers',
                to: '/customers',
                icon: icons.customers,
                label: t('navigation.customers', 'العملاء'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            }
        ]
    },
    {
        id: 'cashier',
        title: t('navigation.cashier', 'الكاشير'),
        roles: ['OWNER', 'ADMIN', 'CASHIER'],
        items: [
            {
                id: 'cashier-invoice',
                to: '/sys-cashier',
                icon: icons.cashierInvoice,
                label: t('navigation.cashierInvoice', 'فاتورة الكاشير'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            }
        ]
    },
    {
        id: 'factory',
        title: t('navigation.factory', 'المصنع'),
        roles: ['OWNER', 'ADMIN', 'WORKER'],
        items: [
            {
                id: 'factory-tasks',
                to: '/factory',
                icon: icons.factory,
                label: t('navigation.factory', 'مهام المصنع'),
                roles: ['OWNER', 'ADMIN', 'WORKER']
            }
        ]
    },
    {
        id: 'admin',
        title: t('navigation.admin', 'الإدارة'),
        roles: ['OWNER', 'ADMIN'],
        items: [
            {
                id: 'company-profile',
                to: '/admin/company-profile',
                icon: icons.companyProfile,
                label: t('navigation.companyProfile', 'بيانات الشركة'),
                roles: ['OWNER']
            },
            {
                id: 'user-management',
                to: '/admin/users',
                icon: icons.userManagement,
                label: t('users.title', 'إدارة المستخدمين'),
                roles: ['OWNER', 'ADMIN']
            },
            {
                id: 'glass-types',
                to: '/admin/glass-types',
                icon: icons.glassTypes,
                label: t('navigation.glassTypes', 'أنواع الزجاج'),
                roles: ['OWNER', 'ADMIN']
            },
            // {
            //     id: 'cutting-prices',
            //     to: '/admin/cutting-prices',
            //     icon: icons.cuttingPrices,
            //     label: t('navigation.cuttingPrices', 'أسعار القطع'),
            //     roles: ['OWNER'],
            //     badge: 'جديد'
            // },
            // {
            //     id: 'operation-prices',
            //     to: '/admin/operation-prices',
            //     icon: icons.operationPrices,
            //     label: t('navigation.operationPrices', 'أسعار العمليات'),
            //     roles: ['OWNER', 'ADMIN']
            // }
        ]
    }
];

const NavItem = ({ to, icon: IconComponent, label, isActive, onClick, badge }) => (
    <Link
        to={to}
        onClick={onClick}
        className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
            'hover:bg-primary-50 dark:hover:bg-gray-800',
            isActive && 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
            !isActive && 'text-gray-700 dark:text-gray-300'
        )}
    >
        <IconComponent className="w-5 h-5" />
        <span className="font-medium flex-1">{label}</span>
        {badge && (
            <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">
                {badge}
            </span>
        )}
    </Link>
);

const NavGroup = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
            {title}
        </h3>
        <nav className="space-y-1">
            {children}
        </nav>
    </div>
);

const Sidebar = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const { user, logout } = useAuth();
    const { isOwner, isCashier, isWorker, isAdmin } = usePermissions();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const [showUserSettings, setShowUserSettings] = useState(false);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [companyName, setCompanyName] = useState(null);

    const isRTL = i18n.language === 'ar';
    const isActive = (path) => location.pathname === path;

    // Fetch company profile for logo
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await companyProfileService.getProfile();
                if (profile?.logoUrl) {
                    setCompanyLogo(profile.logoUrl);
                }
                if (profile?.companyNameArabic || profile?.companyName) {
                    setCompanyName(isRTL ? profile.companyNameArabic : profile.companyName);
                }
            } catch (error) {
                console.error('Failed to fetch company profile:', error);
            }
        };
        fetchProfile();
    }, [isRTL]);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    // Helper function to check if user has access to a specific role
    const hasRole = (requiredRoles) => {
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const userRole = user?.role;
        return requiredRoles.includes(userRole);
    };

    // Helper function to check if group should be visible
    const shouldShowGroup = (group) => {
        if (!group.roles) return true;
        return hasRole(group.roles);
    };

    // Helper function to check if item should be visible
    const shouldShowItem = (item) => {
        if (!item.roles) return true;
        return hasRole(item.roles);
    };

    const handleLogout = async () => {
        await logout();
        onClose();
    };

    // Get sidebar configuration
    const sidebarItems = getSidebarItems(t);

    return (
        <>
            {/* Sidebar */}
            <div
                className={clsx(
                    'fixed inset-y-0 z-50 w-64 bg-white dark:bg-gray-900',
                    'transform transition-transform duration-300 ease-in-out',
                    'flex flex-col',
                    // Position based on language direction
                    isRTL ? 'right-0 border-l border-gray-200 dark:border-gray-700' : 'left-0 border-r border-gray-200 dark:border-gray-700',
                    // Desktop: always visible
                    'lg:translate-x-0',
                    // Mobile: slide in/out based on direction
                    isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
                )}
            >
                {/* Sidebar header - Fixed at top */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className={clsx(
                        'flex items-center gap-3',
                        isRTL ? 'justify-between' : 'justify-between flex-row-reverse'
                    )}>
                        <div className={clsx('flex items-center gap-3', !isRTL && 'flex-row-reverse')}>
                            {companyLogo ? (
                                <img
                                    src={companyLogo}
                                    alt={companyName || t('app.name', 'الجيندي للزجاج')}
                                    className="w-10 h-10 rounded-xl object-contain"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className={clsx(
                                    "w-10 h-10 bg-primary-500 rounded-xl items-center justify-center text-white font-bold",
                                    companyLogo ? "hidden" : "flex"
                                )}
                            >
                                G
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {companyName || t('app.name', 'الجيندي للزجاج')}
                                </h1>
                            </div>
                        </div>

                        {/* Close button for mobile */}
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation - Scrollable section */}
                <div className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
                    {/* ADDED: overflow-y-auto for vertical scrolling, overflow-x-hidden to prevent horizontal scroll */}
                    {sidebarItems.map((group) => {
                        // Check if group should be visible based on user roles
                        if (!shouldShowGroup(group)) return null;

                        // Filter items based on user roles
                        const visibleItems = group.items.filter(shouldShowItem);

                        // Don't render group if no items are visible
                        if (visibleItems.length === 0) return null;

                        return (
                            <NavGroup key={group.id} title={group.title}>
                                {visibleItems.map((item) => (
                                    <NavItem
                                        key={item.id}
                                        to={item.to}
                                        icon={item.icon}
                                        label={item.label}
                                        isActive={isActive(item.to)}
                                        onClick={onClose}
                                        badge={item.badge}
                                    />
                                ))}
                            </NavGroup>
                        );
                    })}
                </div>

                {/* Footer with user info, settings, and logout - Fixed at bottom */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                    {/* Settings Panel - Shows when user clicks on profile */}
                    {showUserSettings && (
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
                                    <span className="text-sm font-medium">
                                        {isDarkMode ? t('theme.dark', 'الوضع الليلي') : t('theme.light', 'الوضع النهاري')}
                                    </span>
                                </div>
                                <div className={clsx(
                                    'w-9 h-5 rounded-full p-0.5 transition-colors',
                                    isDarkMode ? 'bg-primary-600' : 'bg-gray-300'
                                )}>
                                    <div className={clsx(
                                        'w-4 h-4 bg-white rounded-full shadow transition-transform',
                                        isDarkMode
                                            ? (isRTL ? '-translate-x-4' : 'translate-x-4')
                                            : 'translate-x-0'
                                    )} />
                                </div>
                            </button>

                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FiGlobe className="w-4 h-4" />
                                    <span className="text-sm font-medium">{t('language.title', 'اللغة')}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-medium">
                                    {i18n.language === 'ar' ? 'AR' : 'EN'}
                                </span>
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('auth.logout', 'تسجيل الخروج')}</span>
                            </button>
                        </div>
                    )}

                    {/* User Profile - Clickable */}
                    <div
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setShowUserSettings(!showUserSettings)}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                                {user?.firstName?.charAt(0) || <FiUser size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">
                                    {user?.displayName || t('users.user')}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.role === 'OWNER' && t('users.roles.OWNER')}
                                    {user?.role === 'ADMIN' && t('users.roles.ADMIN')}
                                    {user?.role === 'CASHIER' && t('users.roles.CASHIER')}
                                    {user?.role === 'WORKER' && t('users.roles.WORKER')}
                                </div>
                            </div>
                            <FiSettings className={clsx(
                                'w-5 h-5 text-gray-400 transition-transform duration-200',
                                showUserSettings && 'rotate-90'
                            )} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
        </>
    );
};

export default Sidebar;