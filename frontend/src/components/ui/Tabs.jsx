import React from 'react';

/**
 * Reusable Tabs component
 * @param {Object} props
 * @param {Array<{id: string, label: string, content: React.ReactNode, icon?: React.ReactNode}>} props.tabs
 * @param {string} props.activeTab
 * @param {Function} props.onTabChange
 * @param {string} [props.className]
 */
const Tabs = ({ tabs, activeTab, onTabChange, className = '' }) => {
    return (
        <div className={`flex flex-col ${className}`}>
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto scroller-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                        `}
                    >
                        {tab.icon && <span className="text-lg">{tab.icon}</span>}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={activeTab === tab.id ? 'block' : 'hidden'}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
