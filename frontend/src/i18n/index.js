import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arValidation from './locales/ar/validation.json';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enValidation from './locales/en/validation.json';

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
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // Default language (Arabic-first)
        lng: 'ar',
        fallbackLng: 'ar',

        // Available languages
        supportedLngs: ['ar', 'en'],

        // Namespace settings
        defaultNS: 'common',
        ns: ['common', 'auth', 'validation'],

        // Resources
        resources,

        // Detection options
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },

        // Interpolation options
        interpolation: {
            escapeValue: false, // React already does escaping
        },

        // React specific options
        react: {
            useSuspense: true,
            bindI18n: 'languageChanged',
            bindI18nStore: 'added removed',
            transEmptyNodeValue: '',
            transSupportBasicHtmlNodes: true,
            transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
        },

        // Backend options (for loading translations from server)
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },

        // Debug mode
        debug: import.meta.env.VITE_DEBUG_MODE === 'true',
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
    document.body.className = direction;
};

// Initialize with current language
updateHtmlAttributes(i18n.language);

// Listen for language changes
i18n.on('languageChanged', updateHtmlAttributes);

export default i18n;