package com.example.backend.exceptions.websocket;

import lombok.Getter;

/**
 * Exception thrown when WebSocket operations fail
 * Used for WebSocket connection, message sending, and notification failures
 */
@Getter
public class WebSocketException extends RuntimeException {

    private final String operation;
    private final String destination;

    public WebSocketException(String message) {
        super(message);
        this.operation = null;
        this.destination = null;
    }

    public WebSocketException(String message, Throwable cause) {
        super(message, cause);
        this.operation = null;
        this.destination = null;
    }

    public WebSocketException(String message, String operation, String destination) {
        super(message);
        this.operation = operation;
        this.destination = destination;
    }

    public WebSocketException(String message, String operation, String destination, Throwable cause) {
        super(message, cause);
        this.operation = operation;
        this.destination = destination;
    }

    /**
     * Create exception for connection failures
     */
    public static WebSocketException connectionFailed(String message, Throwable cause) {
        return new WebSocketException(
                "فشل في الاتصال بـ WebSocket: " + message,
                "CONNECTION",
                null,
                cause
        );
    }

    /**
     * Create exception for message sending failures
     */
    public static WebSocketException messageSendFailed(String destination, Throwable cause) {
        return new WebSocketException(
                "فشل في إرسال رسالة WebSocket إلى: " + destination,
                "SEND_MESSAGE",
                destination,
                cause
        );
    }

    /**
     * Create exception for authentication failures
     */
    public static WebSocketException authenticationFailed(String message) {
        return new WebSocketException(
                "فشل في تسجيل الدخول عبر WebSocket: " + message,
                "AUTHENTICATION",
                null
        );
    }

    /**
     * Create exception for subscription failures
     */
    public static WebSocketException subscriptionFailed(String destination, Throwable cause) {
        return new WebSocketException(
                "فشل في الاشتراك في قناة WebSocket: " + destination,
                "SUBSCRIPTION",
                destination,
                cause
        );
    }

    /**
     * Create exception for notification sending failures
     */
    public static WebSocketException notificationFailed(String username, String notificationType, Throwable cause) {
        return new WebSocketException(
                String.format("فشل في إرسال إشعار %s إلى المستخدم %s", notificationType, username),
                "NOTIFICATION",
                "/user/" + username + "/queue/notifications",
                cause
        );
    }

    /**
     * Create exception for broadcast failures
     */
    public static WebSocketException broadcastFailed(String topic, Throwable cause) {
        return new WebSocketException(
                "فشل في البث العام إلى: " + topic,
                "BROADCAST",
                topic,
                cause
        );
    }

    /**
     * Create exception for session management failures
     */
    public static WebSocketException sessionManagementFailed(String sessionId, String operation, Throwable cause) {
        return new WebSocketException(
                String.format("فشل في إدارة جلسة WebSocket (%s): %s", operation, sessionId),
                "SESSION_" + operation.toUpperCase(),
                sessionId,
                cause
        );
    }
}