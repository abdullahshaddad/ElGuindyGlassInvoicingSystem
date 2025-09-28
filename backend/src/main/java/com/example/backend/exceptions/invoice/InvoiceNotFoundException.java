package com.example.backend.exceptions.invoice;

/**
 * Exception thrown when invoice is not found
 */
public class InvoiceNotFoundException extends com.example.backend.exceptions.invoice.InvoiceException {
    private final Long invoiceId;

    public InvoiceNotFoundException(String message) {
        super(message);
        this.invoiceId = null;
    }

    public InvoiceNotFoundException(Long invoiceId) {
        super("Invoice not found: " + invoiceId);
        this.invoiceId = invoiceId;
    }

    public InvoiceNotFoundException(String message, Long invoiceId) {
        super(message);
        this.invoiceId = invoiceId;
    }

    public Long getInvoiceId() {
        return invoiceId;
    }
}
