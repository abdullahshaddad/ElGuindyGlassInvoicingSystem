package com.example.backend.repositories;

import com.example.backend.models.CuttingDetail;
import com.example.backend.models.enums.CuttingMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CuttingDetailRepository extends JpaRepository<CuttingDetail, Long> {
    List<CuttingDetail> findByInvoiceLineId(Long invoiceLineId);

    List<CuttingDetail> findByMethod(CuttingMethod method);
}
