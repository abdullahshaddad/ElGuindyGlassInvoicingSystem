import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const UnauthorizedPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();

    const { requiredRoles, userRole } = location.state || {};

    const getRoleDisplayName = (role) => {
        const roleNames = {
            OWNER: 'مالك',
            CASHIER: 'كاشير',
            WORKER: 'عامل',
        };
        return roleNames[role] || role;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    {/* 403 Illustration */}
                    <div className="mx-auto w-32 h-32 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-8">
                        <span className="text-4xl">🚫</span>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        غير مصرح بالوصول
                    </h1>

                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                        عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.
                    </p>

                    {user && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                            <div className="text-sm">
                                <p className="text-yellow-800 dark:text-yellow-200 mb-2">
                                    <strong>المستخدم الحالي:</strong> {user.displayName}
                                </p>
                                <p className="text-yellow-700 dark:text-yellow-300 mb-2">
                                    <strong>دورك:</strong> {getRoleDisplayName(user.role)}
                                </p>
                                {requiredRoles && (
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        <strong>الصلاحيات المطلوبة:</strong> {requiredRoles.map(getRoleDisplayName).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                            لوحة التحكم
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            الرجوع
                        </button>
                    </div>

                    <div className="mt-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المسؤول.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;