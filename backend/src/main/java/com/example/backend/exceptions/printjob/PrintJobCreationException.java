package com.example.backend.exceptions.printjob;

// Custom exception classes
public class PrintJobCreationException extends RuntimeException {
    public PrintJobCreationException(String message) {
        super(message);
    }

    public PrintJobCreationException(String message, Throwable cause) {
        super(message, cause);
    }
}

