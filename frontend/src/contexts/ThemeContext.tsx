import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
    // Initialize theme from localStorage or use default
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme') as Theme;
            if (stored && (stored === 'light' || stored === 'dark')) {
                return stored;
            }

            // Check system preference if no stored theme
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return systemPrefersDark ? 'dark' : 'light';
        }
        return defaultTheme;
    });

    // Apply theme to document and persist to localStorage
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove previous theme classes
        root.classList.remove('light', 'dark');

        // Add current theme class
        root.classList.add(theme);

        // Persist to localStorage
        localStorage.setItem('theme', theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                theme === 'dark' ? '#0F172A' : '#FFFFFF'
            );
        }
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            // Only update if user hasn't manually set a preference
            const storedTheme = localStorage.getItem('theme');
            if (!storedTheme) {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => {
        setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const value = {
        theme,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}

// Hook to check if current theme is dark
export function useIsDark() {
    const { theme } = useTheme();
    return theme === 'dark';
}

// Hook for theme-aware values
export function useThemeValue<T>(lightValue: T, darkValue: T): T {
    const { theme } = useTheme();
    return theme === 'dark' ? darkValue : lightValue;
}