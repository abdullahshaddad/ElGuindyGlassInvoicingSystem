import React from 'react';
import ReactDOM from 'react-dom/client';

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

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);