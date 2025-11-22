package com.example.backend.services;

import com.example.backend.dto.PaymentDTO;
import com.example.backend.exceptions.customer.CustomerNotFoundException;
import com.example.backend.exceptions.invoice.InvoiceNotFoundException;
import com.example.backend.exceptions.PaymentException;
import com.example.backend.models.Invoice;
import com.example.backend.models.Payment;
import com.example.backend.models.customer.Customer;
import com.example.backend.models.enums.CustomerType;
import com.example.backend.models.enums.InvoiceStatus;
import com.example.backend.models.enums.PaymentMethod;
import com.example.backend.repositories.InvoiceRepository;
import com.example.backend.repositories.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for handling payment operations and balance management
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {
    
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerService customerService;
    
    /**
     * Record a payment for an invoice or general customer balance
     * 
     * @param customerId Customer making the payment
     * @param invoiceId Optional invoice ID (null for general balance payment)
     * @param amount Payment amount
     * @param paymentMethod Payment method
     * @param referenceNumber Optional reference number
     * @param notes Optional notes
     * @param createdBy User who recorded the payment
     * @return Created payment DTO
     */
    @Transactional
    public PaymentDTO recordPayment(
            Long customerId,
            Long invoiceId,
            Double amount,
            PaymentMethod paymentMethod,
            String referenceNumber,
            String notes,
            String createdBy
    ) {
        // Validate input
        if (amount == null || amount <= 0) {
            throw new PaymentException("مبلغ الدفع يجب أن يكون أكبر من صفر");
        }
        
        // Get customer
        Customer customer = customerService.findById(customerId)
                .orElseThrow(() -> CustomerNotFoundException.forCustomerId(customerId));
        
        // Validate customer can have payments
        if (customer.getCustomerType() == CustomerType.CASH) {
            throw new PaymentException("العملاء النقديون يدفعون كامل المبلغ عند إنشاء الفاتورة");
        }
        
        // Check if customer has sufficient balance to pay
        if (customer.getBalance() == null || customer.getBalance() <= 0) {
            log.warn("Customer {} has no outstanding balance, but payment is being recorded", customerId);
        }
        
        Invoice invoice = null;
        if (invoiceId != null) {
            invoice = invoiceRepository.findById(invoiceId)
                    .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));
            
            // Validate invoice belongs to customer
            if (!invoice.getCustomer().getId().equals(customerId)) {
                throw new PaymentException("الفاتورة لا تنتمي للعميل المحدد");
            }
            
            // Check if invoice is already fully paid
            if (invoice.isFullyPaid()) {
                throw new PaymentException("الفاتورة مدفوعة بالكامل بالفعل");
            }
            
            // Validate payment doesn't exceed remaining balance
            if (amount > invoice.getRemainingBalance()) {
                throw new PaymentException(
                    String.format("المبلغ المدفوع (%.2f) أكبر من الرصيد المتبقي (%.2f)",
                        amount, invoice.getRemainingBalance())
                );
            }
        }
        
        // Create payment record
        Payment payment = Payment.builder()
                .customer(customer)
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(paymentMethod != null ? paymentMethod : PaymentMethod.CASH)
                .paymentDate(LocalDateTime.now())
                .referenceNumber(referenceNumber)
                .notes(notes)
                .createdBy(createdBy)
                .createdAt(LocalDateTime.now())
                .build();
        
        payment = paymentRepository.save(payment);
        log.info("Payment recorded: ID={}, Customer={}, Amount={}, Invoice={}",
                payment.getId(), customerId, amount, invoiceId);
        
        // Update invoice if specified
        if (invoice != null) {
            invoice.recordPayment(amount);
            invoiceRepository.save(invoice);
            log.info("Invoice {} updated: AmountPaid={}, RemainingBalance={}, Status={}",
                    invoice.getId(), invoice.getAmountPaidNow(), 
                    invoice.getRemainingBalance(), invoice.getStatus());
        }
        
        // Update customer balance
        customer.subtractFromBalance(amount);
        customerService.updateCustomer(customer);
        log.info("Customer {} balance updated: OldBalance was reduced by {}, NewBalance={}",
                customerId, amount, customer.getBalance());
        
        return PaymentDTO.from(payment);
    }
    
    /**
     * Get all payments for a customer
     */
    public List<PaymentDTO> getCustomerPayments(Long customerId) {
        // Verify customer exists
        customerService.findById(customerId)
                .orElseThrow(() -> CustomerNotFoundException.forCustomerId(customerId));
        
        List<Payment> payments = paymentRepository.findByCustomerId(customerId);
        return payments.stream()
                .map(PaymentDTO::from)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all payments for an invoice
     */
    public List<PaymentDTO> getInvoicePayments(Long invoiceId) {
        // Verify invoice exists
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new InvoiceNotFoundException(invoiceId);
        }
        
        List<Payment> payments = paymentRepository.findByInvoiceId(invoiceId);
        return payments.stream()
                .map(PaymentDTO::from)
                .collect(Collectors.toList());
    }
    
    /**
     * Get payment by ID
     */
    public PaymentDTO getPaymentById(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentException("لم يتم العثور على الدفعة"));
        return PaymentDTO.from(payment);
    }
    
    /**
     * Get total payments made by customer
     */
    public Double getTotalCustomerPayments(Long customerId) {
        return paymentRepository.getTotalPaymentsByCustomer(customerId);
    }
    
    /**
     * Get payments within date range
     */
    public List<PaymentDTO> getPaymentsBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findPaymentsBetweenDates(startDate, endDate);
        return payments.stream()
                .map(PaymentDTO::from)
                .collect(Collectors.toList());
    }
    
    /**
     * Get customer payments within date range
     */
    public List<PaymentDTO> getCustomerPaymentsBetweenDates(
            Long customerId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        customerService.findById(customerId)
                .orElseThrow(() -> CustomerNotFoundException.forCustomerId(customerId));
        
        List<Payment> payments = paymentRepository.findCustomerPaymentsBetweenDates(
                customerId, startDate, endDate);
        return payments.stream()
                .map(PaymentDTO::from)
                .collect(Collectors.toList());
    }
    
    /**
     * Delete a payment (admin only, reverses balance changes)
     */
    @Transactional
    public void deletePayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentException("لم يتم العثور على الدفعة"));
        
        // Reverse customer balance
        Customer customer = payment.getCustomer();
        customer.addToBalance(payment.getAmount());
        customerService.updateCustomer(customer);
        
        // Reverse invoice if applicable
        if (payment.getInvoice() != null) {
            Invoice invoice = payment.getInvoice();
            invoice.setAmountPaidNow(invoice.getAmountPaidNow() - payment.getAmount());
            invoice.calculateRemainingBalance();
            if (invoice.getStatus() == InvoiceStatus.PAID) {
                invoice.setStatus(InvoiceStatus.PENDING);
            }
            invoiceRepository.save(invoice);
        }
        
        paymentRepository.delete(payment);
        log.info("Payment {} deleted and balances reversed", paymentId);
    }
}
