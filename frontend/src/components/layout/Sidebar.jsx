import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import clsx from 'clsx';

// Icons (you can replace with actual icon library)
const icons = {
    dashboard: '📊',
    invoices: '🧾',
    customers: '👥',
    factory: '🏭',
    admin: '⚙️',
    glassTypes: '🔷',
    reports: '📈',
    settings: '🔧',
};

const NavItem = ({ to, icon, label, isActive, onClick, badge }) => (
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
        <span className="text-xl">{icon}</span>
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
    const { isOwner, isCashier, isWorker, canAccess } = usePermissions();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await logout();
        onClose();
    };

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
                                {t('app.name', 'النظام العربي')}
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
                        ✕
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 px-2 py-4 overflow-y-auto">
                    {/* Main Navigation */}
                    <NavGroup title={t('navigation.main', 'الرئيسية')}>
                        <NavItem
                            to="/dashboard"
                            icon={icons.dashboard}
                            label={t('navigation.dashboard', 'لوحة التحكم')}
                            isActive={isActive('/dashboard')}
                            onClick={onClose}
                        />
                    </NavGroup>

                    {/* Invoice Management - Cashier & Owner */}
                    {(isCashier || isOwner) && (
                        <NavGroup title={t('navigation.invoices', 'الفواتير')}>
                            <NavItem
                                to="/invoices"
                                icon={icons.invoices}
                                label={t('navigation.invoices', 'الفواتير')}
                                isActive={isActive('/invoices')}
                                onClick={onClose}
                            />
                            <NavItem
                                to="/invoices/new"
                                icon="➕"
                                label={t('navigation.newInvoice', 'فاتورة جديدة')}
                                isActive={isActive('/invoices/new')}
                                onClick={onClose}
                            />
                            <NavItem
                                to="/customers"
                                icon={icons.customers}
                                label={t('navigation.customers', 'العملاء')}
                                isActive={isActive('/customers')}
                                onClick={onClose}
                            />
                        </NavGroup>
                    )}

                    {/* Factory Management - Worker & Owner */}
                    {(isWorker || isOwner) && (
                        <NavGroup title={t('navigation.factory', 'المصنع')}>
                            <NavItem
                                to="/factory"
                                icon={icons.factory}
                                label={t('navigation.factory', 'المصنع')}
                                isActive={isActive('/factory')}
                                onClick={onClose}
                            />
                        </NavGroup>
                    )}

                    {/* Admin Section - Owner Only */}
                    {isOwner && (
                        <NavGroup title={t('navigation.admin', 'الإدارة')}>
                            <NavItem
                                to="/admin/glass-types"
                                icon={icons.glassTypes}
                                label={t('navigation.glassTypes', 'أنواع الزجاج')}
                                isActive={isActive('/admin/glass-types')}
                                onClick={onClose}
                            />
                            <NavItem
                                to="/admin/users"
                                icon="👤"
                                label={t('navigation.users', 'المستخدمون')}
                                isActive={isActive('/admin/users')}
                                onClick={onClose}
                            />
                            <NavItem
                                to="/admin/reports"
                                icon={icons.reports}
                                label={t('navigation.reports', 'التقارير')}
                                isActive={isActive('/admin/reports')}
                                onClick={onClose}
                            />
                        </NavGroup>
                    )}

                    {/* Settings */}
                    <NavGroup title={t('navigation.settings', 'الإعدادات')}>
                        <NavItem
                            to="/profile"
                            icon="👤"
                            label={t('navigation.profile', 'الملف الشخصي')}
                            isActive={isActive('/profile')}
                            onClick={onClose}
                        />
                        <NavItem
                            to="/settings"
                            icon={icons.settings}
                            label={t('navigation.settings', 'الإعدادات')}
                            isActive={isActive('/settings')}
                            onClick={onClose}
                        />
                    </NavGroup>
                </div>

                {/* User info and logout */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {user?.displayName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.role === 'OWNER' && 'مالك'}
                                    {user?.role === 'CASHIER' && 'كاشير'}
                                    {user?.role === 'WORKER' && 'عامل'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <span>🚪</span>
                        {t('navigation.logout', 'تسجيل الخروج')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;