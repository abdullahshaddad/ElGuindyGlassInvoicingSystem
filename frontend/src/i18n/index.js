import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources directly
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arValidation from './locales/ar/validation.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enValidation from './locales/en/validation.json';
import arNavigation from './locales/ar/navigation.json';
import enNavigation from './locales/en/navigation.json';



const resources = {
    ar: {
        common: arCommon,
        auth: arAuth,
        validation: arValidation,
    },
    en: {
        common: enCommon,
        auth: enAuth,
        validation: enValidation,
    },
};

i18n
    // REMOVE Backend - we're using imported resources
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: 'ar',
        fallbackLng: 'ar',
        supportedLngs: ['ar', 'en'],

        defaultNS: 'common',
        ns: ['common', 'auth', 'validation'],

        // Use imported resources directly
        resources,

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },

        interpolation: {
            escapeValue: false,
        },

        react: {
            useSuspense: false, // CRITICAL: Set to false
            bindI18n: 'languageChanged',
            bindI18nStore: 'added removed',
            transEmptyNodeValue: '',
            transSupportBasicHtmlNodes: true,
            transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
        },

        // Remove backend configuration
        debug: false
    });

// Language direction helper
export const getLanguageDirection = (language) => {
    return language === 'ar' ? 'rtl' : 'ltr';
};

// Update HTML direction and lang attributes
export const updateHtmlAttributes = (language) => {
    const direction = getLanguageDirection(language);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', language);

    // Fix body class update
    document.body.className = document.body.className
        .replace(/\b(rtl|ltr)\b/g, '') + ' ' + direction;
};

// Initialize with current language
updateHtmlAttributes(i18n.language || 'ar');

// Listen for language changes
i18n.on('languageChanged', updateHtmlAttributes);

export default i18n;