package com.example.backend.services;

import com.example.backend.models.Invoice;
import com.example.backend.models.InvoiceLine;



import com.example.backend.models.InvoiceLineOperation;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
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

            // Send to factory screen with line cards
            Map<String, Object> factoryMessage = new HashMap<>(message);
            factoryMessage.put("lines", buildFactoryLineCards(invoice));
            messagingTemplate.convertAndSend("/topic/factory/new-invoice", factoryMessage);

            // Send to dashboard for real-time updates
            messagingTemplate.convertAndSend("/topic/dashboard/invoice-created", message);

            log.info("WebSocket notification sent for new invoice {} with {} line cards",
                    invoice.getId(), invoice.getInvoiceLines() != null ? invoice.getInvoiceLines().size() : 0);

        } catch (Exception e) {
            log.error("Error sending WebSocket notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Build factory line cards with Arabic name, quantity, notes, operations
     */
    private List<Map<String, Object>> buildFactoryLineCards(Invoice invoice) {
        List<Map<String, Object>> lineCards = new ArrayList<>();

        if (invoice.getInvoiceLines() == null) {
            return lineCards;
        }

        for (InvoiceLine line : invoice.getInvoiceLines()) {
            Map<String, Object> card = new HashMap<>();

            // Arabic item name with dimensions
            String itemName = line.getGlassType() != null ? line.getGlassType().getName() : "زجاج";
            String thickness = (line.getGlassType() != null && line.getGlassType().getThickness() != null)
                    ? " - " + line.getGlassType().getThickness() + " مم"
                    : "";
            String dimensions = String.format(" (%.0f×%.0f)", line.getWidth(), line.getHeight());
            card.put("itemName", itemName + thickness + dimensions);

            // Quantity (emphasized for factory)
            card.put("quantity", line.getQuantity() != null ? line.getQuantity() : 1);

            // Notes
            card.put("notes", line.getNotes() != null ? line.getNotes() : "");

            // Operations list
            List<String> operations = new ArrayList<>();
            if (line.getOperations() != null && !line.getOperations().isEmpty()) {
                for (InvoiceLineOperation op : line.getOperations()) {
                    operations.add(op.getDescription());
                }
            }
            card.put("operations", operations);

            // Additional info for factory
            card.put("lineId", line.getId());
            card.put("glassType", line.getGlassType() != null ? line.getGlassType().getName() : "");
            card.put("width", line.getWidth());
            card.put("height", line.getHeight());

            lineCards.add(card);
        }

        return lineCards;
    }

    public void notifyPrintJobUpdate(String invoiceId, String status) {
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

    /**
     * Notify factory screens about line status change
     */
    public void notifyLineStatusChange(String invoiceId, Long lineId, String oldStatus, String newStatus) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "LINE_STATUS_CHANGE");
            message.put("invoiceId", invoiceId);
            message.put("lineId", lineId);
            message.put("oldStatus", oldStatus);
            message.put("newStatus", newStatus);
            message.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/factory/line-status", message);
            log.info("Line status change notification sent: line {} changed from {} to {}",
                    lineId, oldStatus, newStatus);

        } catch (Exception e) {
            log.error("Error sending line status change notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Notify about invoice work status change (factory progress)
     */
    public void notifyInvoiceWorkStatusChange(String invoiceId, String oldStatus, String newStatus) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "INVOICE_WORK_STATUS_CHANGE");
            message.put("invoiceId", invoiceId);
            message.put("oldStatus", oldStatus);
            message.put("newStatus", newStatus);
            message.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/factory/invoice-work-status", message);
            messagingTemplate.convertAndSend("/topic/dashboard/invoice-work-status", message);
            log.info("Invoice work status change notification sent: invoice {} changed from {} to {}",
                    invoiceId, oldStatus, newStatus);

        } catch (Exception e) {
            log.error("Error sending invoice work status change notification: {}", e.getMessage(), e);
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
