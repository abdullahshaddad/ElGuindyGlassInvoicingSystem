import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiBell, FiCheck, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiInfo, FiX } from 'react-icons/fi';
import { useMyNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from '@/services/notificationService';
import clsx from 'clsx';

const typeConfig = {
    SUCCESS: { icon: FiCheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    ERROR: { icon: FiAlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    WARNING: { icon: FiAlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    INFO: { icon: FiInfo, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

function getRelativeTime(timestamp, t) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    return t('notifications.daysAgo', { count: days });
}

const NotificationBell = () => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    const notifications = useMyNotifications();
    const unreadCount = useUnreadCount();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                buttonRef.current && !buttonRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead({ notificationId: notification._id });
        }
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead({});
    };

    return (
        <div className="relative">
            {/* Bell button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen((prev) => !prev)}
                className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('notifications.title')}
            >
                <FiBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    ref={panelRef}
                    className={clsx(
                        'absolute top-full mt-2 w-80 max-h-96 overflow-y-auto',
                        'bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50',
                        'ltr:right-0 rtl:left-0'
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {t('notifications.title')}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                <FiCheck size={12} />
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div>
                        {!notifications || notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                <FiBell size={24} className="mx-auto mb-2 opacity-50" />
                                {t('notifications.noNotifications')}
                            </div>
                        ) : (
                            notifications.map((n) => {
                                const config = typeConfig[n.type] || typeConfig.INFO;
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={n._id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={clsx(
                                            'w-full text-start px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-b-0',
                                            !n.isRead && config.bg
                                        )}
                                    >
                                        <div className={clsx('mt-0.5 shrink-0', config.color)}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={clsx(
                                                'text-sm truncate',
                                                n.isRead
                                                    ? 'text-gray-600 dark:text-gray-400'
                                                    : 'text-gray-900 dark:text-white font-medium'
                                            )}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {getRelativeTime(n.createdAt, t)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="shrink-0 mt-1.5">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
