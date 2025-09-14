import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useLanguage, languages } from '@/i18n';

const LanguageSwitcher = ({ className = '', showFlag = true, showText = true }) => {
    const { t } = useTranslation('common');
    const { currentLanguage, changeLanguage, isRTL, languageInfo } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const handleLanguageChange = async (langCode) => {
        try {
            await changeLanguage(langCode);
            setIsOpen(false);

            // Optional: Show success message
            // You can integrate with your notification system here
        } catch (error) {
            console.error('Language change failed:', error);
        }
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    const handleBlur = (e) => {
        // Small delay to allow click events on dropdown items
        setTimeout(() => {
            if (!e.currentTarget.contains(document.activeElement)) {
                setIsOpen(false);
            }
        }, 150);
    };

    return (
        <div
            className={`relative inline-block text-left ${className}`}
            onBlur={handleBlur}
            tabIndex={0}
        >
            {/* Language Button */}
            <button
                onClick={toggleDropdown}
                className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${
                    isRTL ? 'flex-row-reverse' : ''
                }`}
                aria-haspopup="true"
                aria-expanded={isOpen}
                title={t('switchLanguage', 'Switch Language')}
            >
                {/* Globe Icon */}
                <FiGlobe className={`w-4 h-4 text-gray-500 ${
                    showText ? (isRTL ? 'ml-2' : 'mr-2') : ''
                }`} />

                {/* Current Language Info */}
                {showText && (
                    <span className="truncate">
                        {showFlag && languageInfo.flag && (
                            <span className={isRTL ? 'ml-1' : 'mr-1'}>
                                {languageInfo.flag}
                            </span>
                        )}
                        {languageInfo.name}
                    </span>
                )}

                {/* Dropdown Arrow */}
                <FiChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    } ${
                        showText ? (isRTL ? 'mr-2' : 'ml-2') : (isRTL ? 'mr-1' : 'ml-1')
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute z-10 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        isRTL ? 'left-0' : 'right-0'
                    }`}
                    role="menu"
                    aria-orientation="vertical"
                    tabIndex={-1}
                >
                    <div className="py-1" role="none">
                        {Object.entries(languages).map(([langCode, langInfo]) => (
                            <button
                                key={langCode}
                                onClick={() => handleLanguageChange(langCode)}
                                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 flex items-center ${
                                    currentLanguage === langCode
                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                        : 'text-gray-700'
                                } ${
                                    isRTL ? 'flex-row-reverse text-right' : ''
                                }`}
                                role="menuitem"
                                tabIndex={-1}
                            >
                                {/* Language Flag */}
                                {showFlag && langInfo.flag && (
                                    <span className={`text-lg ${
                                        isRTL ? 'ml-3' : 'mr-3'
                                    }`}>
                                        {langInfo.flag}
                                    </span>
                                )}

                                {/* Language Name and Direction */}
                                <div className="flex-1">
                                    <div className="font-medium">
                                        {langInfo.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {langInfo.dir.toUpperCase()} • {langCode.toUpperCase()}
                                    </div>
                                </div>

                                {/* Current Language Indicator */}
                                {currentLanguage === langCode && (
                                    <div className={`w-2 h-2 bg-primary-600 rounded-full ${
                                        isRTL ? 'mr-2' : 'ml-2'
                                    }`} />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className={`px-4 py-2 border-t border-gray-100 bg-gray-50 ${
                        isRTL ? 'text-right' : 'text-left'
                    }`}>
                        <p className="text-xs text-gray-500">
                            {t('languageSwitchInfo', 'Language preference is saved')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simplified Language Toggle (just flag/name)
export const LanguageToggle = ({ showText = false }) => {
    const { currentLanguage, changeLanguage, languageInfo } = useLanguage();

    const toggleLanguage = async () => {
        const newLang = currentLanguage === 'ar' ? 'en' : 'ar';
        await changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            title={`Switch to ${currentLanguage === 'ar' ? 'English' : 'العربية'}`}
        >
            {languageInfo.flag && (
                <span className="text-lg">
                    {languageInfo.flag}
                </span>
            )}
            {showText && (
                <span className="ml-1">
                    {languageInfo.name}
                </span>
            )}
        </button>
    );
};

// Mini Language Indicator (status bar)
export const LanguageIndicator = () => {
    const { languageInfo, isRTL } = useLanguage();

    return (
        <div className="inline-flex items-center text-xs text-gray-500">
            <span className="font-mono">
                {languageInfo.flag} {isRTL ? 'RTL' : 'LTR'}
            </span>
        </div>
    );
};

export default LanguageSwitcher;