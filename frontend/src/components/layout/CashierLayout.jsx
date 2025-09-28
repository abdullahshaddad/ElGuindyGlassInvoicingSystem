import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {useAuth} from "@contexts/AuthContext.jsx";

import {Outlet} from "react-router-dom";
import Header from "@components/layout/Header.jsx";

const CashierLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            {/* Cashier Navbar */}
            <Header/>
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo/Title */}
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">
                                نظام إدارة الزجاج - نقطة البيع
                            </h1>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">
                                    {user?.displayName || `${user?.firstName} ${user?.lastName}`}
                                </div>
                                <div className="text-xs text-gray-500">كاشير</div>
                            </div>

                            <button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                تسجيل الخروج
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default CashierLayout