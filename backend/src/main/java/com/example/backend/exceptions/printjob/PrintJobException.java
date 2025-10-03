package com.example.backend.exceptions.printjob;

public class PrintJobException extends RuntimeException {
        public PrintJobException(String message) {
            super(message);
        }

        public PrintJobException(String message, Throwable cause) {
            super(message, cause);
        }
    }