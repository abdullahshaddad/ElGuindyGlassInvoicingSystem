package com.example.backend.services;

import com.example.backend.models.Invoice;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public WebSocketNotificationService(SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    public void notifyNewInvoice(Invoice invoice) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "NEW_INVOICE");
            message.put("invoiceId", invoice.getId());
            message.put("customerName", invoice.getCustomer().getName());
            message.put("totalPrice", invoice.getTotalPrice());
            message.put("timestamp", LocalDateTime.now().toString());
            message.put("invoice", simplifyInvoiceForWebSocket(invoice));

            // Send to factory screen
            messagingTemplate.convertAndSend("/topic/factory/new-invoice", message);

            // Send to dashboard for real-time updates
            messagingTemplate.convertAndSend("/topic/dashboard/invoice-created", message);

        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Error sending WebSocket notification: " + e.getMessage());
        }
    }

    public void notifyPrintJobUpdate(Long invoiceId, String status) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "PRINT_JOB_UPDATE");
            message.put("invoiceId", invoiceId);
            message.put("status", status);
            message.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/factory/print-update", message);
            messagingTemplate.convertAndSend("/topic/dashboard/print-update", message);

        } catch (Exception e) {
            System.err.println("Error sending print job update: " + e.getMessage());
        }
    }

    public void notifyInvoiceStatusChange(Invoice invoice, String oldStatus, String newStatus) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "INVOICE_STATUS_CHANGE");
            message.put("invoiceId", invoice.getId());
            message.put("oldStatus", oldStatus);
            message.put("newStatus", newStatus);
            message.put("customerName", invoice.getCustomer().getName());
            message.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/dashboard/invoice-status", message);

        } catch (Exception e) {
            System.err.println("Error sending status change notification: " + e.getMessage());
        }
    }

    public void notifySystemAlert(String alertType, String message, String severity) {
        try {
            Map<String, Object> alertMessage = new HashMap<>();
            alertMessage.put("type", "SYSTEM_ALERT");
            alertMessage.put("alertType", alertType);
            alertMessage.put("message", message);
            alertMessage.put("severity", severity);
            alertMessage.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/system/alerts", alertMessage);

        } catch (Exception e) {
            System.err.println("Error sending system alert: " + e.getMessage());
        }
    }

    public void broadcastToRole(String role, String topic, Object message) {
        try {
            messagingTemplate.convertAndSend("/topic/role/" + role.toLowerCase() + "/" + topic, message);
        } catch (Exception e) {
            System.err.println("Error broadcasting to role " + role + ": " + e.getMessage());
        }
    }

    private Map<String, Object> simplifyInvoiceForWebSocket(Invoice invoice) {
        Map<String, Object> simplified = new HashMap<>();
        simplified.put("id", invoice.getId());
        simplified.put("customerName", invoice.getCustomer().getName());
        simplified.put("customerPhone", invoice.getCustomer().getPhone());
        simplified.put("totalPrice", invoice.getTotalPrice());
        simplified.put("status", invoice.getStatus().getArabicName());
        simplified.put("issueDate", invoice.getIssueDate().toString());
        simplified.put("lineCount", invoice.getInvoiceLines() != null ? invoice.getInvoiceLines().size() : 0);

        return simplified;
    }
}
