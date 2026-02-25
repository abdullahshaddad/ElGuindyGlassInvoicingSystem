import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';

// Import i18n FIRST
import './i18n/index.js';

// Import styles
import './styles/globals.css';

// Import App
import App from './App.jsx';

// dayjs configuration
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale('ar');
dayjs.tz.setDefault('Africa/Cairo');

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <App />
            </ConvexProviderWithClerk>
        </ClerkProvider>
    </React.StrictMode>,
);
