package com.example.backend.exceptions.printjob;

public  class PrintJobDatabaseException extends RuntimeException {
    public PrintJobDatabaseException(String message) {
        super(message);
    }

    public PrintJobDatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
