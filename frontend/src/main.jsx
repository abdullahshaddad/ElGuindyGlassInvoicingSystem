import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import styles first
import './styles/globals.css';

// Import dayjs with Arabic locale
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('ar'); // Set Arabic as default locale
dayjs.tz.setDefault('Africa/Cairo');

// Import i18n configuration after other imports
import './i18n/index.js';

// Simple loading component for i18n initialization
const AppWithI18n = () => {
    const [isI18nReady, setIsI18nReady] = React.useState(false);

    React.useEffect(() => {
        // Wait for i18n to be ready
        import('./i18n/index.js').then((i18nModule) => {
            const i18n = i18nModule.default;

            if (i18n.isInitialized) {
                setIsI18nReady(true);
            } else {
                i18n.on('initialized', () => {
                    setIsI18nReady(true);
                });
            }
        });
    }, []);

    if (!isI18nReady) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppWithI18n />
    </React.StrictMode>,
);