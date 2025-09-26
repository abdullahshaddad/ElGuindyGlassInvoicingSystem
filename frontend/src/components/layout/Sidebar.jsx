import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
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
    FiLayers
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
    tools: FiTool
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
            {
                id: 'cutting-prices',
                to: '/admin/cutting-prices',
                icon: icons.cuttingPrices,
                label: t('navigation.cuttingPrices', 'أسعار القطع'),
                roles: ['OWNER'], // Only OWNER can access
                badge: 'جديد'
            },
            {
                id: 'reports',
                to: '/admin/reports',
                icon: icons.reports,
                label: t('navigation.reports', 'التقارير'),
                roles: ['OWNER'] // Owner only
            }
        ]
    },
    {
        id: 'account',
        title: t('navigation.account', 'الحساب'),
        items: [
            {
                id: 'settings',
                to: '/settings',
                icon: icons.settings,
                label: t('navigation.settings', 'الإعدادات'),
                roles: ['OWNER', 'ADMIN', 'CASHIER', 'WORKER']
            }
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
        <span className="font-medium">{label}</span>
        {badge && (
            <span className="mr-auto bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">
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
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { isOwner, isCashier, isWorker, isAdmin } = usePermissions();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

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
                    'fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700',
                    'transform transition-transform duration-300 ease-in-out',
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold">
                            G
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('app.name', 'نظام إدارة الزجاج')}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user?.displayName}
                            </p>
                        </div>
                    </div>

                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <span className="sr-only">إغلاق القائمة</span>
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-2 py-4 overflow-y-auto">
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

                {/* Footer with logout */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-lg transition-all duration-200"
                    >
                        <FiLogOut className="w-5 h-5" />
                        <span className="font-medium">{t('auth.logout', 'تسجيل الخروج')}</span>
                    </button>
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