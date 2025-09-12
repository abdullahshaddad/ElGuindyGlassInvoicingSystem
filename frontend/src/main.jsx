import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Import styles
import './styles/globals.css';

// Import i18n configuration
import './i18n/index.js';

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

// Set timezone (you can adjust this based on your location)
dayjs.tz.setDefault('Africa/Cairo');

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);