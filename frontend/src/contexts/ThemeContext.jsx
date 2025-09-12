import React, { createContext, useContext, useEffect, useState } from 'react';

// Theme context
const ThemeContext = createContext();

// Theme types
export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Local storage key for theme preference
const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * Custom hook to use theme context
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Theme Provider Component
 */
export const ThemeProvider = ({ children }) => {
    // Get initial theme from localStorage or default to system
    const getInitialTheme = () => {
        if (typeof window === 'undefined') return THEMES.SYSTEM;

        try {
            const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
                return savedTheme;
            }
        } catch (error) {
            console.warn('Failed to read theme from localStorage:', error);
        }

        return THEMES.SYSTEM;
    };

    const [theme, setTheme] = useState(getInitialTheme);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [systemPrefersDark, setSystemPrefersDark] = useState(false);

    // Check system preference
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setSystemPrefersDark(mediaQuery.matches);

        const handleChange = (e) => {
            setSystemPrefersDark(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Calculate actual dark mode state
    useEffect(() => {
        let shouldBeDark = false;

        switch (theme) {
            case THEMES.DARK:
                shouldBeDark = true;
                break;
            case THEMES.LIGHT:
                shouldBeDark = false;
                break;
            case THEMES.SYSTEM:
            default:
                shouldBeDark = systemPrefersDark;
                break;
        }

        setIsDarkMode(shouldBeDark);
    }, [theme, systemPrefersDark]);

    // Apply theme to document
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;

        if (isDarkMode) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }

        // Also update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = isDarkMode ? '#1f2937' : '#ffffff';
        }
    }, [isDarkMode]);

    // Save theme preference to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    }, [theme]);

    /**
     * Set theme preference
     */
    const setThemePreference = (newTheme) => {
        if (Object.values(THEMES).includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    /**
     * Toggle between light and dark themes
     */
    const toggleTheme = () => {
        if (theme === THEMES.SYSTEM) {
            // If currently system, toggle to opposite of current system preference
            setTheme(systemPrefersDark ? THEMES.LIGHT : THEMES.DARK);
        } else if (theme === THEMES.LIGHT) {
            setTheme(THEMES.DARK);
        } else {
            setTheme(THEMES.LIGHT);
        }
    };

    /**
     * Get theme display name for UI
     */
    const getThemeDisplayName = (themeKey = theme) => {
        const displayNames = {
            [THEMES.LIGHT]: 'فاتح',
            [THEMES.DARK]: 'داكن',
            [THEMES.SYSTEM]: 'النظام'
        };
        return displayNames[themeKey] || themeKey;
    };

    /**
     * Get available themes for selection
     */
    const getAvailableThemes = () => {
        return Object.values(THEMES).map(themeKey => ({
            key: themeKey,
            name: getThemeDisplayName(themeKey),
            isCurrent: themeKey === theme
        }));
    };

    const value = {
        // Current state
        theme,
        isDarkMode,
        systemPrefersDark,

        // Actions
        setTheme: setThemePreference,
        toggleTheme,

        // Utilities
        getThemeDisplayName,
        getAvailableThemes,

        // Constants
        themes: THEMES
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

/**
 * Higher-order component for theme-aware components
 */
export const withTheme = (Component) => {
    return function ThemedComponent(props) {
        const theme = useTheme();
        return <Component {...props} theme={theme} />;
    };
};

/**
 * Hook for conditional rendering based on theme
 */
export const useThemeValue = (lightValue, darkValue) => {
    const { isDarkMode } = useTheme();
    return isDarkMode ? darkValue : lightValue;
};

/**
 * Hook for theme-aware CSS classes
 */
export const useThemeClasses = (lightClasses = '', darkClasses = '') => {
    const { isDarkMode } = useTheme();
    return isDarkMode ? darkClasses : lightClasses;
};

export default ThemeContext;