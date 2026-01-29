package com.example.backend.repositories;

import com.example.backend.models.InvoiceLine;
import com.example.backend.models.enums.CuttingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceLineRepository extends JpaRepository<InvoiceLine, Long> {
    List<InvoiceLine> findByInvoiceId(String invoiceId);

    List<InvoiceLine> findByGlassTypeId(Long glassTypeId);

    List<InvoiceLine> findByCuttingType(CuttingType cuttingType);

    @org.springframework.data.jpa.repository.Query("SELECT MAX(il.id) FROM InvoiceLine il")
    Long findMaxNumericId();
}
