import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext.jsx';
import { useCompanyProfile } from '@services/companyProfileService';
import { useExitTenant } from '@services/superAdminService';
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
    FiUser,
    FiChevronLeft,
    FiChevronRight,
    FiMenu,
    FiChevronDown,
    FiCheck,
    FiGrid,
    FiArrowLeft,
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
        id: 'superAdmin',
        title: t('superAdmin.nav.title', 'مدير النظام'),
        roles: ['SUPERADMIN'],
        items: [
            {
                id: 'sa-dashboard',
                to: '/super-admin/dashboard',
                icon: icons.dashboard,
                label: t('superAdmin.nav.dashboard', 'لوحة النظام'),
                roles: ['SUPERADMIN']
            },
            {
                id: 'sa-tenants',
                to: '/super-admin/tenants',
                icon: FiGrid,
                label: t('superAdmin.nav.manageTenants', 'إدارة المستأجرين'),
                roles: ['SUPERADMIN']
            },
            {
                id: 'sa-plans',
                to: '/super-admin/plans',
                icon: FiDollarSign,
                label: t('superAdmin.nav.managePlans', 'إدارة الخطط'),
                roles: ['SUPERADMIN']
            },
            {
                id: 'sa-users',
                to: '/super-admin/users',
                icon: icons.userManagement,
                label: t('superAdmin.nav.manageUsers', 'إدارة المستخدمين'),
                roles: ['SUPERADMIN']
            },
            {
                id: 'sa-audit',
                to: '/super-admin/audit-logs',
                icon: FiActivity,
                label: t('superAdmin.nav.auditLogs', 'سجل المراجعة'),
                roles: ['SUPERADMIN']
            }
        ]
    },
    {
        id: 'main',
        title: t('navigation.main', '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629'),
        items: [
            {
                id: 'dashboard',
                to: '/dashboard',
                icon: icons.dashboard,
                label: t('navigation.dashboard', '\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645'),
                roles: ['OWNER', 'ADMIN']
            }
        ]
    },
    {
        id: 'sales',
        title: t('navigation.sales', '\u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a'),
        roles: ['OWNER', 'ADMIN', 'CASHIER'],
        items: [
            {
                id: 'invoices',
                to: '/invoices',
                icon: icons.invoices,
                label: t('navigation.invoices', '\u0627\u0644\u0641\u0648\u0627\u062a\u064a\u0631'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            },
            {
                id: 'customers',
                to: '/customers',
                icon: icons.customers,
                label: t('navigation.customers', '\u0627\u0644\u0639\u0645\u0644\u0627\u0621'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            }
        ]
    },
    {
        id: 'cashier',
        title: t('navigation.cashier', '\u0627\u0644\u0643\u0627\u0634\u064a\u0631'),
        roles: ['OWNER', 'ADMIN', 'CASHIER'],
        items: [
            {
                id: 'cashier-invoice',
                to: '/sys-cashier',
                icon: icons.cashierInvoice,
                label: t('navigation.cashierInvoice', '\u0641\u0627\u062a\u0648\u0631\u0629 \u0627\u0644\u0643\u0627\u0634\u064a\u0631'),
                roles: ['OWNER', 'ADMIN', 'CASHIER']
            }
        ]
    },
    {
        id: 'factory',
        title: t('navigation.factory', '\u0627\u0644\u0645\u0635\u0646\u0639'),
        roles: ['OWNER', 'ADMIN', 'WORKER'],
        items: [
            {
                id: 'factory-tasks',
                to: '/factory',
                icon: icons.factory,
                label: t('navigation.factory', '\u0645\u0647\u0627\u0645 \u0627\u0644\u0645\u0635\u0646\u0639'),
                roles: ['OWNER', 'ADMIN', 'WORKER']
            }
        ]
    },
    {
        id: 'admin',
        title: t('navigation.admin', '\u0627\u0644\u0625\u062f\u0627\u0631\u0629'),
        roles: ['SUPERADMIN', 'OWNER', 'ADMIN'],
        items: [
            {
                id: 'company-profile',
                to: '/admin/company-profile',
                icon: icons.companyProfile,
                label: t('navigation.companyProfile', '\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0634\u0631\u0643\u0629'),
                roles: ['OWNER']
            },
            {
                id: 'user-management',
                to: '/admin/users',
                icon: icons.userManagement,
                label: t('users.title', '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646'),
                roles: ['SUPERADMIN', 'OWNER', 'ADMIN']
            },
            {
                id: 'glass-types',
                to: '/admin/glass-types',
                icon: icons.glassTypes,
                label: t('navigation.glassTypes', '\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0632\u062c\u0627\u062c'),
                roles: ['OWNER', 'ADMIN']
            },
            {
                id: 'tenantSettings',
                to: '/admin/tenant-settings',
                icon: FiGrid,
                label: t('tenant.settings', '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631'),
                roles: ['SUPERADMIN']
            },
            {
                id: 'tenantMembers',
                to: '/admin/tenant-members',
                icon: FiUsers,
                label: t('tenant.members', '\u0623\u0639\u0636\u0627\u0621 \u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631'),
                roles: ['SUPERADMIN']
            },
            // {
            //     id: 'cutting-prices',
            //     to: '/admin/cutting-prices',
            //     icon: icons.cuttingPrices,
            //     label: t('navigation.cuttingPrices', '\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0642\u0637\u0639'),
            //     roles: ['OWNER'],
            //     badge: '\u062c\u062f\u064a\u062f'
            // },
            // {
            //     id: 'operation-prices',
            //     to: '/admin/operation-prices',
            //     icon: icons.operationPrices,
            //     label: t('navigation.operationPrices', '\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a'),
            //     roles: ['OWNER', 'ADMIN']
            // }
        ]
    }
];

const NavItem = ({ to, icon: IconComponent, label, isActive, onClick, badge, isCollapsed }) => (
    <Link
        to={to}
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={clsx(
            'flex items-center gap-3 rounded-lg transition-all duration-200',
            isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
            'hover:bg-primary-50 dark:hover:bg-gray-800',
            isActive && 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
            !isActive && 'text-gray-700 dark:text-gray-300'
        )}
    >
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
            <>
                <span className="font-medium flex-1">{label}</span>
                {badge && (
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-primary-900 dark:text-primary-300">
                        {badge}
                    </span>
                )}
            </>
        )}
    </Link>
);

const NavGroup = ({ title, children, isCollapsed }) => (
    <div className="mb-6">
        {!isCollapsed && (
            <h3 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                {title}
            </h3>
        )}
        {/*{isCollapsed && <div className="border-t border-gray-200 dark:border-gray-700 my-2 mx-3"></div>}*/}
        <nav className="space-y-1">
            {children}
        </nav>
    </div>
);

const TenantSwitcher = ({ tenants, currentTenant, switchTenant, isCollapsed, isRTL }) => {
    const { t } = useTranslation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    if (!tenants || tenants.length <= 1) return null;

    const currentName = currentTenant?.name || t('tenant.selectTenant', 'اختر مستأجر');
    const firstLetter = currentName.charAt(0).toUpperCase();

    const handleSwitch = async (tenantId) => {
        setIsDropdownOpen(false);
        if (tenantId !== currentTenant?._id) {
            await switchTenant(tenantId);
        }
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 relative" ref={dropdownRef}>
            <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                title={isCollapsed ? currentName : undefined}
                className={clsx(
                    'w-full flex items-center gap-3 transition-colors',
                    'hover:bg-gray-50 dark:hover:bg-gray-800',
                    isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                    isDropdownOpen && 'bg-gray-50 dark:bg-gray-800'
                )}
            >
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: currentTenant?.brandColors?.primary || '#6366f1' }}
                >
                    {firstLetter}
                </div>
                {!isCollapsed && (
                    <>
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate text-start">
                            {currentName}
                        </span>
                        <FiChevronDown className={clsx(
                            'w-4 h-4 text-gray-400 transition-transform',
                            isDropdownOpen && 'rotate-180'
                        )} />
                    </>
                )}
            </button>

            {isDropdownOpen && (
                <div className={clsx(
                    'absolute z-50 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg',
                    'border border-gray-200 dark:border-gray-700 py-1 max-h-60 overflow-y-auto',
                    isCollapsed
                        ? (isRTL ? 'right-full mr-2 top-0' : 'left-full ml-2 top-0')
                        : 'inset-x-2',
                    'min-w-[200px]'
                )}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('tenant.switchTenant', 'تبديل المستأجر')}
                    </div>
                    {tenants.map((tenant) => (
                        <button
                            key={tenant._id}
                            onClick={() => handleSwitch(tenant._id)}
                            className={clsx(
                                'w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                                'hover:bg-gray-100 dark:hover:bg-gray-700',
                                tenant._id === currentTenant?._id && 'bg-primary-50 dark:bg-primary-900/20'
                            )}
                        >
                            <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: tenant.brandColors?.primary || '#6366f1' }}
                            >
                                {tenant.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="flex-1 text-gray-700 dark:text-gray-300 truncate text-start">
                                {tenant.name}
                            </span>
                            {tenant._id === currentTenant?._id && (
                                <FiCheck className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
    const { t, i18n } = useTranslation();
    const { user, logout, currentTenant, tenants, switchTenant, isSuperAdminViewing } = useAuth();
    const { isOwner, isCashier, isWorker, isAdmin } = usePermissions();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const exitTenant = useExitTenant();
    const [showUserSettings, setShowUserSettings] = useState(false);
    const popupRef = useRef(null);

    const isRTL = i18n.language === 'ar';

    // Convex reactive query for company profile
    const profileData = useCompanyProfile();
    const companyLogo = profileData?.logoUrl || null;
    const companyName = profileData
        ? (isRTL ? profileData.companyNameArabic : profileData.companyName) || null
        : null;

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setShowUserSettings(false);
            }
        };

        if (showUserSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserSettings]);
    const isActive = (path) => location.pathname === path;

    const toggleLanguage = () => {
        const newLang = i18n.language === 'ar' ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
    };

    // Helper function to check if user has access to a specific role
    // SUPERADMIN sees super admin items always, and regular tenant items only when inside a tenant
    const hasRole = (requiredRoles) => {
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const userRole = user?.role;
        if (userRole === 'SUPERADMIN') {
            // Items explicitly marked SUPERADMIN → always visible
            if (requiredRoles.includes('SUPERADMIN')) return true;
            // Regular tenant items → only visible when switched into a tenant
            return !!currentTenant;
        }
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
                    'fixed inset-y-0 z-50 bg-white dark:bg-gray-900',
                    'transform transition-all duration-300 ease-in-out',
                    'flex flex-col',
                    // Width based on collapsed state
                    isCollapsed ? 'w-20' : 'w-64',
                    // Position based on language direction
                    isRTL ? 'right-0 border-l border-gray-200 dark:border-gray-700' : 'left-0 border-r border-gray-200 dark:border-gray-700',
                    // Desktop: always visible
                    'lg:translate-x-0',
                    // Mobile: slide in/out based on direction
                    isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')
                )}
            >
                {/* Sidebar header - Fixed at top */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                    {isCollapsed ? (
                        /* Collapsed: only menu icon, click to expand */
                        <div className="flex flex-col items-center py-4">
                            <button
                                onClick={onToggleCollapse}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                title={isRTL ? 'توسيع القائمة' : 'Expand sidebar'}
                            >
                                <FiMenu className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* Expanded: logo + name + toggle/close buttons */
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {companyLogo ? (
                                    <img
                                        src={companyLogo}
                                        alt={companyName || t('app.name', 'كوارتز')}
                                        className="w-10 h-10 rounded-xl object-contain flex-shrink-0"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={clsx(
                                        "w-10 h-10 rounded-xl items-center justify-center text-white font-bold flex-shrink-0 bg-primary-500",
                                        companyLogo ? "hidden" : "flex"
                                    )}
                                >
                                    K
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {companyName || t('app.name', 'كوارتز')}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Collapse Toggle - Desktop only */}
                                <button
                                    onClick={onToggleCollapse}
                                    className={clsx(
                                        'hidden lg:flex p-2 rounded-lg',
                                        'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                                        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                                    )}
                                    title={isRTL ? 'طي القائمة' : 'Collapse sidebar'}
                                >
                                    {isRTL ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
                                </button>

                                {/* Close button for mobile */}
                                <button
                                    onClick={onClose}
                                    className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tenant Switcher — hidden for SUPERADMIN */}
                {user?.role !== 'SUPERADMIN' && (
                    <TenantSwitcher
                        tenants={tenants}
                        currentTenant={currentTenant}
                        switchTenant={switchTenant}
                        isCollapsed={isCollapsed}
                        isRTL={isRTL}
                    />
                )}

                {/* Back to Admin Panel — shown when SUPERADMIN is viewing a tenant */}
                {isSuperAdminViewing && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={async () => {
                                await exitTenant({});
                                navigate('/super-admin/dashboard');
                            }}
                            title={isCollapsed ? t('superAdmin.backToPanel', 'العودة للوحة النظام') : undefined}
                            className={clsx(
                                'w-full flex items-center gap-2 transition-colors',
                                'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
                                'hover:bg-amber-100 dark:hover:bg-amber-900/30',
                                isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                            )}
                        >
                            <FiArrowLeft className="w-4 h-4 flex-shrink-0" />
                            {!isCollapsed && (
                                <span className="text-sm font-medium">
                                    {t('superAdmin.backToPanel', 'العودة للوحة النظام')}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Navigation - Scrollable section */}
                <div className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden">
                    {sidebarItems.map((group) => {
                        // Check if group should be visible based on user roles
                        if (!shouldShowGroup(group)) return null;

                        // Filter items based on user roles
                        const visibleItems = group.items.filter(shouldShowItem);

                        // Don't render group if no items are visible
                        if (visibleItems.length === 0) return null;

                        return (
                            <NavGroup key={group.id} title={group.title} isCollapsed={isCollapsed}>
                                {visibleItems.map((item) => (
                                    <NavItem
                                        key={item.id}
                                        to={item.to}
                                        icon={item.icon}
                                        label={item.label}
                                        isActive={isActive(item.to)}
                                        onClick={onClose}
                                        badge={item.badge}
                                        isCollapsed={isCollapsed}
                                    />
                                ))}
                            </NavGroup>
                        );
                    })}
                </div>

                {/* Footer with user info - Fixed at bottom */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 relative" ref={popupRef}>
                    {/* Settings Popup - Floats above user profile */}
                    {showUserSettings && (
                        <div className={clsx(
                            'absolute bottom-full mb-2 z-50',
                            'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700',
                            'p-2 space-y-1 min-w-[200px]',
                            isCollapsed
                                ? (isRTL ? 'right-0' : 'left-0')
                                : 'inset-x-2'
                        )}>
                            {/* User Info Header in Popup */}
                            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                    {user?.displayName || t('users.user')}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {user?.role === 'SUPERADMIN' && t('users.roles.SUPERADMIN')}
                                    {user?.role === 'OWNER' && t('users.roles.OWNER')}
                                    {user?.role === 'ADMIN' && t('users.roles.ADMIN')}
                                    {user?.role === 'CASHIER' && t('users.roles.CASHIER')}
                                    {user?.role === 'WORKER' && t('users.roles.WORKER')}
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
                                    <span className="text-sm font-medium">
                                        {isDarkMode ? t('theme.dark', '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064a\u0644\u064a') : t('theme.light', '\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064a')}
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
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <FiGlobe className="w-4 h-4" />
                                    <span className="text-sm font-medium">{t('language.title', '\u0627\u0644\u0644\u063a\u0629')}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs font-medium">
                                    {i18n.language === 'ar' ? 'AR' : 'EN'}
                                </span>
                            </button>

                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('auth.logout', '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c')}</span>
                            </button>
                        </div>
                    )}

                    {/* User Profile - Clickable */}
                    <div
                        className={clsx(
                            'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                            isCollapsed ? 'p-3' : 'p-4',
                            showUserSettings && 'bg-gray-50 dark:bg-gray-800'
                        )}
                        onClick={() => setShowUserSettings(!showUserSettings)}
                        title={isCollapsed ? user?.displayName : undefined}
                    >
                        <div className={clsx(
                            'flex items-center',
                            isCollapsed ? 'justify-center' : 'gap-3'
                        )}>
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 bg-primary-500"
                            >
                                {user?.firstName?.charAt(0) || <FiUser size={18} />}
                            </div>
                            {!isCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                            {user?.displayName || t('users.user')}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {user?.role === 'SUPERADMIN' && t('users.roles.SUPERADMIN')}
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
                                </>
                            )}
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
