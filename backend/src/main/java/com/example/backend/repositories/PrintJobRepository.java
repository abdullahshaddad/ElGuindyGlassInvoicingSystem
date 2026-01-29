package com.example.backend.repositories;

import com.example.backend.models.PrintJob;
import com.example.backend.models.enums.PrintStatus;
import com.example.backend.models.enums.PrintType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {
    List<PrintJob> findByStatus(PrintStatus status);

    List<PrintJob> findByInvoiceId(String invoiceId);

    List<PrintJob> findByType(PrintType type);

    @Query("SELECT p FROM PrintJob p WHERE p.status = :status ORDER BY p.createdAt ASC")
    List<PrintJob> findQueuedJobsOrderedByCreation(@Param("status") PrintStatus status);
}
