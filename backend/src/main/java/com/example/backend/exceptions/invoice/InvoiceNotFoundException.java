package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when invoice is not found
 */
public class InvoiceNotFoundException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final String invoiceId;

    public InvoiceNotFoundException(String message) {
        super(message);
        this.invoiceId = null;
    }

    public InvoiceNotFoundException(String message, String invoiceId) {
        super(message);
        this.invoiceId = invoiceId;
    }

    public static InvoiceNotFoundException forId(String invoiceId) {
        return new InvoiceNotFoundException("Invoice not found: " + invoiceId, invoiceId);
    }

    public String getInvoiceId() {
        return invoiceId;
    }
}
