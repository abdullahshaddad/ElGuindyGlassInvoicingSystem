package com.example.backend.exceptions.invoice;

import com.example.backend.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Global exception handler for invoice-related errors
 */
@ControllerAdvice
public class InvoiceExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(InvoiceExceptionHandler.class);

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(ValidationException e) {
        log.warn("Validation error: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Error")
                .message(e.getArabicMessage())
                .details(e.getValidationErrors())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(InvoiceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleInvoiceNotFoundException(InvoiceNotFoundException e) {
        log.warn("Invoice not found: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error("Invoice Not Found")
                .message(e.getArabicMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(GlassTypeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleGlassTypeNotFoundException(GlassTypeNotFoundException e) {
        log.warn("Glass type not found: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Glass Type Not Found")
                .message(e.getArabicMessage())
                .details(List.of("Glass Type ID: " + e.getGlassTypeId()))
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler({
            InvoiceCreationException.class,
            CustomerResolutionException.class,
            InvoiceLineCreationException.class,
            InvoiceUpdateException.class,
            InvoiceReloadException.class,
            InvalidDimensionsException.class,
            CuttingCalculationException.class
    })
    public ResponseEntity<ErrorResponse> handleInvoiceException(com.example.backend.exceptions.invoice.InvoiceException e) {
        log.error("Invoice operation failed: {}", e.getMessage(), e);

        List<String> details = new ArrayList<>();
        if (e instanceof InvoiceLineCreationException) {
            details.addAll(((InvoiceLineCreationException) e).getLineErrors());
        }

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Invoice Operation Failed")
                .message(e.getArabicMessage())
                .details(details.isEmpty() ? null : details)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ErrorResponse> handleDataAccessException(DataAccessException e) {
        log.error("Database error: {}", e.getMessage(), e);

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Database Error")
                .message("خطأ في قاعدة البيانات. يرجى المحاولة مرة أخرى.")
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.")
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }
}
