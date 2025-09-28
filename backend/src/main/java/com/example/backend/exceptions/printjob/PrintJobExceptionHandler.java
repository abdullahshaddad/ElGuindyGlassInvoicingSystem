package com.example.backend.exceptions.printjob;

import com.example.backend.dto.ErrorResponse;
import com.example.backend.services.PrintJobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

// Exception Handler for Print Job Exceptions
@RestControllerAdvice
public class PrintJobExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(PrintJobExceptionHandler.class);

    @ExceptionHandler(PrintJobCreationException.class)
    public ResponseEntity<ErrorResponse> handlePrintJobCreationException(
            PrintJobCreationException e) {
        log.error("Print job creation error: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Print Job Creation Failed")
                .message("فشل في إنشاء مهام الطباعة: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }

    @ExceptionHandler(PdfGenerationException.class)
    public ResponseEntity<ErrorResponse> handlePdfGenerationException(
            PdfGenerationException e) {
        log.error("PDF generation error: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("PDF Generation Failed")
                .message("فشل في إنشاء ملف PDF: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }

    @ExceptionHandler(PrintJobDatabaseException.class)
    public ResponseEntity<ErrorResponse> handlePrintJobDatabaseException(
            PrintJobDatabaseException e) {
        log.error("Print job database error: {}", e.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Database Error")
                .message("خطأ في قاعدة البيانات لمهام الطباعة: " + e.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.internalServerError().body(response);
    }
}
