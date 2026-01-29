// src/hooks/useWebSocket.js
import { useState, useEffect, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * Custom hook for WebSocket connection with STOMP
 * Provides real-time notifications from the backend
 *
 * @param {Object} options - Configuration options
 * @param {string[]} options.topics - Array of topics to subscribe to (e.g., ['/topic/factory/new-invoice'])
 * @param {Function} options.onMessage - Callback function when a message is received (topic, data)
 * @param {boolean} options.enabled - Whether to enable the WebSocket connection (default: true)
 * @param {boolean} options.debug - Enable debug logging (default: false)
 * @returns {Object} - Connection status and control functions
 */
export const useWebSocket = ({
    topics = [],
    onMessage,
    enabled = true,
    debug = false
} = {}) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const stompClientRef = useRef(null);
    const subscriptionsRef = useRef([]);
    const reconnectTimeoutRef = useRef(null);
    const mountedRef = useRef(true);

    const log = useCallback((...args) => {
        if (debug) {
            console.log('[WebSocket]', ...args);
        }
    }, [debug]);

    const disconnect = useCallback(() => {
        log('Disconnecting...');

        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        // Unsubscribe from all topics
        subscriptionsRef.current.forEach(sub => {
            try {
                sub.unsubscribe();
            } catch (e) {
                // Ignore unsubscribe errors
            }
        });
        subscriptionsRef.current = [];

        // Disconnect STOMP client
        if (stompClientRef.current) {
            try {
                stompClientRef.current.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
            stompClientRef.current = null;
        }

        if (mountedRef.current) {
            setConnected(false);
        }
    }, [log]);

    const connect = useCallback(() => {
        if (!enabled || topics.length === 0) {
            log('Connection disabled or no topics specified');
            return;
        }

        // Don't reconnect if already connected
        if (stompClientRef.current?.connected) {
            log('Already connected');
            return;
        }

        const wsUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/ws`;
        log('Connecting to:', wsUrl);

        try {
            const socket = new SockJS(wsUrl);
            const client = Stomp.over(socket);

            // Disable debug output unless explicitly enabled
            client.debug = debug ? (msg) => console.log('[STOMP]', msg) : () => {};

            client.connect(
                {},
                // Success callback
                () => {
                    log('Connected successfully');
                    if (mountedRef.current) {
                        setConnected(true);
                        setError(null);
                    }

                    // Subscribe to all topics
                    topics.forEach(topic => {
                        const subscription = client.subscribe(topic, (message) => {
                            try {
                                const data = JSON.parse(message.body);
                                log('Message received on', topic, data);
                                if (onMessage && mountedRef.current) {
                                    onMessage(topic, data);
                                }
                            } catch (e) {
                                console.error('[WebSocket] Error parsing message:', e);
                            }
                        });
                        subscriptionsRef.current.push(subscription);
                        log('Subscribed to:', topic);
                    });
                },
                // Error callback
                (error) => {
                    console.error('[WebSocket] Connection error:', error);
                    if (mountedRef.current) {
                        setConnected(false);
                        setError(error?.message || 'Connection failed');
                    }

                    // Attempt to reconnect after 5 seconds
                    if (mountedRef.current && enabled) {
                        log('Attempting reconnect in 5 seconds...');
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (mountedRef.current) {
                                connect();
                            }
                        }, 5000);
                    }
                }
            );

            stompClientRef.current = client;

        } catch (error) {
            console.error('[WebSocket] Error creating connection:', error);
            if (mountedRef.current) {
                setConnected(false);
                setError(error?.message || 'Failed to create connection');
            }
        }
    }, [enabled, topics, onMessage, debug, log]);

    // Connect on mount, disconnect on unmount
    useEffect(() => {
        mountedRef.current = true;

        if (enabled && topics.length > 0) {
            connect();
        }

        return () => {
            mountedRef.current = false;
            disconnect();
        };
    }, [enabled, topics.join(',')]); // Reconnect if topics change

    // Reconnect function for manual reconnection
    const reconnect = useCallback(() => {
        disconnect();
        setTimeout(() => {
            if (mountedRef.current) {
                connect();
            }
        }, 100);
    }, [connect, disconnect]);

    return {
        connected,
        error,
        reconnect,
        disconnect
    };
};

/**
 * Pre-defined topic constants for easy reference
 */
export const WEBSOCKET_TOPICS = {
    // Factory topics
    FACTORY_NEW_INVOICE: '/topic/factory/new-invoice',
    FACTORY_PRINT_UPDATE: '/topic/factory/print-update',
    FACTORY_LINE_STATUS: '/topic/factory/line-status',
    FACTORY_INVOICE_WORK_STATUS: '/topic/factory/invoice-work-status',

    // Dashboard topics
    DASHBOARD_INVOICE_CREATED: '/topic/dashboard/invoice-created',
    DASHBOARD_PRINT_UPDATE: '/topic/dashboard/print-update',
    DASHBOARD_INVOICE_STATUS: '/topic/dashboard/invoice-status',
    DASHBOARD_INVOICE_WORK_STATUS: '/topic/dashboard/invoice-work-status',

    // System topics
    SYSTEM_ALERTS: '/topic/system/alerts',
    NOTIFICATIONS: '/topic/notifications'
};

export default useWebSocket;
