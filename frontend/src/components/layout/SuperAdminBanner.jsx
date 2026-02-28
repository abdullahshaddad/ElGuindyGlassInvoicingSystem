import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useExitTenant } from '@/services/superAdminService';
import { FiEye, FiX } from 'react-icons/fi';

const SuperAdminBanner = () => {
    const { t } = useTranslation();
    const { isSuperAdminViewing, currentTenant } = useAuth();
    const exitTenant = useExitTenant();
    const navigate = useNavigate();

    if (!isSuperAdminViewing) return null;

    const handleExit = async () => {
        await exitTenant({});
        navigate('/super-admin/dashboard');
    };

    return (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm">
                <FiEye className="w-4 h-4 flex-shrink-0" />
                <span>
                    {t('superAdmin.viewingTenant', 'أنت تعرض بيانات المستأجر')}:
                    <strong className="ms-1">{currentTenant?.name}</strong>
                </span>
            </div>
            <button
                onClick={handleExit}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
            >
                <FiX className="w-3 h-3" />
                {t('superAdmin.exitTenant', 'خروج')}
            </button>
        </div>
    );
};

export default SuperAdminBanner;
