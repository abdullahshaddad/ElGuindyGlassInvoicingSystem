import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TENANT_THEMES, DEFAULT_THEME_ID } from '@/constants/tenantThemes';

/**
 * Reads the current tenant's `theme` field and injects the corresponding
 * CSS custom properties (--color-primary-50 … --color-primary-900 and
 * --color-secondary-*) onto `document.documentElement`.
 *
 * Pure side-effect component — just returns `children`.
 */
const TenantThemeProvider = ({ children }) => {
    const { currentTenant } = useAuth();

    useEffect(() => {
        const themeId = currentTenant?.theme || DEFAULT_THEME_ID;
        const theme = TENANT_THEMES[themeId] || TENANT_THEMES[DEFAULT_THEME_ID];

        const root = document.documentElement;

        // Set primary shades
        for (const [shade, value] of Object.entries(theme.primary)) {
            root.style.setProperty(`--color-primary-${shade}`, value);
        }

        // Set secondary shades
        for (const [shade, value] of Object.entries(theme.secondary)) {
            root.style.setProperty(`--color-secondary-${shade}`, value);
        }
    }, [currentTenant?.theme]);

    return children;
};

export default TenantThemeProvider;
