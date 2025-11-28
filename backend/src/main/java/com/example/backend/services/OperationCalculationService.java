package com.example.backend.services;

import com.example.backend.dto.OperationRequest;
import com.example.backend.exceptions.invoice.CuttingCalculationException;
import com.example.backend.models.InvoiceLineOperation;
import com.example.backend.models.enums.FarmaType;
import com.example.backend.models.enums.OperationType;
import com.example.backend.models.enums.ShatafType;
import com.example.backend.services.cutting.ShatafRateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Operation Calculation Service
 * Handles price calculations for different operation types (SHATAF, FARMA, LASER)
 */
@Service
@Slf4j
public class OperationCalculationService {

    private final ShatafRateService shatafRateService;

    @Autowired
    public OperationCalculationService(ShatafRateService shatafRateService) {
        this.shatafRateService = shatafRateService;
    }

    /**
     * Create and calculate an InvoiceLineOperation from an OperationRequest
     *
     * @param request   Operation request from frontend
     * @param widthM    Width in meters
     * @param heightM   Height in meters
     * @param thickness Glass thickness in mm (for rate lookup)
     * @return Populated InvoiceLineOperation with calculated price
     */
    public InvoiceLineOperation createAndCalculateOperation(
            OperationRequest request,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        log.debug("Creating operation: type={}, width={}m, height={}m, thickness={}mm",
                request.getType(), widthM, heightM, thickness);

        // Validate request
        request.validate();

        // Create base operation
        InvoiceLineOperation operation = InvoiceLineOperation.builder()
                .operationType(request.getType())
                .notes(request.getNotes())
                .build();

        // Set type-specific fields and calculate price
        switch (request.getType()) {
            case SHATAF:
                configureShatafOperation(operation, request, widthM, heightM, thickness);
                break;
            case FARMA:
                configureFarmaOperation(operation, request, widthM, heightM, thickness);
                break;
            case LASER:
                configureLaserOperation(operation, request);
                break;
            default:
                throw new CuttingCalculationException("نوع عملية غير معروف: " + request.getType());
        }

        log.debug("Operation calculated: type={}, price={} EGP",
                operation.getOperationType(), operation.getOperationPrice());

        return operation;
    }

    /**
     * Configure and calculate SHATAF operation
     */
    private void configureShatafOperation(
            InvoiceLineOperation operation,
            OperationRequest request,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        ShatafType shatafType = request.getShatafType();
        FarmaType farmaType = request.getFarmaType();
        Double diameter = request.getDiameter();

        // Set fields
        operation.setShatafType(shatafType);
        operation.setFarmaType(farmaType);
        operation.setDiameter(diameter);
        operation.setManualCuttingPrice(request.getManualCuttingPrice());

        // Calculate price
        if (shatafType.isManualInput()) {
            // Manual price
            if (request.getManualCuttingPrice() == null || request.getManualCuttingPrice() < 0) {
                throw new CuttingCalculationException(
                        "سعر القطع اليدوي مطلوب للنوع: " + shatafType.getArabicName()
                );
            }
            operation.setOperationPrice(request.getManualCuttingPrice());
        } else if (shatafType.isFormulaBased()) {
            // Formula-based calculation
            if (farmaType == null) {
                throw new CuttingCalculationException(
                        "نوع الفارمة مطلوب لنوع الشطف: " + shatafType.getArabicName()
                );
            }

            // Calculate shataf meters
            operation.calculateShatafMeters(widthM, heightM);
            double shatafMeters = operation.getShatafMeters();

            // Get rate per meter from database using shataf type and thickness
            Double ratePerMeter = shatafRateService.getRateForThickness(shatafType, thickness);
            operation.setRatePerMeter(ratePerMeter);

            // Calculate price: shatafMeters × ratePerMeter
            double price = shatafMeters * ratePerMeter;
            operation.setOperationPrice(price);

            log.debug("Shataf calculation: shatafMeters={}, rate={}, price={}",
                    shatafMeters, ratePerMeter, price);
        } else if (shatafType.isAreaBased()) {
            // Area-based calculation (like SANDING)
            double areaM2 = widthM * heightM;
            Double ratePerM2 = shatafRateService.getRateForThickness(shatafType, thickness);
            operation.setRatePerMeter(ratePerM2);

            double price = areaM2 * ratePerM2;
            operation.setOperationPrice(price);

            log.debug("Area-based shataf calculation: area={}m², rate={}, price={}",
                    areaM2, ratePerM2, price);
        } else {
            throw new CuttingCalculationException(
                    "نوع شطف غير مدعوم: " + shatafType.getArabicName()
            );
        }
    }

    /**
     * Configure and calculate FARMA operation
     */
    private void configureFarmaOperation(
            InvoiceLineOperation operation,
            OperationRequest request,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        FarmaType farmaType = request.getFarmaType();
        Double diameter = request.getDiameter();

        // Set fields
        operation.setFarmaType(farmaType);
        operation.setDiameter(diameter);

        // Calculate price
        if (farmaType.isManual()) {
            // Manual price
            if (request.getManualPrice() == null || request.getManualPrice() < 0) {
                throw new CuttingCalculationException(
                        "السعر اليدوي مطلوب لنوع الفارمة: " + farmaType.getArabicName()
                );
            }
            operation.setManualPrice(request.getManualPrice());
            operation.setOperationPrice(request.getManualPrice());
        } else {
            // Formula-based farma
            // Calculate shataf meters using farma formula
            operation.calculateShatafMeters(widthM, heightM);
            double shatafMeters = operation.getShatafMeters();

            // Get rate per meter - use a default shataf type for standalone farma operations
            // Since standalone FARMA doesn't have a shatafType, we use NORMAL_SHATAF as default
            ShatafType defaultShatafType = ShatafType.KHARAZAN; // Default for farma calculations
            Double ratePerMeter = shatafRateService.getRateForThickness(defaultShatafType, thickness);
            operation.setRatePerMeter(ratePerMeter);

            // Calculate price
            double price = shatafMeters * ratePerMeter;
            operation.setOperationPrice(price);

            log.debug("Farma calculation: shatafMeters={}, rate={}, price={}",
                    shatafMeters, ratePerMeter, price);
        }
    }

    /**
     * Configure LASER operation (always manual price)
     */
    private void configureLaserOperation(
            InvoiceLineOperation operation,
            OperationRequest request
    ) {
        // Validate laser type
        if (request.getLaserType() == null || request.getLaserType().trim().isEmpty()) {
            throw new CuttingCalculationException("نوع الليزر مطلوب لعمليات الليزر");
        }

        // Validate manual price
        if (request.getManualPrice() == null || request.getManualPrice() < 0) {
            throw new CuttingCalculationException("السعر مطلوب لعمليات الليزر");
        }

        // Set fields
        operation.setLaserType(request.getLaserType());
        operation.setManualPrice(request.getManualPrice());
        operation.setOperationPrice(request.getManualPrice());

        log.debug("Laser operation: type={}, price={}",
                request.getLaserType(), request.getManualPrice());
    }

    /**
     * Recalculate price for an existing operation (e.g., when dimensions change)
     */
    public void recalculateOperationPrice(
            InvoiceLineOperation operation,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        log.debug("Recalculating operation price: type={}", operation.getOperationType());

        switch (operation.getOperationType()) {
            case SHATAF:
                recalculateShatafPrice(operation, widthM, heightM, thickness);
                break;
            case FARMA:
                recalculateFarmaPrice(operation, widthM, heightM, thickness);
                break;
            case LASER:
                // Laser uses manual price, no recalculation needed
                log.debug("Laser operation uses manual price, skipping recalculation");
                break;
        }
    }

    /**
     * Recalculate SHATAF operation price
     */
    private void recalculateShatafPrice(
            InvoiceLineOperation operation,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        if (operation.getShatafType().isManualInput()) {
            // Manual price doesn't change
            return;
        }

        // Recalculate shataf meters
        operation.calculateShatafMeters(widthM, heightM);
        double shatafMeters = operation.getShatafMeters();

        // Get current rate using shataf type and thickness
        Double ratePerMeter = shatafRateService.getRateForThickness(operation.getShatafType(), thickness);
        operation.setRatePerMeter(ratePerMeter);

        // Recalculate price
        double price = shatafMeters * ratePerMeter;
        operation.setOperationPrice(price);
    }

    /**
     * Recalculate FARMA operation price
     */
    private void recalculateFarmaPrice(
            InvoiceLineOperation operation,
            Double widthM,
            Double heightM,
            Double thickness
    ) {
        if (operation.getFarmaType().isManual()) {
            // Manual price doesn't change
            return;
        }

        // Recalculate shataf meters
        operation.calculateShatafMeters(widthM, heightM);
        double shatafMeters = operation.getShatafMeters();

        // Get current rate - use default shataf type for standalone farma
        ShatafType defaultShatafType = ShatafType.KHARAZAN;
        Double ratePerMeter = shatafRateService.getRateForThickness(defaultShatafType, thickness);
        operation.setRatePerMeter(ratePerMeter);

        // Recalculate price
        double price = shatafMeters * ratePerMeter;
        operation.setOperationPrice(price);
    }
}
